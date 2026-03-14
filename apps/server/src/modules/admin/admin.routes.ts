import { FastifyInstance } from "fastify";
import {
  adminLoginController,
  getPendingDoctorsController,
  getAllDoctorsController,
  updateDoctorStatusController,
  getStatsController,
  getAllPatientsController,
  getAllAppointmentsController,
} from "./admin.controller";
import { authenticate } from "../../middlewares/authenticate";

/**
 * Admin routes
 * /api/admin/*
 */
export async function adminRoutes(app: FastifyInstance) {
  // Public — admin login
  app.post("/login", adminLoginController);

  // Protected — require admin JWT
  app.get(
    "/doctors/pending",
    { preHandler: [authenticate] },
    getPendingDoctorsController,
  );
  app.get("/doctors", { preHandler: [authenticate] }, getAllDoctorsController);
  app.put(
    "/doctors/:id/status",
    { preHandler: [authenticate] },
    updateDoctorStatusController,
  );
  app.get("/stats", { preHandler: [authenticate] }, getStatsController);
  app.get(
    "/patients",
    { preHandler: [authenticate] },
    getAllPatientsController,
  );
  app.get(
    "/appointments",
    { preHandler: [authenticate] },
    getAllAppointmentsController,
  );
}
