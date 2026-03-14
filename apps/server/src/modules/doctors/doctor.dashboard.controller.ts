import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../config/prisma";

/**
 * Get doctor's own appointments
 */
export async function getDoctorAppointmentsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id: doctorId } = request.user as { id: string; role: string };

    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
      take: 50,
    });

    return reply.status(200).send({ success: true, data: { appointments } });
  } catch (error: any) {
    return reply.status(500).send({ success: false, message: error.message });
  }
}

/**
 * Get doctor's own profile
 */
export async function getDoctorProfileController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id: doctorId } = request.user as { id: string; role: string };

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        bio: true,
        status: true,
        experienceYears: true,
        consultationFee: true,
        specializations: {
          select: { specialization: { select: { id: true, name: true } } },
        },
        availability: true,
      },
    });

    if (!doctor) {
      return reply
        .status(404)
        .send({ success: false, message: "Doctor not found" });
    }

    return reply.status(200).send({ success: true, data: { doctor } });
  } catch (error: any) {
    return reply.status(500).send({ success: false, message: error.message });
  }
}

/**
 * Update doctor availability
 */
export async function updateAvailabilityController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id: doctorId } = request.user as { id: string; role: string };

    const { availability } = request.body as {
      availability: {
        dayOfWeek: string;
        startTime: string;
        endTime: string;
      }[];
    };

    // Delete existing availability
    await prisma.doctorAvailability.deleteMany({ where: { doctorId } });

    // Create new availability
    const created = await prisma.doctorAvailability.createMany({
      data: availability.map((a) => ({
        doctorId,
        dayOfWeek: a.dayOfWeek as any,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    });

    return reply.status(200).send({
      success: true,
      message: "Availability updated successfully",
      data: { count: created.count },
    });
  } catch (error: any) {
    return reply.status(500).send({ success: false, message: error.message });
  }
}

/**
 * Add a leave day
 */
export async function addLeaveController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id: doctorId } = request.user as { id: string; role: string };
    const { date, reason } = request.body as { date: string; reason?: string };

    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId,
        date: new Date(date),
        reason,
        isFullDay: true,
      },
    });

    return reply.status(200).send({ success: true, data: { leave } });
  } catch (error: any) {
    return reply.status(500).send({ success: false, message: error.message });
  }
}

/**
 * Update appointment status by doctor
 */
export async function updateAppointmentStatusController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id: doctorId } = request.user as { id: string; role: string };
    const { id } = request.params as { id: string };
    const { status } = request.body as {
      status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
    };

    const appointment = await prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      return reply
        .status(404)
        .send({ success: false, message: "Appointment not found" });
    }
    if (appointment.doctorId !== doctorId) {
      return reply
        .status(403)
        .send({ success: false, message: "Unauthorized" });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    return reply.status(200).send({
      success: true,
      message: `Appointment ${status.toLowerCase()} successfully`,
      data: { appointment: updated },
    });
  } catch (error: any) {
    return reply.status(500).send({ success: false, message: error.message });
  }
}
