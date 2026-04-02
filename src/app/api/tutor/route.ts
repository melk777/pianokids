import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { studentName, eventType, context } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API Key not configured" },
        { status: 500 }
      );
    }

    // 1. Gerar o Texto Dinâmico (IA)
    const systemPrompt = `
      Você é a "Professora Mel", uma tutora virtual carinhosa, paciente e animada do app PianoKids.
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
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 60,
      temperature: 0.8,
    });

    const textToSpeak = chatResponse.choices[0]?.message?.content || "Vamos tocar?";

    // 2. Converter Texto em Voz (TTS)
    // Usando o modelo tts-1 da OpenAI (rápido e de alta qualidade)
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "shimmer", // Voz feminina expressiva e energética (ideal para crianças)
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
