import { FastifyRequest, FastifyReply } from "fastify";

// auth middleware, verifies jwt token on protected routes
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // verifies token from auth headers
    await request.jwtVerify();
  } catch (error) {
    return reply.status(401).send({
      success: false,
      message: "Unauthorized - please login first",
    });
  }
}
