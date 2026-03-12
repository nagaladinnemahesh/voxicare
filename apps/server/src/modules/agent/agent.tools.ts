import Anthropic from "@anthropic-ai/sdk";

/**
 * Tools definition for the Voxicare AI agent
 * These are the actions Claude can perform on behalf of the user
 * Claude reads these descriptions to understand when and how to use each tool
 * The better the description, the smarter Claude behaves
 */
export const voxicareTools: Anthropic.Tool[] = [
  {
    name: "getSpecializations",
    description:
      "Get a list of all available medical specializations. Use this when the user asks about available specializations, types of doctors, or when you need to find a specialization ID before searching for doctors.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "getDoctors",
    description:
      "Get a list of approved doctors. Use this when the user wants to find a doctor, browse available doctors, or when you need a doctor ID before booking. You can filter by city or specialization.",
    input_schema: {
      type: "object" as const,
      properties: {
        city: {
          type: "string",
          description: "Filter doctors by city name",
        },
        specializationId: {
          type: "string",
          description: "Filter doctors by specialization ID",
        },
      },
      required: [],
    },
  },
  {
    name: "getDoctorAvailability",
    description:
      "Check if a doctor is available on a specific date. Use this before booking to confirm the doctor works on that day and is not on leave.",
    input_schema: {
      type: "object" as const,
      properties: {
        doctorId: {
          type: "string",
          description: "The ID of the doctor to check availability for",
        },
        date: {
          type: "string",
          description: "The date to check in YYYY-MM-DD format e.g. 2026-03-12",
        },
      },
      required: ["doctorId", "date"],
    },
  },
  {
    name: "bookAppointment",
    description:
      "Book a new appointment for the patient with a doctor. Use this when the user wants to schedule, book, or make an appointment. Always check doctor availability first before booking.",
    input_schema: {
      type: "object" as const,
      properties: {
        doctorId: {
          type: "string",
          description: "The ID of the doctor to book with",
        },
        startTime: {
          type: "string",
          description:
            "Appointment start time in ISO format e.g. 2026-03-12T10:00:00.000Z",
        },
        endTime: {
          type: "string",
          description:
            "Appointment end time in ISO format e.g. 2026-03-12T10:30:00.000Z. Default to 30 minutes after start time.",
        },
        reason: {
          type: "string",
          description:
            "Optional reason for the appointment e.g. regular checkup, fever, back pain",
        },
      },
      required: ["doctorId", "startTime", "endTime"],
    },
  },
  {
    name: "listAppointments",
    description:
      "Get all appointments for the logged in patient. Use this when the user asks to see their appointments, upcoming bookings, or appointment history.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          description:
            "Filter by status: PENDING, CONFIRMED, COMPLETED, CANCELLED, RESCHEDULED, NO_SHOW",
        },
      },
      required: [],
    },
  },
  {
    name: "cancelAppointment",
    description:
      "Cancel an existing appointment. Use this when the user wants to cancel or delete a booking. Always list appointments first to get the appointment ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        appointmentId: {
          type: "string",
          description: "The ID of the appointment to cancel",
        },
      },
      required: ["appointmentId"],
    },
  },
  {
    name: "rescheduleAppointment",
    description:
      "Reschedule an existing appointment to a new date and time. Use this when the user wants to change, move, or reschedule a booking.",
    input_schema: {
      type: "object" as const,
      properties: {
        appointmentId: {
          type: "string",
          description: "The ID of the appointment to reschedule",
        },
        startTime: {
          type: "string",
          description: "New appointment start time in ISO format",
        },
        endTime: {
          type: "string",
          description: "New appointment end time in ISO format",
        },
      },
      required: ["appointmentId", "startTime", "endTime"],
    },
  },
];
