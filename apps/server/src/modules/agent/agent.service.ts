// import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import { env } from "../../config/env";
import { voxicareTools } from "./agent.tools";
import { prisma } from "../../config/prisma";

// Initialize Anthropic client
// const anthropic = new Anthropic({
//   apiKey: env.ANTHROPIC_API_KEY,
// });

//initialize groq client
const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

/**
 * System prompt for the Voxicare AI agent
 * This tells Claude who it is and how to behave
 * The clearer this is, the better Claude performs
 */
const SYSTEM_PROMPT = `You are Voxia, a helpful AI assistant for Voxicare — a healthcare appointment booking platform.

Your job is to help patients:
- Find doctors by specialization or city
- Check doctor availability
- Book, cancel, and reschedule appointments
- View their appointment history

Guidelines:
- Always be polite, professional and empathetic — this is healthcare
- When booking, always check doctor availability first
- If you need information to complete a task, ask the user clearly
- Always confirm details before booking (doctor name, date, time)
- When listing doctors or appointments, present them in a clear readable format
- Today's date is ${new Date().toISOString().split("T")[0]}
- Default appointment duration is 30 minutes unless user specifies otherwise
- Always refer to times in a human friendly format e.g. "10:00 AM" not "10:00:00.000Z"`;

/**
 * Executes a tool call requested by Claude
 * Maps tool names to actual API/database operations
 */
async function executeTool(
  toolName: string,
  toolInput: any,
  userId: string,
): Promise<string> {
  try {
    switch (toolName) {
      case "getSpecializations": {
        // Fetch all specializations from database
        const specializations = await prisma.specialization.findMany({
          orderBy: { name: "asc" },
        });
        return JSON.stringify(specializations);
      }

      case "getDoctors": {
        // Fetch approved doctors with optional filters
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
          take: 10, // limit to 10 doctors
        });
        return JSON.stringify(doctors);
      }

      case "getDoctorAvailability": {
        // Check doctor availability for a specific date
        const { doctorId, date } = toolInput;
        const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const dayOfWeek = dayNames[new Date(date).getDay()];

        // Check for leave
        const leave = await prisma.doctorLeave.findFirst({
          where: { doctorId, date: new Date(date) },
        });
        if (leave?.isFullDay) {
          return JSON.stringify({
            available: false,
            reason: "Doctor is on leave",
          });
        }

        // Check regular schedule
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
        // Book a new appointment for the logged in user
        const { doctorId, startTime, endTime, reason } = toolInput;
        const start = new Date(startTime);
        const end = new Date(endTime);

        // Check for conflicts
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

        // Create the appointment
        const appointment = await prisma.appointment.create({
          data: {
            userId,
            doctorId,
            startTime: start,
            endTime: end,
            reason,
            status: "PENDING",
          },
          include: {
            doctor: { select: { name: true, city: true } },
          },
        });
        return JSON.stringify({ success: true, appointment });
      }

      case "listAppointments": {
        // Get all appointments for the logged in user
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
        // Cancel an appointment — verify it belongs to the user first
        const { appointmentId } = toolInput;
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
        });

        if (!appointment) {
          return JSON.stringify({
            success: false,
            error: "Appointment not found",
          });
        }
        if (appointment.userId !== userId) {
          return JSON.stringify({ success: false, error: "Unauthorized" });
        }
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
        // Reschedule — cancel old, create new with history link
        const { appointmentId, startTime, endTime } = toolInput;
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
        });

        if (!appointment) {
          return JSON.stringify({
            success: false,
            error: "Appointment not found",
          });
        }
        if (appointment.userId !== userId) {
          return JSON.stringify({ success: false, error: "Unauthorized" });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        // Use transaction to cancel old and create new atomically
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
    // Return error as string so Claude can handle it gracefully
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Main agent function using Groq
 * Sends user message to Groq, handles tool calls, returns final response
 */
export async function runAgent(data: {
  message: string;
  userId: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<string> {
  const { message, userId, conversationHistory } = data;

  // Build messages array with conversation history + new message
  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  // Agentic loop — keeps running until LLM gives a final text response
  while (true) {
    // Send message to Groq with our tools
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // best free model for tool calling
      max_tokens: 1024,
      messages,
      tools: voxicareTools.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema,
        },
      })),
    });

    const choice = response.choices[0];

    // If LLM is done and gives a text response — return it
    if (choice.finish_reason === "stop") {
      return choice.message.content || "I could not process your request.";
    }

    // If LLM wants to use a tool
    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      // Add assistant message to history
      messages.push(choice.message);

      // Process all tool calls
      for (const toolCall of choice.message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolInput = JSON.parse(toolCall.function.arguments);

        console.log(`🔧 Voxia is calling tool: ${toolName}`, toolInput);

        // Execute the tool
        const result = await executeTool(toolName, toolInput, userId);

        console.log(`✅ Tool result for ${toolName}:`, result);

        // Add tool result back to messages
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    }
  }
}
