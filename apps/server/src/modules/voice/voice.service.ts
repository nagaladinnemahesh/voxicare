import { DeepgramClient } from "@deepgram/sdk";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { env } from "../../config/env";

// initialize deepgram client for speech to text
const deepgram = new DeepgramClient({ apiKey: env.DEEPGRAM_API_KEY });

//initialize elevenlabs client for text to speech
const elevenlabs = new ElevenLabsClient({
  apiKey: env.ELEVENLABS_API_KEY,
});

// converts audio buffer to text using deepgram
// audioBuffer - raw audio from mic, mimeType - audio format
export async function speechToText(
  audioBuffer: Buffer,
  mimeType: string = "audio/webm",
): Promise<string> {
  //send audio to deepgram for transcription
  const response = (await deepgram.listen.v1.media.transcribeFile(audioBuffer, {
    model: "nova-3",
    smart_format: true,
    punctuate: true,
    language: "en",
  })) as any;

  //   if (error) {
  //     throw new Error(`Deepgram error: ${error.message}`);
  //   }

  //extract the transcript text from deepgram response
  const transcript =
    response.results?.channels?.[0]?.alternatives?.[0].transcript;
  if (!transcript) {
    throw new Error("Could not transcribe audio - please try again");
  }

  return transcript;
}

//text to speech using elevenlabs
export async function textToSpeech(text: string): Promise<Buffer> {
  //generate audo from text
  const audioStream = await elevenlabs.textToSpeech.convert(
    "cgSgspJ2msm6clMCkdW9", // jessica voice
    // "pFZP5JQG7iQjIQuC4Bku", // lily
    {
      text,
      modelId: "eleven_flash_v2_5", // english only
      outputFormat: "mp3_44100_128",
    },
  );

  //convert stream to buffer
  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}
