import { NextResponse } from 'next/server';
import { answerQuestionLocally, buildAssistantGrounding } from '@/lib/assistant';
import { buildSchoolContext, SCHOOLS } from '@/lib/atlas-data';

type AssistantRequest = {
  question?: unknown;
  schoolCode?: unknown;
  recentQuestions?: unknown;
};

function endpointFrom(base: string) {
  const normalized = base.replace(/\/$/, '');
  return normalized.endsWith('/chat/completions') ? normalized : `${normalized}/chat/completions`;
}

export async function POST(request: Request) {
  let body: AssistantRequest;
  try {
    body = await request.json() as AssistantRequest;
  } catch {
    return NextResponse.json({ error: 'Corpo JSON inválido.' }, { status: 400 });
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const schoolCode = typeof body.schoolCode === 'string' ? body.schoolCode : '';
  if (!question || question.length > 2_000 || !SCHOOLS.some((school) => school.code === schoolCode)) {
    return NextResponse.json({ error: 'Pergunta ou código de escola inválido.' }, { status: 400 });
  }

  const context = buildSchoolContext(schoolCode, true);
  const localAnswer = answerQuestionLocally(question, context);
  const apiUrl = process.env.LLAMA_API_URL;
  const apiKey = process.env.LLAMA_API_KEY;
  const model = process.env.LLAMA_MODEL;

  if (!apiUrl || !apiKey || !model) {
    return NextResponse.json(localAnswer);
  }

  const recentQuestions = Array.isArray(body.recentQuestions)
    ? body.recentQuestions.filter((item): item is string => typeof item === 'string').slice(-3)
    : [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(endpointFrom(apiUrl), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 700,
        messages: [
          {
            role: 'system',
            content: 'Você é o Assistente Atlas Escolar. Responda em português brasileiro somente com base no JSON fornecido. Seja direto, cite números e contagens de participantes, não invente campos, não infira causalidade e respeite todas as ressalvas metodológicas. Use Markdown simples. Se a evidência não existir, diga explicitamente.',
          },
          {
            role: 'user',
            content: JSON.stringify({ question, recentQuestions, evidence: buildAssistantGrounding(context) }),
          },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Llama respondeu com status ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Resposta vazia do Llama.');

    return NextResponse.json({
      ...localAnswer,
      text,
      mode: 'Llama + evidências estruturadas',
      engine: 'llama',
    });
  } catch (error) {
    console.error('Falha no provedor Llama; usando resposta local.', error);
    return NextResponse.json(localAnswer);
  } finally {
    clearTimeout(timeout);
  }
}
