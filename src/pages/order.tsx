'use client';
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import '../styles/order.css';
import { StationLogin } from '@/components/stationLogin';
import { Ticket, ChevronLeft, Loader2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

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
        cantidad_res: '',
        sexo: 'Mixto',
        clasificacion: 'Premium',
        fecha_matanza: new Date().toISOString().split('T')[0]
    });

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

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await apiFetch('/orden-compra', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    temperatura: parseFloat(formData.temperatura),
                    temp_termoking: parseFloat(formData.temp_termoking || '0'),
                    cantidad_res: parseInt(formData.cantidad_res)
                })
            });
            toast.success('Orden registrada con éxito');
            setModalNuevo(false);
            fetchData();
            // Reset form
            setFormData({
                proveedor_id: '',
                matadero_id: '',
                placa: '',
                chofer: '',
                temperatura: '',
                temp_termoking: '',
                condicion_vehiculo: 'Bien',
                condicion_cestas: 'Bien',
                observaciones: '',
                cantidad_res: '',
                sexo: 'Mixto',
                clasificacion: 'Premium',
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
                    <button className="btnNuevo" onClick={() => setModalNuevo(true)}>
                        <PlusCircle size={20} style={{ marginRight: '8px' }} />
                        Nueva Orden
                    </button>
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
                        <div className="modal">
                            <button className="closeBtn" onClick={() => setModalNuevo(false)}>&times;</button>
                            <h2 style={{ fontFamily: 'serif', marginTop: 0, marginBottom: '10px' }}>Registrar Nueva Orden</h2>

                            <form onSubmit={handleCreateOrder}>
                                <p className="sectionTitle">Origen</p>
                                <div className="formGrid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    <div className="fieldGroup">
                                        <label>Proveedor</label>
                                        <select
                                            value={formData.proveedor_id}
                                            onChange={(e) => setFormData({ ...formData, proveedor_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Seleccione Proveedor</option>
                                            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Matadero</label>
                                        <select
                                            value={formData.matadero_id}
                                            onChange={(e) => setFormData({ ...formData, matadero_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Seleccione Matadero</option>
                                            {mataderos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <p className="sectionTitle">Transporte</p>
                                <div className="formGrid">
                                    <div className="fieldGroup">
                                        <label>Placa</label>
                                        <input
                                            placeholder="ABC-123"
                                            value={formData.placa}
                                            onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Chofer</label>
                                        <input
                                            placeholder="Nombre"
                                            value={formData.chofer}
                                            onChange={(e) => setFormData({ ...formData, chofer: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Temp Termoking (°C)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="2.0"
                                            value={formData.temp_termoking}
                                            onChange={(e) => setFormData({ ...formData, temp_termoking: e.target.value })}
                                        />
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Condición Vehículo</label>
                                        <select
                                            value={formData.condicion_vehiculo}
                                            onChange={(e) => setFormData({ ...formData, condicion_vehiculo: e.target.value })}
                                        >
                                            <option value="Bien">Bien</option>
                                            <option value="Mal">Mal</option>
                                        </select>
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Condición Cestas</label>
                                        <select
                                            value={formData.condicion_cestas}
                                            onChange={(e) => setFormData({ ...formData, condicion_cestas: e.target.value })}
                                        >
                                            <option value="Bien">Bien</option>
                                            <option value="Mal">Mal</option>
                                        </select>
                                    </div>
                                </div>

                                <p className="sectionTitle">Ganado</p>
                                <div className="formGrid">
                                    <div className="fieldGroup">
                                        <label>Cantidad</label>
                                        <input
                                            type="number"
                                            value={formData.cantidad_res}
                                            onChange={(e) => setFormData({ ...formData, cantidad_res: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Sexo</label>
                                        <select
                                            value={formData.sexo}
                                            onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                                        >
                                            <option value="Mixto">Mixto</option>
                                            <option value="Macho">Macho</option>
                                            <option value="Hembra">Hembra</option>
                                        </select>
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Clasificación</label>
                                        <select
                                            value={formData.clasificacion}
                                            onChange={(e) => setFormData({ ...formData, clasificacion: e.target.value })}
                                        >
                                            <option value="Premium">Premium</option>
                                            <option value="Primera">Primera</option>
                                            <option value="Segunda">Segunda</option>
                                            <option value="Industrial">Industrial</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="formGrid" style={{ marginTop: '10px' }}>
                                    <div className="fieldGroup">
                                        <label>Fecha de Matanza</label>
                                        <input
                                            type="date"
                                            value={formData.fecha_matanza}
                                            onChange={(e) => setFormData({ ...formData, fecha_matanza: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="fieldGroup" style={{ gridColumn: 'span 2' }}>
                                        <label>Observaciones de Recepción</label>
                                        <textarea
                                            placeholder="Ingrese observaciones sobre el estado de la carga o el ganado..."
                                            value={formData.observaciones}
                                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                            style={{ width: '100%', minHeight: '60px', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setModalNuevo(false)}
                                        style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ccc', background: 'none' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btnNuevo" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : 'Registrar Orden'}
                                    </button>
                                </div>
                            </form>
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
