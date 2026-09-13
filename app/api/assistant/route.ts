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
  if (normalized.endsWith('/chat/completions')) return normalized;

  try {
    const url = new URL(normalized);
    if (
      url.hostname === 'api.cloudflare.com'
      && /^\/client\/v4\/accounts\/[^/]+$/.test(url.pathname)
    ) {
      url.pathname = `${url.pathname}/ai/v1/chat/completions`;
      return url.toString();
    }
  } catch {
    // O fetch produzirá o erro apropriado para URLs inválidas.
  }

  return `${normalized}/chat/completions`;
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
  const grounding = localAnswer.mode === 'síntese auditável'
    ? buildAssistantGrounding(context)
    : undefined;
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
        temperature: 0,
        max_tokens: 700,
        messages: [
          {
            role: 'system',
            content: 'Você é o Assistente Atlas Escolar. Responda em português brasileiro somente com base no conteúdo fornecido. Se o modo da resposta auditável for "saudação", cumprimente naturalmente e ofereça ajuda sobre os dados da escola. Para qualquer outro modo, devolva exatamente o texto da RESPOSTA AUDITÁVEL DE REFERÊNCIA, sem acrescentar, remover, reformular, recalcular ou inferir informações. Preserve o Markdown simples.',
          },
          {
            role: 'user',
            content: [
              `PERGUNTA ATUAL (responda exatamente a ela):\n${question}`,
              `RESPOSTA AUDITÁVEL DE REFERÊNCIA (modo: ${localAnswer.mode}):\n${localAnswer.text}`,
              `PERGUNTAS ANTERIORES (apenas contexto):\n${JSON.stringify(recentQuestions)}`,
              grounding
                ? `EVIDÊNCIAS E RESSALVAS:\n${JSON.stringify(grounding)}`
                : '',
            ].join('\n\n'),
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
