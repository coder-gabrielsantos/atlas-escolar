'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Bolt,
  Bot,
  Construction,
  LaptopMinimal,
  RotateCcw,
  SendHorizontal,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { AtlasShell } from '@/components/atlas-shell';
import { useAtlas } from '@/components/atlas-provider';
import {
  EnemPerformanceChart,
  InfrastructureChart,
} from '@/components/atlas-charts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { answerQuestionLocally, AssistantAnswer } from '@/lib/assistant';
import { SchoolContext } from '@/lib/atlas-data';

type ChatMessage = AssistantAnswer & { id: string; role: 'assistant' | 'user' };

const SUGGESTIONS = [
  {
    label: 'Análise rápida',
    question:
      'Faça uma análise rápida dos principais indicadores desta escola.',
    icon: Bolt,
  },
  {
    label: 'Gargalo de infraestrutura',
    question: 'Qual é o principal gargalo de infraestrutura desta escola?',
    icon: Construction,
  },
  {
    label: 'Desempenho no ENEM',
    question: 'Compare as médias do ENEM da escola com o município.',
    icon: BarChart3,
  },
  {
    label: 'Recursos ausentes',
    question: 'Quais recursos estão ausentes nesta escola?',
    icon: LaptopMinimal,
  },
];

function welcomeMessage(context: SchoolContext): ChatMessage {
  return {
    id: `welcome-${context.school.code}`,
    role: 'assistant',
    text: `Olá! Eu sou o Atlas. Posso interpretar os dados reais de **${context.school.name}**.\n\nPergunte sobre infraestrutura, ENEM, cobertura dos dados ou o contexto estadual do SAEB.`,
    mode: 'contexto carregado',
    engine: 'local',
  };
}

function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-sm leading-7">
      {text.split('\n\n').map((paragraph, index) => (
        <p key={index} className="whitespace-pre-line">
          {paragraph.split(/(\*\*.*?\*\*)/g).map((part, partIndex) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong
                key={partIndex}
                className="font-bold text-[var(--ink)]"
              >
                {part.slice(2, -2)}
              </strong>
            ) : (
              <Fragment key={partIndex}>{part}</Fragment>
            ),
          )}
        </p>
      ))}
    </div>
  );
}

export default function AssistantPage() {
  const { schoolContext: context } = useAtlas();
  const [messages, setMessages] = useState<ChatMessage[]>([
    welcomeMessage(context),
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const contextKey = context.school.code;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMessages([welcomeMessage(context)]);
      setDraft('');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [context, contextKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  const recentQuestions = useMemo(
    () =>
      messages
        .filter((message) => message.role === 'user')
        .slice(-3)
        .map((message) => message.text),
    [messages],
  );

  async function send(question: string) {
    const clean = question.trim();
    if (!clean || loading) return;
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'user', text: clean, mode: 'pergunta' },
    ]);
    setDraft('');
    setLoading(true);

    let answer: AssistantAnswer;
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: clean,
          schoolCode: context.school.code,
          recentQuestions,
        }),
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      answer = (await response.json()) as AssistantAnswer;
    } catch {
      answer = answerQuestionLocally(clean, context);
    }

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'assistant', ...answer },
    ]);
    setLoading(false);
  }

  function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    void send(draft);
  }

  function reset() {
    setMessages([welcomeMessage(context)]);
    setDraft('');
    setLoading(false);
  }

  return (
    <AtlasShell>
      <div className="atlas-page max-w-[1340px]">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="atlas-eyebrow">Assistência contextual</p>
            <h1 className="atlas-page-heading mt-3">Converse com o Atlas.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              Faça perguntas em linguagem natural e encontre as evidências por
              trás de cada resposta.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={reset}
            className="h-11 w-full rounded-xl border-[var(--line-strong)] bg-white px-4 font-bold shadow-sm sm:w-fit"
          >
            <RotateCcw size={15} /> Nova conversa
          </Button>
        </section>

        <section className="mt-7 overflow-hidden rounded-[12px] border border-[var(--line)] bg-white shadow-[0_20px_70px_rgb(18_47_56/7%)]">
          <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[#fbfcf9] px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid size-11 shrink-0 place-items-center rounded-[10px] bg-[var(--navy)] text-[var(--lime)]">
                <Bot size={20} />
                <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-[3px] border-white bg-[#62b782]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold">Atlas</p>
                <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                  {context.school.name}
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full bg-[var(--teal-soft)] px-3 py-1.5 text-xs font-bold text-[var(--teal)] min-[430px]:flex">
              <ShieldCheck size={14} /> Contexto carregado
            </div>
          </header>

          <div className="grid lg:h-[680px] lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-h-0 min-w-0 flex-col">
              <div className="border-b border-[var(--line)] bg-white px-4 py-3 lg:hidden">
                <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Pergunte agora
                </p>
                <div className="chart-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                  {SUGGESTIONS.map(({ label, question, icon: Icon }) => (
                    <button
                      key={label}
                      onClick={() => void send(question)}
                      disabled={loading}
                      className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--canvas)] px-3 text-xs font-bold text-[var(--ink)] disabled:opacity-50"
                    >
                      <Icon size={14} className="text-[var(--teal)]" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="soft-scroll flex min-h-[390px] flex-1 flex-col gap-5 overflow-y-auto px-3 py-5 sm:min-h-[460px] sm:px-6 sm:py-7 lg:min-h-0"
                aria-live="polite"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2.5 sm:gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--navy)] text-[var(--lime)]">
                        <Bot size={15} />
                      </div>
                    )}
                    <div
                      className={`min-w-0 max-w-[calc(100%-42px)] rounded-2xl px-3.5 py-3 sm:max-w-[84%] sm:px-4 ${
                        message.role === 'user'
                          ? 'bg-[var(--navy)] text-white shadow-[0_8px_24px_rgb(18_47_56/12%)]'
                          : 'border border-[var(--line)] bg-[#fbfcf9]'
                      }`}
                    >
                      <RichText text={message.text} />
                      {message.chart === 'infrastructure' && (
                        <div className="mt-4 min-w-0 rounded-xl bg-white p-2 sm:p-3">
                          <InfrastructureChart context={context} />
                        </div>
                      )}
                      {message.chart === 'performance' && (
                        <div className="mt-4 min-w-0 rounded-xl bg-white p-2 sm:p-3">
                          <EnemPerformanceChart context={context} />
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--teal-soft)] text-[var(--teal)]">
                        <UserRound size={15} />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                    <div className="grid size-8 place-items-center rounded-xl bg-[var(--navy)] text-[var(--lime)]">
                      <Bot size={15} />
                    </div>
                    <span className="animate-pulse">
                      Consultando as evidências…
                    </span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={submit}
                className="border-t border-[var(--line)] bg-[#fbfcf9] p-3 sm:p-4"
              >
                <div className="flex items-end gap-2 rounded-[10px] border border-[var(--line-strong)] bg-white p-2 shadow-[0_5px_18px_rgb(18_47_56/7%)] transition-colors focus-within:border-[var(--teal)] focus-within:ring-2 focus-within:ring-[var(--teal-soft)]">
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void send(draft);
                      }
                    }}
                    placeholder="Pergunte sobre esta escola…"
                    aria-label="Pergunta para o Assistente Atlas"
                    className="max-h-32 min-h-12 resize-none border-0 bg-transparent px-2 py-3 text-lg shadow-none focus-visible:outline-none focus-visible:ring-0 sm:px-3"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!draft.trim() || loading}
                    aria-label="Enviar pergunta"
                    className="size-12 shrink-0 rounded-[8px] bg-[var(--teal)] text-white shadow-sm hover:bg-[var(--teal-strong)]"
                  >
                    <SendHorizontal size={18} />
                  </Button>
                </div>
                <div className="mt-2.5 flex items-center justify-center px-1 text-[11px] leading-relaxed text-[var(--muted)]">
                  <p className="flex items-center gap-1.5 text-center">
                    <ShieldCheck size={13} className="shrink-0 text-[var(--teal)]" />
                    Confirme as evidências com a escola antes de decidir.
                  </p>
                </div>
              </form>
            </div>

            <aside className="hidden border-l border-[var(--line)] bg-[#f8faf6] p-5 lg:block">
              <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
                Perguntas sugeridas
              </p>
              <div className="space-y-2.5">
                {SUGGESTIONS.map(({ label, question, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => void send(question)}
                    disabled={loading}
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-3 text-left text-xs font-bold transition hover:border-[var(--teal)] hover:shadow-sm disabled:opacity-50"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--teal-soft)] text-[var(--teal)]">
                      <Icon size={15} />
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </AtlasShell>
  );
}
