'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  Building2,
  CalendarClock,
  Check,
  ClipboardCheck,
  Target,
  UsersRound,
} from 'lucide-react';
import { AtlasShell } from '@/components/atlas-shell';
import { useAtlas } from '@/components/atlas-provider';
import { buildReport } from '@/lib/report';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

type ActionDefinition = {
  id: 'infrastructure' | 'pedagogy';
  number: string;
  title: string;
  description: string;
  impact: string;
  complexity: string;
  icon: typeof Target;
  steps: string[];
};

export default function ActionPlanPage() {
  const { schoolContext: context } = useAtlas();
  const storageKey = `atlas-action-plan:${context.school.code}`;
  const [completed, setCompleted] = useState<string[]>([]);
  const [downloaded, setDownloaded] = useState(false);

  const actions = useMemo<ActionDefinition[]>(() => {
    const pedagogicalImpact = context.lowSampleAreas.length
      ? 'Validar amostra'
      : 'Impacto preventivo';
    const lowestArea = context.lowestPerformanceArea;
    return [
      {
        id: 'infrastructure',
        number: '01',
        title: 'Fortalecer a infraestrutura prioritária',
        description: `Priorizar ${context.criticalFactorName}, hoje o menor índice composto da escola, com ${(context.school.infrastructure[context.criticalFactor] * 10).toFixed(1).replace('.', ',')}%.`,
        impact: 'Impacto alto',
        complexity: 'Complexidade média',
        icon: Building2,
        steps: [
          'Validar o diagnóstico com um levantamento técnico local.',
          'Mapear programas públicos e parceiros disponíveis.',
          'Definir responsável, orçamento, prazo e indicador de sucesso.',
        ],
      },
      {
        id: 'pedagogy',
        number: '02',
        title: 'Acompanhar o desempenho pedagógico',
        description: lowestArea
          ? `Começar por ${lowestArea.label}, a menor média válida do ENEM (${lowestArea.schoolAverage?.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} pontos; n=${lowestArea.schoolParticipants}), sem confundir associação com causalidade.`
          : 'Não há média válida por área nesta escola; primeiro valide a disponibilidade e a cobertura dos dados.',
        impact: pedagogicalImpact,
        complexity: 'Complexidade baixa',
        icon: UsersRound,
        steps: [
          'Cruzar o sinal da área com avaliações internas e evidências pedagógicas locais.',
          'Organizar monitorias e intervenções de curta duração.',
          'Reavaliar os indicadores a cada bimestre.',
        ],
      },
    ];
  }, [context]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setCompleted(
          JSON.parse(window.localStorage.getItem(storageKey) ?? '[]'),
        );
      } catch {
        setCompleted([]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  function toggleStep(stepId: string) {
    setCompleted((current) => {
      const next = current.includes(stepId)
        ? current.filter((item) => item !== stepId)
        : [...current, stepId];
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  function downloadReport() {
    const report = buildReport(context);
    const url = URL.createObjectURL(report.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = report.filename;
    link.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 2200);
  }

  const totalSteps = actions.reduce(
    (total, action) => total + action.steps.length,
    0,
  );
  const progress = Math.round((completed.length / totalSteps) * 100);

  return (
    <AtlasShell>
      <div className="mx-auto max-w-[1320px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <section>
          <div>
            <p className="atlas-eyebrow">Da análise à prática</p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.052em]">
              Plano de ação.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              Dois movimentos objetivos para transformar sinais do diagnóstico
              em acompanhamento.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="atlas-card flex items-center gap-4 p-5">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--teal-soft)] text-[var(--teal)]">
              <ClipboardCheck size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Progresso do plano</p>
                <span className="text-xs font-semibold text-[var(--teal)]">
                  {completed.length}/{totalSteps} etapas
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--canvas)]">
                <div
                  className="h-full rounded-full bg-[var(--teal)] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[var(--navy)] px-6 py-5 text-white">
            <CalendarClock size={20} className="text-[var(--lime)]" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/42">
                Próxima revisão
              </p>
              <p className="mt-1 text-sm font-semibold">Fim do bimestre</p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div>
            <p className="atlas-eyebrow">Ações priorizadas</p>
            <h2 className="atlas-section-title">
              Comece pelo que move o resultado
            </h2>
            <p className="atlas-section-copy">
              Marque as etapas conforme o time escolar avança.
            </p>
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            {actions.map((action) => {
              const Icon = action.icon;
              const actionDone = action.steps.filter((_, index) =>
                completed.includes(`${action.id}-${index}`),
              ).length;
              return (
                <article key={action.id} className="atlas-card overflow-hidden">
                  <div className="border-b border-[var(--line)] bg-[#fbfbf8] p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold tracking-[0.12em] text-[var(--teal)]">
                          {action.number}
                        </span>
                        <div className="grid size-10 place-items-center rounded-[14px] bg-[var(--teal-soft)] text-[var(--teal)]">
                          <Icon size={18} />
                        </div>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-[var(--muted)] shadow-sm">
                        {actionDone}/{action.steps.length} concluídas
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-[-0.035em]">
                      {action.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                      {action.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#eaf3c8] px-3 py-1.5 text-[10px] font-semibold text-[#5a6f17]">
                        {action.impact}
                      </span>
                      <span className="rounded-full bg-[#f7efd7] px-3 py-1.5 text-[10px] font-semibold text-[#87651f]">
                        {action.complexity}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 sm:p-7">
                    <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                      Próximos passos
                    </p>
                    <div className="space-y-2">
                      {action.steps.map((step, index) => {
                        const stepId = `${action.id}-${index}`;
                        const checked = completed.includes(stepId);
                        return (
                          <label
                            key={step}
                            className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition ${checked ? 'border-[var(--teal)]/20 bg-[var(--teal-soft)]/55' : 'border-transparent bg-[var(--canvas)] hover:border-[var(--line-strong)]'}`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleStep(stepId)}
                              aria-label={`Marcar etapa: ${step}`}
                              className="mt-0.5 data-checked:border-[var(--teal)] data-checked:bg-[var(--teal)]"
                            />
                            <span
                              className={`text-xs leading-relaxed ${checked ? 'text-[var(--muted)] line-through' : 'text-[var(--ink)]'}`}
                            >
                              {step}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="relative mb-5 mt-10 overflow-hidden rounded-xl bg-[var(--navy)] p-7 text-white shadow-[0_22px_70px_rgb(23_43_53/18%)] sm:p-9">
          <div className="absolute -right-16 -top-24 size-72 rounded-full border-[56px] border-white/[0.035]" />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="flex gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--lime)] text-[var(--navy)]">
                <ArrowDownToLine size={21} />
              </div>
              <div>
                <p className="text-xl font-semibold tracking-[-0.035em]">
                  Leve o diagnóstico para a reunião
                </p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/52">
                  Baixe um relatório em PDF com os indicadores atuais,
                  prioridades e próximos passos desta escola.
                </p>
              </div>
            </div>
            <Button
              onClick={downloadReport}
              className="h-12 shrink-0 rounded-xl bg-[var(--lime)] px-5 font-semibold text-[var(--navy)] hover:bg-[var(--lime)]/90"
            >
              {downloaded ? (
                <>
                  <Check size={17} /> Relatório baixado
                </>
              ) : (
                <>
                  Gerar relatório PDF <ArrowRight size={17} />
                </>
              )}
            </Button>
          </div>
        </section>
      </div>
    </AtlasShell>
  );
}
