import { FastifyInstance } from "fastify";
import { voiceChatController, ttsController } from "./voice.controller";
import { authenticate } from "../../middlewares/authenticate";
import { appendFile } from "node:fs";
import { auth } from "@deepgram/sdk";

// voice routes
export async function voiceRoutes(app: FastifyInstance) {
  app.post(
    "/chat",
    {
      preHandler: [authenticate], // must logged in user
    },
    voiceChatController,
  );

  app.post(
    "/tts",
    {
      preHandler: [authenticate],
    },
    ttsController,
  );
}
