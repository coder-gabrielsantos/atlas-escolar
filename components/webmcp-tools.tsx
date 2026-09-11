'use client';

import { useEffect } from 'react';
import { ACCESS_PROFILES, AccessProfile, SCHOOLS } from '@/lib/atlas-data';
import { useAtlas } from '@/components/atlas-provider';

type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

export function WebMcpTools() {
  const { selectSchoolContext } = useAtlas();

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();

    const registration = modelContext.registerTool(
      {
        name: 'set_school_context',
        title: 'Selecionar contexto escolar',
        description: 'Seleciona uma escola e, opcionalmente, um perfil de acesso no painel Atlas.',
        inputSchema: {
          type: 'object',
          properties: {
            schoolName: { type: 'string', description: 'Nome exato de uma escola disponível no Atlas.' },
            profile: { type: 'string', enum: [...ACCESS_PROFILES] },
          },
          required: ['schoolName'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input: unknown) {
          const value = input as { schoolName?: unknown; profile?: unknown };
          if (typeof value.schoolName !== 'string') throw new Error('schoolName deve ser uma string.');
          const school = SCHOOLS.find((item) => item.name === value.schoolName);
          if (!school) throw new Error('Escola não encontrada no conjunto de dados atual.');
          if (value.profile !== undefined && !ACCESS_PROFILES.includes(value.profile as AccessProfile)) {
            throw new Error('Perfil de acesso inválido.');
          }
          selectSchoolContext(school.name, value.profile as AccessProfile | undefined);
          return { schoolName: school.name, municipality: school.municipality, state: school.state };
        },
      },
      { signal: lifecycle.signal },
    );

    void Promise.resolve(registration).catch(() => undefined);
    return () => lifecycle.abort();
  }, [selectSchoolContext]);

  return null;
}
