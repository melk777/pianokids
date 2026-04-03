import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";


export async function POST(req: NextRequest) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { studentName, eventType, context } = await req.json();


    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API Key not configured" },
        { status: 500 }
      );
    }

    // 1. Gerar o Texto Dinâmico (IA)
    const systemPrompt = `
      Você é a "Professora Lua", uma tutora virtual super animada do app PianoKids.
      Seu objetivo é incentivar crianças de 4 a 8 anos que estão aprendendo piano.
      Use uma linguagem simples, cheia de metáforas musicais (ex: "notas brilhantes", "dedinhos mágicos").
      Nunca critique. Se houver erro, diga que é uma oportunidade para uma nova descoberta.
      Mantenha as respostas curtas (máximo 2 frases) para não cansar a criança.
    `;


    const userPrompt = `
      Aluno: ${studentName || "Pequeno Músico"}
      Evento: ${eventType} (ex: error, success, welcome)
      Contexto: ${context || "Iniciando a aula"}
      
      Gere uma frase curta e motivadora de acordo com o evento acima.
    `;

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [

        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 60,
      temperature: 0.8,
    });

    const textToSpeak = chatResponse.choices[0]?.message?.content || "Vamos tocar?";

    // 2. Converter Texto em Voz (TTS) - ELEVENLABS (Prioridade) ou OpenAI (Fallback)
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID;

    if (elevenLabsApiKey && elevenLabsVoiceId) {
      console.log("[TUTOR_API]: Using ElevenLabs for TTS");
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": elevenLabsApiKey,
          },
          body: JSON.stringify({
            text: textToSpeak,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (response.ok) {
        const audioBuffer = Buffer.from(await response.arrayBuffer());
        return new NextResponse(audioBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "X-Generated-Text": encodeURIComponent(textToSpeak),
          },
        });
      }
      console.warn("[TUTOR_API]: ElevenLabs failed, falling back to OpenAI");
    }

    // Fallback: OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "shimmer",
      input: textToSpeak,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    // 3. Retornar o áudio e o texto
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Generated-Text": encodeURIComponent(textToSpeak), // Opcional: para exibir legenda
      },
    });

  } catch (error: unknown) {
    console.error("[TUTOR_API_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to generate tutor response", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }

}
