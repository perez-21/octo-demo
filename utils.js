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

module.exports = { formatConversation };
