'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Bot,
  CircleGauge,
  ClipboardCheck,
  Menu,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useAtlas } from '@/components/atlas-provider';
import { WebMcpTools } from '@/components/webmcp-tools';
import { AtlasReactSelect } from '@/components/atlas-react-select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

const NAVIGATION = [
  { href: '/', label: 'Visão geral', short: 'Visão', icon: CircleGauge },
  {
    href: '/assistente',
    label: 'Assistente Atlas',
    short: 'Assistente',
    icon: Bot,
  },
  {
    href: '/plano-de-acao',
    label: 'Plano de ação',
    short: 'Plano',
    icon: ClipboardCheck,
  },
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
        <label className="atlas-field-label" htmlFor="atlas-state">
          Estado
        </label>
        <AtlasReactSelect
          id="atlas-state"
          value={atlas.state}
          options={atlas.states.map((state) => ({
            value: state,
            label: state,
          }))}
          onChange={atlas.setStateValue}
        />
      </div>
      <div className="space-y-2">
        <label className="atlas-field-label" htmlFor="atlas-municipality">
          Município
        </label>
        <AtlasReactSelect
          id="atlas-municipality"
          value={atlas.municipality}
          options={atlas.municipalities.map((municipality) => ({
            value: municipality,
            label: municipality,
          }))}
          onChange={atlas.setMunicipality}
        />
      </div>
      <div className="space-y-2">
        <label className="atlas-field-label" htmlFor="atlas-school">
          Escola
        </label>
        <AtlasReactSelect
          id="atlas-school"
          value={atlas.schoolCode}
          options={atlas.schools.map((school) => ({
            value: school.code,
            label: school.name,
          }))}
          onChange={atlas.setSchoolCode}
        />
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

      {onDone && (
        <Button
          onClick={onDone}
          className="w-full bg-[var(--lime)] text-[var(--navy)] hover:bg-[var(--lime)]/90"
        >
          Aplicar contexto
        </Button>
      )}
    </div>
  );
}

function Brand() {
  return (
    <Link
      href="/"
      className="block"
      aria-label="Atlas — página inicial"
    >
      <div>
        <p className="text-[17px] font-semibold tracking-[-0.02em] text-white">
          Atlas
        </p>
        <p className="text-[11px] text-white/45">Inteligência educacional</p>
      </div>
    </Link>
  );
}

export function AtlasShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { schoolContext } = useAtlas();
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <WebMcpTools />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] flex-col overflow-y-auto bg-[var(--navy)] px-5 py-6 text-white lg:flex">
        <div className="-mx-5 -mt-6 flex h-[70px] shrink-0 items-center border-b border-white/10 px-7">
          <Brand />
        </div>
        <nav className="mt-10 space-y-1" aria-label="Navegação principal">
          {NAVIGATION.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  active
                    ? 'bg-white/10 font-medium text-white'
                    : 'text-white/52 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
                {active && (
                  <span className="ml-auto size-1.5 rounded-full bg-[var(--lime)]" />
                )}
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
      </aside>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-[var(--navy)]/45 backdrop-blur-sm"
            aria-label="Fechar filtros"
            onClick={() => setFiltersOpen(false)}
          />
          <aside className="soft-scroll absolute inset-y-0 right-0 w-[min(88vw,380px)] overflow-y-auto bg-[var(--navy)] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                className="grid size-10 place-items-center rounded-xl bg-white/8"
                onClick={() => setFiltersOpen(false)}
                aria-label="Fechar"
              >
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
            <button
              onClick={() => setFiltersOpen(true)}
              className="grid size-10 place-items-center rounded-xl bg-[var(--navy)] text-[var(--lime)]"
              aria-label="Abrir filtros"
            >
              <Menu size={19} />
            </button>
            <span className="text-sm font-semibold">
              {PAGE_NAMES[pathname] ?? 'Atlas'}
            </span>
          </div>
          <p className="hidden text-sm text-[var(--muted)] lg:block">
            Diagnóstico{' '}
            <span className="mx-2 text-[var(--line-strong)]">/</span>{' '}
            <span className="font-medium text-[var(--ink)]">
              {PAGE_NAMES[pathname] ?? 'Atlas'}
            </span>
          </p>
          <p className="max-w-[240px] truncate text-xs text-[var(--muted)] sm:max-w-[360px]">
            {schoolContext.school.name}
          </p>
        </header>
        {children}
        <footer className="border-t border-[var(--line)] px-5 py-5 text-center text-xs text-[var(--muted)] sm:px-8 lg:px-10">
          Censo/ENEM {schoolContext.school.year} · SAEB 2023
        </footer>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-30 flex h-[64px] items-center justify-around rounded-2xl border border-white/10 bg-[var(--navy)] px-2 shadow-[0_18px_60px_rgb(23_43_53/28%)] lg:hidden"
        aria-label="Navegação principal móvel"
      >
        {NAVIGATION.map(({ href, short, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-20 flex-col items-center gap-1 text-[10px] ${active ? 'text-[var(--lime)]' : 'text-white/48'}`}
            >
              <Icon size={19} />
              {short}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
