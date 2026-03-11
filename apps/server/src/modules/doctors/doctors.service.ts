import { prisma } from "../../config/prisma";

// doctors services

// getting approved doctors list
export async function listDoctors(filters: {
  city?: string;
  specializationId?: string;
  page: number;
  limit: number;
}) {
  const { city, specializationId, page, limit } = filters;

  // Calculate how many records to skip for pagination
  // e.g. page 2 with limit 10 skips first 10 records
  const skip = (page - 1) * limit;

  const doctors = await prisma.doctor.findMany({
    where: {
      // Only show approved doctors to patients
      status: "APPROVED",

      // Filter by city if provided
      ...(city && { city: { contains: city, mode: "insensitive" } }),

      // Filter by specialization if provided
      ...(specializationId && {
        specializations: {
          some: {
            specializationId,
          },
        },
      }),
    },
    select: {
      id: true,
      name: true,
      city: true,
      bio: true,
      experienceYears: true,
      consultationFee: true,
      // Include specializations with their details
      specializations: {
        select: {
          specialization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  // Get total count for pagination metadata
  const total = await prisma.doctor.count({
    where: {
      status: "APPROVED",
      ...(city && { city: { contains: city, mode: "insensitive" } }),
      ...(specializationId && {
        specializations: {
          some: { specializationId },
        },
      }),
    },
  });

  return {
    doctors,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Get a single doctor by ID with full details

export async function getDoctorById(id: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      city: true,
      bio: true,
      experienceYears: true,
      consultationFee: true,
      // Include specializations
      specializations: {
        select: {
          specialization: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
      // Include weekly availability schedule
      availability: {
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          breakStart: true,
          breakEnd: true,
        },
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  return doctor;
}

// Get a doctor's availability for a specific date

export async function getDoctorAvailability(doctorId: string, date: string) {
  // Convert date string to day of week
  // e.g. "2026-03-11" → "WED"
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayOfWeek = dayNames[new Date(date).getDay()];

  // Check if doctor has a leave on this date
  const leave = await prisma.doctorLeave.findFirst({
    where: {
      doctorId,
      date: new Date(date),
    },
  });

  // If doctor is on full day leave, return unavailable
  if (leave?.isFullDay) {
    return {
      available: false,
      reason: "Doctor is on leave",
      slots: [],
    };
  }

  // Get doctor's regular schedule for this day
  const availability = await prisma.doctorAvailability.findUnique({
    where: {
      doctorId_dayOfWeek: {
        doctorId,
        dayOfWeek: dayOfWeek as any,
      },
    },
  });

  // If doctor doesn't work on this day, return unavailable
  if (!availability) {
    return {
      available: false,
      reason: "Doctor does not work on this day",
      slots: [],
    };
  }

  return {
    available: true,
    dayOfWeek,
    startTime: availability.startTime,
    endTime: availability.endTime,
    breakStart: availability.breakStart,
    breakEnd: availability.breakEnd,
  };
}

//SPECIALIZATIONS SERVICES

// Get all specializations
export async function listSpecializations() {
  const specializations = await prisma.specialization.findMany({
    orderBy: { name: "asc" },
  });
  return specializations;
}
