import { SchoolContext } from '@/lib/atlas-data';

function ascii(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '');
}

function pdfEscape(value: string) {
  return ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function slugify(value: string) {
  return ascii(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function buildReport(context: SchoolContext) {
  const gap = context.socioeconomicGap;
  const lines = [
    `Escola: ${context.school.name} (${context.school.municipality}/${context.school.state})`,
    `Ano de referencia: ${context.school.year}`,
    '',
    'INDICADORES-CHAVE',
    `Indice de infraestrutura: ${context.infrastructureScore.toFixed(1)} / 10`,
    `Conectividade: ${context.connectivityStatus} (${context.connectivityScore.toFixed(1)} / 10)`,
    `Desempenho: ${context.school.performance} pontos`,
    `Gap versus contexto socioeconomico: ${gap >= 0 ? '+' : ''}${gap.toFixed(0)} pontos`,
    `Matriculas: ${context.school.enrollments}`,
    '',
    'ACOES PRIORIZADAS',
    `1. Infraestrutura: priorizar ${context.criticalFactorName}`,
    '   - Validar o diagnostico com levantamento tecnico local.',
    '   - Definir responsavel, orcamento, prazo e indicador de sucesso.',
    '2. Desempenho: instituir ciclo bimestral de acompanhamento.',
    '   - Identificar habilidades com maior oportunidade de avanco.',
    '   - Organizar monitorias e intervencoes de curta duracao.',
    '',
    'Relatorio gerado automaticamente pelo Atlas.',
    'Dados sinteticos utilizados exclusivamente para demonstracao.',
  ];

  let y = 760;
  const commands = [`BT /F1 17 Tf 50 ${y} Td (${pdfEscape(`Relatorio de diagnostico - ${context.school.name}`)}) Tj ET`];
  y -= 38;
  for (const line of lines) {
    const font = line === 'INDICADORES-CHAVE' || line === 'ACOES PRIORIZADAS' ? '/F1 11 Tf' : '/F2 10 Tf';
    commands.push(`BT ${font} 50 ${y} Td (${pdfEscape(line)}) Tj ET`);
    y -= line ? 18 : 10;
  }
  const stream = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
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
    blob: new Blob([pdf], { type: 'application/pdf' }),
    filename: `relatorio_atlas_${slugify(context.school.name)}.pdf`,
  };
}
