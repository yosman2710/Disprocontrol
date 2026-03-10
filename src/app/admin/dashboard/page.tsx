'use client';

import { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, MoreVertical, CheckCircle2, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [stocks, setStocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsData, ordersData, stocksData] = await Promise.all([
                    apiFetch('/estadisticas'),
                    apiFetch('/orden-compra'),
                    apiFetch('/stocks')
                ]);
                setStats(statsData);
                setOrders(ordersData);

                // Handle various response formats for stocks
                if (stocksData && stocksData.success && Array.isArray(stocksData.data)) {
                    setStocks(stocksData.data);
                } else if (Array.isArray(stocksData)) {
                    setStocks(stocksData);
                } else {
                    setStocks([]);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const lowStockCuts = useMemo(() => {
        const aggregated = stocks.reduce((acc: Record<string, number>, current: any) => {
            const name = current.tipo_corte;
            const weight = Number(current.peso_total) || 0;
            acc[name] = (acc[name] || 0) + weight;
            return acc;
        }, {});

        return Object.entries(aggregated)
            .map(([name, weight]) => ({ name, weight }))
            .sort((a, b) => a.weight - b.weight)
            .slice(0, 3);
    }, [stocks]);

    if (loading) {
        return (
            <div className="admin-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={48} className="animate-spin" style={{ color: '#7c3aed' }} />
                <span style={{ marginLeft: 16, fontSize: '1.2rem', color: '#64748b' }}>Cargando panel de control...</span>
            </div>
        );
    }

    const kpis = stats?.kpis || {
        resesProcesadas: 0,
        pesoTotal: 0,
        mermaPromedio: 0,
        cortesRegistrados: 0
    };

    const ordersToday = orders.filter(o => {
        const today = new Date().toISOString().split('T')[0];
        const orderDate = new Date(o.fecha).toISOString().split('T')[0];
        return orderDate === today;
    });

    const pendingOrders = orders.filter(o => o.estado === 'pendiente');

    return (
        <div className="admin-content">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ padding: '8px', background: '#f5f3ff', borderRadius: '8px', color: '#7c3aed' }}>
                            <LayoutDashboard size={24} />
                        </div>
                        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '32px' }}>Dashboard</h1>
                    </div>
                    <p>Resumen general de operaciones</p>
                </div>
            </header>

            <div className="admin-stats-grid">
                <div className="admin-stat-card" style={{ borderLeft: '4px solid #9d174d' }}>
                    <div>
                        <div className="admin-stat-label">Ordenes Hoy</div>
                        <div className="admin-stat-value">{ordersToday.length}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{pendingOrders.length} pendientes</div>
                        <div className="admin-stat-trend trend-up" style={{ marginTop: '8px' }}>↗ 15%</div>
                    </div>
                    <div style={{ padding: '10px', background: '#fff1f2', borderRadius: '10px', height: 'fit-content' }}>
                        🚚
                    </div>
                </div>

                <div className="admin-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div>
                        <div className="admin-stat-label">Kg Procesados</div>
                        <div className="admin-stat-value">{kpis.pesoTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Total acumulado</div>
                        <div className="admin-stat-trend trend-up" style={{ marginTop: '8px' }}>↗ 8%</div>
                    </div>
                    <div style={{ padding: '10px', background: '#fff7ed', borderRadius: '10px', height: 'fit-content' }}>
                        ⚖️
                    </div>
                </div>

                <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div>
                        <div className="admin-stat-label">Reses Procesadas</div>
                        <div className="admin-stat-value">{kpis.resesProcesadas}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Total en sistema</div>
                        <div className="admin-stat-trend trend-up" style={{ marginTop: '8px' }}>↗ 5%</div>
                    </div>
                    <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '10px', height: 'fit-content' }}>
                        🐄
                    </div>
                </div>

                <div className="admin-stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
                    <div>
                        <div className="admin-stat-label">kg Procesados en el inventario</div>
                        <div className="admin-stat-value">{kpis.pesoTotal}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Total en sistema</div>
                        <div className="admin-stat-trend trend-down" style={{ marginTop: '8px' }}>↘ 0.5%</div>
                    </div>
                    <div style={{ padding: '10px', background: '#eef2ff', borderRadius: '10px', height: 'fit-content' }}>
                        📉
                    </div>
                </div>
            </div>

            <div className="admin-main-grid" style={{ marginBottom: '32px' }}>
                <div className="admin-table-card">
                    <div className="card-header">
                        <h3>Ordenes de Compra Recientes</h3>
                        <a href="/admin/ordenes" className="btn-text">Ver todas</a>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {orders.slice(0, 3).map((order) => (
                            <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className={`badge-dot ${order.estado === 'completado' ? 'bg-success' : 'bg-warning'}`}></span>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>ORD-{order.id}</div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>{order.placa} - {order.chofer}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold' }}>{order.cantidad_res} reses</div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>{new Date(order.fecha).toLocaleDateString()}</div>
                                </div>
                            </div>
                        ))}
                        {orders.length === 0 && <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No hay ordenes registradas</p>}
                    </div>
                </div>

                <div className="admin-table-card">
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                            <h3>Inventario con menos existencia</h3>
                        </div>
                        <a href="/admin/inventario" className="btn-text">Ver inventario</a>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {lowStockCuts.length > 0 ? (
                            lowStockCuts.map((cut, idx) => (
                                <div key={idx} style={{ padding: '12px 16px', background: idx === 0 ? '#fffbeb' : '#f8fafc', borderRadius: '12px', border: idx === 0 ? '1px solid #fef3c7' : 'none' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '600' }}>{cut.name}</span>
                                        <span style={{ fontWeight: 'bold', color: idx === 0 ? '#b45309' : '#1e293b' }}>
                                            {cut.weight.toLocaleString()} kg
                                        </span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '10px', marginTop: '8px', overflow: 'hidden' }}>
                                        <div
                                            style={{
                                                width: `${Math.min((cut.weight / (kpis.pesoTotal / (kpis.cortesRegistrados || 1) * 2)) * 100, 100)}%`,
                                                height: '100%',
                                                background: idx === 0 ? '#f59e0b' : '#6366f1',
                                                borderRadius: '10px'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No hay datos de inventario disponibles</p>
                        )}
                        <div style={{ padding: '16px', background: '#f1f5f9', borderRadius: '12px', marginTop: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '13px', color: '#64748b' }}>Existencia Total</div>
                                <div style={{ fontWeight: 'bold' }}>{kpis.pesoTotal.toLocaleString()} kg</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="admin-main-grid">
                <div className="admin-table-card">
                    <div className="card-header">
                        <h3>Estado de Lotes</h3>
                        <button className="btn-text"><MoreVertical size={18} /></button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="status-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', background: '#ecfdf5', color: '#10b981', borderRadius: '8px' }}>
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600' }}>Ordenes Completadas</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Todas las estaciones</div>
                                </div>
                            </div>
                            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{orders.filter(o => o.estado === 'completado').length}</span>
                        </div>
                        <div className="status-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', background: '#fff7ed', color: '#f59e0b', borderRadius: '8px' }}>
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600' }}>Ordenes en Proceso</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Pendientes de pesaje</div>
                                </div>
                            </div>
                            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{orders.filter(o => o.estado !== 'completado').length}</span>
                        </div>
                    </div>
                </div>

                <div className="admin-table-card">
                    <div className="card-header">
                        <h3>Actividad Reciente</h3>
                        <a href="/pages/order" className="btn-text">Ver todas</a>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {orders.slice(0, 4).map((order, i) => (
                            <div key={i} className={`activity-item ${order.estado === 'completado' ? 'success' : 'info'}`}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                        {order.estado === 'completado' ? `Orden ORD-${order.id} finalizada` : `Nueva orden ORD-${order.id} registrada`}
                                    </div>
                                    <div className="activity-time">{new Date(order.fecha).toLocaleDateString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
