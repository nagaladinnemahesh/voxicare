import { FastifyRequest, FastifyReply } from "fastify";
import * as appointmentsService from "./appointments.service";

//APPOINTMENTS CONTROLLERS

/**
 * Handles booking a new appointment
 * - Gets logged in user id from JWT token
 * - Passes to service to validate and create
 */
export async function bookAppointmentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // Extract logged in user's id from JWT token payload
    const { id: userId } = request.user as { id: string; role: string };

    const { doctorId, startTime, endTime, reason } = request.body as {
      doctorId: string;
      startTime: string;
      endTime: string;
      reason?: string;
    };

    const appointment = await appointmentsService.bookAppointment({
      userId,
      doctorId,
      startTime,
      endTime,
      reason,
    });

    return reply.status(201).send({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Handles listing all appointments for the logged in patient
 */
export async function listAppointmentsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id: userId } = request.user as { id: string; role: string };

    const {
      status,
      page = 1,
      limit = 10,
    } = request.query as {
      status?: string;
      page?: number;
      limit?: number;
    };

    const result = await appointmentsService.listAppointments({
      userId,
      status,
      page: Number(page),
      limit: Number(limit),
    });

    return reply.status(200).send({
      success: true,
      message: "Appointments fetched successfully",
      data: result,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Handles getting a single appointment by ID
 * Verifies appointment belongs to logged in user
 */
export async function getAppointmentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id: userId } = request.user as { id: string; role: string };
    const { id } = request.params as { id: string };

    const appointment = await appointmentsService.getAppointmentById(
      id,
      userId,
    );

    return reply.status(200).send({
      success: true,
      message: "Appointment fetched successfully",
      data: appointment,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("Unauthorized")
      ? 403
      : error.message.includes("not found")
        ? 404
        : 500;
    return reply.status(statusCode).send({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Handles cancelling an appointment
 * Verifies appointment belongs to logged in user
 */
export async function cancelAppointmentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id: userId } = request.user as { id: string; role: string };
    const { id } = request.params as { id: string };

    const appointment = await appointmentsService.cancelAppointment(id, userId);

    return reply.status(200).send({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("Unauthorized")
      ? 403
      : error.message.includes("not found")
        ? 404
        : 400;
    return reply.status(statusCode).send({
      success: false,
      message: error.message,
    });
  }
}

/**
 * Handles rescheduling an appointment
 * Cancels old appointment and creates new one with history link
 */
export async function rescheduleAppointmentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id: userId } = request.user as { id: string; role: string };
    const { id } = request.params as { id: string };

    const { startTime, endTime } = request.body as {
      startTime: string;
      endTime: string;
    };

    const appointment = await appointmentsService.rescheduleAppointment({
      id,
      userId,
      startTime,
      endTime,
    });

    return reply.status(200).send({
      success: true,
      message: "Appointment rescheduled successfully",
      data: appointment,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("Unauthorized")
      ? 403
      : error.message.includes("not found")
        ? 404
        : 400;
    return reply.status(statusCode).send({
      success: false,
      message: error.message,
    });
  }
}
