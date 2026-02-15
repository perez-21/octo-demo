const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { Conversation, Message, Response } = require("./models");
const { classifyIntent, addToCart, checkout } = require("./intent");
const { generateResponse } = require("./gemma");
const { formatConversation } = require("./utils");

dotenv.config();

const app = express();
const mongoURI = "mongodb://localhost:27017/octodemo-db";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/messages", async (req, res) => {
  const { Body, To, From, MessageSid, MessagingServiceSid, ButtonPayload } =
    req.body;

  try {
    // create / get conversation
    let conversation = await Conversation.findOne({
      customerWaid: From,
      businessWaid: To,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        customerWaid: From,
        businessWaid: To,
      });
    }

    // create message
    const newMessage = await Message.create({
      messageSid: MessageSid,
      customerWaid: From,
      businessWaid: To,
      text: Body,
      conversation: conversation._id,
      buttonPayload: ButtonPayload,
    });

    // add message to conversation and save
    conversation.messages.push(newMessage);
    conversation.flowState = "initiation";
    await conversation.save();

    // classify intent
    console.log('moving to classification');
    const { intent, entities } = await classifyIntent(
      conversation.context,
      formatConversation(conversation.messages),
    );

    console.log('top level intent: ', intent);

    let response;
    if (intent === "add-to-cart") {
      response = await addToCart(_, conversation.context, entities);
    } else if (intent === "checkout") {
      response = await checkout(_, conversation.context, entities);
    } else {
      const instructions =
        "Based on the system context and conversation, answer the user's question or provide a helpful response. Ensure that you strictly adhere to the JSON schema provided. Modify the system context object provided as needed. Make sure there is a `twiML` field in the schema and it contains an appropriate text response formatted in Twilio's TwiML syntax for Whatsapp. Ensure that you include the system context object in the `context` field.";

      const responseSchema = z.object({
        twiML: z
          .string()
          .describe(
            "Appropriate text response formatted in Twilio's TwiML syntax for Whatsapp",
          ),
        context: z.object().describe("System context object"),
      });

      const result = await generateResponse(
        instructions,
        zodToJsonSchema(responseSchema),
        formatConversation(conversation.messages),
        conversation.context,
      );

      if (result.error) {
        // handle error
        return res.send(
          "<Response><Message>An error occured, please message again later.</Message></Response>",
        );
      }

      response = result;
    }

    const modelResponse = await Response.create({
      customerWaid: From,
      businessWaid: To,
      text: response.twiML,
      conversation: conversation._id,
    });


    conversation.messages.push(modelResponse);
    conversation.context = response.context;
    await conversation.save();


    res.send(response.twiML);
  } catch (err) {}
});

app.get("/api/health", (req, res) => {
  res.send({ status: "ok" });
});

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      maxPoolSize: 100,
      autoIndex: false,
    });
  } catch (err) {
    if (err instanceof Error) {
      console.error("MongoDB connection error: ", err.message);
      process.exit(1);
    }
  }
};

connectDB().then(() => {
  app.listen(3000, () => console.log("listening on port 3000"));
});
