'use client'

import { useState, useEffect } from 'react';
import { Beef, TrendingDown, Scale, Scissors, TrendingUp } from 'lucide-react';
import Head from 'next/head';
import '@/styles/Estadisticas.css';

const monthlyData = [
    { mes: 'Sep', reses: 85 },
    { mes: 'Oct', reses: 102 },
    { mes: 'Nov', reses: 93 },
    { mes: 'Dic', reses: 78 },
    { mes: 'Ene', reses: 110 },
    { mes: 'Feb', reses: 94 },
];

const mermaData = [
    { mes: 'Sep', merma: 2.1 },
    { mes: 'Oct', merma: 1.9 },
    { mes: 'Nov', merma: 2.3 },
    { mes: 'Dic', merma: 2.0 },
    { mes: 'Ene', merma: 1.8 },
    { mes: 'Feb', merma: 2.1 },
];

const cortesData = [
    { nombre: 'Lomito', porcentaje: 8, color: '#4b1515' },
    { nombre: 'Solomo', porcentaje: 12, color: '#f59e0b' },
    { nombre: 'Punta Trasera', porcentaje: 10, color: '#3b82f6' },
    { nombre: 'Muchacho', porcentaje: 15, color: '#10b981' },
    { nombre: 'Costilla', porcentaje: 18, color: '#ef4444' },
    { nombre: 'Otros', porcentaje: 37, color: '#a8a29e' },
];

const proveedorData = [
    { nombre: 'La Esperanza', kg: 9720 },
    { nombre: 'El Progreso', kg: 7500 },
    { nombre: 'Los Andes', kg: 5460 },
    { nombre: 'San Miguel', kg: 2800 },
];

interface StatCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    trend?: { value: string; isPositive: boolean };
    accentColor: string;
    bgTint: string;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, accentColor, bgTint }: StatCardProps) {
    return (
        <div className="statCard" style={{ '--accent-color': accentColor } as any}>
            <div className="statCardContent">
                <h3>{title}</h3>
                <div className="statCardValue">{value}</div>
                {trend ? (
                    <div className="statCardTrend" style={{ color: trend.isPositive ? '#16a34a' : '#dc2626' }}>
                        <TrendingUp size={14} style={{ transform: trend.isPositive ? 'none' : 'rotate(180deg)' }} />
                        {trend.value}
                    </div>
                ) : subtitle && (
                    <p className="statCardSubtitle">{subtitle}</p>
                )}
            </div>
            <div className="statCardIcon" style={{ '--bg-tint': bgTint } as any}>
                <Icon size={24} />
            </div>
        </div>
    );
}

const CHART_HEIGHT = 200;
const CHART_WIDTH = 400;
const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };

function VerticalBarChart({ data, dataKey }: { data: any[], dataKey: string }) {
    const maxValue = 120;
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const barSpacing = innerWidth / data.length;
    const barWidth = barSpacing * 0.7;

    return (
        <div className="chartContainer">
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} style={{ width: '100%', height: 'auto' }}>
                {/* Horizontal Grid Lines */}
                {[0, 30, 60, 90, 120].map(v => {
                    const y = PADDING.top + innerHeight - (v / maxValue) * innerHeight;
                    return (
                        <g key={v}>
                            <line x1={PADDING.left} y1={y} x2={CHART_WIDTH - PADDING.right} y2={y} className="gridLine" />
                            <text x={PADDING.left - 10} y={y + 4} textAnchor="end" className="axisText">{v}</text>
                        </g>
                    );
                })}

                {/* Bars */}
                {data.map((d, i) => {
                    const barHeight = (d[dataKey] / maxValue) * innerHeight;
                    const x = PADDING.left + i * barSpacing + (barSpacing - barWidth) / 2;
                    const y = PADDING.top + innerHeight - barHeight;
                    return (
                        <g key={i}>
                            <rect
                                x={x} y={y} width={barWidth} height={barHeight}
                                fill="#7c2d12" rx="2" className="chartBar"
                            />
                            <text x={x + barWidth / 2} y={CHART_HEIGHT - 10} textAnchor="middle" className="axisText">{d.mes}</text>
                        </g>
                    );
                })}
                <line x1={PADDING.left} y1={CHART_HEIGHT - PADDING.bottom} x2={CHART_WIDTH - PADDING.right} y2={CHART_HEIGHT - PADDING.bottom} className="axisLine" />
            </svg>
        </div>
    );
}

function LineChart({ data, dataKey }: { data: any[], dataKey: string }) {
    const minVal = 1;
    const maxVal = 3;
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right;
    const stepX = innerWidth / (data.length - 1);

    const points = data.map((d, i) => {
        const x = PADDING.left + i * stepX;
        const y = PADDING.top + innerHeight - ((d[dataKey] - minVal) / (maxVal - minVal)) * innerHeight;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="chartContainer">
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} style={{ width: '100%', height: 'auto' }}>
                {[1, 1.5, 2, 2.5, 3].map(v => {
                    const y = PADDING.top + innerHeight - ((v - minVal) / (maxVal - minVal)) * innerHeight;
                    return (
                        <g key={v}>
                            <line x1={PADDING.left} y1={y} x2={CHART_WIDTH - PADDING.right} y2={y} className="gridLine" />
                            <text x={PADDING.left - 10} y={y + 4} textAnchor="end" className="axisText">{v}</text>
                        </g>
                    );
                })}

                <polyline points={points} fill="none" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
                {data.map((d, i) => {
                    const x = PADDING.left + i * stepX;
                    const y = PADDING.top + innerHeight - ((d[dataKey] - minVal) / (maxVal - minVal)) * innerHeight;
                    return (
                        <g key={i}>
                            <circle cx={x} cy={y} r="4" fill="#d97706" stroke="white" strokeWidth="2" />
                            <text x={x} y={CHART_HEIGHT - 10} textAnchor="middle" className="axisText">{d.mes}</text>
                        </g>
                    );
                })}
                <line x1={PADDING.left} y1={CHART_HEIGHT - PADDING.bottom} x2={CHART_WIDTH - PADDING.right} y2={CHART_HEIGHT - PADDING.bottom} className="axisLine" />
            </svg>
        </div>
    );
}

function PieChart({ data }: { data: any[] }) {
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className="pieLayout">
            <svg viewBox="-1 -1 2 2" style={{ width: '160px', height: '160px', transform: 'rotate(-90deg)' }}>
                {data.map((slice, i) => {
                    const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                    cumulativePercent += slice.porcentaje / 100;
                    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                    const largeArcFlag = slice.porcentaje / 100 > 0.5 ? 1 : 0;
                    const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
                    return <path key={i} d={pathData} fill={slice.color} />;
                })}
            </svg>
            <div className="pieLegend">
                {data.map((slice, i) => (
                    <div key={i} className="pieLegendItem">
                        <div className="pieLegendLabel">
                            <span className="pieLegendDot" style={{ backgroundColor: slice.color }} />
                            {slice.nombre} {slice.porcentaje}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HorizontalBarChart({ data, dataKey }: { data: any[], dataKey: string }) {
    const maxValue = 10000;
    const chartHeight = 160;
    const barHeight = (chartHeight / data.length) * 0.6;
    const barSpacing = chartHeight / data.length;
    const LEFT_MARGIN = 100; // Increased padding for names

    return (
        <div className="chartContainer">
            <svg viewBox={`0 0 ${CHART_WIDTH} ${chartHeight + 40}`} style={{ width: '100%', height: 'auto' }}>
                {[0, 2500, 5000, 7500, 10000].map(v => {
                    const x = LEFT_MARGIN + (v / maxValue) * (CHART_WIDTH - LEFT_MARGIN - PADDING.right);
                    return (
                        <g key={v}>
                            <line x1={x} y1={10} x2={x} y2={chartHeight + 10} className="gridLine" />
                            <text x={x} y={chartHeight + 25} textAnchor="middle" className="axisText">{v}</text>
                        </g>
                    );
                })}

                {data.map((d, i) => {
                    const barWidth = (d[dataKey] / maxValue) * (CHART_WIDTH - LEFT_MARGIN - PADDING.right);
                    const y = 10 + i * barSpacing + (barSpacing - barHeight) / 2;
                    return (
                        <g key={i}>
                            <text x={LEFT_MARGIN - 10} y={y + barHeight / 2 + 4} textAnchor="end" className="axisText">{d.nombre}</text>
                            <rect x={LEFT_MARGIN} y={y} width={barWidth} height={barHeight} fill="#2563eb" rx="2" />
                        </g>
                    );
                })}
                <line x1={LEFT_MARGIN} y1={10} x2={LEFT_MARGIN} y2={chartHeight + 10} className="axisLine" />
            </svg>
        </div>
    );
}

export default function Estadisticas() {
    return (
        <div className="container">
            <div className="header">
                <h1 className="title">Estadísticas</h1>
                <p className="subtitle">Resumen general de operaciones</p>
            </div>

            <div className="statsGrid">
                <StatCard
                    title="Reses Procesadas"
                    value="562"
                    icon={Beef}
                    trend={{ value: '8.2%', isPositive: true }}
                    accentColor="#7c2d12"
                    bgTint="#fff7ed"
                />
                <StatCard
                    title="Peso Total"
                    value="151.7t"
                    subtitle="Último semestre"
                    icon={Scale}
                    accentColor="#4b1515"
                    bgTint="#fef2f2"
                />
                <StatCard
                    title="Merma Promedio"
                    value="2.03%"
                    icon={TrendingDown}
                    trend={{ value: '0.3%', isPositive: true }}
                    accentColor="#ca8a04"
                    bgTint="#fefce8"
                />
                <StatCard
                    title="Cortes Registrados"
                    value="3,240"
                    icon={Scissors}
                    accentColor="#d97706"
                    bgTint="#fffbeb"
                />
            </div>

            <div className="chartsRow">
                <div className="chartCard">
                    <h3 className="chartTitle">Reses Recibidas por Mes</h3>
                    <VerticalBarChart data={monthlyData} dataKey="reses" />
                </div>
                <div className="chartCard">
                    <h3 className="chartTitle">Tendencia de Merma (%)</h3>
                    <LineChart data={mermaData} dataKey="merma" />
                </div>
            </div>

            <div className="chartsRow">
                <div className="chartCard">
                    <h3 className="chartTitle">Distribución de Cortes</h3>
                    <PieChart data={cortesData} />
                </div>
                <div className="chartCard">
                    <h3 className="chartTitle">Kg por Proveedor</h3>
                    <HorizontalBarChart data={proveedorData} dataKey="kg" />
                </div>
            </div>
        </div>
    );
}
