import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3001,
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  NODE_ENV: process.env.NODE_ENV || "development",
};
