// doctors schema

// schema for listing doctor
export const listDoctorsSchema = {
  querystring: {
    type: "object",
    properties: {
      city: { type: "string" }, // filter by city
      specializationId: { type: "string" }, // filter by specialization
      page: { type: "number", default: 1 }, // pagination
      limit: { type: "number", default: 10 }, // results per page
    },
  },
};

// schema for getting a doctor by Id
export const getDoctorSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};
