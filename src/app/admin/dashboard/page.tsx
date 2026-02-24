import { LayoutDashboard, MoreVertical, CheckCircle2, Clock } from 'lucide-react';

export default function DashboardPage() {
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
                        <div className="admin-stat-label">Tickets Hoy</div>
                        <div className="admin-stat-value">12</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>3 pendientes</div>
                        <div className="admin-stat-trend trend-up" style={{ marginTop: '8px' }}>↗ 15%</div>
                    </div>
                    <div style={{ padding: '10px', background: '#fff1f2', borderRadius: '10px', height: 'fit-content' }}>
                        🚚
                    </div>
                </div>

                <div className="admin-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div>
                        <div className="admin-stat-label">Kg Procesados</div>
                        <div className="admin-stat-value">4,580</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Esta semana</div>
                        <div className="admin-stat-trend trend-up" style={{ marginTop: '8px' }}>↗ 8%</div>
                    </div>
                    <div style={{ padding: '10px', background: '#fff7ed', borderRadius: '10px', height: 'fit-content' }}>
                        ⚖️
                    </div>
                </div>

                <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                    <div>
                        <div className="admin-stat-label">Inventario Total</div>
                        <div className="admin-stat-value">12,450</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Kg en almacén</div>
                        <div className="admin-stat-trend trend-up" style={{ marginTop: '8px' }}>↗ 5%</div>
                    </div>
                    <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '10px', height: 'fit-content' }}>
                        📦
                    </div>
                </div>

                <div className="admin-stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
                    <div>
                        <div className="admin-stat-label">Ventas del Mes</div>
                        <div className="admin-stat-value">$45,890</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>+ 12% vs mes anterior</div>
                        <div className="admin-stat-trend trend-up" style={{ marginTop: '8px' }}>↗ 12%</div>
                    </div>
                    <div style={{ padding: '10px', background: '#eef2ff', borderRadius: '10px', height: 'fit-content' }}>
                        $
                    </div>
                </div>
            </div>

            <div className="admin-main-grid" style={{ marginBottom: '32px' }}>
                <div className="admin-table-card">
                    <div className="card-header">
                        <h3>Tickets Recientes</h3>
                        <button className="btn-text">Ver todos</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { id: 'TK-001', prov: 'Hacienda La Aurora', weight: '2,450 kg', date: '2024-01-28', status: 'success' },
                            { id: 'TK-002', prov: 'Finca El Rodeo', weight: '1,890 kg', date: '2024-01-28', status: 'warning' },
                            { id: 'TK-003', prov: 'Agropecuaria Zulia', weight: '3,200 kg', date: '2024-01-27', status: 'info' }
                        ].map((tk) => (
                            <div key={tk.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className={`badge-dot bg-${tk.status}`}></span>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{tk.id}</div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>{tk.prov}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold' }}>{tk.weight}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>{tk.date}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="admin-table-card">
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#f59e0b' }}>⚠️</span>
                            <h3>Inventario Bajo</h3>
                        </div>
                        <button className="btn-text">Ver inventario</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { item: 'Lomito', stock: '45 kg', min: '100 kg', percent: '10%' },
                            { item: 'Solomo', stock: '28 kg', min: '80 kg', percent: '20%' },
                            { item: 'Punta Trasera', stock: '15 kg', min: '50 kg', percent: '30%' }
                        ].map((item) => (
                            <div key={item.item} style={{ padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: 'bold' }}>{item.item}</div>
                                    <div style={{ fontWeight: 'bold' }}>{item.stock}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
                                    <span>Mínimo: {item.min}</span>
                                    <span>{item.percent} bajo mínimo</span>
                                </div>
                            </div>
                        ))}
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
                                    <div style={{ fontWeight: '600' }}>Lotes Cerrados</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Esta semana</div>
                                </div>
                            </div>
                            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>8</span>
                        </div>
                        <div className="status-row">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ padding: '8px', background: '#fff7ed', color: '#f59e0b', borderRadius: '8px' }}>
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600' }}>Lotes Abiertos</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>En proceso</div>
                                </div>
                            </div>
                            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>3</span>
                        </div>
                    </div>
                </div>

                <div className="admin-table-card">
                    <div className="card-header">
                        <h3>Actividad Reciente</h3>
                        <button className="btn-text">Ver todo</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {[
                            { text: 'Ticket TK-001 completado', time: 'Hace 15 min', type: 'success' },
                            { text: 'Nuevo lote LT-045 creado', time: 'Hace 1 hora', type: 'info' },
                            { text: 'Pesaje de 450kg registrado', time: 'Hace 2 horas', type: 'warning' },
                            { text: 'Orden OC-089 aprobada', time: 'Hace 3 horas', type: 'success' }
                        ].map((activity, i) => (
                            <div key={i} className={`activity-item ${activity.type}`}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{activity.text}</div>
                                    <div className="activity-time">{activity.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
