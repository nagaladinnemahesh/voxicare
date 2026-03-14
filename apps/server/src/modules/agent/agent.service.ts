import {
  GoogleGenerativeAI,
  Tool,
  FunctionDeclaration,
} from "@google/generative-ai";
import { env } from "../../config/env";
import { voxicareTools } from "./agent.tools";
import { prisma } from "../../config/prisma";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are Voxia, a helpful AI assistant for Voxicare — a healthcare appointment booking platform.

Your job is to help patients:
- Find doctors by specialization or city
- Check doctor availability
- Book, cancel, and reschedule appointments
- View their appointment history

Guidelines:
- Always be polite, professional and empathetic — this is healthcare
- Today's date is ${new Date().toISOString().split("T")[0]}
- Default appointment duration is 30 minutes unless user specifies otherwise
- Always refer to times in a human friendly format e.g. "10:00 AM" not "10:00:00.000Z"

IMPORTANT BOOKING RULES:
- NEVER ask the user for a doctor ID — you find it yourself using tools
- When the user mentions a doctor by name, use getDoctors tool to find their ID
- When the user says a city, use it to filter doctors
- When you have doctor name + date + time, immediately check availability then book
- Once you have all details confirmed, book immediately using bookAppointment
- If the doctor is not available at requested time, suggest their next available slot
- If the user already told you something in this conversation, do NOT ask for it again
- Never say you don't have access to tools — you always have all tools available
- After finding doctors or checking availability, always summarize what you found in your response
- Always include doctor name AND confirmed date/time in your response before booking

IMPORTANT CANCEL/RESCHEDULE RULES:
- When user wants to cancel or reschedule, ALWAYS call listAppointments tool first
- Never ask the user for an appointment ID — find it yourself using listAppointments
- After listing appointments, show them clearly and ask which one to cancel/reschedule
- Once user picks an appointment, use the ID from listAppointments result to proceed
- For reschedule, ask for new date and time, check availability, then call rescheduleAppointment`;
/**
 * Executes a tool call
 */
async function executeTool(
  toolName: string,
  toolInput: any,
  userId: string,
): Promise<string> {
  try {
    switch (toolName) {
      case "getSpecializations": {
        const specializations = await prisma.specialization.findMany({
          orderBy: { name: "asc" },
        });
        return JSON.stringify(specializations);
      }

      case "getDoctors": {
        const { city, specializationId } = toolInput;
        const doctors = await prisma.doctor.findMany({
          where: {
            status: "APPROVED",
            ...(city && { city: { contains: city, mode: "insensitive" } }),
            ...(specializationId && {
              specializations: { some: { specializationId } },
            }),
          },
          select: {
            id: true,
            name: true,
            city: true,
            experienceYears: true,
            consultationFee: true,
            specializations: {
              select: {
                specialization: { select: { name: true } },
              },
            },
          },
          take: 10,
        });
        return JSON.stringify(doctors);
      }

      case "getDoctorAvailability": {
        const { doctorId, date } = toolInput;
        const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const dayOfWeek = dayNames[new Date(date).getDay()];

        const leave = await prisma.doctorLeave.findFirst({
          where: { doctorId, date: new Date(date) },
        });
        if (leave?.isFullDay) {
          return JSON.stringify({
            available: false,
            reason: "Doctor is on leave",
          });
        }

        const availability = await prisma.doctorAvailability.findUnique({
          where: {
            doctorId_dayOfWeek: { doctorId, dayOfWeek: dayOfWeek as any },
          },
        });
        if (!availability) {
          return JSON.stringify({
            available: false,
            reason: `Doctor does not work on ${dayOfWeek}`,
          });
        }

        return JSON.stringify({
          available: true,
          dayOfWeek,
          startTime: availability.startTime,
          endTime: availability.endTime,
          breakStart: availability.breakStart,
          breakEnd: availability.breakEnd,
        });
      }

      case "bookAppointment": {
        const { doctorId, startTime, endTime, reason } = toolInput;
        const start = new Date(startTime);
        const end = new Date(endTime);

        // Generate booking ID like VX-1001
        const lastAppt = await prisma.appointment.findFirst({
          orderBy: { createdAt: "desc" },
          where: { bookingId: { not: null } },
        });
        const lastNum = lastAppt?.bookingId
          ? parseInt(lastAppt.bookingId.replace("VX-", ""))
          : 1000;
        const bookingId = `VX-${lastNum + 1}`;

        const conflict = await prisma.appointment.findFirst({
          where: {
            doctorId,
            status: { in: ["PENDING", "CONFIRMED"] },
            OR: [
              { startTime: { gte: start, lt: end } },
              { endTime: { gt: start, lte: end } },
              { startTime: { lte: start }, endTime: { gte: end } },
            ],
          },
        });
        if (conflict) {
          return JSON.stringify({
            success: false,
            error: "This time slot is already booked",
          });
        }

        const appointment = await prisma.appointment.create({
          data: {
            userId,
            doctorId,
            startTime: start,
            endTime: end,
            reason,
            status: "PENDING",
            bookingId,
          },
          include: {
            doctor: { select: { name: true, city: true } },
          },
        });
        return JSON.stringify({ success: true, appointment });
      }

      case "listAppointments": {
        const { status } = toolInput;
        const appointments = await prisma.appointment.findMany({
          where: {
            userId,
            ...(status && { status: status as any }),
          },
          include: {
            doctor: {
              select: {
                name: true,
                city: true,
                consultationFee: true,
                specializations: {
                  select: { specialization: { select: { name: true } } },
                },
              },
            },
          },
          orderBy: { startTime: "desc" },
          take: 10,
        });
        return JSON.stringify(appointments);
      }

      case "cancelAppointment": {
        const { appointmentId } = toolInput;
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
        });

        if (!appointment)
          return JSON.stringify({
            success: false,
            error: "Appointment not found",
          });
        if (appointment.userId !== userId)
          return JSON.stringify({ success: false, error: "Unauthorized" });
        if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
          return JSON.stringify({
            success: false,
            error: `Cannot cancel appointment with status ${appointment.status}`,
          });
        }

        const updated = await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: "CANCELLED" },
        });
        return JSON.stringify({ success: true, appointment: updated });
      }

      case "rescheduleAppointment": {
        const { appointmentId, startTime, endTime } = toolInput;
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
        });

        if (!appointment)
          return JSON.stringify({
            success: false,
            error: "Appointment not found",
          });
        if (appointment.userId !== userId)
          return JSON.stringify({ success: false, error: "Unauthorized" });

        const start = new Date(startTime);
        const end = new Date(endTime);

        const newAppointment = await prisma.$transaction(async (tx) => {
          await tx.appointment.update({
            where: { id: appointmentId },
            data: { status: "RESCHEDULED" },
          });
          return tx.appointment.create({
            data: {
              userId: appointment.userId,
              doctorId: appointment.doctorId,
              startTime: start,
              endTime: end,
              reason: appointment.reason,
              status: "PENDING",
              rescheduledFromId: appointmentId,
            },
          });
        });
        return JSON.stringify({ success: true, appointment: newAppointment });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Main agent function using Gemini
 */
export async function runAgent(data: {
  message: string;
  userId: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<{ response: string; conversationHistory: any[] }> {
  const { message, userId, conversationHistory } = data;

  // Convert tools to Gemini format
  const tools: Tool[] = [
    {
      functionDeclarations: voxicareTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema as any,
      })) as FunctionDeclaration[],
    },
  ];

  // Build Gemini chat history from conversation history
  const history = conversationHistory.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  // Initialize model with system instruction
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: SYSTEM_PROMPT,
    tools,
  });

  // Start chat with history
  const chat = model.startChat({ history });

  // Track updated history
  const updatedHistory = [...conversationHistory];

  // Send initial message
  // Inject recent context into message so Gemini doesn't lose it
  const contextReminder =
    conversationHistory.length > 0
      ? `[Context from our conversation so far: ${conversationHistory
          .slice(-6)
          .map((m) => `${m.role}: ${m.content}`)
          .join(" | ")}]\n\nUser says: ${message}`
      : message;

  let result = await chat.sendMessage(contextReminder);
  updatedHistory.push({ role: "user", content: message });

  // Agentic loop
  while (true) {
    const response = result.response;
    const candidate = response.candidates?.[0];

    if (!candidate) {
      break;
    }

    // Check for function calls
    const functionCalls = candidate.content.parts
      .filter((p: any) => p.functionCall)
      .map((p: any) => p.functionCall!);

    if (functionCalls.length === 0) {
      // No tool calls — return final text response
      const finalResponse = response.text();
      updatedHistory.push({ role: "assistant", content: finalResponse });
      return { response: finalResponse, conversationHistory: updatedHistory };
    }

    // Execute all function calls
    const functionResponseParts = [];
    for (const fc of functionCalls) {
      console.log(`🔧 Voxia is calling tool: ${fc.name}`, fc.args);
      const toolResult = await executeTool(fc.name, fc.args ?? {}, userId);
      console.log(`✅ Tool result for ${fc.name}:`, toolResult);

      functionResponseParts.push({
        functionResponse: {
          name: fc.name,
          response: { result: toolResult },
        },
      });
    }

    // Send tool results back — must be non-empty
    if (functionResponseParts.length > 0) {
      result = await chat.sendMessage(functionResponseParts);
    } else {
      break;
    }
  }

  return {
    response: "I could not process your request.",
    conversationHistory: updatedHistory,
  };
}
