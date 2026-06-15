'use client';
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import '../styles/order.css';
import { StationLogin } from '@/components/stationLogin';
import { Ticket, ChevronLeft, Loader2, PlusCircle, LayoutDashboard, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, handleLogout } from '@/lib/api';

export default function Order() {
    const [orders, setOrders] = useState<any[]>([]);
    const [mataderos, setMataderos] = useState<any[]>([]);
    const [proveedores, setProveedores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalNuevo, setModalNuevo] = useState(false);
    const [ticketDetalle, setTicketDetalle] = useState<any>(null);
    const [carcasses, setCarcasses] = useState<any[]>([]);
    const [loadingCarcasses, setLoadingCarcasses] = useState(false);
    const [selectedRes, setSelectedRes] = useState<any>(null);
    const [cortesRes, setCortesRes] = useState<any[]>([]);
    const [loadingCortes, setLoadingCortes] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const TIPOS_RES = [
        { value: 'Novillo', abrev: 'NO' },
        { value: 'Novilla', abrev: 'NA' },
        { value: 'Torete', abrev: 'TE' },
        { value: 'Toro', abrev: 'TO' },
        { value: 'Buvillo', abrev: 'BO' },
        { value: 'Buvilla', abrev: 'BA' },
        { value: 'Vaca', abrev: 'VA' },
    ];

    const [formData, setFormData] = useState({
        proveedor_id: '',
        matadero_id: '',
        placa: '',
        chofer: '',
        temperatura: '',
        temp_termoking: '',
        condicion_vehiculo: 'Bien',
        condicion_cestas: 'Bien',
        observaciones: '',
        peso_promedio: '',
        peso_total_matadero: '',
        fecha_matanza: new Date().toISOString().split('T')[0]
    });

    const [resLote, setResLote] = useState<{tipo_de_res: string; cantidad: string}[]>([
        { tipo_de_res: 'Novillo', cantidad: '' }
    ]);

    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (ticketDetalle) {
            fetchCarcasses(ticketDetalle.id);
        } else {
            setCarcasses([]);
            setSelectedRes(null);
        }
    }, [ticketDetalle]);

    useEffect(() => {
        if (selectedRes) {
            fetchCortes(selectedRes.id);
        } else {
            setCortesRes([]);
        }
    }, [selectedRes]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersData, mataderosData, proveedoresData] = await Promise.all([
                apiFetch('/orden-compra'),
                apiFetch('/mataderos'),
                apiFetch('/proveedores')
            ]);
            setOrders(ordersData);
            setMataderos(mataderosData);
            setProveedores(proveedoresData);
        } catch (error: any) {
            toast.error('Error cargando datos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCarcasses = async (ticketId: number) => {
        setLoadingCarcasses(true);
        try {
            const data = await apiFetch(`/reses/by-order/${ticketId}`);
            setCarcasses(data);
        } catch (error: any) {
            toast.error('Error cargando reses: ' + error.message);
        } finally {
            setLoadingCarcasses(false);
        }
    };

    const fetchCortes = async (resId: number) => {
        setLoadingCortes(true);
        try {
            const response = await apiFetch(`/deshueze/por-res/${resId}`);
            if (response.success) {
                setCortesRes(response.data);
            }
        } catch (error: any) {
            toast.error('Error cargando cortes: ' + error.message);
        } finally {
            setLoadingCortes(false);
        }
    };

    const addLoteRow = () => {
        const usedTypes = new Set(resLote.map(r => r.tipo_de_res));
        const next = TIPOS_RES.find(t => !usedTypes.has(t.value));
        if (!next) return;
        setResLote([...resLote, { tipo_de_res: next.value, cantidad: '' }]);
    };
    const removeLoteRow = (idx: number) => {
        if (resLote.length <= 1) return;
        setResLote(resLote.filter((_, i) => i !== idx));
    };
    const updateLoteRow = (idx: number, field: 'tipo_de_res' | 'cantidad', value: string) =>
        setResLote(resLote.map((r, i) => i === idx ? { ...r, [field]: value } : r));
    const totalReses = resLote.reduce((sum, r) => sum + (parseInt(r.cantidad) || 0), 0);

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (totalReses === 0) { toast.error('Debe agregar al menos una res al lote'); return; }
        setIsSubmitting(true);
        try {
            const lote = resLote.filter(r => parseInt(r.cantidad) > 0).map(r => ({
                tipo_de_res: r.tipo_de_res,
                cantidad: parseInt(r.cantidad)
            }));
            await apiFetch('/orden-compra', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    temperatura: parseFloat(formData.temperatura || '0'),
                    temp_termoking: parseFloat(formData.temp_termoking || '0'),
                    peso_promedio: parseFloat(formData.peso_promedio || '0'),
                    peso_total_matadero: parseFloat(formData.peso_total_matadero || '0'),
                    cantidad_res: totalReses,
                    lote
                })
            });
            toast.success('Orden registrada con éxito');
            setModalNuevo(false);
            fetchData();
            setResLote([{ tipo_de_res: 'Novillo', cantidad: '' }]);
            setFormData({
                proveedor_id: '', matadero_id: '', placa: '', chofer: '',
                temperatura: '', temp_termoking: '', condicion_vehiculo: 'Bien',
                condicion_cestas: 'Bien', observaciones: '', peso_promedio: '',
                peso_total_matadero: '',
                fecha_matanza: new Date().toISOString().split('T')[0]
            });
        } catch (error: any) {
            toast.error('Error al crear orden: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.id.toString().includes(searchTerm) ||
        o.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.chofer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedores.find(p => p.id === o.proveedor_id)?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <StationLogin
            stationName="Registro de Ordenes"
            stationIcon={<Ticket size={24} />}
            stationColor="bg-primary"
            targetRole="registrador"
        >
            <div className="container">
                <header className="header">
                    <div className="title">
                        <h1>Registro de Ordenes</h1>
                        <p>Gestión de recepción de ganado</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                            className="btnBack"
                            onClick={() => router.push('/')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', fontSize: '0.95rem' }}
                        >
                            <LayoutDashboard size={18} /> Panel Principal
                        </button>
                        <button className="btnNuevo" onClick={() => setModalNuevo(true)}>
                            <PlusCircle size={20} style={{ marginRight: '8px' }} />
                            Nueva Orden
                        </button>
                        <button
                            className="btnBack"
                            onClick={handleLogout}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', fontSize: '0.95rem', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}
                        >
                            <LogOut size={18} /> Cerrar Sesión
                        </button>
                    </div>
                </header>

                <input
                    type="text"
                    className="searchBox"
                    placeholder="Buscar por ID, placa, chofer o proveedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                        <Loader2 className="animate-spin" size={48} color="#641B2E" />
                    </div>
                ) : (
                    <div className="grid">
                        {filteredOrders.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                {searchTerm ? 'No se encontraron órdenes para tu búsqueda.' : 'No hay órdenes de compra registradas.'}
                            </div>
                        ) : (
                            filteredOrders.map(tk => (
                                <div key={tk.id} className="card" onClick={() => setTicketDetalle(tk)}>
                                    <div className="cardHeader">
                                        <span className="id">#{tk.id}</span>
                                        <span className={`badge ${tk.estado}`}>{tk.estado.replace('_', ' ').toUpperCase()}</span>
                                        <span style={{ color: '#a0aec0', fontSize: '0.9rem' }}>{new Date(tk.fecha).toLocaleDateString()}</span>
                                    </div>
                                    <div className="cardBody">
                                        <h2>{proveedores.find(p => p.id === tk.proveedor_id)?.nombre || 'Proveedor Desconocido'}</h2>
                                        <p className="subtext">{mataderos.find(m => m.id === tk.matadero_id)?.nombre || 'Matadero Desconocido'}</p>
                                        <div className="tags">
                                            <span className="tag">🚛 {tk.placa}</span>
                                            <span className="tag">🐄 {tk.cantidad_res} reses</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* MODAL: NUEVA ORDEN */}
                {modalNuevo && (
                    <div className="overlay">
                        <div className="modal nmo-modal">
                            <button className="closeBtn" onClick={() => { setModalNuevo(false); setResLote([{ tipo_de_res: 'Novillo', cantidad: '' }]); }}>&times;</button>

                            <form onSubmit={handleCreateOrder} id="nmo-form">
                                <h2 className="nmo-title">Registrar Nueva Orden</h2>
                                {/* ORIGEN */}
                                <p className="sectionTitle">Origen</p>
                                <div className="formGrid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    <div className="fieldGroup">
                                        <label>Proveedor</label>
                                        <select value={formData.proveedor_id} onChange={e => setFormData({...formData, proveedor_id: e.target.value})} required>
                                            <option value="">Seleccione Proveedor</option>
                                            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Matadero</label>
                                        <select value={formData.matadero_id} onChange={e => setFormData({...formData, matadero_id: e.target.value})} required>
                                            <option value="">Seleccione Matadero</option>
                                            {mataderos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* TRANSPORTE Y CONDICIONES */}
                                <p className="sectionTitle">Transporte y Condiciones</p>
                                <div className="nmo-grid-3">
                                    <div className="fieldGroup">
                                        <label>Placa</label>
                                        <input placeholder="ASD841" value={formData.placa} onChange={e => setFormData({...formData, placa: e.target.value})} required />
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Chofer</label>
                                        <input placeholder="Nombre del chofer" value={formData.chofer} onChange={e => setFormData({...formData, chofer: e.target.value})} required />
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Temp Termoking (°C)</label>
                                        <input type="number" step="0.1" placeholder="-8" value={formData.temp_termoking} onChange={e => setFormData({...formData, temp_termoking: e.target.value})} />
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Condición del Vehículo</label>
                                        <select value={formData.condicion_vehiculo} onChange={e => setFormData({...formData, condicion_vehiculo: e.target.value})}>
                                            <option>Bien</option><option>Mal</option>
                                        </select>
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Condición de las Cestas</label>
                                        <select value={formData.condicion_cestas} onChange={e => setFormData({...formData, condicion_cestas: e.target.value})}>
                                            <option>Bien</option><option>Mal</option>
                                        </select>
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Fecha de Matanza</label>
                                        <input type="date" value={formData.fecha_matanza} onChange={e => setFormData({...formData, fecha_matanza: e.target.value})} required />
                                    </div>
                                </div>

                                {/* DETALLE DE RESES (LOTE) */}
                                <p className="sectionTitle">Detalle de Reses (Lote)</p>
                                <div className="nmo-lote-card">
                                    <div className="nmo-tipos-legend">
                                        {TIPOS_RES.map(t => <span key={t.value}><b>{t.abrev}</b> = {t.value}</span>)}
                                    </div>
                                    {resLote.map((row, idx) => (
                                        <div key={idx} className="nmo-lote-row">
                                            <div className="fieldGroup nmo-lote-tipo">
                                                <label>Tipo de Res</label>
                                                <select value={row.tipo_de_res} onChange={e => updateLoteRow(idx, 'tipo_de_res', e.target.value)}>
                                                    {TIPOS_RES.map(t => <option key={t.value} value={t.value}>{t.value} ({t.abrev})</option>)}
                                                </select>
                                            </div>
                                            <div className="fieldGroup nmo-lote-cant">
                                                <label>Cantidad</label>
                                                <input type="number" min="1" placeholder="0" value={row.cantidad} onChange={e => updateLoteRow(idx, 'cantidad', e.target.value)} required />
                                            </div>
                                            {resLote.length > 1 && (
                                                <button type="button" className="nmo-remove-btn" onClick={() => removeLoteRow(idx)}>×</button>
                                            )}
                                        </div>
                                    ))}
                                    <div className="nmo-lote-footer">
                                        <button type="button" className="nmo-add-btn" onClick={addLoteRow} disabled={resLote.length >= TIPOS_RES.length}>
                                            + Agregar otro tipo
                                        </button>
                                        <span className="nmo-total">
                                            Total: <strong>{totalReses} reses</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* DATOS ADICIONALES */}
                                <div className="nmo-grid-2" style={{ marginTop: '16px' }}>
                                    <div className="fieldGroup">
                                        <label>Temp Promedio de la Carne (°C)</label>
                                        <input type="number" step="0.1" placeholder="Ej: 4.5" value={formData.temperatura} onChange={e => setFormData({...formData, temperatura: e.target.value})} />
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Peso Promedio Esperado (kg)</label>
                                        <input type="number" step="0.1" placeholder="Ej: 220" value={formData.peso_promedio} onChange={e => setFormData({...formData, peso_promedio: e.target.value})} />
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Peso Total Matadero (kg)</label>
                                        <input type="number" step="0.1" placeholder="Ej: 4500" value={formData.peso_total_matadero} onChange={e => setFormData({...formData, peso_total_matadero: e.target.value})} required />
                                    </div>
                                </div>

                                <div className="fieldGroup" style={{ marginTop: '12px' }}>
                                    <label>Observaciones</label>
                                    <textarea
                                        placeholder="Estado de la carga, observaciones generales..."
                                        value={formData.observaciones}
                                        onChange={e => setFormData({...formData, observaciones: e.target.value})}
                                        className="nmo-textarea"
                                    />
                                </div>
                            </form>

                            <div className="nmo-actions">
                                <button type="button" className="nmo-cancel-btn" onClick={() => { setModalNuevo(false); setResLote([{ tipo_de_res: 'Novillo', cantidad: '' }]); }}>
                                    Cancelar
                                </button>
                                <button type="submit" form="nmo-form" className="btnNuevo" disabled={isSubmitting || totalReses === 0}>
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Registrar Orden'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: DETALLE ORDEN */}
                {ticketDetalle && (
                    <div className="overlay">
                        <div className="modal order-detail-modal">
                            <button className="closeBtn" onClick={() => setTicketDetalle(null)}>&times;</button>

                            {/* Header */}
                            <div className="odm-header">
                                <div className="odm-title-block">
                                    <span className="odm-orden-label">Orden de Compra</span>
                                    <h2 className="odm-title">#{ticketDetalle.id}</h2>
                                    <p className="odm-subtitle">Detalles de recepción y procesamiento</p>
                                </div>
                                <span className={`badge ${ticketDetalle.estado} odm-status-badge`}>
                                    {ticketDetalle.estado.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>

                            {/* Info chips */}
                            <div className="odm-info-grid">
                                <div className="odm-info-chip">
                                    <label>Proveedor</label>
                                    <span>{proveedores.find(p => p.id === ticketDetalle.proveedor_id)?.nombre || '—'}</span>
                                </div>
                                <div className="odm-info-chip">
                                    <label>Placa Camión</label>
                                    <span>{ticketDetalle.placa}</span>
                                </div>
                                <div className="odm-info-chip">
                                    <label>Total Reses</label>
                                    <span>{ticketDetalle.cantidad_res}</span>
                                </div>
                                <div className="odm-info-chip">
                                    <label>Chofer</label>
                                    <span>{ticketDetalle.chofer}</span>
                                </div>
                                <div className="odm-info-chip" style={{ background: 'rgba(100, 27, 46, 0.05)', border: '1px solid rgba(100, 27, 46, 0.1)' }}>
                                    <label style={{ color: '#641B2E' }}>Peso Matadero</label>
                                    <span style={{ fontWeight: 800, color: '#641B2E' }}>{Number(ticketDetalle.peso_total_matadero || 0).toFixed(2)} kg</span>
                                </div>
                                <div className="odm-info-chip" style={{ background: 'rgba(22, 101, 52, 0.05)', border: '1px solid rgba(22, 101, 52, 0.1)' }}>
                                    <label style={{ color: '#166534' }}>Peso Planta (Romana)</label>
                                    <span style={{ fontWeight: 800, color: '#166534' }}>{carcasses.reduce((sum, r) => sum + (Number(r.peso_romana) || 0), 0).toFixed(2)} kg</span>
                                </div>
                            </div>

                            {/* Reses section */}
                            <div className="odm-section">
                                <div className="odm-section-header">
                                    <h3>Reses en Proceso</h3>
                                    <div className="odm-count-pill">
                                        {carcasses.length} / {ticketDetalle.cantidad_res} procesadas
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="odm-progress-track">
                                    <div
                                        className="odm-progress-fill"
                                        style={{ width: `${(carcasses.length / ticketDetalle.cantidad_res) * 100}%` }}
                                    />
                                </div>

                                {loadingCarcasses ? (
                                    <div className="odm-loading">
                                        <Loader2 className="animate-spin" size={32} color="#641B2E" />
                                    </div>
                                ) : carcasses.length === 0 ? (
                                    <div className="odm-empty">
                                        <div className="odm-empty-icon">⏳</div>
                                        <h4>No hay reses procesadas todavía</h4>
                                        <p>Las reses aparecerán aquí una vez que pasen por el pesaje en caliente.</p>
                                    </div>
                                ) : (
                                    <div className="odm-res-grid">
                                        {carcasses.map((res: any) => (
                                            <div
                                                key={res.id}
                                                className="odm-res-card"
                                                onClick={(e) => { e.stopPropagation(); setSelectedRes(res); }}
                                            >
                                                {/* Card header */}
                                                <div className="odm-res-card-top">
                                                    <div className="odm-res-avatar">🐄</div>
                                                    <div className="odm-res-title">
                                                        <strong>Res #{res.numero}</strong>
                                                        <span className={`odm-res-badge ${res.estado}`}>
                                                            {res.estado.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Stats */}
                                                <div className="odm-res-stats">
                                                    <div className="odm-res-stat">
                                                        <label>Tipo</label>
                                                        <span>{res.tipo_de_res || res.tipo_res || '—'}</span>
                                                    </div>
                                                    <div className="odm-res-stat">
                                                        <label>Clasificación</label>
                                                        <span>{res.clasificacion || '—'}</span>
                                                    </div>
                                                    <div className="odm-res-stat">
                                                        <label>Peso Rom.</label>
                                                        <span className="odm-res-weight">{res.peso_romana} kg</span>
                                                    </div>
                                                    <div className="odm-res-stat">
                                                        <label>Sexo</label>
                                                        <span>{res.sexo || '—'}</span>
                                                    </div>
                                                </div>

                                                <div className="odm-res-link">Ver detalles →</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: DETALLE ESPECÍFICO DE RES */}
                {selectedRes && (
                    <div className="overlay" style={{ zIndex: 1100 }}>
                        <div className="modal res-detail-modal">
                            <button className="closeBtn" onClick={() => setSelectedRes(null)}>&times;</button>

                            {/* Res header */}
                            <div className="rdm-header">
                                <div className="rdm-avatar">🐄</div>
                                <div className="rdm-title-block">
                                    <h2>Res #{selectedRes.numero}</h2>
                                    <span className={`badge ${selectedRes.estado}`}>
                                        {selectedRes.estado.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Res stats */}
                            <div className="rdm-stats">
                                <div className="rdm-stat-card rdm-stat-primary">
                                    <label>Tipo de Res</label>
                                    <span>{selectedRes.tipo_de_res || selectedRes.tipo_res || '—'}</span>
                                </div>
                                <div className="rdm-stat-card">
                                    <label>Sexo</label>
                                    <span>{selectedRes.sexo || '—'}</span>
                                </div>
                                <div className="rdm-stat-card">
                                    <label>Clasificación</label>
                                    <span>{selectedRes.clasificacion || '—'}</span>
                                </div>
                                <div className="rdm-stat-card">
                                    <label>Peso Romana</label>
                                    <span>{selectedRes.peso_romana} kg</span>
                                </div>
                                <div className="rdm-stat-card">
                                    <label>Peso Ticket</label>
                                    <span>{selectedRes.peso_ticket ? `${selectedRes.peso_ticket} kg` : '—'}</span>
                                </div>
                                <div className="rdm-stat-card rdm-stat-dark">
                                    <label>Diferencia</label>
                                    <span>{selectedRes.peso_ticket
                                        ? `${(parseFloat(selectedRes.peso_romana) - parseFloat(selectedRes.peso_ticket)).toFixed(2)} kg`
                                        : '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Cortes section */}
                            <div className="rdm-cortes-title">
                                <h3>Ítems Extraídos</h3>
                                <span className="rdm-cortes-count">{cortesRes.length}</span>
                            </div>

                            {loadingCortes ? (
                                <div className="rdm-loading">
                                    <Loader2 className="animate-spin" size={24} color="#641B2E" />
                                </div>
                            ) : cortesRes.length === 0 ? (
                                <div className="rdm-empty">
                                    No se han registrado ítems para esta res todavía.
                                </div>
                            ) : (
                                <div className="rdm-cortes-list">
                                    {cortesRes.map((c: any) => (
                                        <div key={c.id} className="rdm-corte-item">
                                            <div className="rdm-corte-icon">✂️</div>
                                            <div className="rdm-corte-info">
                                                <strong>{c.tipo_nombre}</strong>
                                                <span>Categoría: {c.clasificacion} · {c.almacen || ''}</span>
                                            </div>
                                            <div className="rdm-corte-weight">
                                                {parseFloat(c.peso).toFixed(2)} kg
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button className="rdm-close-btn" onClick={() => setSelectedRes(null)}>
                                Cerrar Detalles
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </StationLogin>
    );
}
