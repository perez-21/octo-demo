const { modelSystemInstructions } = require("./data");
const Groq = require("groq-sdk");

// Base "interface" class
class IGenerateResponseStrategy {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async generateResponse(instructions, schema, conversation, context) {
    throw new Error("generateResponse() must be implemented by subclass");
  }
}

// Concrete implementation
class GeminiGenerateResponseStrategy extends IGenerateResponseStrategy {
  async generateResponse(instructions, schema, conversation, context) {
    try {
      console.log("in generateResponse");

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: context
          ? [
              ...conversation,
              {
                role: "user",
                parts: [
                  {
                    text: `Current context:\n${JSON.stringify(context, null, 2)}`,
                  },
                ],
              },
            ]
          : conversation,
        config: {
          systemInstruction: modelSystemInstructions + "\n" + instructions,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const jsonResponseString = result.candidates[0].content.parts[0].text;
      const jsonResponse = JSON.parse(jsonResponseString);
      return jsonResponse;
    } catch (error) {
      console.error("error: ", error.message);
      return { error: error.message };
    }
  }
}

class GroqGenerateResponseStrategy extends IGenerateResponseStrategy {
  async generateResponse(instructions, schema, conversation, context) {
    try {
      // Convert conversation to Groq's message format
      const messages = conversation.map((msg) => ({
        role: msg.role,
        content: msg.parts.map((part) => part.text).join("\n"),
      }));

      // Add context if provided
      if (context) {
        messages.push({
          role: "system",
          content: `Current context:\n${JSON.stringify(context, null, 2)}`,
        });
      }

      messages.unshift({
        role: "system",
        content: ` ${modelSystemInstructions}\n${instructions}\n\nRespond with JSON matching this schema:\n${JSON.stringify(schema, null, 2)}`,
      });

      const client = new Groq({ apiKey: this.apiKey });

      const data = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        response_format: {
          type: "json_object",
        },
        temperature: 0.7,
      });

      const jsonResponseString = data.choices[0].message.content;
      const jsonResponse = JSON.parse(jsonResponseString);

      return jsonResponse;
    } catch (error) {
      console.error("error: ", error.message);
      return { error: error.message };
    }
  }
}
// Context class
class GenerateResponseContext {
  constructor(strategy) {
    this.strategy = strategy;
  }

  async generateResponse(instructions, schema, conversation, context) {
    return await this.strategy.generateResponse(
      instructions,
      schema,
      conversation,
      context,
    );
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }
}

module.exports = {
  GenerateResponseContext,
  GroqGenerateResponseStrategy,
  GeminiGenerateResponseStrategy,
};
