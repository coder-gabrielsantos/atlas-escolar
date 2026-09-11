'use client';

import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CircleAlert,
  MapPin,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { AtlasShell } from '@/components/atlas-shell';
import { useAtlas } from '@/components/atlas-provider';
import { ContextScatterChart, FeatureImportanceChart, InfrastructureChart } from '@/components/atlas-charts';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FEATURE_IMPORTANCE, INFRA_KEYS, INFRA_LABELS } from '@/lib/atlas-data';

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
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
  const infraDelta = context.infrastructureScore - context.municipalScore;
  const gapPositive = context.socioeconomicGap >= 0;

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
              Os sinais mais importantes para orientar as próximas decisões da escola.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm font-medium shadow-[0_1px_2px_rgb(21_34_45/4%)]">
              <Building2 size={16} /> {context.school.name}
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--muted)] shadow-[0_1px_2px_rgb(21_34_45/4%)]">
              <MapPin size={16} /> {context.school.municipality} · {context.school.state}
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--muted)] shadow-[0_1px_2px_rgb(21_34_45/4%)]">
              <CalendarDays size={16} /> {context.school.year}
            </span>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <article className="relative overflow-hidden rounded-[24px] bg-[var(--navy)] p-6 text-white shadow-[0_18px_50px_rgb(23_35_46/10%)] sm:p-7">
            <div className="absolute -right-12 -top-16 size-52 rounded-full border-[42px] border-white/[0.035]" />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--lime)]">Prioridade atual</p>
            <div className="mt-7 flex items-end justify-between gap-5">
              <div className="min-w-0">
                <p className="text-xl font-semibold tracking-[-0.035em] sm:text-2xl">{context.criticalFactorName}</p>
                <p className="mt-2 text-sm text-white/50">Menor indicador da escola</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-[40px] font-semibold leading-none tracking-[-0.06em]">{context.school.infrastructure[context.criticalFactor].toFixed(1).replace('.', ',')}</span>
                <span className="ml-1 text-sm text-white/42">/10</span>
              </div>
            </div>
          </article>

          <article className="atlas-card p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-[var(--muted)]">Infraestrutura</p>
              {context.compareMunicipal && <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${infraDelta >= 0 ? 'bg-[var(--teal-soft)] text-[var(--teal)]' : 'bg-[#fbe5e1] text-[#a7433a]'}`}>{infraDelta >= 0 ? '+' : ''}{infraDelta.toFixed(1).replace('.', ',')} municipal</span>}
            </div>
            <p className="mt-7 text-[40px] font-semibold leading-none tracking-[-0.055em]">{context.infrastructureScore.toFixed(1).replace('.', ',')}<span className="ml-1 text-sm font-normal text-[var(--muted)]">/10</span></p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[var(--canvas)]"><div className="h-full rounded-full bg-[var(--teal)]" style={{ width: `${context.infrastructureScore * 10}%` }} /></div>
          </article>

          <article className="atlas-card p-6">
            <div className="flex items-start justify-between"><p className="text-sm text-[var(--muted)]">Desempenho</p>{gapPositive ? <ArrowUpRight size={18} className="text-[var(--teal)]" /> : <ArrowDownRight size={18} className="text-[#b24f46]" />}</div>
            <p className="mt-7 text-[40px] font-semibold leading-none tracking-[-0.055em]">{context.school.performance}<span className="ml-1 text-sm font-normal text-[var(--muted)]">pts</span></p>
            <p className={`mt-5 text-xs font-medium ${gapPositive ? 'text-[var(--teal)]' : 'text-[#b24f46]'}`}>{context.socioeconomicGap >= 0 ? '+' : ''}{context.socioeconomicGap.toFixed(0)} pts versus contexto esperado</p>
          </article>

          <article className="atlas-card p-6">
            <div className="flex items-start justify-between"><p className="text-sm text-[var(--muted)]">Conectividade</p><Wifi size={18} className={context.connectivityScore >= 6 ? 'text-[var(--teal)]' : 'text-[#b24f46]'} /></div>
            <p className="mt-7 text-[31px] font-semibold leading-none tracking-[-0.05em]">{context.connectivityStatus}</p>
            <p className="mt-5 text-xs text-[var(--muted)]">Índice combinado · <strong className="text-[var(--ink)]">{context.connectivityScore.toFixed(1).replace('.', ',')}/10</strong></p>
          </article>
        </section>

        <aside className="mt-4 flex gap-4 rounded-[20px] border border-[#dfe9a8] bg-[var(--lemon)] p-5 text-[var(--navy)]">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/65"><BookOpenCheck size={18} /></div>
          <div>
            <p className="text-sm font-semibold">Leitura rápida</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--navy)]/68">
              {context.compareMunicipal ? <>A infraestrutura está <strong>{Math.abs(infraDelta).toFixed(1).replace('.', ',')} ponto(s) {infraDelta >= 0 ? 'acima' : 'abaixo'}</strong> da média municipal. </> : null}
              O ponto que merece atenção primeiro é <strong>{context.criticalFactorName}</strong>. Valide esse sinal localmente antes de definir uma intervenção.
            </p>
          </div>
        </aside>

        <section className="mt-10">
          <div>
            <p className="atlas-eyebrow">Posicionamento</p>
            <h2 className="atlas-section-title">Como a escola se compara</h2>
            <p className="atlas-section-copy">Infraestrutura e resultados lidos dentro do contexto educacional do município.</p>
          </div>
          <div className="mt-5 grid gap-4 2xl:grid-cols-2">
            <article className="atlas-card p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="atlas-card-title">Infraestrutura por dimensão</h3><p className="atlas-card-copy">Pontuação da escola{context.compareMunicipal ? ' versus média municipal' : ''}</p></div>
                <div className="flex gap-4 text-[11px] text-[var(--muted)]"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[var(--teal)]" /> Escola</span>{context.compareMunicipal && <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#d7d3c5]" /> Município</span>}</div>
              </div>
              <div className="mt-3 overflow-x-auto"><div className="min-w-[520px]"><InfrastructureChart context={context} /></div></div>
            </article>
            <article className="atlas-card p-5 sm:p-7">
              <div><h3 className="atlas-card-title">Contexto e desempenho</h3><p className="atlas-card-copy">Relação entre nível socioeconômico e resultado educacional</p></div>
              <div className="mt-3 overflow-x-auto"><div className="min-w-[520px]"><ContextScatterChart context={context} /></div></div>
            </article>
          </div>
        </section>

        <section className="mt-10">
          <div><p className="atlas-eyebrow">Diagnóstico detalhado</p><h2 className="atlas-section-title">Recursos da escola</h2><p className="atlas-section-copy">Uma leitura direta do nível atual e da distância para a referência municipal.</p></div>
          <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--line)] bg-white shadow-[0_8px_30px_rgb(23_35_46/4%)]">
            <div className="hidden grid-cols-[1.4fr_.75fr_.75fr_.75fr] gap-5 border-b border-[var(--line)] bg-[#fafaf7] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)] md:grid">
              <span>Dimensão</span><span>Escola</span><span>Município</span><span>Situação</span>
            </div>
            {INFRA_KEYS.map((key) => {
              const value = context.school.infrastructure[key];
              const municipal = context.municipalInfrastructure[key];
              const status = statusFor(value);
              return (
                <div key={key} className="grid gap-4 border-b border-[var(--line)] px-5 py-5 last:border-0 md:grid-cols-[1.4fr_.75fr_.75fr_.75fr] md:items-center md:px-6">
                  <div><p className="text-sm font-semibold">{INFRA_LABELS[key]}</p><p className="mt-1 text-xs text-[var(--muted)]">{value < 3 ? 'Requer verificação imediata' : value < 6 ? 'Oportunidade de melhoria' : 'Condição funcional para uso pedagógico'}</p></div>
                  <div><div className="flex items-center gap-3"><strong className="w-7 text-sm">{value.toFixed(1).replace('.', ',')}</strong><div className="h-1.5 w-full max-w-24 overflow-hidden rounded-full bg-[var(--canvas)]"><div className={`h-full ${status.bar}`} style={{ width: `${value * 10}%` }} /></div></div></div>
                  <div className="text-sm text-[var(--muted)]"><span className="mr-2 md:hidden">Média:</span>{context.compareMunicipal ? municipal.toFixed(1).replace('.', ',') : 'Oculta'}</div>
                  <div><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.tone}`}>{status.label}</span></div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-6 mt-10">
          <Accordion className="rounded-[24px] border border-[var(--line)] bg-white px-5 shadow-[0_8px_30px_rgb(23_35_46/4%)] sm:px-7" defaultValue={profile === 'Estudante' ? [] : ['factors']}>
            <AccordionItem value="factors" className="border-0">
              <AccordionTrigger className="py-6 hover:no-underline">
                <div className="text-left"><div className="flex items-center gap-2"><CircleAlert size={17} className="text-[var(--teal)]" /><span className="font-semibold">O que mais influencia os resultados?</span></div><p className="mt-1 pl-6 text-xs font-normal text-[var(--muted)]">Importância relativa no modelo demonstrativo — não representa causalidade.</p></div>
              </AccordionTrigger>
              <AccordionContent className="pb-7">
                <div className="grid gap-8 xl:grid-cols-[1.15fr_1fr]">
                  <div className="overflow-x-auto"><div className="min-w-[600px]"><FeatureImportanceChart /></div></div>
                  <div className="space-y-3">
                    {FEATURE_IMPORTANCE.map((item) => (
                      <div key={item.factor} className="rounded-xl bg-[var(--canvas)] p-3.5">
                        <div className="flex justify-between gap-3 text-xs font-semibold"><span>{item.factor}</span><span className="text-[var(--teal)]">{Math.round(item.value * 100)}%</span></div>
                        <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{item.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </AtlasShell>
  );
}
