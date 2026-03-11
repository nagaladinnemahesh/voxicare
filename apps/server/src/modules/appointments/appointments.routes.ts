import { FastifyInstance } from "fastify";
import {
  bookAppointmentController,
  listAppointmentsController,
  getAppointmentController,
  cancelAppointmentController,
  rescheduleAppointmentController,
} from "./appointments.controller";
import {
  bookAppointmentSchema,
  listAppointmentsSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from "./appointments.schema";
import { authenticate } from "../../middlewares/authenticate";

/**
 * Appointments routes — registers all appointment related endpoints
 * All routes here are PROTECTED — valid JWT token required
 * The authenticate middleware runs before every route handler
 * @param app - Fastify instance
 */
export async function appointmentsRoutes(app: FastifyInstance) {
  /**
   * POST /api/appointments
   * Books a new appointment for the logged in patient
   */
  app.post(
    "/",
    {
      preHandler: [authenticate], // runs authenticate before controller
      schema: bookAppointmentSchema,
    },
    bookAppointmentController,
  );

  /**
   * GET /api/appointments
   * Returns all appointments for the logged in patient
   */
  app.get(
    "/",
    {
      preHandler: [authenticate],
      schema: listAppointmentsSchema,
    },
    listAppointmentsController,
  );

  /**
   * GET /api/appointments/:id
   * Returns a single appointment by ID
   */
  app.get(
    "/:id",
    {
      preHandler: [authenticate],
    },
    getAppointmentController,
  );

  /**
   * PUT /api/appointments/:id/cancel
   * Cancels an appointment
   */
  app.put(
    "/:id/cancel",
    {
      preHandler: [authenticate],
      schema: cancelAppointmentSchema,
    },
    cancelAppointmentController,
  );

  /**
   * PUT /api/appointments/:id/reschedule
   * Reschedules an appointment — cancels old, creates new
   */
  app.put(
    "/:id/reschedule",
    {
      preHandler: [authenticate],
      schema: rescheduleAppointmentSchema,
    },
    rescheduleAppointmentController,
  );
}
