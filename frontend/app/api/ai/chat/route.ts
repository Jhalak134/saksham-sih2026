import { NextRequest, NextResponse } from 'next/server';

const LANGUAGE_PROMPTS: Record<string, string> = {
  en: 'simple, easy-to-understand English without complex academic or financial jargon',
  hi: 'simple, natural Hindi (सरल हिंदी) written in Devanagari script',
  mr: 'simple, natural Marathi (सोपी मराठी) written in Devanagari script',
  ta: 'simple, natural Tamil (எளிய தமிழ்) written in Tamil script',
  te: 'simple, natural Telugu (సరళమైన తెలుగు) written in Telugu script',
};

// Available Gemini models for text generation with fallback chain
const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
];

const DEFAULT_GEMINI_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, language = 'en', userApiKey } = body;

    const apiKey =
      (typeof userApiKey === 'string' && userApiKey.trim()) ||
      req.headers.get('x-gemini-api-key') ||
      DEFAULT_GEMINI_KEY;

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

    const systemPrompt = `You are SAKSHAM AI, an expert rural enterprise, micro-business, and government scheme advisor for Indian entrepreneurs developed for Smart India Hackathon #91.

Core Grounding & Domain Rules:
1. Strict Domain Focus: You strictly advise on rural entrepreneurship, micro-enterprises (Dairy & Livestock, Agro & Food Processing, Kirana & Retail, Rural Artisans & Handicrafts, Rural Services), official government schemes (PMFME, PMEGP, Mudra), and business feasibility in India.
   - If the user asks something completely outside this domain (e.g. video games, entertainment celebrity gossip, general software coding, academic homework unrelated to business), politely and respectfully decline, steering them back to rural business ideas, dairy, schemes, and startup financing.
2. Specific & Dynamic Answers: Directly and specifically address the entrepreneur's exact question. Never give a generic or repetitive canned response.
   - If they ask about milk fat testing or milk analyzers, explain fat measurement, SNF, and dairy collection pricing.
   - If they ask about cattle breeds or fodder, explain high-yield breeds (e.g., Murrah buffalo, Gir, Sahiwal) and balanced feed (green fodder, dry fodder, concentrates).
   - If they ask about dairy value-addition products like paneer, ghee, curd, or flavored milk, explain the setup process, necessary equipment (chillers, cream separators, packaging), and profit margins.
   - If they ask about loans or setup costs, provide clear, realistic numbers for small village-level units.
3. Financial Structure: SAKSHAM operates on a statutory 10% borrower equity margin and 90% priority institutional bank loan up to ₹10 Lakhs. Always remind the entrepreneur that they only need to invest 10% of their own savings to begin.
4. Concessional Schemes: Highlight active government support, including PMFME (35% capital subsidy up to ₹10 Lakhs for food/dairy units), PMEGP (15-35% subsidy for rural industries), and PM Mudra loans (collateral-free bank loans up to ₹10 Lakhs).
5. Target Language: Respond entirely in ${targetLangDesc}. Use clear, encouraging, practical, and everyday words that a rural entrepreneur or village producer can easily understand.`;

    // Try candidate models in order until one succeeds
    let lastError = '';
    for (const modelName of GEMINI_MODELS) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;

      try {
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
              temperature: 0.4,
              maxOutputTokens: 4096,
            },
          }),
        });

        if (!res.ok) {
          lastError = await res.text();
          continue; // Try next model fallback
        }

        const data = await res.json();
        const candidate = data?.candidates?.[0];
        const candidateText = candidate?.content?.parts?.find((p: any) => typeof p.text === 'string')?.text;

        if (candidateText && candidateText.trim().length > 0) {
          return NextResponse.json({
            available: true,
            answer: candidateText.trim(),
            model: modelName,
            language,
          });
        }
      } catch (e: any) {
        lastError = e?.message || 'Fetch failed';
      }
    }

    return NextResponse.json(
      { available: false, error: 'GEMINI_MODELS_UNAVAILABLE', details: lastError },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { available: false, error: err?.message || 'INTERNAL_ERROR' },
      { status: 200 }
    );
  }
}
