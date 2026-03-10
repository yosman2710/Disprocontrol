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
                            <h2 style={{ fontFamily: 'serif' }}>Registrar Nueva Orden</h2>

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
                                        <label>Temp (°C)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="4.0"
                                            value={formData.temperatura}
                                            onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                                            required
                                        />
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
                                </div>

                                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
                        <div className="modal" style={{ maxWidth: '950px', padding: '0', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '40px', borderBottom: '1px solid #f1f5f9' }}>
                                <button className="closeBtn" onClick={() => setTicketDetalle(null)}>&times;</button>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ fontFamily: 'serif', fontSize: '2.4rem', color: '#1a1a1a', margin: '0' }}>Orden #{ticketDetalle.id}</h2>
                                        <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '5px' }}>Detalles de recepción y procesamiento</p>
                                    </div>
                                    <span className={`badge ${ticketDetalle.estado}`} style={{ fontSize: '1rem', padding: '8px 20px' }}>
                                        {ticketDetalle.estado.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>

                                <div className="detailHeaderInfo" style={{ marginTop: '30px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                    <div className="fieldGroup">
                                        <label>Proveedor</label>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{proveedores.find(p => p.id === ticketDetalle.proveedor_id)?.nombre || '...'}</span>
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Placa Camión</label>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{ticketDetalle.placa}</span>
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Total de Reses</label>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{ticketDetalle.cantidad_res}</span>
                                    </div>
                                    <div className="fieldGroup">
                                        <label>Chofer</label>
                                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{ticketDetalle.chofer}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '40px', background: '#fcfcfc', flex: '1', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#334155', margin: '0' }}>Reses en Proceso</h3>
                                    <div style={{ background: '#641B2E', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
                                        {carcasses.length} / {ticketDetalle.cantidad_res} Completadas
                                    </div>
                                </div>

                                <div style={{ width: '100%', height: '14px', background: '#e2e8f0', borderRadius: '7px', overflow: 'hidden', marginBottom: '40px' }}>
                                    <div style={{ width: `${(carcasses.length / ticketDetalle.cantidad_res) * 100}%`, height: '100%', background: '#641B2E', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                                </div>

                                {loadingCarcasses ? (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <Loader2 className="animate-spin" size={32} color="#641B2E" />
                                    </div>
                                ) : carcasses.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '20px' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⏳</div>
                                        <h4 style={{ color: '#475569', marginBottom: '5px' }}>No hay reses procesadas todavía</h4>
                                        <p style={{ color: '#94a3b8' }}>Las reses aparecerán aquí una vez que pasen por el pesaje en caliente.</p>
                                    </div>
                                ) : (
                                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                        {carcasses.map((res: any) => (
                                            <div key={res.id} className="resCard" onClick={(e) => { e.stopPropagation(); setSelectedRes(res); }} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '40px', height: '40px', background: '#fef2f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🐄</div>
                                                        <span style={{ fontWeight: '700', fontSize: '1.2rem', color: '#1e293b' }}>Res #{res.numero}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '12px', background: res.estado === 'completado' ? '#def7ec' : '#fef3c7', color: res.estado === 'completado' ? '#03543f' : '#92400e' }}>
                                                        {res.estado.replace('_', ' ').toUpperCase()}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '15px', background: '#f8fafc', borderRadius: '12px' }}>
                                                    <div>
                                                        <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Cortes</span>
                                                        <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#641B2E' }}>{res.cortes_count || 0} pzs</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Peso Cal.</span>
                                                        <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#334155' }}>{res.peso_caliente}kg</span>
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.85rem', color: '#641B2E', fontWeight: '600' }}>
                                                    Ver detalles &rarr;
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: DETALLE ESPECIFICO DE RES */}
                {selectedRes && (
                    <div className="overlay" style={{ zIndex: 1100 }}>
                        <div className="modal" style={{ maxWidth: '600px', animation: 'fadeIn 0.3s ease-out' }}>
                            <button className="closeBtn" onClick={() => setSelectedRes(null)}>&times;</button>

                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <div style={{ width: '80px', height: '80px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 15px' }}>🐄</div>
                                <h2 style={{ fontFamily: 'serif', fontSize: '2rem', margin: '0' }}>Res #{selectedRes.numero}</h2>
                                <p style={{ color: '#64748b' }}>Información detallada del procesamiento</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '40px' }}>
                                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '16px', textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Peso Caliente</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#334155' }}>{selectedRes.peso_caliente} kg</span>
                                </div>
                                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '16px', textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Peso Frío</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#334155' }}>{selectedRes.peso_frio ? `${selectedRes.peso_frio} kg` : '—'}</span>
                                </div>
                                <div style={{ padding: '15px', background: '#641B2E', borderRadius: '16px', textAlign: 'center' }}>
                                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase' }}>Merma</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>{selectedRes.merma_porcentaje ? `${parseFloat(selectedRes.merma_porcentaje).toFixed(2)}%` : '—'}</span>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>
                                Cortes Extraídos ({cortesRes.length})
                            </h3>

                            {loadingCortes ? (
                                <div style={{ textAlign: 'center', padding: '30px' }}>
                                    <Loader2 className="animate-spin" size={24} color="#641B2E" />
                                </div>
                            ) : cortesRes.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', background: '#f8fafc', borderRadius: '16px' }}>
                                    No se han registrado cortes para esta res todavía.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '10px' }}>
                                    {cortesRes.map((c: any) => (
                                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#1a1a1a' }}>{c.tipo_nombre}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Categoría: {c.clasificacion}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#641B2E' }}>{parseFloat(c.peso).toFixed(2)} kg</div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID #{c.id}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: '30px' }}>
                                <button onClick={() => setSelectedRes(null)} style={{ width: '100%', padding: '16px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>
                                    Cerrar Detalles
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StationLogin>
    );
}
