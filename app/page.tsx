'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CircleAlert,
  Database,
  MapPin,
  Sparkles,
  UsersRound,
  Wifi,
} from 'lucide-react';
import { AtlasShell } from '@/components/atlas-shell';
import { useAtlas } from '@/components/atlas-provider';
import { EnemPerformanceChart, InfrastructureChart, SaebStateChart } from '@/components/atlas-charts';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DATA_MANIFEST, DOCUMENT_SOURCES, INFRA_KEYS, INFRA_LABELS, SAEB_STATE } from '@/lib/atlas-data';

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
}

function formatScore(value: number | null) {
  return value === null ? 'Sem dado' : value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function statusFor(score: number) {
  if (score < 3) return { label: 'Crítico', tone: 'bg-[#fbe5e1] text-[#a7433a]', bar: 'bg-[#cc665c]' };
  if (score < 6) return { label: 'Atenção', tone: 'bg-[#f7efd7] text-[#87651f]', bar: 'bg-[#d39d36]' };
  if (score < 8) return { label: 'Adequado', tone: 'bg-[var(--teal-soft)] text-[var(--teal)]', bar: 'bg-[var(--teal)]' };
  return { label: 'Favorável', tone: 'bg-[#eaf3c8] text-[#5a6f17]', bar: 'bg-[#8a9b37]' };
}

export default function OverviewPage() {
  const { profile, schoolContext: context } = useAtlas();
  const profileName = profile === 'Gestor(a) Escolar' ? 'Gestor' : profile.replace('(a)', '').trim();
  const criticalPercentage = context.school.infrastructure[context.criticalFactor] * 10;
  const math = context.performanceAreas.find((area) => area.key === 'mt')!;
  const stateSaebHighSchool = SAEB_STATE.find((row) => row.ETAPA === 'Ensino Médio');

  return (
    <AtlasShell>
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <section className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--teal)]">
              <Sparkles size={14} /> Panorama da escola
            </div>
            <h1 className="max-w-3xl text-[clamp(2rem,4vw,3.45rem)] font-semibold leading-[1.02] tracking-[-0.052em]">
              {greeting()}, {profileName}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              Indicadores reais do Censo Escolar e ENEM 2025, com contexto estadual do SAEB 2023.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm font-medium"><Building2 size={16} /> {context.school.name}</span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--muted)]"><MapPin size={16} /> {context.school.municipality} · {context.school.state}</span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--muted)]"><CalendarDays size={16} /> Código {context.school.code}</span>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-[1.25fr_1fr_1fr_1fr]">
          <article className="relative overflow-hidden rounded-[24px] bg-[var(--navy)] p-6 text-white shadow-[0_18px_50px_rgb(23_35_46/10%)] sm:p-7">
            <div className="absolute -right-12 -top-16 size-52 rounded-full border-[42px] border-white/[0.035]" />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--lime)]">Prioridade de infraestrutura</p>
            <p className="mt-7 text-2xl font-semibold tracking-[-0.035em]">{context.criticalFactorName}</p>
            <div className="mt-3 flex items-end justify-between gap-4"><p className="text-sm text-white/50">Menor índice composto</p><p className="text-[40px] font-semibold leading-none">{criticalPercentage.toFixed(0)}<span className="text-base">%</span></p></div>
          </article>

          <article className="atlas-card p-6">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Registros ENEM</p><UsersRound size={18} className="text-[var(--teal)]" /></div>
            <p className="mt-7 text-[40px] font-semibold leading-none tracking-[-0.055em]">{context.school.records.toLocaleString('pt-BR')}</p>
            <p className="mt-5 text-xs text-[var(--muted)]">{context.lowSampleAreas.length ? `${context.lowSampleAreas.length} área(s) com amostra abaixo de 30` : 'Amostra ≥30 em todas as áreas'}</p>
          </article>

          <article className="atlas-card p-6">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Matemática</p><Database size={18} className="text-[var(--teal)]" /></div>
            <p className="mt-7 text-[40px] font-semibold leading-none tracking-[-0.055em]">{formatScore(math.schoolAverage)}<span className="ml-1 text-sm font-normal text-[var(--muted)]">pts</span></p>
            <p className="mt-5 text-xs text-[var(--muted)]">Município: {formatScore(math.municipalAverage)} · n={math.schoolParticipants}</p>
          </article>

          <article className="atlas-card p-6">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Conectividade</p><Wifi size={18} className="text-[var(--teal)]" /></div>
            <p className="mt-7 text-[40px] font-semibold leading-none tracking-[-0.055em]">{(context.connectivityScore * 10).toFixed(0)}<span className="text-base">%</span></p>
            <p className="mt-5 text-xs text-[var(--muted)]">Índice composto · situação {context.connectivityStatus.toLowerCase()}</p>
          </article>
        </section>

        {context.lowSampleAreas.length > 0 && (
          <div className="mt-4 flex gap-3 rounded-2xl border border-[#ead8a8] bg-[#fff9e9] p-4 text-sm text-[#725a1f]">
            <CircleAlert size={18} className="mt-0.5 shrink-0" />
            <p>Interprete com cautela: {context.lowSampleAreas.map((area) => `${area.label} (n=${area.schoolParticipants})`).join(', ')} têm menos de 30 participantes.</p>
          </div>
        )}

        <section className="mt-10 grid gap-5 xl:grid-cols-2">
          <article className="atlas-card p-5 sm:p-7">
            <p className="atlas-eyebrow">Infraestrutura</p><h2 className="atlas-section-title">Escola e média municipal</h2>
            <p className="atlas-section-copy">Percentuais compostos conforme as regras do dicionário.</p>
            <div className="mt-3 overflow-x-auto"><div className="min-w-[560px]"><InfrastructureChart context={context} /></div></div>
          </article>
          <article className="atlas-card p-5 sm:p-7">
            <p className="atlas-eyebrow">ENEM 2025</p><h2 className="atlas-section-title">Médias por área</h2>
            <p className="atlas-section-copy">Cada resultado traz sua própria contagem de participantes.</p>
            <div className="mt-3 overflow-x-auto"><div className="min-w-[560px]"><EnemPerformanceChart context={context} /></div></div>
          </article>
        </section>

        <section className="mt-10 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
          <article className="atlas-card p-6 sm:p-7">
            <p className="atlas-eyebrow">Diagnóstico detalhado</p><h2 className="atlas-section-title">Composição da infraestrutura</h2>
            <div className="mt-6 space-y-5">
              {INFRA_KEYS.map((key) => {
                const score = context.school.infrastructure[key];
                const status = statusFor(score);
                return <div key={key}><div className="mb-2 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{INFRA_LABELS[key]}</p><p className="mt-0.5 text-[11px] text-[var(--muted)]">Município: {(context.municipalInfrastructure[key] * 10).toFixed(1)}%</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.tone}`}>{status.label} · {(score * 10).toFixed(1)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[var(--canvas)]"><div className={`h-full rounded-full ${status.bar}`} style={{ width: `${score * 10}%` }} /></div></div>;
              })}
            </div>
          </article>

          <article className="atlas-card p-6 sm:p-7">
            <p className="atlas-eyebrow">SAEB 2023</p><h2 className="atlas-section-title">Contexto do Maranhão</h2>
            <p className="atlas-section-copy">Médias estaduais ponderadas pelo número de estudantes presentes.</p>
            <div className="mt-3 overflow-x-auto"><div className="min-w-[520px]"><SaebStateChart /></div></div>
            {stateSaebHighSchool && <p className="mt-2 text-xs text-[var(--muted)]">Ensino Médio: participação de {stateSaebHighSchool.TAXA_PARTICIPACAO_AGREGADA?.toLocaleString('pt-BR')}% em {stateSaebHighSchool.QTD_ESCOLAS_GRUPO.toLocaleString('pt-BR')} escolas do grupo.</p>}
          </article>
        </section>

        <section className="mt-10">
          <Accordion className="atlas-card px-5 sm:px-7">
            <AccordionItem value="methodology">
              <AccordionTrigger className="py-5 text-left"><div><p className="font-semibold">Metodologia e rastreabilidade</p><p className="mt-1 text-xs font-normal text-[var(--muted)]">Como os indicadores foram validados e quais são seus limites.</p></div></AccordionTrigger>
              <AccordionContent className="pb-6 text-sm leading-7 text-[var(--muted)]">
                <p>Os arquivos foram conferidos contra o dicionário por hash SHA-256, cabeçalho, tipos, chaves, nulidade e totais de aceitação. A entrega contém {DATA_MANIFEST.acceptance.publicSchools.toLocaleString('pt-BR')} escolas públicas no Censo, {DATA_MANIFEST.acceptance.linkedSchools.toLocaleString('pt-BR')} escolas vinculadas à base escolar e {DATA_MANIFEST.acceptance.unlinkedSchools} registros escolares do ENEM sem vínculo com o Censo.</p>
                <p className="mt-3">As médias do ENEM devem ser ponderadas pelas contagens da área. O SAEB é apresentado apenas como contexto estadual, pois os identificadores de escola e município na origem estão mascarados. Comparações não representam causalidade.</p>
                <p className="mt-3 text-xs">Fontes: {DOCUMENT_SOURCES.school}; {DOCUMENT_SOURCES.municipality}; {DOCUMENT_SOURCES.saeb}.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="relative mb-5 mt-10 overflow-hidden rounded-[28px] bg-[var(--navy)] p-7 text-white sm:p-9">
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div><p className="text-xl font-semibold tracking-[-0.035em]">Transforme o diagnóstico em acompanhamento</p><p className="mt-2 max-w-xl text-sm leading-relaxed text-white/52">O plano usa os sinais reais da escola selecionada e mantém o progresso no navegador.</p></div>
            <Link href="/plano-de-acao" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--lime)] px-5 text-sm font-semibold text-[var(--navy)]">Abrir plano de ação <ArrowRight size={17} /></Link>
          </div>
        </section>
      </div>
    </AtlasShell>
  );
}
