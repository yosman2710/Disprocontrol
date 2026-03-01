'use client'

import { useState, useEffect } from 'react';
import { Beef, TrendingDown, Scale, Scissors, TrendingUp, Loader2 } from 'lucide-react';
import Head from 'next/head';
import { apiFetch } from '@/lib/api';
import '@/styles/Estadisticas.css';

// Hardcoded mock data removed, will be fetched from API

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
                                x={x} y={y} width={barWidth} height={Math.max(barHeight, 0)}
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

    if (data.length === 0) return <div className="pieLayout"><p style={{ color: '#64748b' }}>No hay datos suficientes</p></div>;

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
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = await apiFetch('/estadisticas');
                setData(result);
            } catch (error) {
                console.error("Error fetching estadisticas:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={48} className="animate-spin" style={{ color: '#7c2d12' }} />
                <span style={{ marginLeft: 16, fontSize: '1.2rem', color: '#64748b' }}>Cargando estadísticas reales...</span>
            </div>
        );
    }

    if (!data) {
        return <div className="container" style={{ color: '#dc2626', textAlign: 'center', marginTop: '2rem' }}>Error al cargar las estadísticas. Revisa que el servidor backend esté corriendo.</div>;
    }

    const { kpis, charts } = data;

    return (
        <div className="container">
            <div className="header">
                <h1 className="title">Estadísticas</h1>
                <p className="subtitle">Resumen general de operaciones</p>
            </div>

            <div className="statsGrid">
                <StatCard
                    title="Reses Procesadas"
                    value={kpis.resesProcesadas.toString()}
                    icon={Beef}
                    accentColor="#7c2d12"
                    bgTint="#fff7ed"
                />
                <StatCard
                    title="Peso Total (Caliente)"
                    value={kpis.pesoTotal > 1000 ? `${(kpis.pesoTotal).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg` : `${kpis.pesoTotal.toFixed(1)} kg`}
                    icon={Scale}
                    accentColor="#4b1515"
                    bgTint="#fef2f2"
                />
                <StatCard
                    title="Merma Promedio"
                    value={`${kpis.mermaPromedio.toFixed(2)}%`}
                    icon={TrendingDown}
                    accentColor="#ca8a04"
                    bgTint="#fefce8"
                />
                <StatCard
                    title="Cortes Registrados"
                    value={kpis.cortesRegistrados.toString()}
                    icon={Scissors}
                    accentColor="#d97706"
                    bgTint="#fffbeb"
                />
            </div>

            <div className="chartsRow">
                <div className="chartCard">
                    <h3 className="chartTitle">Reses Recibidas por Mes</h3>
                    {charts.monthlyData.length > 0 ? <VerticalBarChart data={charts.monthlyData} dataKey="reses" /> : <p className="text-gray-400">Sin datos registrados</p>}
                </div>
                <div className="chartCard">
                    <h3 className="chartTitle">Tendencia de Merma (%)</h3>
                    {charts.mermaData.length > 0 ? <LineChart data={charts.mermaData} dataKey="merma" /> : <p className="text-gray-400">Sin datos registrados</p>}
                </div>
            </div>

            <div className="chartsRow">
                <div className="chartCard">
                    <h3 className="chartTitle">Distribución de Cortes</h3>
                    {charts.cortesData.length > 0 ? <PieChart data={charts.cortesData} /> : <p className="text-gray-400">Sin datos registrados</p>}
                </div>
                <div className="chartCard">
                    <h3 className="chartTitle">Kg por Proveedor</h3>
                    {charts.proveedorData.length > 0 ? <HorizontalBarChart data={charts.proveedorData} dataKey="kg" /> : <p className="text-gray-400">Sin datos registrados</p>}
                </div>
            </div>
        </div>
    );
}
