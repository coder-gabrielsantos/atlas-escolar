export const INFRA_KEYS = [
  'computers',
  'computerLab',
  'broadband',
  'scienceLab',
  'makerSpace',
] as const;

export type InfraKey = (typeof INFRA_KEYS)[number];

export const INFRA_LABELS: Record<InfraKey, string> = {
  computers: 'Computadores por aluno',
  computerLab: 'Laboratório de informática',
  broadband: 'Banda larga',
  scienceLab: 'Laboratório de ciências',
  makerSpace: 'Espaço maker',
};

export const INFRA_SHORT_LABELS: Record<InfraKey, string> = {
  computers: 'Computadores',
  computerLab: 'Lab. informática',
  broadband: 'Banda larga',
  scienceLab: 'Lab. ciências',
  makerSpace: 'Espaço maker',
};

export type School = {
  state: string;
  municipality: string;
  name: string;
  socioeconomicLevel: number;
  performance: number;
  enrollments: number;
  year: number;
  dataType: 'SINTÉTICO' | 'REAL';
  source: string;
  infrastructure: Record<InfraKey, number>;
};

export const SCHOOLS: School[] = [
  {
    state: 'MA', municipality: 'Coelho Neto', name: 'IEMA PLENO COELHO NETO', socioeconomicLevel: 5.8,
    performance: 612, enrollments: 480, year: 2024, dataType: 'SINTÉTICO', source: 'ATLAS Escolar',
    infrastructure: { computers: 8.5, computerLab: 9, broadband: 8, scienceLab: 7.5, makerSpace: 6 },
  },
  {
    state: 'MA', municipality: 'Coelho Neto', name: 'U.E. Raimunda Costa Ferreira', socioeconomicLevel: 3.9,
    performance: 452, enrollments: 620, year: 2024, dataType: 'SINTÉTICO', source: 'ATLAS Escolar',
    infrastructure: { computers: 3, computerLab: 4, broadband: 3.5, scienceLab: 1, makerSpace: 0 },
  },
  {
    state: 'MA', municipality: 'Coelho Neto', name: 'U.E. Prof. Antônio Wilson Bacelar', socioeconomicLevel: 4.1,
    performance: 468, enrollments: 540, year: 2024, dataType: 'SINTÉTICO', source: 'ATLAS Escolar',
    infrastructure: { computers: 3.5, computerLab: 4.5, broadband: 4, scienceLab: 1.5, makerSpace: 0 },
  },
  {
    state: 'MA', municipality: 'Coelho Neto', name: 'U.E. Centro Educacional Coelho Neto', socioeconomicLevel: 4.4,
    performance: 481, enrollments: 710, year: 2024, dataType: 'SINTÉTICO', source: 'ATLAS Escolar',
    infrastructure: { computers: 4, computerLab: 5, broadband: 5.5, scienceLab: 2, makerSpace: 1 },
  },
  {
    state: 'MA', municipality: 'Coelho Neto', name: 'U.E. Rural Povoado Bacuri', socioeconomicLevel: 3.2,
    performance: 431, enrollments: 190, year: 2024, dataType: 'SINTÉTICO', source: 'ATLAS Escolar',
    infrastructure: { computers: 1, computerLab: 1.5, broadband: 1, scienceLab: 0, makerSpace: 0 },
  },
  {
    state: 'MA', municipality: 'Timon', name: 'U.E. Centro de Timon', socioeconomicLevel: 4.6,
    performance: 475, enrollments: 560, year: 2024, dataType: 'SINTÉTICO', source: 'ATLAS Escolar',
    infrastructure: { computers: 4.5, computerLab: 5, broadband: 5, scienceLab: 2, makerSpace: 1 },
  },
  {
    state: 'MA', municipality: 'Timon', name: 'U.E. Prof. José Ribamar Timon', socioeconomicLevel: 3.8,
    performance: 449, enrollments: 400, year: 2024, dataType: 'SINTÉTICO', source: 'ATLAS Escolar',
    infrastructure: { computers: 2.5, computerLab: 3, broadband: 3, scienceLab: 1, makerSpace: 0 },
  },
  {
    state: 'MA', municipality: 'Codó', name: 'U.E. Vila Codó', socioeconomicLevel: 4.2,
    performance: 463, enrollments: 480, year: 2024, dataType: 'SINTÉTICO', source: 'ATLAS Escolar',
    infrastructure: { computers: 3.8, computerLab: 4.2, broadband: 4.5, scienceLab: 1.8, makerSpace: 0.5 },
  },
  {
    state: 'MA', municipality: 'Codó', name: 'U.E. Prof. Raimunda Nunes Codó', socioeconomicLevel: 3.6,
    performance: 441, enrollments: 330, year: 2024, dataType: 'SINTÉTICO', source: 'ATLAS Escolar',
    infrastructure: { computers: 2, computerLab: 2.5, broadband: 2.5, scienceLab: 0.5, makerSpace: 0 },
  },
];

export const ACCESS_PROFILES = ['Estudante', 'Professor(a)', 'Gestor(a) Escolar'] as const;
export type AccessProfile = (typeof ACCESS_PROFILES)[number];

export type SchoolContext = ReturnType<typeof buildSchoolContext>;

export function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function buildSchoolContext(schoolName: string, compareMunicipal: boolean) {
  const school = SCHOOLS.find((item) => item.name === schoolName) ?? SCHOOLS[0];
  const municipalitySchools = SCHOOLS.filter(
    (item) => item.state === school.state && item.municipality === school.municipality,
  );
  const municipalInfrastructure = Object.fromEntries(
    INFRA_KEYS.map((key) => [key, average(municipalitySchools.map((item) => item.infrastructure[key]))]),
  ) as Record<InfraKey, number>;
  const infrastructureScore = average(INFRA_KEYS.map((key) => school.infrastructure[key]));
  const municipalScore = average(INFRA_KEYS.map((key) => municipalInfrastructure[key]));
  const connectivityScore = average([school.infrastructure.broadband, school.infrastructure.computerLab]);
  const socioeconomicGap = school.performance - (400 + 35 * school.socioeconomicLevel);
  const criticalFactor = INFRA_KEYS.reduce((lowest, key) =>
    school.infrastructure[key] < school.infrastructure[lowest] ? key : lowest,
  );

  return {
    school,
    municipalitySchools,
    municipalInfrastructure,
    infrastructureScore,
    municipalScore,
    connectivityScore,
    connectivityStatus: connectivityScore >= 6 ? ('Adequada' as const) : ('Crítica' as const),
    socioeconomicGap,
    criticalFactor,
    criticalFactorName: INFRA_LABELS[criticalFactor],
    compareMunicipal,
  };
}

export const FEATURE_IMPORTANCE = [
  { factor: 'Acesso à internet / conectividade', value: 0.24, explanation: 'Viabiliza o uso consistente de recursos digitais em sala.' },
  { factor: 'Nível socioeconômico das famílias', value: 0.21, explanation: 'Ajuda a construir comparações mais justas entre escolas.' },
  { factor: 'Formação continuada de professores', value: 0.18, explanation: 'Apoia práticas pedagógicas e intervenções mais eficazes.' },
  { factor: 'Infraestrutura de laboratórios', value: 0.16, explanation: 'Amplia as oportunidades de aprendizagem prática.' },
  { factor: 'Distorção idade-série', value: 0.13, explanation: 'Sinaliza desafios de trajetória e acompanhamento escolar.' },
  { factor: 'Tamanho médio da turma', value: 0.08, explanation: 'Afeta a capacidade de acompanhamento individualizado.' },
];

export const DOCUMENT_SOURCES = {
  infrastructure: 'Manual metodológico sintético do ATLAS Escolar · 2024 · seção 2.1',
  comparison: 'Nota técnica sintética de comparabilidade · 2024 · seção 4.1',
  prioritization: 'Guia sintético de intervenção do ATLAS Escolar · 2024 · seção 6.1',
};
