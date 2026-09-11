'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Bot,
  ChartNoAxesCombined,
  CircleGauge,
  ClipboardCheck,
  Database,
  Menu,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useAtlas } from '@/components/atlas-provider';
import { WebMcpTools } from '@/components/webmcp-tools';
import { ACCESS_PROFILES, AccessProfile } from '@/lib/atlas-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

const NAVIGATION = [
  { href: '/', label: 'Visão geral', short: 'Visão', icon: CircleGauge },
  { href: '/assistente', label: 'Assistente Atlas', short: 'Assistente', icon: Bot },
  { href: '/plano-de-acao', label: 'Plano de ação', short: 'Plano', icon: ClipboardCheck },
];

const PAGE_NAMES: Record<string, string> = {
  '/': 'Visão geral',
  '/assistente': 'Assistente Atlas',
  '/plano-de-acao': 'Plano de ação',
};

function Filters({ onDone }: { onDone?: () => void }) {
  const atlas = useAtlas();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="atlas-field-label" htmlFor="atlas-state">Estado</label>
        <Select value={atlas.state} onValueChange={(value) => value && atlas.setStateValue(value)}>
          <SelectTrigger id="atlas-state" className="atlas-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            {atlas.states.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="atlas-field-label" htmlFor="atlas-municipality">Município</label>
        <Select value={atlas.municipality} onValueChange={(value) => value && atlas.setMunicipality(value)}>
          <SelectTrigger id="atlas-municipality" className="atlas-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            {atlas.municipalities.map((municipality) => (
              <SelectItem key={municipality} value={municipality}>{municipality}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="atlas-field-label" htmlFor="atlas-school">Escola</label>
        <Select value={atlas.schoolName} onValueChange={(value) => value && atlas.setSchoolName(value)}>
          <SelectTrigger id="atlas-school" className="atlas-select min-h-11 h-auto"><SelectValue /></SelectTrigger>
          <SelectContent>
            {atlas.schools.map((school) => (
              <SelectItem key={school.name} value={school.name}>{school.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4 border-y border-white/10 py-4">
        <div>
          <p className="text-xs font-medium text-white/78">Média municipal</p>
          <p className="mt-1 text-[11px] text-white/38">Mostrar comparação</p>
        </div>
        <Switch
          checked={atlas.compareMunicipal}
          onCheckedChange={atlas.setCompareMunicipal}
          aria-label="Comparar com a média municipal"
          className="data-checked:bg-[var(--lime)] data-unchecked:bg-white/15"
        />
      </div>

      <div className="space-y-2">
        <label className="atlas-field-label" htmlFor="atlas-profile">Perfil de acesso</label>
        <Select value={atlas.profile} onValueChange={(value) => value && atlas.setProfile(value as AccessProfile)}>
          <SelectTrigger id="atlas-profile" className="atlas-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACCESS_PROFILES.map((profile) => (
              <SelectItem key={profile} value={profile}>{profile}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {onDone && (
        <Button onClick={onDone} className="w-full bg-[var(--lime)] text-[var(--navy)] hover:bg-[var(--lime)]/90">
          Aplicar contexto
        </Button>
      )}
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Atlas — página inicial">
      <div className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[var(--lime)] text-[var(--navy)] shadow-[0_9px_24px_rgb(200_236_81/10%)]">
        <ChartNoAxesCombined size={21} strokeWidth={2.4} />
      </div>
      <div>
        <p className="text-[17px] font-semibold tracking-[-0.02em] text-white">Atlas</p>
        <p className="text-[11px] text-white/45">Inteligência educacional</p>
      </div>
    </Link>
  );
}

export function AtlasShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, schoolContext } = useAtlas();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const initials = profile === 'Estudante' ? 'ES' : profile === 'Professor(a)' ? 'PR' : 'GE';
  const shortProfile = profile === 'Gestor(a) Escolar' ? 'Gestor(a)' : profile;

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <WebMcpTools />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] flex-col overflow-y-auto bg-[var(--navy)] px-5 py-6 text-white lg:flex">
        <div className="px-2"><Brand /></div>
        <nav className="mt-10 space-y-1" aria-label="Navegação principal">
          {NAVIGATION.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  active ? 'bg-white/10 font-medium text-white' : 'text-white/52 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
                {active && <span className="ml-auto size-1.5 rounded-full bg-[var(--lime)]" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-white/10 pt-7">
          <div className="mb-5 flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
            <SlidersHorizontal size={13} /> Contexto da análise
          </div>
          <Filters />
        </div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-white/58">
            <Database size={14} className="text-[var(--lime)]" />
            Base demonstrativa ativa
          </div>
          <p className="text-[11px] leading-relaxed text-white/36">
            9 escolas · indicadores sintéticos de 2024.
          </p>
        </div>
      </aside>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-[var(--navy)]/45 backdrop-blur-sm" aria-label="Fechar filtros" onClick={() => setFiltersOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-[min(88vw,380px)] overflow-y-auto bg-[var(--navy)] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <Brand />
              <button className="grid size-10 place-items-center rounded-xl bg-white/8" onClick={() => setFiltersOpen(false)} aria-label="Fechar">
                <X size={19} />
              </button>
            </div>
            <div className="mb-5 mt-10 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
              <SlidersHorizontal size={13} /> Contexto da análise
            </div>
            <Filters onDone={() => setFiltersOpen(false)} />
          </aside>
        </div>
      )}

      <div className="pb-20 lg:pl-[272px] lg:pb-0">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-[var(--line)] bg-[color:rgba(247,247,243,.88)] px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setFiltersOpen(true)} className="grid size-10 place-items-center rounded-xl bg-[var(--navy)] text-[var(--lime)]" aria-label="Abrir filtros">
              <Menu size={19} />
            </button>
            <span className="text-sm font-semibold">{PAGE_NAMES[pathname] ?? 'Atlas'}</span>
          </div>
          <p className="hidden text-sm text-[var(--muted)] lg:block">
            Diagnóstico <span className="mx-2 text-[var(--line-strong)]">/</span>{' '}
            <span className="font-medium text-[var(--ink)]">{PAGE_NAMES[pathname] ?? 'Atlas'}</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-medium text-[var(--muted)] shadow-sm sm:block">
              Dados atualizados · {schoolContext.school.year}
            </span>
            <div className="grid size-9 place-items-center rounded-full bg-[var(--navy)] text-[11px] font-semibold text-white">{initials}</div>
            <div className="hidden max-w-[170px] sm:block">
              <p className="truncate text-xs font-semibold">{shortProfile}</p>
              <p className="truncate text-[10px] text-[var(--muted)]">{schoolContext.school.name}</p>
            </div>
          </div>
        </header>
        {children}
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 flex h-[64px] items-center justify-around rounded-2xl border border-white/10 bg-[var(--navy)] px-2 shadow-[0_18px_60px_rgb(23_43_53/28%)] lg:hidden" aria-label="Navegação principal móvel">
        {NAVIGATION.map(({ href, short, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`flex min-w-20 flex-col items-center gap-1 text-[10px] ${active ? 'text-[var(--lime)]' : 'text-white/48'}`}>
              <Icon size={19} />{short}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
