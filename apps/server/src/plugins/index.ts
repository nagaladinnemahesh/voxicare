import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import { env } from "../config/env";

/**
 * Registers all global fastify plugins
 * plugins are shared across the entire application
 * @param app - Fastify instance
 */

export async function registerPlugins(app: FastifyInstance) {
  // cors connection for frontend and backend talking
  await app.register(cors, {
    origin: "http://localhost:3000", // nextjs runs here
    credentials: true, // allows cookies/auth headers
  });

  // helmet for adding security headers to response automatically
  await app.register(helmet);

  // jwt for verifying tokens
  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });
}
