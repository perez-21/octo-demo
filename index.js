const express = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { businessesRouter } = require("./routes");
const { Conversation, Message, Response, Business } = require("./models");
const { classifyIntent, addToCart, checkout } = require("./intent");
const { generateResponse } = require("./gemma");
const { isValidTwiML, toTwiMl, formatConversationForGroq } = require("./utils");
const { GenerateResponseContext, GeminiGenerateResponseStrategy, GroqGenerateResponseStrategy } = require("./generateResponse.strategy.js");

const { PORT, MONGO_URI, GROQ_API_KEY } = require("./config");
const app = express();
const mongoURI = MONGO_URI;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", businessesRouter);

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
    // console.log('moving to classification');
    // const { intent, entities } = await classifyIntent(
    //   conversation.context,
    //   formatConversationForGroq(conversation.messages),
    // );

    // console.log('top level intent: ', intent);

    const intent = '';

    let response;
    if (intent === "add-to-cart") {
      response = await addToCart(_, conversation.context, entities);
    } else if (intent === "checkout") {
      response = await checkout(_, conversation.context, entities);
    } else {
      const instructions =
        "";

      const responseSchema = z.object({
        twiML: z
          .string()
          .describe(
            "Appropriate text response formatted in Twilio's TwiML syntax for Whatsapp",
          ),
        context: z.object().describe("System context object"),
      }).toJSONSchema();
      responseSchema.additionalProperties = true;

      const business = await Business.findOne({businessWaid: To});
      

      const generateResContext = new GenerateResponseContext(new GroqGenerateResponseStrategy(GROQ_API_KEY));
      const result = await generateResContext.generateResponse(
        business.instructions + '\n' + business.flow + '\n' + instructions,
        responseSchema,
        formatConversationForGroq(conversation.messages),
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
    
    if (!isValidTwiML(response.twiML)) {
      response.twiML = toTwiMl(response.twiML);
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


    return res.send(response.twiML);
  } catch (err) {}
});


app.post("/api/delivered", (req, res) => {
  console.log(req.body);
  res.status(200).send();
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
  app.listen(PORT, () => console.log(`listening on port ${PORT}`));
});
