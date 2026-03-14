import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";

/**
 * Admin login
 */
export async function adminLoginController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return reply
        .status(401)
        .send({ success: false, message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return reply
        .status(401)
        .send({ success: false, message: "Invalid credentials" });
    }

    const token = request.server.jwt.sign({
      id: admin.id,
      role: "ADMIN",
    });

    return reply.status(200).send({
      success: true,
      data: {
        token,
        admin: { id: admin.id, name: admin.name, email: admin.email },
      },
    });
  } catch (error: any) {
    return reply.status(500).send({ success: false, message: error.message });
  }
}

/**
 * Get all pending doctors
 */
export async function getPendingDoctorsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { status: "PENDING" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        experienceYears: true,
        consultationFee: true,
        createdAt: true,
        specializations: {
          select: { specialization: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return reply.status(200).send({ success: true, data: { doctors } });
  } catch (error: any) {
    return reply.status(500).send({ success: false, message: error.message });
  }
}

/**
 * Get all doctors
 */
export async function getAllDoctorsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const doctors = await prisma.doctor.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        status: true,
        experienceYears: true,
        consultationFee: true,
        createdAt: true,
        specializations: {
          select: { specialization: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return reply.status(200).send({ success: true, data: { doctors } });
  } catch (error: any) {
    return reply.status(500).send({ success: false, message: error.message });
  }
}

/**
 * Approve or reject a doctor
 */
export async function updateDoctorStatusController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { id } = request.params as { id: string };
    const { status } = request.body as {
      status: "APPROVED" | "REJECTED" | "SUSPENDED";
    };

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return reply
        .status(404)
        .send({ success: false, message: "Doctor not found" });
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data: { status },
    });

    return reply.status(200).send({
      success: true,
      data: { doctor: updated },
      message: `Doctor ${status.toLowerCase()} successfully`,
    });
  } catch (error: any) {
    return reply.status(500).send({ success: false, message: error.message });
  }
}

/**
 * Get platform stats
 */
export async function getStatsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const [
      totalPatients,
      totalDoctors,
      pendingDoctors,
      totalAppointments,
      todayAppointments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.doctor.count({ where: { status: "APPROVED" } }),
      prisma.doctor.count({ where: { status: "PENDING" } }),
      prisma.appointment.count(),
      prisma.appointment.count({
        where: {
          startTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    return reply.status(200).send({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        pendingDoctors,
        totalAppointments,
        todayAppointments,
      },
    });
  } catch (error: any) {
    return reply.status(500).send({ success: false, message: error.message });
  }
}

/**
 * Get all patients
 */
export async function getAllPatientsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const patients = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return reply.status(200).send({ success: true, data: { patients } });
  } catch (error: any) {
    return reply.status(500).send({ success: false, message: error.message });
  }
}

/**
 * Get all appointments
 */
export async function getAllAppointmentsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        doctor: { select: { name: true, city: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { startTime: "desc" },
      take: 50,
    });
    return reply.status(200).send({ success: true, data: { appointments } });
  } catch (error: any) {
    return reply.status(500).send({ success: false, message: error.message });
  }
}
