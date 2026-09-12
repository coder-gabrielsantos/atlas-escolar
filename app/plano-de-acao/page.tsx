'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  Building2,
  Check,
  UsersRound,
} from 'lucide-react';
import { AtlasShell } from '@/components/atlas-shell';
import { useAtlas } from '@/components/atlas-provider';
import { buildReport } from '@/lib/report';
import { Button } from '@/components/ui/button';

type ImprovementDefinition = {
  id: 'infrastructure' | 'pedagogy';
  number: string;
  title: string;
  description: string;
  impact: string;
  detail: string;
  icon: typeof Building2;
};

export default function ActionPlanPage() {
  const { schoolContext: context } = useAtlas();
  const [downloaded, setDownloaded] = useState(false);

  const improvements = useMemo<ImprovementDefinition[]>(() => {
    const pedagogicalImpact = context.lowSampleAreas.length
      ? 'Atenção à amostra'
      : 'Prioridade pedagógica';
    const lowestArea = context.lowestPerformanceArea;
    const criticalSchool =
      context.school.infrastructure[context.criticalFactor] * 10;
    const criticalMunicipal =
      context.municipalInfrastructure[context.criticalFactor] * 10;

    return [
      {
        id: 'infrastructure',
        number: '01',
        title: context.criticalFactorName,
        description: `É o menor índice composto de infraestrutura da escola, com ${criticalSchool.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%.`,
        impact: 'Prioridade de infraestrutura',
        detail: `Referência municipal: ${criticalMunicipal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%.`,
        icon: Building2,
      },
      {
        id: 'pedagogy',
        number: '02',
        title: lowestArea?.label ?? 'Cobertura dos dados do ENEM',
        description: lowestArea
          ? `É a menor média válida da escola no ENEM: ${lowestArea.schoolAverage?.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} pontos.`
          : 'Não há média válida por área para esta escola na entrega atual.',
        impact: pedagogicalImpact,
        detail: lowestArea
          ? `Referência municipal: ${lowestArea.municipalAverage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} pontos · ${lowestArea.schoolParticipants} participante(s).`
          : 'A disponibilidade e a cobertura precisam ser verificadas antes da análise.',
        icon: UsersRound,
      },
    ];
  }, [context]);

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

  return (
    <AtlasShell>
      <div className="mx-auto max-w-[1320px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <section>
          <div>
            <p className="atlas-eyebrow">Leitura objetiva</p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.052em]">
              Plano de ação.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              Os principais pontos que pedem atenção na escola selecionada.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div>
            <p className="atlas-eyebrow">Pontos de melhoria</p>
            <h2 className="atlas-section-title">O que precisa melhorar</h2>
            <p className="atlas-section-copy">
              A lista considera o menor indicador de infraestrutura e a menor
              média válida do ENEM.
            </p>
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            {improvements.map((improvement) => {
              const Icon = improvement.icon;
              return (
                <article
                  key={improvement.id}
                  className="atlas-card relative overflow-hidden p-6 sm:p-7"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-[var(--teal)]" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold tracking-[0.12em] text-[var(--teal)]">
                        {improvement.number}
                      </span>
                      <div className="grid size-10 place-items-center rounded-[14px] bg-[var(--teal-soft)] text-[var(--teal)]">
                        <Icon size={18} />
                      </div>
                    </div>
                    <span className="rounded-full bg-[#eaf3c8] px-3 py-1.5 text-[10px] font-semibold text-[#5a6f17]">
                      {improvement.impact}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-[-0.035em]">
                    {improvement.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    {improvement.description}
                  </p>
                  <div className="mt-5 rounded-xl bg-[var(--canvas)] px-4 py-3 text-xs font-medium text-[var(--ink)]">
                    {improvement.detail}
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
                  Baixe um diagnóstico visual com indicadores e pontos de
                  melhoria da escola.
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
