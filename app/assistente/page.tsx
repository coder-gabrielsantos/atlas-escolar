'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  BarChart3,
  Bolt,
  Bot,
  Construction,
  Database,
  LaptopMinimal,
  RotateCcw,
  UserRound,
} from 'lucide-react';
import { AtlasShell } from '@/components/atlas-shell';
import { useAtlas } from '@/components/atlas-provider';
import { EnemPerformanceChart, InfrastructureChart } from '@/components/atlas-charts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { answerQuestionLocally, AssistantAnswer } from '@/lib/assistant';
import { SchoolContext } from '@/lib/atlas-data';

type ChatMessage = AssistantAnswer & { id: string; role: 'assistant' | 'user' };

const SUGGESTIONS = [
  { label: 'Análise rápida', question: 'Faça uma análise rápida dos principais indicadores desta escola.', icon: Bolt },
  { label: 'Gargalo de infraestrutura', question: 'Qual é o principal gargalo de infraestrutura desta escola?', icon: Construction },
  { label: 'Desempenho no ENEM', question: 'Compare as médias do ENEM da escola com o município.', icon: BarChart3 },
  { label: 'Recursos ausentes', question: 'Quais recursos estão ausentes nesta escola?', icon: LaptopMinimal },
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
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={partIndex} className="font-semibold text-[var(--ink)]">{part.slice(2, -2)}</strong>
              : <Fragment key={partIndex}>{part}</Fragment>,
          )}
        </p>
      ))}
    </div>
  );
}

export default function AssistantPage() {
  const { schoolContext: context } = useAtlas();
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage(context)]);
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

  const recentQuestions = useMemo(() => messages.filter((message) => message.role === 'user').slice(-3).map((message) => message.text), [messages]);
  const lastEngine = [...messages].reverse().find((message) => message.role === 'assistant')?.engine ?? 'local';

  async function send(question: string) {
    const clean = question.trim();
    if (!clean || loading) return;
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text: clean, mode: 'pergunta' }]);
    setDraft('');
    setLoading(true);

    let answer: AssistantAnswer;
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: clean, schoolCode: context.school.code, recentQuestions }),
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      answer = await response.json() as AssistantAnswer;
    } catch {
      answer = answerQuestionLocally(clean, context);
    }

    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', ...answer }]);
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
      <div className="mx-auto max-w-[1280px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="atlas-eyebrow">Assistência contextual</p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3.35rem)] font-semibold leading-[1.02] tracking-[-0.052em]">Converse com o Atlas.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">Pergunte aos dados em linguagem natural e veja as evidências usadas na resposta.</p>
          </div>
          <Button variant="outline" onClick={reset} className="w-fit rounded-xl bg-white"><RotateCcw size={15} /> Nova conversa</Button>
        </section>

        <section className="mt-8 overflow-hidden rounded-[26px] border border-[var(--line)] bg-white shadow-[0_20px_70px_rgb(23_35_46/6%)]">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] bg-[#fbfbf8] px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="relative grid size-11 place-items-center rounded-[15px] bg-[var(--navy)] text-[var(--lime)]"><Bot size={20} /><span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-[#64b783]" /></div>
              <div><p className="text-sm font-semibold">Atlas</p><p className="mt-0.5 text-[11px] text-[var(--muted)]">Contexto: {context.school.name} · {context.school.code}</p></div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]"><Database size={13} /> {lastEngine === 'llama' ? 'Llama conectado' : 'Modo local auditável'}</span>
          </header>

          <div className="grid min-h-[610px] lg:grid-cols-[1fr_260px]">
            <div className="flex min-w-0 flex-col">
              <div className="max-h-[610px] flex-1 space-y-6 overflow-y-auto px-5 py-7 sm:px-8">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'assistant' && <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--navy)] text-[var(--lime)]"><Bot size={15} /></div>}
                    <div className={`max-w-[86%] rounded-2xl px-4 py-3.5 ${message.role === 'user' ? 'bg-[var(--navy)] text-white' : 'border border-[var(--line)] bg-[#fbfbf8]'}`}>
                      <RichText text={message.text} />
                      {message.chart === 'infrastructure' && <div className="mt-4 overflow-x-auto rounded-xl bg-white p-3"><div className="min-w-[480px]"><InfrastructureChart context={context} /></div></div>}
                      {message.chart === 'performance' && <div className="mt-4 overflow-x-auto rounded-xl bg-white p-3"><div className="min-w-[480px]"><EnemPerformanceChart context={context} /></div></div>}
                      {message.role === 'assistant' && message.source && <div className="mt-4 border-t border-[var(--line)] pt-3 text-[10px] leading-5 text-[var(--muted)]"><span className="font-semibold">Fonte:</span> {message.source}<br /><span className="font-semibold">Modo:</span> {message.mode}</div>}
                    </div>
                    {message.role === 'user' && <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--teal-soft)] text-[var(--teal)]"><UserRound size={15} /></div>}
                  </div>
                ))}
                {loading && <div className="flex items-center gap-3 text-xs text-[var(--muted)]"><div className="grid size-8 place-items-center rounded-xl bg-[var(--navy)] text-[var(--lime)]"><Bot size={15} /></div><span className="animate-pulse">Consultando as evidências…</span></div>}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={submit} className="border-t border-[var(--line)] p-4 sm:p-5">
                <div className="flex items-end gap-3 rounded-2xl border border-[var(--line-strong)] bg-white p-2 shadow-sm focus-within:border-[var(--teal)]">
                  <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(draft); } }} placeholder="Pergunte sobre os dados desta escola…" className="min-h-12 max-h-32 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0" />
                  <Button type="submit" size="icon" disabled={!draft.trim() || loading} className="size-11 shrink-0 rounded-xl bg-[var(--teal)] text-white"><ArrowUp size={18} /></Button>
                </div>
                <p className="mx-auto mt-2 max-w-4xl text-center text-[10px] text-[var(--muted)]">Dados agregados e institucionais. Confirme evidências com a escola antes de decidir.</p>
              </form>
            </div>

            <aside className="hidden border-l border-[var(--line)] bg-[#fbfbf8] p-5 lg:block">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Perguntas sugeridas</p>
              <div className="space-y-2">
                {SUGGESTIONS.map(({ label, question, icon: Icon }) => <button key={label} onClick={() => void send(question)} disabled={loading} className="flex w-full items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-3 text-left text-xs font-medium transition hover:border-[var(--teal)]"><Icon size={15} className="shrink-0 text-[var(--teal)]" />{label}</button>)}
              </div>
              <div className="mt-6 rounded-xl bg-[var(--teal-soft)] p-4 text-[11px] leading-5 text-[var(--teal)]">O assistente recebe apenas o recorte estruturado da escola selecionada, não os CSVs completos nem credenciais do provedor.</div>
            </aside>
          </div>
        </section>
      </div>
    </AtlasShell>
  );
}
