const formatConversation = (conversation) => {
  return conversation.map((message) => {
    if (message.messageSid) {
      const content = {
        role: "user",
        parts: [
          { text: message.text },
          
        ],
      };
      if (message.buttonPayload) {
        content.parts.push({ buttonPayload: message.buttonPayload });
      }
      return content;
    } else {
      const content = { role: "model", parts: [{ text: message.text }] };
      return content;
    }
  });
};

const formatConversationForGroq = (conversation) => {
  return conversation.map((message) => {
    if (message.messageSid) {
      const content = {
        role: "user",
        parts: [
          { text: message.text },
          
        ],
      };
      if (message.buttonPayload) {
        content.parts.push({ buttonPayload: message.buttonPayload });
      }
      return content;
    } else {
      const content = { role: "assistant", parts: [{ text: message.text }] };
      return content;
    }
  });
};

function isValidTwiML(str) {
  const regex = /^<Response><Message>.*?<\/Message><\/Response>$/;
  return regex.test(str);
}

function toTwiMl(str) {
  return `<Response><Message>${str}</Message></Response>`;
}

module.exports = { formatConversation, formatConversationForGroq, isValidTwiML, toTwiMl };
