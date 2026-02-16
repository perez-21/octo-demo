const { Product } = require("./models");
const { generateResponse } = require("./gemma");
const {
  GenerateResponseContext,
  GroqGenerateResponseStrategy,
} = require("./generateResponse.strategy");
const { GROQ_API_KEY } = require("./config");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

async function browseProducts(business, context, entities) {
  const products = await Product.find().lean();

  return { message: products };
}

async function addToCart(business, context, entities) {
  const product = await Product.findById(entities.productId).lean();
  if (product) {
    context.cart.push(product);
  }

  return {
    twiMl: `<Response>
  <Message>
    Added ${product.title}. Your cart: ${context.cart.length} items
  </Message>
</Response>`,
    context,
  };
}

async function checkout(business, context, entities) {
  context.cart = [];
  return {
    message: `<Response>
  <Message>
    Your order has been created! We will get back to you soon with a confirmation.

    Order:
    ${context.cart}

    ID: #3JK31
  </Message>
</Response>`,
    context,
  };
}

async function classifyIntent(context, conversation) {
  console.log("in classifyIntent");
  const instructions =
    "Based on the system context and conversation, classify the user's intention in their last message. Format the information according to the schema provided.  ";
  const intentSchema = z
    .object({
      intent: z
        .templateLiteral(["add-to-cart", "checkout", "other"])
        .describe("The user's intention in the most recent message"),
      entities: z
        .object({
          productId: z
            .string()
            .describe("The id of the product the user is adding to the cart"),
        })
        .describe("API entities a user refers to"),
    })
    .toJSONSchema();

  console.log("in classifyIntent");
  const generateResContext = new GenerateResponseContext(
    new GroqGenerateResponseStrategy(GROQ_API_KEY),
  );

  intentSchema.additionalProperties = true;

  const response = await generateResContext.generateResponse(
    instructions,
    intentSchema,
    conversation,
    context,
  );
  if (!response) {
    throw new Error("failed to classify intent");
  }
  return response;
}

/*
{
  user_intention: 'greeting',
  confidence_score: '0.85',
  detected_entities: [],
  sentiment: 'neutral',
  analysis: "The user input consists of multiple concatenated greetings, testing phrases, and expressions of frustration or confusion, which typically represents an initial attempt to interact with or test the bot's response capabilities."
}

*/

module.exports = { classifyIntent, addToCart, browseProducts, checkout };
