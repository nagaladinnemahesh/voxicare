import { FastifyInstance } from "fastify";
import {
  listDoctorsController,
  getDoctorController,
  getDoctorAvailabilityController,
  listSpecializationsController,
} from "./doctors.controller";
import { listDoctorsSchema, getDoctorSchema } from "./doctors.schema";
import {
  getDoctorAppointmentsController,
  getDoctorProfileController,
  updateAvailabilityController,
  addLeaveController,
  updateAppointmentStatusController,
} from "./doctor.dashboard.controller";
import { authenticate } from "../../middlewares/authenticate";

// Doctors routes — registers all doctor related endpoints

//Patients can browse doctors without being logged in

export async function doctorsRoutes(app: FastifyInstance) {
  // Returns list of all approved doctors

  app.get(
    "/",
    {
      schema: listDoctorsSchema,
    },
    listDoctorsController,
  );

  //  Returns all specializations Must be defined BEFORE /:id to avoid conflict
  app.get("/specializations", listSpecializationsController);

  /**
   * GET /api/doctors/:id
   * Returns single doctor with full details
   */
  app.get(
    "/:id",
    {
      schema: getDoctorSchema,
    },
    getDoctorController,
  );

  /**
   * GET /api/doctors/:id/availability?date=2026-03-11
   * Returns doctor's availability for a specific date
   */
  app.get(
    "/:id/availability",
    {
      schema: getDoctorSchema,
    },
    getDoctorAvailabilityController,
  );
  // Doctor dashboard routes — protected, requires doctor JWT
  app.get(
    "/me/profile",
    { preHandler: [authenticate] },
    getDoctorProfileController,
  );
  app.get(
    "/me/appointments",
    { preHandler: [authenticate] },
    getDoctorAppointmentsController,
  );
  app.put(
    "/me/availability",
    { preHandler: [authenticate] },
    updateAvailabilityController,
  );
  app.post("/me/leave", { preHandler: [authenticate] }, addLeaveController);

  app.put(
    "/me/appointments/:id/status",
    { preHandler: [authenticate] },
    updateAppointmentStatusController,
  );
}
