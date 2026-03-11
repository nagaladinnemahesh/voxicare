import { FastifyRequest, FastifyReply } from "fastify";
import * as doctorsService from "./doctors.service";

//DOCTORS CONTROLLERS

//Handles listing all approved doctors

export async function listDoctorsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // Extract query parameters with defaults
    const {
      city,
      specializationId,
      page = 1,
      limit = 10,
    } = request.query as {
      city?: string;
      specializationId?: string;
      page?: number;
      limit?: number;
    };

    const result = await doctorsService.listDoctors({
      city,
      specializationId,
      page: Number(page),
      limit: Number(limit),
    });

    return reply.status(200).send({
      success: true,
      message: "Doctors fetched successfully",
      data: result,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message,
    });
  }
}

//Handles getting a single doctor by ID

export async function getDoctorController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id } = request.params as { id: string };

    const doctor = await doctorsService.getDoctorById(id);

    return reply.status(200).send({
      success: true,
      message: "Doctor fetched successfully",
      data: doctor,
    });
  } catch (error: any) {
    // If doctor not found return 404
    const statusCode = error.message === "Doctor not found" ? 404 : 500;
    return reply.status(statusCode).send({
      success: false,
      message: error.message,
    });
  }
}

// Handles getting a doctor's availability for a specific date

export async function getDoctorAvailabilityController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id } = request.params as { id: string };

    // date comes as a query parameter e.g. ?date=2026-03-11
    const { date } = request.query as { date: string };

    if (!date) {
      return reply.status(400).send({
        success: false,
        message: "date query parameter is required",
      });
    }

    const availability = await doctorsService.getDoctorAvailability(id, date);

    return reply.status(200).send({
      success: true,
      message: "Availability fetched successfully",
      data: availability,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message,
    });
  }
}

// SPECIALIZATIONS CONTROLLERS

// Handles listing all specializations

export async function listSpecializationsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const specializations = await doctorsService.listSpecializations();

    return reply.status(200).send({
      success: true,
      message: "Specializations fetched successfully",
      data: specializations,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message,
    });
  }
}
