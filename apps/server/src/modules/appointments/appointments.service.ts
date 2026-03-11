import { prisma } from "../../config/prisma";

// appointment Services
/**
 * check if doctor exists and is approved
 * check doctor available on that day
 * checks doctor is not on leave
 * checks no conflicting appointments exist
 * crates the appointment
 */

export async function bookAppointment(data: {
  userId: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  reason?: string;
}) {
  const { userId, doctorId, startTime, endTime, reason } = data;

  const start = new Date(startTime);
  const end = new Date(endTime);

  //checking if doctor exists and is approved
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });
  if (!doctor) throw new Error("Doctor not found");
  if (doctor.status !== "APPROVED") throw new Error("Doctor is not available");

  //check doctor works on this day of week
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayOfWeek = dayNames[start.getDay()];

  const availability = await prisma.doctorAvailability.findUnique({
    where: {
      doctorId_dayOfWeek: {
        doctorId,
        dayOfWeek: dayOfWeek as any,
      },
    },
  });

  if (!availability) {
    throw new Error(`Doctor does not work on ${dayOfWeek}`);
  }

  //check doctor is not on leave
  const leaveDate = new Date(start);
  leaveDate.setHours(0, 0, 0, 0); // normalize to start of day

  const leave = await prisma.doctorLeave.findFirst({
    where: {
      doctorId,
      date: leaveDate,
    },
  });
  if (leave?.isFullDay) {
    throw new Error("Doctor is on leave on this date");
  }

  // Check no conflicting appointments exist for this doctor at this time
  // An appointment conflicts if it overlaps with the requested time slot
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      status: { in: ["PENDING", "CONFIRMED"] }, // only check active appointments
      OR: [
        {
          // existing appointment starts during requested slot
          startTime: { gte: start, lt: end },
        },
        {
          // existing appointment ends during requested slot
          endTime: { gt: start, lte: end },
        },
        {
          // existing appointment completely covers requested slot
          startTime: { lte: start },
          endTime: { gte: end },
        },
      ],
    },
  });
  if (conflict) {
    throw new Error("This time slot is already booked");
  }

  // All checks passed — create the appointment
  const appointment = await prisma.appointment.create({
    data: {
      userId,
      doctorId,
      startTime: start,
      endTime: end,
      reason,
      status: "PENDING",
    },
    // Return appointment with doctor and user details
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return appointment;
}

/**
 * Get all appointments for a patient
 * Supports filtering by status and pagination
 */
export async function listAppointments(data: {
  userId: string;
  status?: string;
  page: number;
  limit: number;
}) {
  const { userId, status, page, limit } = data;
  const skip = (page - 1) * limit;

  const appointments = await prisma.appointment.findMany({
    where: {
      userId,
      // Filter by status if provided
      ...(status && { status: status as any }),
    },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          city: true,
          consultationFee: true,
          specializations: {
            select: {
              specialization: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    skip,
    take: limit,
    orderBy: { startTime: "desc" }, // most recent first
  });

  const total = await prisma.appointment.count({
    where: {
      userId,
      ...(status && { status: status as any }),
    },
  });

  return {
    appointments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single appointment by ID
 * Verifies the appointment belongs to the requesting user
 */
export async function getAppointmentById(id: string, userId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          city: true,
          consultationFee: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!appointment) throw new Error("Appointment not found");

  // Security check — patients can only view their own appointments
  if (appointment.userId !== userId) {
    throw new Error("Unauthorized — this appointment does not belong to you");
  }

  return appointment;
}

/**
 * Cancels an appointment
 * - Verifies appointment belongs to user
 * - Verifies appointment is in a cancellable state
 */
export async function cancelAppointment(id: string, userId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) throw new Error("Appointment not found");

  // Security check
  if (appointment.userId !== userId) {
    throw new Error("Unauthorized — this appointment does not belong to you");
  }

  // Can only cancel PENDING or CONFIRMED appointments
  if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
    throw new Error(
      `Cannot cancel an appointment with status ${appointment.status}`,
    );
  }

  // Update status to CANCELLED
  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return updated;
}

/**
 * Reschedules an appointment
 * - Cancels the old appointment
 * - Creates a new one linked via rescheduledFromId
 * - Keeps full history of changes
 */
export async function rescheduleAppointment(data: {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
}) {
  const { id, userId, startTime, endTime } = data;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) throw new Error("Appointment not found");

  // Security check
  if (appointment.userId !== userId) {
    throw new Error("Unauthorized — this appointment does not belong to you");
  }

  // Can only reschedule PENDING or CONFIRMED appointments
  if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
    throw new Error(
      `Cannot reschedule an appointment with status ${appointment.status}`,
    );
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  // Check no conflicts for the new time slot
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId: appointment.doctorId,
      id: { not: id }, // exclude current appointment
      status: { in: ["PENDING", "CONFIRMED"] },
      OR: [
        { startTime: { gte: start, lt: end } },
        { endTime: { gt: start, lte: end } },
        { startTime: { lte: start }, endTime: { gte: end } },
      ],
    },
  });
  if (conflict) throw new Error("This time slot is already booked");

  // Use transaction — cancel old, create new atomically
  const newAppointment = await prisma.$transaction(async (tx) => {
    // Cancel the old appointment
    await tx.appointment.update({
      where: { id },
      data: { status: "RESCHEDULED" },
    });

    // Create new appointment linked to the old one
    return tx.appointment.create({
      data: {
        userId: appointment.userId,
        doctorId: appointment.doctorId,
        startTime: start,
        endTime: end,
        reason: appointment.reason,
        status: "PENDING",
        rescheduledFromId: id, // links to old appointment for history
      },
    });
  });

  return newAppointment;
}
