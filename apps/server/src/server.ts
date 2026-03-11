import Fastify from "fastify";
import { timeStamp } from "node:console";
import { request } from "node:http";

const app = Fastify({
  logger: true,
});

// routes
app.get("/health", async (request, reply) => {
  return { status: "ok", app: "voxicare", timeStamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await app.listen({ port: 3001, host: "0.0.0.0" });
    console.log("Voxicare server running on http://localhost:3001");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
