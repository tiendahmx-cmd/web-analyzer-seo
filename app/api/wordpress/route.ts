import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Permisos CORS para que WordPress pueda conectarse
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-license-token',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { title, focusKeyword, content } = await req.json();
    
    // ¡Pon aquí tu clave de OpenAI!
    const openai = new OpenAI({ apiKey: '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' });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Eres un experto SEO. Responde SOLO en formato JSON: {\"tasks\": [{\"title\": \"...\", \"aiSolution\": \"...\"}]}" },
        { role: "user", content: `Genera 2 tareas SEO para la palabra clave "${focusKeyword}" sobre el título "${title}".` }
      ],
    });

    const tasks = JSON.parse(response.choices[0].message.content || '{"tasks": []}').tasks;

    return NextResponse.json({ tasks }, { headers: corsHeaders });

  } catch (error: any) {
    return NextResponse.json({ error: "Error de OpenAI: " + error.message }, { status: 500, headers: corsHeaders });
  }
}