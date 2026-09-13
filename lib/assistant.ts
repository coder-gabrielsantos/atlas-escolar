import {
  DOCUMENT_SOURCES,
  SAEB_STATE,
  SchoolContext,
} from '@/lib/atlas-data';

export type AssistantChart = 'infrastructure' | 'performance';
export type AssistantAnswer = {
  text: string;
  source?: string;
  mode: string;
  chart?: AssistantChart;
  engine?: 'llama' | 'local';
};

const RESOURCE_LABELS: Array<[keyof SchoolContext['school']['resources'], string]> = [
  ['water', 'água potável'],
  ['publicEnergy', 'energia da rede pública'],
  ['publicSewage', 'esgoto da rede pública'],
  ['wasteCollection', 'coleta de lixo'],
  ['library', 'biblioteca'],
  ['readingRoom', 'biblioteca/sala de leitura'],
  ['scienceLab', 'laboratório de ciências'],
  ['computerLab', 'laboratório de informática'],
  ['sportsCourt', 'quadra esportiva'],
  ['cafeteria', 'refeitório'],
  ['internet', 'internet'],
  ['studentInternet', 'internet para estudantes'],
  ['learningInternet', 'internet para aprendizagem'],
];

function decimal(value: number, digits = 1) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function participantCount(value: number) {
  return `${value} ${value === 1 ? 'participante' : 'participantes'}`;
}

function isGreeting(question: string) {
  const normalized = question
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return /^(oi|ola|opa|e ai|bom dia|boa tarde|boa noite|tudo bem|como vai)( (atlas|assistente|tudo bem|como vai))?$/.test(normalized);
}

export function answerQuestionLocally(question: string, context: SchoolContext): AssistantAnswer {
  const normalized = question.toLocaleLowerCase('pt-BR');
  const critical = context.school.infrastructure[context.criticalFactor] * 10;

  if (isGreeting(question)) {
    return {
      text: `Olá! Sou o Assistente Atlas Escolar e estou com os dados de **${context.school.name}** carregados.\n\nPosso ajudar com infraestrutura, desempenho no ENEM, cobertura dos dados ou o contexto estadual do SAEB. O que você gostaria de analisar?`,
      mode: 'saudação',
      engine: 'local',
    };
  }

  if (normalized.includes('infra') || normalized.includes('gargalo')) {
    const municipal = context.municipalInfrastructure[context.criticalFactor] * 10;
    const difference = critical - municipal;
    return {
      text: `O menor índice composto de infraestrutura é **${context.criticalFactorName}**, com **${decimal(critical)}%**. A média municipal é **${decimal(municipal)}%**, uma diferença de **${decimal(Math.abs(difference))} ponto(s) percentual(is) ${difference >= 0 ? 'acima' : 'abaixo'}**.\n\nUse o resultado como triagem e confirme cada item do Censo em levantamento local antes de definir a ação.`,
      source: `${DOCUMENT_SOURCES.school} · campos compostos do Censo Escolar`,
      mode: 'cálculo auditável',
      chart: 'infrastructure',
      engine: 'local',
    };
  }

  if (normalized.includes('recurso') || normalized.includes('ausente') || normalized.includes('falta')) {
    const missing = RESOURCE_LABELS.filter(([key]) => context.school.resources[key] === false).map(([, label]) => label);
    return {
      text: missing.length
        ? `Segundo os campos binários do Censo, não estão registrados: **${missing.join(', ')}**.\n\nA escola tem **${context.school.resources.totalDevices} dispositivo(s) para estudantes** e ${context.school.resources.broadband === null ? 'não há informação válida sobre banda larga' : context.school.resources.broadband ? 'possui banda larga' : 'não possui banda larga'}.`
        : `Não há ausência registrada nos recursos binários acompanhados. A escola tem **${context.school.resources.totalDevices} dispositivo(s) para estudantes**.`,
      source: `${DOCUMENT_SOURCES.school} · indicadores IN_* e QT_*`,
      mode: 'leitura direta da base',
      chart: 'infrastructure',
      engine: 'local',
    };
  }

  if (normalized.includes('saeb')) {
    const lines = SAEB_STATE.map((row) => `${row.ETAPA}: LP ${decimal(row.MEDIA_LP_PONDERADA_PRESENTES ?? 0)} e MT ${decimal(row.MEDIA_MT_PONDERADA_PRESENTES ?? 0)}`).join('; ');
    return {
      text: `O SAEB disponível é **contexto estadual do Maranhão**, não um resultado desta escola. Médias ponderadas por presentes: ${lines}.\n\nOs identificadores da origem estão mascarados; por isso, não é metodologicamente válido atribuir essas médias à escola selecionada.`,
      source: DOCUMENT_SOURCES.saeb,
      mode: 'contexto estadual',
      engine: 'local',
    };
  }

  if (normalized.includes('desempenho') || normalized.includes('nota') || normalized.includes('enem') || normalized.includes('compara')) {
    const lines = context.performanceAreas.map((area) => {
      const school = area.schoolAverage === null ? 'sem dado' : decimal(area.schoolAverage);
      return `${area.label}: **${school}** (${participantCount(area.schoolParticipants)}; média municipal ${decimal(area.municipalAverage)})`;
    });
    return {
      text: `Resultados do ENEM 2025 por área:\n\n${lines.map((line) => `• ${line}`).join('\n')}\n\nA comparação municipal usa a agregação entregue; amostras abaixo de 30 devem ser interpretadas com cautela.`,
      source: 'ENEM e Censo Escolar 2025 · escola e município',
      mode: 'comparação descritiva',
      chart: 'performance',
      engine: 'local',
    };
  }

  if (normalized.includes('socioecon') || normalized.includes('inse')) {
    return {
      text: 'A entrega atual **não contém INSE escolar**. O SAEB inclui categorias estaduais de nível socioeconômico, mas seus identificadores estão mascarados e elas não podem ser associadas a esta escola. Posso analisar infraestrutura, ENEM, cobertura municipal e o contexto estadual do SAEB sem inventar essa ligação.',
      source: `${DOCUMENT_SOURCES.dictionary} · regra global do SAEB`,
      mode: 'limite metodológico',
      engine: 'local',
    };
  }

  const lowestPerformance = context.lowestPerformanceArea;
  return {
    text: `A escola **${context.school.name}** possui **${context.school.records} registro(s) do ENEM**. O menor índice composto de infraestrutura é **${context.criticalFactorName} (${decimal(critical)}%)**.${lowestPerformance ? ` A menor média válida do ENEM é **${lowestPerformance.label}: ${decimal(lowestPerformance.schoolAverage ?? 0)} pontos**, calculada com ${participantCount(lowestPerformance.schoolParticipants)}.` : ' Não há média escolar válida do ENEM nas áreas acompanhadas.'}\n\nHá ${context.lowSampleAreas.length} área(s) com amostra abaixo de 30. Esses sinais apoiam a priorização, mas devem ser validados com a equipe escolar.`,
    source: 'ENEM e Censo Escolar 2025 · escola e município',
    mode: 'síntese auditável',
    engine: 'local',
  };
}

export function buildAssistantGrounding(context: SchoolContext) {
  return {
    school: {
      code: context.school.code,
      name: context.school.name,
      municipality: context.school.municipality,
      dependency: context.school.dependency,
      location: context.school.location,
      enemRecords: context.school.records,
      infrastructurePercentages: Object.fromEntries(Object.entries(context.school.infrastructure).map(([key, value]) => [key, Number((value * 10).toFixed(2))])),
      resources: context.school.resources,
      enem: context.performanceAreas,
    },
    municipality: {
      code: context.municipality.code,
      name: context.municipality.name,
      linkedEnemCoveragePercentage: context.municipality.linkedCoveragePercentage,
      unlinkedEnemPercentage: context.municipality.unlinkedPercentage,
    },
    saebState: SAEB_STATE,
    methodology: {
      lowSampleThreshold: 30,
      caveats: [
        'O SAEB é somente contexto estadual; não associar seus resultados à escola.',
        'Não inferir causalidade.',
        'Não há INSE escolar nesta entrega.',
        'Médias do ENEM devem ser lidas com a contagem de participantes da área.',
      ],
      sources: DOCUMENT_SOURCES,
    },
  };
}
