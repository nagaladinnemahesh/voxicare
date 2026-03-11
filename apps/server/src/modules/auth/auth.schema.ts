/**
 * defines the shape and validation rules
 * fastify uses these to automatically validate incoming data
 */

// patient schemas

// schema for patinet registration

export const registerUserSchema = {
  body: {
    type: "object",
    required: ["name", "email", "phone", "password", "dateOfBirth", "gender"],
    properties: {
      name: { type: "string", minLength: 2 },
      email: { type: "string", format: "email" },
      phone: { type: "string", minLength: 10 },
      password: { type: "string", minLength: 6 },
      dateOfBirth: { type: "string" }, //ISO DATE STRING "1997-06-11"
      gender: { type: "string", enum: ["MALE", "FEMALE", "OTHER"] },
      bloodGroup: {
        type: "string",
        enum: [
          "A_POS",
          "A_NEG",
          "B_POS",
          "B_NEG",
          "AB_POS",
          "AB_NEG",
          "O_POS",
          "O_NEG",
        ],
      },
      height: { type: "number" }, // optional
      weight: { type: "number" }, // optional
    },
  },
};

// schema for patient login

export const loginUserSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },
};

//doctor schemas

// schema for doctor registration

export const registerDoctorSchema = {
  body: {
    type: "object",
    required: [
      "name",
      "email",
      "phone",
      "password",
      "city",
      "experienceYears",
      "consultationFee",
      "specializationIds",
    ],
    properties: {
      name: { type: "string", minLength: 2 },
      email: { type: "string", format: "email" },
      phone: { type: "string", minLength: 10 },
      password: { type: "string", minLength: 6 },
      city: { type: "string" },
      bio: { type: "string" }, // optional
      experienceYears: { type: "number" },
      consultationFee: { type: "number" },
      specializationIds: {
        type: "array", // array of specialization IDs
        items: { type: "string" },
        minItems: 1, // must have at least one specialization
      },
    },
  },
};

// schema for doctor login

export const loginDoctorSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },
};
