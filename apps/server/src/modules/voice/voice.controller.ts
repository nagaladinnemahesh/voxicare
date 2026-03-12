import { FastifyRequest, FastifyReply } from "fastify";
import { speechToText, textToSpeech } from "./voice.service";
import { runAgent } from "../agent/agent.service";

/**
 * handles full voice interactions
 * receive audio from browser -> stt -> text to voxia -> tts -> to browser
 */

export async function voiceChatController(
  request: FastifyRequest & { file: () => Promise<any> },
  reply: FastifyReply,
) {
  try {
    // get logged in user id from jwt token
    const { id: userId } = request.user as { id: string; role: string };

    //get upload audio file from multipart form data
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        success: false,
        message: "No audio file provided",
      });
    }

    //read audio files into buffer
    const audioBuffer = await data.toBuffer();
    const mimeType = data.mimetype || "audio/webm";

    console.log(
      `Received audio file: ${data.filename}, size: ${audioBuffer.length} bytes`,
    );

    //step1 - stt using deepgram
    console.log("Transcribing audio..");
    const transcript = await speechToText(audioBuffer, mimeType);
    console.log(`Transcript: "${transcript}"`);

    //get conversation history from form fields if provided
    const conversationHistoryField = (request.body as any)?.conversationHistory;
    const conversationHistory = conversationHistoryField
      ? JSON.parse(conversationHistoryField)
      : [];

    //step2 - send transcript to voxia
    console.log("Sending to voxia agent..");
    const agentResponse = await runAgent({
      message: transcript,
      userId,
      conversationHistory,
    });
    console.log(`Agent response: "${agentResponse}"`);

    //step3 - agent response to speech using elevenlabs
    console.log("Converting to speech");
    const audioResponse = await textToSpeech(agentResponse);
    console.log(`Audio generated: ${audioResponse.length} bytes`);

    // return audio file to browser
    //browser will paly audio directly

    return reply
      .status(200)
      .header("content-type", "audio/mpeg")
      .header("X-Transcript", encodeURIComponent(transcript))
      .header("X-Agent-Response", encodeURIComponent(agentResponse))
      .send(audioResponse);
  } catch (error: any) {
    console.error("Voice chat error:", error);
    return reply.status(500).send({
      success: false,
      message: error.message || "Voice processing failed",
    });
  }
}

/**
 * tts only endpoint, converts any text to audio
 */

export async function ttsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { text } = request.body as { text: string };

    if (!text) {
      return reply.status(400).send({
        success: false,
        message: "text is required",
      });
    }

    const audio = await textToSpeech(text);

    return reply.status(200).header("Content-Type", "audio/mpeg").send(audio);
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      message: error.message,
    });
  }
}
