'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  BarChart3,
  Bolt,
  Bot,
  ChevronDown,
  Construction,
  Database,
  LaptopMinimal,
  RotateCcw,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { AtlasShell } from '@/components/atlas-shell';
import { useAtlas } from '@/components/atlas-provider';
import { InfrastructureChart, PeerComparisonChart } from '@/components/atlas-charts';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DOCUMENT_SOURCES, INFRA_KEYS, INFRA_LABELS, SchoolContext } from '@/lib/atlas-data';

type Answer = {
  text: string;
  source?: string;
  mode?: string;
  chart?: 'infrastructure' | 'peers';
  peerAverage?: number;
};

type ChatMessage = Answer & { id: string; role: 'assistant' | 'user' };

const SUGGESTIONS = [
  { label: 'Análise rápida', question: 'Faça uma análise rápida dos principais indicadores desta escola.', icon: Bolt },
  { label: 'Gargalo de infraestrutura', question: 'Qual é o principal gargalo de infraestrutura desta escola?', icon: Construction },
  { label: 'Desempenho vs. semelhantes', question: 'Como o desempenho geral se compara com escolas de mesmo perfil socioeconômico?', icon: BarChart3 },
  { label: 'Recursos ausentes', question: 'Quais recursos tecnológicos estão ausentes?', icon: LaptopMinimal },
];

function welcomeMessage(context: SchoolContext): ChatMessage {
  return {
    id: `welcome-${context.school.name}`,
    role: 'assistant',
    text: `Olá! Eu sou o Atlas. Posso ajudar a interpretar os dados de **${context.school.name}**.\n\nPergunte sobre infraestrutura, desempenho, comparações ou próximos passos. Toda resposta mantém o contexto da escola selecionada.`,
  };
}

function answerQuestion(question: string, context: SchoolContext): Answer {
  const normalized = question.toLocaleLowerCase('pt-BR');
  const infra = context.school.infrastructure;

  if (normalized.includes('análise rápida') || normalized.includes('principais indicadores') || normalized.includes('resumo')) {
    return {
      text: `A escola apresenta índice de infraestrutura de **${context.infrastructureScore.toFixed(1).replace('.', ',')}/10** e desempenho de **${context.school.performance} pontos**. A prioridade mais clara é **${context.criticalFactorName}**, com **${infra[context.criticalFactor].toFixed(1).replace('.', ',')}/10**.\n\nPara a reunião de gestão, vale validar esse gargalo localmente, definir um responsável e acompanhar um indicador simples de avanço.`,
      source: 'ATLAS Escolar · base sintética 2024',
      mode: 'análise local',
    };
  }

  if (normalized.includes('gargalo') || normalized.includes('infraestrutura')) {
    const score = infra[context.criticalFactor];
    const municipal = context.municipalInfrastructure[context.criticalFactor];
    const difference = score - municipal;
    return {
      text: `O principal gargalo de infraestrutura em **${context.school.name}** é **${context.criticalFactorName}**, com **${score.toFixed(1).replace('.', ',')}/10**. O resultado está **${Math.abs(difference).toFixed(1).replace('.', ',')} ponto(s) ${difference >= 0 ? 'acima' : 'abaixo'}** da média municipal de **${municipal.toFixed(1).replace('.', ',')}/10**.\n\nEsse é o primeiro ponto a validar em campo antes de definir orçamento, prazo e responsável.`,
      source: `Censo Escolar simulado 2024 · ${DOCUMENT_SOURCES.infrastructure}`,
      mode: 'análise local + evidência documental',
      chart: 'infrastructure',
    };
  }

  if (normalized.includes('desempenho') || normalized.includes('compara') || normalized.includes('semelhante')) {
    const peers = context.municipalitySchools.filter(
      (school) => school.name !== context.school.name && Math.abs(school.socioeconomicLevel - context.school.socioeconomicLevel) <= 1,
    );
    if (!peers.length) {
      return {
        text: `O desempenho da escola é **${context.school.performance} pontos**. Não há outra escola no município dentro da faixa socioeconômica adotada; por isso, a comparação com pares não pode ser calculada.`,
        source: `ENEM · microdados simulados 2024 · ${DOCUMENT_SOURCES.comparison}`,
        mode: 'análise local',
      };
    }
    const peerAverage = peers.reduce((sum, school) => sum + school.performance, 0) / peers.length;
    const difference = context.school.performance - peerAverage;
    return {
      text: `O desempenho de **${context.school.name}** é **${context.school.performance} pontos**, **${Math.abs(difference).toFixed(0)} pontos ${difference >= 0 ? 'acima' : 'abaixo'}** da média de escolas com perfil socioeconômico semelhante (**${peerAverage.toFixed(0)} pontos**, n=${peers.length}).\n\nA comparação contextual ajuda a evitar conclusões injustas baseadas apenas na média geral.`,
      source: `ENEM · microdados simulados 2024 · ${DOCUMENT_SOURCES.comparison}`,
      mode: 'análise local',
      chart: 'peers',
      peerAverage,
    };
  }

  if (normalized.includes('recurso') || normalized.includes('ausente') || normalized.includes('falta')) {
    const missing = INFRA_KEYS.filter((key) => infra[key] < 3).map((key) => INFRA_LABELS[key]);
    return {
      text: missing.length
        ? `Os recursos **ausentes ou muito limitados** são:\n\n${missing.map((item) => `• ${item}`).join('\n')}`
        : `Não foram identificados recursos criticamente ausentes em **${context.school.name}**. Todos os indicadores estão acima do limiar de 3,0/10 usado neste protótipo.`,
      source: `Censo Escolar simulado 2024 · ${DOCUMENT_SOURCES.infrastructure}`,
      mode: 'análise local',
      chart: 'infrastructure',
    };
  }

  if (normalized.includes('socioecon') || normalized.includes('inse')) {
    return {
      text: 'O nível socioeconômico resume condições que afetam as oportunidades educacionais, como renda e escolaridade familiar. No Atlas, ele é usado para comparar a escola com contextos semelhantes — **não para rotular estudantes ou determinar causalidade**.\n\nO indicador é sintético, sujeito a defasagem e deve ser interpretado junto a evidências locais.',
      source: 'Dicionário sintético de indicadores do ATLAS Escolar · 2024 · seção 3.2',
      mode: 'evidência documental',
    };
  }

  return {
    text: 'Posso ajudar com uma **análise rápida**, gargalos de **infraestrutura**, **desempenho comparado**, recursos ausentes e interpretação do contexto socioeconômico. Escolha uma sugestão ou reformule a pergunta com um desses temas.',
    mode: 'orientação de escopo',
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
  const contextKey = `${context.school.state}|${context.school.municipality}|${context.school.name}`;

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

  function send(question: string) {
    const clean = question.trim();
    if (!clean || loading) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: clean };
    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setLoading(true);
    window.setTimeout(() => {
      const contextualQuestion = /^(e |isso|essa|esse|como |o que )/i.test(clean) && recentQuestions.length
        ? `${recentQuestions.at(-1)} ${clean}`
        : clean;
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', ...answerQuestion(contextualQuestion, context) }]);
      setLoading(false);
    }, 520);
  }

  function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    send(draft);
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
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">Pergunte aos dados em linguagem natural e veja as evidências usadas em cada resposta.</p>
          </div>
          <Button variant="outline" onClick={reset} className="w-fit rounded-xl bg-white"><RotateCcw size={15} /> Nova conversa</Button>
        </section>

        <section className="mt-8 overflow-hidden rounded-[26px] border border-[var(--line)] bg-white shadow-[0_20px_70px_rgb(23_35_46/6%)]">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] bg-[#fbfbf8] px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="relative grid size-11 place-items-center rounded-[15px] bg-[var(--navy)] text-[var(--lime)]"><Bot size={20} /><span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-[#64b783]" /></div>
              <div><p className="text-sm font-semibold">Atlas</p><p className="mt-0.5 text-[11px] text-[var(--muted)]">Online · contexto de {context.school.name}</p></div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]"><Database size={12} /> Motor analítico local</span>
          </header>

          <div className="max-h-[650px] min-h-[470px] overflow-y-auto bg-[linear-gradient(180deg,#fff_0%,#fdfdfb_100%)] px-4 py-7 sm:px-7">
            <div className="mx-auto max-w-4xl space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--teal-soft)] text-[var(--teal)]"><Sparkles size={15} /></div>}
                  <div className={`max-w-[min(92%,720px)] ${message.role === 'user' ? 'rounded-[18px_18px_5px_18px] bg-[var(--navy)] px-5 py-3.5 text-white' : 'rounded-[5px_18px_18px_18px] border border-[var(--line)] bg-white px-5 py-4 text-[var(--muted)] shadow-sm'}`}>
                    <RichText text={message.text} />
                    {message.chart === 'infrastructure' && <div className="mt-4 overflow-x-auto rounded-xl bg-[var(--canvas)] p-3"><div className="min-w-[500px]"><InfrastructureChart context={context} /></div></div>}
                    {message.chart === 'peers' && message.peerAverage !== undefined && <div className="mt-4 overflow-x-auto rounded-xl bg-[var(--canvas)] p-3"><div className="min-w-[440px]"><PeerComparisonChart school={context.school.performance} peers={message.peerAverage} /></div></div>}
                    {message.source && (
                      <Accordion className="mt-4 border-t border-[var(--line)] pt-2">
                        <AccordionItem value="source" className="border-0">
                          <AccordionTrigger className="py-2 text-xs font-medium text-[var(--teal)] hover:no-underline"><span className="flex items-center gap-2"><Database size={13} /> Fontes consultadas</span></AccordionTrigger>
                          <AccordionContent className="rounded-xl bg-[var(--canvas)] p-3 text-[11px] leading-relaxed text-[var(--muted)]"><p className="font-semibold text-[var(--ink)]">Rota: {message.mode}</p><p className="mt-1">{message.source}</p></AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </div>
                  {message.role === 'user' && <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--navy)] text-white"><UserRound size={15} /></div>}
                </div>
              ))}

              {messages.length === 1 && (
                <div className="pl-0 pt-2 sm:pl-11">
                  <p className="mb-3 text-xs font-medium text-[var(--muted)]">Comece por uma destas leituras:</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SUGGESTIONS.map(({ label, question, icon: Icon }) => (
                      <button key={label} onClick={() => send(question)} className="group flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white p-3.5 text-left text-xs font-medium transition hover:-translate-y-0.5 hover:border-[var(--teal)]/35 hover:shadow-md">
                        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--canvas)] text-[var(--teal)]"><Icon size={15} /></span>
                        {label}<ChevronDown size={14} className="ml-auto -rotate-90 text-[var(--muted)] transition group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading && <div className="flex items-center gap-3"><div className="grid size-8 place-items-center rounded-xl bg-[var(--teal-soft)] text-[var(--teal)]"><Sparkles size={15} /></div><div className="flex gap-1.5 rounded-2xl border border-[var(--line)] bg-white px-5 py-4"><i className="size-1.5 animate-bounce rounded-full bg-[var(--teal)] [animation-delay:-.3s]" /><i className="size-1.5 animate-bounce rounded-full bg-[var(--teal)] [animation-delay:-.15s]" /><i className="size-1.5 animate-bounce rounded-full bg-[var(--teal)]" /></div></div>}
              <div ref={bottomRef} />
            </div>
          </div>

          <footer className="border-t border-[var(--line)] bg-white p-4 sm:p-5">
            <form onSubmit={submit} className="mx-auto flex max-w-4xl items-end gap-3 rounded-[20px] border border-[var(--line)] bg-[var(--canvas)] p-2 transition focus-within:border-[var(--teal)]/50 focus-within:ring-4 focus-within:ring-[var(--teal)]/7">
              <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(draft); } }} placeholder="Pergunte ao Atlas sobre esta escola..." rows={1} className="max-h-32 min-h-11 resize-none border-0 bg-transparent px-3 py-3 shadow-none focus-visible:ring-0" aria-label="Mensagem para o Atlas" />
              <Button type="submit" disabled={!draft.trim() || loading} size="icon" className="size-11 shrink-0 rounded-[15px] bg-[var(--navy)] text-[var(--lime)] hover:bg-[var(--navy)]/90"><ArrowUp size={18} /><span className="sr-only">Enviar mensagem</span></Button>
            </form>
            <p className="mx-auto mt-2 max-w-4xl text-center text-[10px] text-[var(--muted)]">Dados sintéticos para demonstração. Valide as evidências antes de tomar decisões.</p>
          </footer>
        </section>
      </div>
    </AtlasShell>
  );
}
