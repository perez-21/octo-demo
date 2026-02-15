const mongoose = require('mongoose');

const { Schema } = mongoose;

const productSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: String,
    required: true,
  }

});

const Product = mongoose.model('Product', productSchema);

const conversationSchema = new Schema({
  flowState: {
    type: String,
    default: 'inactive',
  },
  businessWaid: {
    type: String,
    required: true,
  },
  customerWaid: {
    type: String,
    required: true,
  },
  messages: {
    type: [],
    optional: true,
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 24 * 60 * 60
  },
  context: {},
}, 
{
  timestamps: true,
});

const Conversation = mongoose.model('Conversation', conversationSchema);

const messageSchema = new Schema({
  // messageSid
  // customer: From
  // business: To
  // text: body
  // conversation
  // mediaCount: NumMedia
  // mediaUrl 
  // mediaContentType
  // ButtonPayload
  // ButtonText
  // ButtonType
  // InteractiveData
  // FlowData
  // MessagingServiceSid
  messageSid: {
    type: String,
    required: true,
    immutable: true,
  },
  customerWaid: {
    type: String,
    required: true,
    immutable: true,
  },
  businessWaid: {
    type: String,
    required: true,
    immutable: true,
  },
  text: {
    type: String,
    immutable: true,
  },
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    immutable: true,
  },
  buttonPayload: {
    type: String,
  }
},
{
  timestamps: true,
}
);

const responseSchema = new Schema({
  customerWaid: {
    type: String,
    required: true,
    immutable: true,
  },
  businessWaid: {
    type: String,
    required: true,
    immutable: true,
  },
  text: {
    type: String,
    immutable: true,
  },
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    immutable: true,
  },
}, 
{
  timestamps: true,
})

const Response = mongoose.model('Response', responseSchema);

const Message = mongoose.model('Message', messageSchema);

module.exports = { Message, Conversation, Product, Response }