import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposedHeaders: [
      "X-Transcript",
      "X-Agent-Response",
      "X-Conversation-History",
    ],
  });

  // await app.register(cors, {
  //   origin: "http://localhost:3000",
  //   credentials: true,
  //   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  //   exposedHeaders: [
  //     "X-Transcript",
  //     "X-Agent-Response",
  //     "X-Conversation-History",
  //   ],
  // });
  // helmet for adding security headers to response automatically
  await app.register(helmet);

  // jwt for verifying tokens
  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  // Multipart — allows receiving audio/file uploads
  // Required for voice chat endpoint
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max audio file size
    },
  });
}
