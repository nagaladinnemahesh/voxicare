import { FastifyInstance } from "fastify";
import {
  registerUserController,
  loginUserController,
  registerDoctorController,
  loginDoctorController,
} from "./auth.controller";

import {
  registerUserSchema,
  loginUserSchema,
  registerDoctorSchema,
  loginDoctorSchema,
} from "./auth.schema";

// register all auth endpoints, all are public

export async function authRoutes(app: FastifyInstance) {
  //patient routes
  app.post(
    "/patient/register",
    {
      schema: registerUserSchema, //validates request body
    },
    registerUserController,
  );

  // login a patient and return jwt token
  app.post(
    "/patient/login",
    {
      schema: loginUserSchema,
    },
    loginUserController,
  );

  // doctor routes

  // registering a new doctor
  app.post(
    "/doctor/register",
    {
      schema: registerDoctorSchema,
    },
    registerDoctorController,
  );

  // login doctor
  app.post(
    "/doctor/login",
    {
      schema: loginDoctorSchema,
    },
    loginDoctorController,
  );
}
