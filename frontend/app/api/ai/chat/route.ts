import { NextRequest, NextResponse } from 'next/server';

const LANGUAGE_PROMPTS: Record<string, string> = {
  en: 'simple, easy-to-understand English without complex academic or financial jargon',
  hi: 'simple, natural Hindi (सरल हिंदी) written in Devanagari script',
  mr: 'simple, natural Marathi (सोपी मराठी) written in Devanagari script',
  ta: 'simple, natural Tamil (எளிய தமிழ்) written in Tamil script',
  te: 'simple, natural Telugu (సరళమైన తెలుగు) written in Telugu script',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, language = 'en', userApiKey } = body;

    const apiKey =
      (typeof userApiKey === 'string' && userApiKey.trim()) ||
      req.headers.get('x-gemini-api-key') ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { available: false, error: 'NO_GEMINI_API_KEY' },
        { status: 200 }
      );
    }

    const cleanQuery = typeof query === 'string' ? query.trim() : '';
    if (!cleanQuery) {
      return NextResponse.json(
        { available: false, error: 'EMPTY_QUERY' },
        { status: 400 }
      );
    }

    const targetLangDesc = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en;

    const systemPrompt = `You are SAKSHAM AI, an expert rural enterprise and micro-business advisor for Indian entrepreneurs developed for Smart India Hackathon #91.

Core Grounding Rules:
1. Target Language: Respond entirely in ${targetLangDesc}. Use clear, everyday, accessible words that a village shopkeeper or rural producer can easily understand.
2. Financial Structure: SAKSHAM operates on a statutory 10% borrower equity margin and 90% priority institutional loan up to ₹10 Lakhs. Always remind the entrepreneur that they only need to invest 10% of their own savings.
3. Government Subsidies: Highlight active concessional schemes such as PMFME (35% capital subsidy up to ₹10 Lakh for food/dairy units), PMEGP (15-35% subsidy for rural industries), and PM Mudra loans (collateral-free bank loans).
4. Tone & Style: Be encouraging, practical, structured (using bullet points), and concise.
5. If the user asks in Hindi/Marathi/Tamil/Telugu, respond respectfully in that exact language.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\nEntrepreneur Question: ${cleanQuery}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { available: false, error: `Gemini API Error: ${res.status}`, details: errText },
        { status: 200 }
      );
    }

    const data = await res.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (candidateText && candidateText.trim().length > 0) {
      return NextResponse.json({
        available: true,
        answer: candidateText.trim(),
        model: 'gemini-1.5-flash',
        language,
      });
    }

    return NextResponse.json(
      { available: false, error: 'NO_RESPONSE_CANDIDATE' },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { available: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 200 }
    );
  }
}
