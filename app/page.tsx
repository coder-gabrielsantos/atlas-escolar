'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ChartNoAxesCombined,
  CircleAlert,
  Database,
  School,
  Sparkles,
  UsersRound,
  Wifi,
} from 'lucide-react';
import { AtlasShell } from '@/components/atlas-shell';
import { useAtlas } from '@/components/atlas-provider';
import {
  EnemPerformanceChart,
  InfrastructureChart,
  SaebStateChart,
} from '@/components/atlas-charts';
import { INFRA_KEYS, INFRA_LABELS, SAEB_STATE } from '@/lib/atlas-data';

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
}

function formatScore(value: number | null) {
  return value === null
    ? 'Sem dado'
    : value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function statusFor(score: number) {
  if (score < 3)
    return {
      label: 'Crítico',
      tone: 'bg-[#fbe5e1] text-[#9f3f37]',
      bar: 'bg-[#c95f55]',
    };
  if (score < 6)
    return {
      label: 'Atenção',
      tone: 'bg-[#f8efd7] text-[#7e601e]',
      bar: 'bg-[#d29b32]',
    };
  if (score < 8)
    return {
      label: 'Adequado',
      tone: 'bg-[var(--teal-soft)] text-[var(--teal)]',
      bar: 'bg-[var(--teal)]',
    };
  return {
    label: 'Favorável',
    tone: 'bg-[#eaf3c8] text-[#546b14]',
    bar: 'bg-[#84962e]',
  };
}

function ChartKey({ compare }: { compare: boolean }) {
  return (
    <div className="atlas-chart-key" aria-label="Legenda do gráfico">
      <span>
        <i /> Escola
      </span>
      {compare && (
        <span>
          <i data-tone="muted" /> Média municipal
        </span>
      )}
    </div>
  );
}

export default function OverviewPage() {
  const { schoolContext: context } = useAtlas();
  const criticalPercentage =
    context.school.infrastructure[context.criticalFactor] * 10;
  const math = context.performanceAreas.find((area) => area.key === 'mt')!;
  const stateSaebHighSchool = SAEB_STATE.find(
    (row) => row.ETAPA === 'Ensino Médio',
  );

  return (
    <AtlasShell>
      <div className="atlas-page">
        <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--teal)]">
              <Sparkles size={14} /> Panorama da escola
            </div>
            <h1 className="atlas-page-heading max-w-3xl">
              {greeting()}, vamos aos dados.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              Uma leitura direta dos indicadores que mais ajudam a orientar as
              próximas decisões.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--muted)] shadow-sm">
            <School size={14} className="text-[var(--teal)]" />
            Ano de referência {context.school.year}
          </div>
        </section>

        <section className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <article className="relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-[12px] bg-[var(--navy)] p-5 text-white shadow-[0_18px_55px_rgb(18_47_56/16%)] sm:p-6">
            <div className="absolute -right-12 -top-16 size-52 rounded-full border-[42px] border-white/[0.04]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-[var(--lime)]">
                  Maior prioridade
                </p>
                <p className="mt-3 max-w-[16rem] text-xl font-bold leading-tight tracking-[-0.035em] sm:text-2xl">
                  {context.criticalFactorName}
                </p>
              </div>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/8 text-[var(--lime)]">
                <ChartNoAxesCombined size={19} />
              </span>
            </div>
            <div className="relative mt-6 flex items-end justify-between gap-4">
              <p className="max-w-[9rem] text-xs leading-relaxed text-white/52">
                Menor índice de infraestrutura
              </p>
              <p className="atlas-kpi-value text-white">
                {criticalPercentage.toFixed(0)}
                <span className="ml-1 text-base font-bold text-white/60">%</span>
              </p>
            </div>
          </article>

          <article className="atlas-card flex min-h-[190px] flex-col justify-between p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                Registros ENEM
              </p>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--teal-soft)] text-[var(--teal)]">
                <UsersRound size={17} />
              </span>
            </div>
            <div className="mt-5">
              <p className="atlas-kpi-value">
                {context.school.records.toLocaleString('pt-BR')}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                {context.lowSampleAreas.length
                  ? `${context.lowSampleAreas.length} área(s) com amostra reduzida`
                  : 'Amostra suficiente em todas as áreas'}
              </p>
            </div>
          </article>

          <article className="atlas-card flex min-h-[190px] flex-col justify-between p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                Matemática
              </p>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--teal-soft)] text-[var(--teal)]">
                <Database size={17} />
              </span>
            </div>
            <div className="mt-5">
              <p className="atlas-kpi-value break-words">
                {formatScore(math.schoolAverage)}
                {math.schoolAverage !== null && (
                  <span className="ml-1 text-xs font-semibold tracking-normal text-[var(--muted)]">
                    pts
                  </span>
                )}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                Município {formatScore(math.municipalAverage)} · n=
                {math.schoolParticipants}
              </p>
            </div>
          </article>

          <article className="atlas-card flex min-h-[190px] flex-col justify-between p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                Conectividade
              </p>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--teal-soft)] text-[var(--teal)]">
                <Wifi size={17} />
              </span>
            </div>
            <div className="mt-5">
              <p className="atlas-kpi-value">
                {(context.connectivityScore * 10).toFixed(0)}
                <span className="ml-1 text-base font-bold text-[var(--muted)]">
                  %
                </span>
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
                Índice composto · {context.connectivityStatus.toLowerCase()}
              </p>
            </div>
          </article>
        </section>

        {context.lowSampleAreas.length > 0 && (
          <div className="mt-4 flex gap-3 rounded-2xl border border-[#ead8a8] bg-[#fff9e9] p-4 text-sm leading-relaxed text-[#725a1f] sm:items-center">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f3e5bd]">
              <CircleAlert size={17} />
            </span>
            <p>
              <strong className="font-bold">Leitura com cautela.</strong>{' '}
              {context.lowSampleAreas
                .map((area) => `${area.label} (n=${area.schoolParticipants})`)
                .join(', ')}{' '}
              têm menos de 30 participantes.
            </p>
          </div>
        )}

        <section className="mt-10 grid gap-4 xl:grid-cols-2">
          <article className="atlas-card min-w-0 p-4 sm:p-6">
            <div>
              <div>
                <p className="atlas-eyebrow">Infraestrutura</p>
                <h2 className="atlas-section-title">Escola e município</h2>
                <p className="atlas-section-copy">
                  Percentuais compostos por dimensão avaliada.
                </p>
              </div>
            </div>
            <div className="mt-4 min-w-0">
              <InfrastructureChart context={context} />
            </div>
            <div className="mt-2">
              <ChartKey compare={context.compareMunicipal} />
            </div>
          </article>

          <article className="atlas-card min-w-0 p-4 sm:p-6">
            <div>
              <div>
                <p className="atlas-eyebrow">ENEM 2025</p>
                <h2 className="atlas-section-title">Médias por área</h2>
                <p className="atlas-section-copy">
                  Resultados acompanhados da amostra de participantes.
                </p>
              </div>
            </div>
            <div className="mt-4 min-w-0">
              <EnemPerformanceChart context={context} />
            </div>
            <div className="mt-2">
              <ChartKey compare={context.compareMunicipal} />
            </div>
          </article>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className="atlas-card p-4 sm:p-6">
            <p className="atlas-eyebrow">Diagnóstico detalhado</p>
            <h2 className="atlas-section-title">Composição da infraestrutura</h2>
            <p className="atlas-section-copy">
              Situação da escola em cada dimensão do indicador.
            </p>
            <div className="mt-6 grid gap-y-5">
              {INFRA_KEYS.map((key) => {
                const score = context.school.infrastructure[key];
                const status = statusFor(score);
                return (
                  <div key={key}>
                    <div className="mb-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-snug">
                          {INFRA_LABELS[key]}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Município{' '}
                          {(context.municipalInfrastructure[key] * 10).toFixed(
                            1,
                          )}
                          %
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.tone}`}
                      >
                        {status.label} · {(score * 10).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--canvas-deep)]">
                      <div
                        className={`h-full rounded-full ${status.bar}`}
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="atlas-card min-w-0 p-4 sm:p-6">
            <p className="atlas-eyebrow">SAEB 2023</p>
            <h2 className="atlas-section-title">Contexto do Maranhão</h2>
            <p className="atlas-section-copy">
              Médias estaduais ponderadas por estudantes presentes.
            </p>
            <div className="mt-4 min-w-0">
              <SaebStateChart />
            </div>
            {stateSaebHighSchool && (
              <p className="mt-1 rounded-xl bg-[var(--canvas)] px-3.5 py-3 text-xs leading-relaxed text-[var(--muted)]">
                Ensino Médio: participação de{' '}
                {stateSaebHighSchool.TAXA_PARTICIPACAO_AGREGADA?.toLocaleString(
                  'pt-BR',
                )}
                % em{' '}
                {stateSaebHighSchool.QTD_ESCOLAS_GRUPO.toLocaleString('pt-BR')}{' '}
                escolas do grupo.
              </p>
            )}
          </article>
        </section>

        <section className="relative mb-2 mt-6 overflow-hidden rounded-[12px] bg-[var(--navy)] p-5 text-white shadow-[0_22px_65px_rgb(18_47_56/14%)] sm:p-7 lg:p-8">
          <div className="absolute -right-14 -top-20 size-60 rounded-full border-[48px] border-white/[0.035]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-xl font-bold tracking-[-0.035em] sm:text-2xl">
                Transforme o diagnóstico em ação
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/58">
                Leve as principais evidências da escola para o planejamento e
                para a próxima reunião da equipe.
              </p>
            </div>
            <Link
              href="/plano-de-acao"
              className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--lime)] px-5 text-sm font-bold text-[var(--navy)] transition hover:bg-white sm:w-fit"
            >
              Abrir plano de ação <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </div>
    </AtlasShell>
  );
}
