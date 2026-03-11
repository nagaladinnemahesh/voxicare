import { FastifyRequest, FastifyReply } from "fastify";
import * as authService from "./auth.service";
import { DoctorStatus } from "../../generated/prisma";

// patient controller

//register patient
export async function registerUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const user = await authService.registerUser(request.body as any);

    return reply.status(201).send({
      success: true,
      message: "Registration Successful",
      data: user,
    });
  } catch (error: any) {
    // if email/phone already exists return 400
    return reply.status(400).send({
      success: false,
      message: error.message,
    });
  }
}

//login patient
export async function loginUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const user = await authService.loginUser(request.body as any);

    //sign jwt with userid and role
    const token = request.server.jwt.sign(
      {
        id: user.id,
        role: "PATIENT", // distinguish patients from doctors
      },
      {
        expiresIn: "7d", //token expires in 7days
      },
    );

    return reply.status(200).send({
      success: true,
      message: "Login successful",
      data: {
        token,
        user,
      },
    });
  } catch (error: any) {
    return reply.status(401).send({
      success: false,
      message: error.message,
    });
  }
}

// doctor controller

// doctor registration
export async function registerDoctorController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const doctor = await authService.registerDoctor(request.body as any);

    return reply.status(201).send({
      success: true,
      message: "Registration successful. Your account is pending approval.",
      data: doctor,
    });
  } catch (error: any) {
    return reply.status(400).send({
      success: false,
      message: error.message,
    });
  }
}

// doctor login
export async function loginDoctorController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const doctor = await authService.loginDoctor(request.body as any);

    //sign jwt token with doctor id and role
    const token = request.server.jwt.sign(
      {
        id: doctor.id,
        role: "DOCTOR",
      },
      {
        expiresIn: "7d",
      },
    );

    return reply.status(200).send({
      success: true,
      message: "Login Successful",
      data: {
        token,
        doctor,
      },
    });
  } catch (error: any) {
    return reply.status(401).send({
      success: false,
      message: error.message,
    });
  }
}
