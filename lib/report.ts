import type { SchoolContext } from '@/lib/atlas-data';

type Color = [number, number, number];

const COLORS = {
  navy: [0.09, 0.17, 0.21] as Color,
  teal: [0.04, 0.43, 0.43] as Color,
  lime: [0.77, 0.86, 0.29] as Color,
  ink: [0.11, 0.16, 0.18] as Color,
  muted: [0.38, 0.43, 0.44] as Color,
  canvas: [0.97, 0.97, 0.94] as Color,
  softTeal: [0.9, 0.96, 0.94] as Color,
  white: [1, 1, 1] as Color,
  line: [0.86, 0.88, 0.84] as Color,
};

function safeText(value: string) {
  return value
    .replace(/[–—]/g, '-')
    .replace(/•/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function pdfEscape(value: string) {
  return safeText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function color([red, green, blue]: Color) {
  return `${red} ${green} ${blue}`;
}

function wrapText(value: string, maxCharacters: number) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxCharacters) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function latin1Bytes(value: string) {
  return Uint8Array.from(value, (character) => character.charCodeAt(0) & 0xff);
}

export function buildReport(context: SchoolContext) {
  const lowestArea = context.lowestPerformanceArea;
  const criticalSchool =
    context.school.infrastructure[context.criticalFactor] * 10;
  const criticalMunicipal =
    context.municipalInfrastructure[context.criticalFactor] * 10;
  const commands: string[] = [];

  const rect = (
    x: number,
    y: number,
    width: number,
    height: number,
    fill: Color,
  ) => {
    commands.push(`${color(fill)} rg ${x} ${y} ${width} ${height} re f`);
  };
  const line = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke: Color,
    width = 1,
  ) => {
    commands.push(
      `${color(stroke)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`,
    );
  };
  const text = (
    value: string,
    x: number,
    y: number,
    size: number,
    fill: Color = COLORS.ink,
    bold = false,
  ) => {
    commands.push(
      `${color(fill)} rg BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfEscape(value)}) Tj ET`,
    );
  };
  const paragraph = (
    value: string,
    x: number,
    y: number,
    maxCharacters: number,
    size: number,
    fill: Color = COLORS.muted,
    leading = 15,
  ) => {
    wrapText(value, maxCharacters).forEach((item, index) =>
      text(item, x, y - index * leading, size, fill),
    );
  };

  rect(0, 0, 595, 842, COLORS.canvas);
  rect(0, 690, 595, 152, COLORS.navy);
  rect(42, 805, 48, 4, COLORS.lime);
  text('ATLAS / DIAGNÓSTICO ESCOLAR', 42, 784, 9, COLORS.lime, true);
  text('Pontos de melhoria', 42, 748, 25, COLORS.white, true);
  wrapText(context.school.name, 55)
    .slice(0, 2)
    .forEach((item, index) => text(item, 42, 722 - index * 16, 11, COLORS.white));
  text(
    `${context.school.municipality}/${context.school.state}  |  Código ${context.school.code}  |  ${context.school.dependency} - ${context.school.location}`,
    42,
    702,
    8.5,
    [0.72, 0.78, 0.79],
  );

  text('LEITURA RÁPIDA', 42, 654, 9, COLORS.teal, true);
  const cards = [
    {
      label: 'Infraestrutura',
      value: `${(context.infrastructureScore * 10).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
    },
    {
      label: 'Conectividade',
      value: `${(context.connectivityScore * 10).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
    },
    { label: 'Registros ENEM', value: String(context.school.records) },
  ];
  cards.forEach((card, index) => {
    const x = 42 + index * 174;
    rect(x, 558, 158, 76, COLORS.white);
    rect(x, 558, 4, 76, index === 0 ? COLORS.teal : COLORS.lime);
    text(card.label.toUpperCase(), x + 16, 610, 7.5, COLORS.muted, true);
    text(card.value, x + 16, 577, 22, COLORS.ink, true);
  });

  text('O QUE PRECISA MELHORAR', 42, 519, 9, COLORS.teal, true);
  text('Prioridades identificadas nos dados disponíveis', 42, 496, 17, COLORS.ink, true);

  const improvementCard = (
    y: number,
    number: string,
    title: string,
    description: string,
    reference: string,
  ) => {
    rect(42, y, 510, 102, COLORS.white);
    rect(42, y, 5, 102, COLORS.teal);
    rect(61, y + 58, 30, 30, COLORS.softTeal);
    text(number, 69, y + 68, 10, COLORS.teal, true);
    text(title, 108, y + 72, 15, COLORS.ink, true);
    paragraph(description, 108, y + 50, 68, 9.5, COLORS.muted, 14);
    line(108, y + 25, 531, y + 25, COLORS.line, 0.7);
    text(reference, 108, y + 11, 8.5, COLORS.teal, true);
  };

  improvementCard(
    364,
    '01',
    context.criticalFactorName,
    `Menor índice composto de infraestrutura da escola: ${criticalSchool.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%.`,
    `Referência municipal: ${criticalMunicipal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%.`,
  );
  improvementCard(
    244,
    '02',
    lowestArea?.label ?? 'Cobertura dos dados do ENEM',
    lowestArea
      ? `Menor média válida da escola no ENEM: ${lowestArea.schoolAverage?.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} pontos.`
      : 'Não há média válida por área para esta escola na entrega atual.',
    lowestArea
      ? `Município: ${lowestArea.municipalAverage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} pontos  |  n=${lowestArea.schoolParticipants}`
      : 'A disponibilidade e a cobertura precisam ser verificadas.',
  );

  rect(42, 116, 510, 94, COLORS.softTeal);
  text('COMO LER ESTE DIAGNÓSTICO', 60, 184, 8.5, COLORS.teal, true);
  paragraph(
    `Os resultados são sinais descritivos, não evidências de causalidade. ${context.lowSampleAreas.length} área(s) têm amostra abaixo de 30. O SAEB disponível representa somente o contexto estadual do Maranhão.`,
    60,
    162,
    88,
    8.5,
    COLORS.ink,
    13,
  );

  line(42, 82, 552, 82, COLORS.line, 0.7);
  text('Censo Escolar 2025  |  ENEM 2025  |  SAEB 2023', 42, 62, 8, COLORS.muted);
  text(`Gerado pelo Atlas  |  Referência ${context.school.year}`, 389, 62, 8, COLORS.muted);

  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return {
    blob: new Blob([latin1Bytes(pdf)], { type: 'application/pdf' }),
    filename: `diagnostico_melhorias_atlas_${slugify(context.school.name)}.pdf`,
  };
}
