import { FastifyRequest, FastifyReply } from "fastify";
import { runAgent } from "./agent.service";

/**
 * Handles chat messages sent to the AI agent
 * - Extracts logged in user id from JWT token
 * - Passes message and conversation history to agent
 * - Returns agent's response
 */
export async function agentChatController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // Get logged in user id from JWT token
    const { id: userId } = request.user as { id: string; role: string };

    const { message, conversationHistory = [] } = request.body as {
      message: string;
      conversationHistory: Array<{
        role: "user" | "assistant";
        content: string;
      }>;
    };

    if (!message) {
      return reply.status(400).send({
        success: false,
        message: "message is required",
      });
    }

    console.log(`💬 User ${userId} says: ${message}`);

    // Run the agent — this may take 1-3 seconds as Claude thinks
    const response = await runAgent({
      message,
      userId,
      conversationHistory,
    });

    console.log(`🤖 Voxia responds: ${response}`);

    return reply.status(200).send({
      success: true,
      data: {
        response,
        // Return updated conversation history for frontend to maintain
        conversationHistory: [
          ...conversationHistory,
          { role: "user", content: message },
          { role: "assistant", content: response },
        ],
      },
    });
  } catch (error: any) {
    console.error("Agent error:", error);
    return reply.status(500).send({
      success: false,
      message: "Agent failed to process your request",
    });
  }
}
