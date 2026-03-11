import Fastify from "fastify";
import { registerPlugins } from "./plugins";
import { env } from "./config/env";
import { authRoutes } from "./modules/auth/auth.routes";

// fastify instance
const app = Fastify({
  logger: true,
});

// healthcheck route
app.get("/health", async (request, reply) => {
  return { status: "ok", app: "voxicare", timeStamp: new Date().toISOString() };
});

// main function to start server
const start = async () => {
  try {
    //register all plugins
    await registerPlugins(app);

    //register all routes with under /api/auth/...
    app.register(authRoutes, { prefix: "/api/auth" });

    // start listening on configured port
    await app.listen({ port: Number(env.PORT), host: "0.0.0.0" });
    console.log(`Voxicare server running on http://localhost:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
