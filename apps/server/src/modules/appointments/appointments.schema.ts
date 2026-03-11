// schema for booking appointment
export const bookAppointmentSchema = {
  body: {
    type: "object",
    required: ["doctorId", "startTime", "endTime"],
    properties: {
      doctorId: { type: "string" }, // which doctor to book
      startTime: { type: "string" }, // ISO datetime e.g. "2026-03-15T10:00:00.000Z"
      endTime: { type: "string" }, // ISO datetime e.g. "2026-03-15T10:30:00.000Z"
      reason: { type: "string" }, // optional — why patient is visiting
    },
  },
};

// Schema for rescheduling an appointment Only needs new start and end time
export const rescheduleAppointmentSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["startTime", "endTime"],
    properties: {
      startTime: { type: "string" }, // new start time
      endTime: { type: "string" }, // new end time
    },
  },
};

//Schema for cancelling an appointment Only needs the appointment ID from params
export const cancelAppointmentSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

// Schema for listing appointments Supports filtering by status and pagination
export const listAppointmentsSchema = {
  querystring: {
    type: "object",
    properties: {
      status: { type: "string" }, // filter by status e.g. PENDING, CONFIRMED
      page: { type: "number", default: 1 },
      limit: { type: "number", default: 10 },
    },
  },
};
