import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3001,
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  NODE_ENV: process.env.NODE_ENV || "development",

  //AI services
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY as string,
  DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY as string,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY as string,
  GROQ_API_KEY: process.env.GROQ_API_KEY as string,
};
