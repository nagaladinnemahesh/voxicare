import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";

// 12 salt rounds a good balance for security and performance
const SALT_ROUNDS = 12;

// patient auth services

export async function registerUser(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  bloodGroup?: string;
  height?: number;
  weight?: number;
}) {
  // check if email already registered
  const existingEmail = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingEmail) {
    throw new Error("Email already registered");
  }

  // check if phone already registered
  const existingPhone = await prisma.user.findUnique({
    where: { phone: data.phone },
  });
  if (existingPhone) {
    throw new Error("Phone number already registered");
  }

  // hash the password
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // create the user in the database
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      dateOfBirth: new Date(data.dateOfBirth),
      gender: data.gender as any,
      bloodGroup: data.bloodGroup as any,
      height: data.height,
      weight: data.weight,
    },

    // returning user details except password
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      gender: true,
      bloodGroup: true,
      height: true,
      weight: true,
      createdAt: true,
    },
  });

  return user;
}

// login a patient

export async function loginUser(data: { email: string; password: string }) {
  // find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error("Invalid email or password"); // never reveal email or password whic is wrong
  }

  // compare password with stored hashed
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // return user without password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// doctor auth services

//registering a new doctor

export async function registerDoctor(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  city: string;
  bio?: string;
  experienceYears: number;
  consultationFee: number;
  specializationIds: string[];
}) {
  // check if email already registered
  const existingEmail = await prisma.doctor.findUnique({
    where: { email: data.email },
  });
  if (existingEmail) {
    throw new Error("Email already registered");
  }

  // check if phone already registered
  const existingPhone = await prisma.doctor.findUnique({
    where: { phone: data.phone },
  });
  if (existingPhone) {
    throw new Error("Phone number already registered");
  }

  // validate all provided specialization id's actually exists
  const specializations = await prisma.specialization.findMany({
    where: { id: { in: data.specializationIds } },
  });
  if (specializations.length !== data.specializationIds.length) {
    throw new Error("One or more specialization Ids are invalid");
  }

  // hash the passsword
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // creating doctor along with specialization in one transaction, transactions ensure both ops fail or succeed
  const doctor = await prisma.$transaction(async (tx) => {
    //creat doctor
    const newDoctor = await tx.doctor.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        city: data.city,
        bio: data.bio,
        experienceYears: data.experienceYears,
        consultationFee: data.consultationFee,
        status: "PENDING", // doctor needs admin approval
      },
    });

    // link specializaton to doctor via junction table
    await tx.doctorSpecialization.createMany({
      data: data.specializationIds.map((specializationId) => ({
        doctorId: newDoctor.id,
        specializationId,
      })),
    });

    return newDoctor;
  });

  // return doctor without password
  const { password, ...doctorWithoutPassword } = doctor;
  return doctorWithoutPassword;
}

// login doctor
export async function loginDoctor(data: { email: string; password: string }) {
  // find doctor by email
  const doctor = await prisma.doctor.findUnique({
    where: { email: data.email },
  });

  if (!doctor) {
    throw new Error("Invalid email or password");
  }

  //check if doctor accont is approved
  if (doctor.status === "PENDING") {
    throw new Error("Your account is pending approval");
  }
  if (doctor.status === "REJECTED") {
    throw new Error("Your account has been rejected");
  }
  if (doctor.status === "SUSPENDED") {
    throw new Error("You account has been suspended");
  }

  //compare password
  const isPasswordValid = await bcrypt.compare(data.password, doctor.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // return doctor without password
  const { password, ...doctorWithoutPassword } = doctor;
  return doctorWithoutPassword;
}
