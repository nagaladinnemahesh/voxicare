import { FastifyInstance } from "fastify";
import { agentChatController } from "./agent.controller";
import { authenticate } from "../../middlewares/authenticate";

/**
 * Agent routes — registers the AI agent chat endpoint
 * Protected route — user must be logged in
 * @param app - Fastify instance
 */
export async function agentRoutes(app: FastifyInstance) {
  /**
   * POST /api/agent/chat
   * Send a message to the Voxia AI agent
   * Body: { message: string, conversationHistory: [] }
   */
  app.post(
    "/chat",
    {
      preHandler: [authenticate], // must be logged in to use agent
    },
    agentChatController,
  );
}
