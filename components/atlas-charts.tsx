'use client';

/* oxlint-disable typescript/no-deprecated -- Recharts uses Cell for per-datum chart colors. */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  FEATURE_IMPORTANCE,
  INFRA_KEYS,
  INFRA_SHORT_LABELS,
  SchoolContext,
} from '@/lib/atlas-data';

const infrastructureConfig = {
  school: { label: 'Escola', color: '#087c70' },
  municipality: { label: 'Média municipal', color: '#d7d3c5' },
} satisfies ChartConfig;

export function InfrastructureChart({ context }: { context: SchoolContext }) {
  const data = INFRA_KEYS.map((key) => ({
    label: INFRA_SHORT_LABELS[key],
    school: context.school.infrastructure[key],
    municipality: Number(context.municipalInfrastructure[key].toFixed(2)),
  }));

  return (
    <ChartContainer config={infrastructureConfig} className="h-[310px] w-full" initialDimension={{ width: 660, height: 310 }}>
      <BarChart data={data} margin={{ top: 22, right: 6, left: -20, bottom: 16 }} barGap={3}>
        <CartesianGrid vertical={false} stroke="#ecece7" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11, fill: '#66737a' }} dy={10} />
        <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#7d878c' }} />
        <ChartTooltip cursor={{ fill: '#f4f5f1' }} content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="school" name="school" fill="var(--color-school)" radius={[6, 6, 2, 2]} maxBarSize={28} />
        {context.compareMunicipal && (
          <Bar dataKey="municipality" name="municipality" fill="var(--color-municipality)" radius={[6, 6, 2, 2]} maxBarSize={28} />
        )}
      </BarChart>
    </ChartContainer>
  );
}

const scatterConfig = {
  performance: { label: 'Desempenho', color: '#087c70' },
  trend: { label: 'Tendência', color: '#8a9b37' },
} satisfies ChartConfig;

export function ContextScatterChart({ context }: { context: SchoolContext }) {
  const points = [...context.municipalitySchools].sort((a, b) => a.socioeconomicLevel - b.socioeconomicLevel);
  const n = points.length;
  const sumX = points.reduce((sum, item) => sum + item.socioeconomicLevel, 0);
  const sumY = points.reduce((sum, item) => sum + item.performance, 0);
  const sumXY = points.reduce((sum, item) => sum + item.socioeconomicLevel * item.performance, 0);
  const sumXX = points.reduce((sum, item) => sum + item.socioeconomicLevel ** 2, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX ** 2 || 1);
  const intercept = (sumY - slope * sumX) / n;
  const data = points.map((item) => ({
    school: item.name,
    nse: item.socioeconomicLevel,
    performance: item.performance,
    trend: Number((slope * item.socioeconomicLevel + intercept).toFixed(1)),
    selected: item.name === context.school.name,
  }));

  return (
    <ChartContainer config={scatterConfig} className="h-[310px] w-full" initialDimension={{ width: 660, height: 310 }}>
      <ComposedChart data={data} margin={{ top: 20, right: 12, left: -12, bottom: 16 }}>
        <CartesianGrid stroke="#ecece7" strokeDasharray="3 3" />
        <XAxis type="number" dataKey="nse" domain={['dataMin - 0.25', 'dataMax + 0.25']} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#66737a' }} name="Nível socioeconômico" />
        <YAxis type="number" domain={['dataMin - 25', 'dataMax + 25']} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#66737a' }} name="Desempenho" />
        <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent labelKey="school" indicator="dot" />} />
        {context.compareMunicipal && <Line type="linear" dataKey="trend" stroke="#8a9b37" strokeWidth={2} strokeDasharray="6 5" dot={false} activeDot={false} />}
        <Scatter dataKey="performance" name="performance">
          {data.map((item) => (
            <Cell key={item.school} fill={item.selected ? '#087c70' : '#cfd4ce'} stroke="#fff" strokeWidth={2} />
          ))}
        </Scatter>
      </ComposedChart>
    </ChartContainer>
  );
}

const featureConfig = {
  value: { label: 'Importância', color: '#087c70' },
} satisfies ChartConfig;

export function FeatureImportanceChart() {
  const data = [...FEATURE_IMPORTANCE].sort((a, b) => a.value - b.value);
  return (
    <ChartContainer config={featureConfig} className="h-[300px] w-full" initialDimension={{ width: 760, height: 300 }}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 36, left: 42, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#ecece7" />
        <XAxis type="number" domain={[0, 0.27]} tickFormatter={(value) => `${Math.round(value * 100)}%`} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#66737a' }} />
        <YAxis type="category" dataKey="factor" width={180} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#66737a' }} />
        <ChartTooltip cursor={{ fill: '#f4f5f1' }} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="value" name="value" fill="var(--color-value)" radius={[0, 7, 7, 0]} maxBarSize={18} />
      </BarChart>
    </ChartContainer>
  );
}

const peerConfig = {
  points: { label: 'Pontos', color: '#087c70' },
} satisfies ChartConfig;

export function PeerComparisonChart({ school, peers }: { school: number; peers: number }) {
  const data = [
    { group: 'Escola atual', points: school, fill: '#087c70' },
    { group: 'Escolas semelhantes', points: Number(peers.toFixed(1)), fill: '#d7d3c5' },
  ];
  return (
    <ChartContainer config={peerConfig} className="h-[210px] w-full" initialDimension={{ width: 520, height: 210 }}>
      <BarChart data={data} margin={{ top: 18, right: 8, left: -12, bottom: 12 }}>
        <CartesianGrid vertical={false} stroke="#ecece7" />
        <XAxis dataKey="group" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#66737a' }} />
        <YAxis domain={['dataMin - 40', 'dataMax + 25']} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#66737a' }} />
        <ChartTooltip cursor={{ fill: '#f4f5f1' }} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="points" name="points" radius={[7, 7, 2, 2]} maxBarSize={70}>
          {data.map((item) => <Cell key={item.group} fill={item.fill} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
