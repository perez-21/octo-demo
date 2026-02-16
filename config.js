const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

module.exports = {PORT, GEMINI_API_KEY, MONGO_URI, GROQ_API_KEY};
