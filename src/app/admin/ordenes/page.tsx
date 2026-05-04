'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Edit,
    Trash2,
    Truck,
    Calendar,
    Package,
    Loader2,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

export default function OrdenesAdminPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Selection for Detail View
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [orderCarcasses, setOrderCarcasses] = useState<any[]>([]);
    const [loadingCarcasses, setLoadingCarcasses] = useState(false);

    // Entity Lists for Dropdowns
    const [proveedores, setProveedores] = useState<any[]>([]);
    const [mataderos, setMataderos] = useState<any[]>([]);

    // Nested view for Res Items
    const [selectedResId, setSelectedResId] = useState<number | null>(null);
    const [resItems, setResItems] = useState<{ [key: number]: any[] }>({});
    const [loadingItemsMap, setLoadingItemsMap] = useState<{ [key: number]: boolean }>({});

    // Editing State
    const [editingOrder, setEditingOrder] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchOrders();
        fetchEntities();
    }, []);

    const fetchEntities = async () => {
        try {
            const [provs, mats] = await Promise.all([
                apiFetch('/proveedores'),
                apiFetch('/mataderos')
            ]);
            setProveedores(provs);
            setMataderos(mats);
        } catch (error) {
            console.error('Error fetching entities:', error);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/orden-compra');
            setOrders(data);
        } catch (error: any) {
            toast.error('Error cargando órdenes: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async (orderId: number) => {
        setLoadingCarcasses(true);
        try {
            const data = await apiFetch(`/reses/by-order/${orderId}`);
            setOrderCarcasses(data);
        } catch (error: any) {
            toast.error('Error cargando reses: ' + error.message);
        } finally {
            setLoadingCarcasses(false);
        }
    };

    const fetchResCuts = async (resId: number) => {
        if (resItems[resId]) return; // Already loaded

        setLoadingItemsMap(prev => ({ ...prev, [resId]: true }));
        try {
            const response = await apiFetch(`/deshueze/por-res/${resId}`);
            if (response.success) {
                setResItems(prev => ({ ...prev, [resId]: response.data }));
            }
        } catch (error: any) {
            console.error('Error cuts:', error);
        } finally {
            setLoadingItemsMap(prev => ({ ...prev, [resId]: false }));
        }
    };

    const toggleResExpand = (resId: number) => {
        if (selectedResId === resId) {
            setSelectedResId(null);
        } else {
            setSelectedResId(resId);
            fetchResCuts(resId);
        }
    };

    const handleViewDetail = (order: any) => {
        setSelectedOrder(order);
        setIsDetailOpen(true);
        fetchOrderDetails(order.id);
        setSelectedResId(null);
        setResItems({});
    };

    const handleEditOrder = (e: React.MouseEvent, order: any) => {
        e.stopPropagation();
        setEditingOrder({ ...order });
        setIsEditModalOpen(true);
    };

    const saveOrderEdit = async () => {
        setIsSaving(true);
        try {
            await apiFetch(`/orden-compra/${editingOrder.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    placa:              editingOrder.placa,
                    chofer:             editingOrder.chofer,
                    proveedor_id:       editingOrder.proveedor_id,
                    matadero_id:        editingOrder.matadero_id,
                    temperatura:        editingOrder.temperatura,
                    temp_termoking:     editingOrder.temp_termoking,
                    condicion_vehiculo: editingOrder.condicion_vehiculo,
                    condicion_cestas:   editingOrder.condicion_cestas,
                    observaciones:      editingOrder.observaciones,
                    fecha_matanza:      editingOrder.fecha_matanza,
                    peso_promedio:      editingOrder.peso_promedio,
                })
            });
            toast.success('Orden actualizada');
            setIsEditModalOpen(false);
            fetchOrders();
            if (selectedOrder?.id === editingOrder.id) {
                setSelectedOrder({ ...selectedOrder, ...editingOrder });
            }
        } catch (error: any) {
            toast.error('Error al guardar: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteOrder = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('¿Eliminar esta orden? Esto borrará reses y cortes asociados.')) return;

        try {
            await apiFetch(`/orden-compra/${id}`, { method: 'DELETE' });
            toast.success('Orden eliminada');
            fetchOrders();
            if (selectedOrder?.id === id) setIsDetailOpen(false);
        } catch (error: any) {
            toast.error('Error al eliminar: ' + error.message);
        }
    };

    const handleDeleteRes = async (resId: number) => {
        if (!confirm('¿Eliminar esta res?')) return;
        try {
            await apiFetch(`/reses/${resId}`, { method: 'DELETE' });
            toast.success('Res eliminada');
            fetchOrderDetails(selectedOrder.id);
        } catch (error: any) {
            toast.error('Error: ' + error.message);
        }
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesSearch =
                o.id?.toString().includes(searchTerm) ||
                o.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.chofer?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || o.estado === statusFilter;
            return (matchesSearch || !searchTerm) && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    if (loading && orders.length === 0) {
        return (
            <div className="admin-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={48} className="animate-spin" style={{ color: '#641B2E' }} />
            </div>
        );
    }

    return (
        <div className="admin-content">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {isDetailOpen && (
                            <button
                                onClick={() => setIsDetailOpen(false)}
                                className="back-btn"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div>
                            <h1>{isDetailOpen ? `Orden ORD-${selectedOrder.id}` : 'Órdenes de Compra'}</h1>
                            <p>{isDetailOpen ? `Seguimiento de ${selectedOrder.placa}` : 'Administración de pedidos y logística'}</p>
                        </div>
                    </div>
                </div>

                {!isDetailOpen && (
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div className="search-wrapper">
                            <Search className="search-icon-fixed" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar orden, placa o chofer..."
                                className="admin-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="admin-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Todos</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="en_proceso">En Proceso</option>
                            <option value="completado">Completados</option>
                        </select>
                    </div>
                )}
            </header>

            {!isDetailOpen ? (
                <div className="orders-grid animate-up">
                    {filteredOrders.length === 0 ? (
                        <div className="empty-state">No se encontraron órdenes.</div>
                    ) : filteredOrders.map(order => (
                        <div
                            key={order.id}
                            className="order-card"
                            onClick={() => handleViewDetail(order)}
                        >
                            <div className="card-top">
                                <span className="order-id">#{order.id}</span>
                                <span className={`badge ${order.estado}`}>
                                    {order.estado === 'en_proceso' ? 'PROCESANDO' : order.estado.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="order-date">{new Date(order.fecha).toLocaleDateString()}</span>
                            </div>

                            <div className="card-content">
                                <h3 className="provider-name">
                                    {order.proveedor_nombre ||
                                        proveedores.find(p => p.id == order.proveedor_id)?.nombre ||
                                        order.proveedor || 'Proveedor Desconocido'}
                                </h3>
                                <p className="matadero-name">
                                    {order.matadero_nombre ||
                                        mataderos.find(m => m.id == order.matadero_id)?.nombre ||
                                        order.matadero || 'Matadero Norte'}
                                </p>
                            </div>

                            <div className="card-footer">
                                <div className="footer-pills">
                                    <div className="footer-pill">
                                        <Truck size={14} />
                                        <span>{order.placa}</span>
                                    </div>
                                    <div className="footer-pill">
                                        <Package size={14} />
                                        <span>{order.cantidad_res} reses</span>
                                    </div>
                                </div>
                                <div className="card-actions" onClick={e => e.stopPropagation()}>
                                    <button
                                        className="btn-icon"
                                        title="Editar"
                                        onClick={(e) => handleEditOrder(e, order)}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="btn-icon delete"
                                        title="Eliminar"
                                        onClick={(e) => handleDeleteOrder(e, order.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="animate-fade-in">
                    {/* Header Summary */}
                    <div className="admin-stats-grid" style={{ marginBottom: '32px' }}>
                        <div className="admin-stat-card">
                            <div>
                                <div className="admin-stat-label">Estado Actual</div>
                                <div className="admin-stat-value">
                                    <span className={`badge ${selectedOrder.estado}`}>
                                        {selectedOrder.estado === 'en_proceso' ? 'PROCESANDO' : selectedOrder.estado.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="stat-icon-wrap info"><Truck size={24} /></div>
                        </div>
                        <div className="admin-stat-card">
                            <div>
                                <div className="admin-stat-label">Reses Procesadas</div>
                                <div className="admin-stat-value">{orderCarcasses.length} / {selectedOrder.cantidad_res}</div>
                            </div>
                            <div className="stat-icon-wrap success"><Package size={24} /></div>
                        </div>
                    </div>

                    <div className="admin-table-card animate-up">
                        <div className="card-header">
                            <h3>Gestión de Reses y Cortes</h3>
                            <button className="btn-refresh" onClick={() => fetchOrderDetails(selectedOrder.id)}>
                                Actualizar
                            </button>
                        </div>

                        {loadingCarcasses ? (
                            <div className="loading-state">
                                <Loader2 className="animate-spin" size={32} />
                            </div>
                        ) : (
                            <div className="res-list">
                                {orderCarcasses.length === 0 && (
                                    <div className="empty-state">No hay reses registradas.</div>
                                )}
                                {orderCarcasses.map(res => (
                                    <div key={res.id} className={`res-item ${selectedResId === res.id ? 'expanded' : ''}`}>
                                        <div className="res-header" onClick={() => toggleResExpand(res.id)}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                                <div className="res-icon">#{res.numero}</div>
                                                <div className="res-info">
                                                    <span className="res-title">
                                                        {res.tipo_de_res || 'Sin tipo'} — Res #{res.numero}
                                                    </span>
                                                    <span className="res-meta">
                                                        {res.peso_romana ? `${Number(res.peso_romana).toFixed(2)} kg romana` : 'Sin peso'}
                                                        {res.sexo ? ` · ${res.sexo}` : ''}
                                                        {res.clasificacion ? ` · ${res.clasificacion}` : ''}
                                                    </span>
                                                </div>
                                                <span className={`badge ${res.estado}`} style={{ fontSize: '10px' }}>{res.estado}</span>
                                            </div>
                                            <div className="res-actions">
                                                <button className="btn-icon delete small" onClick={(e) => { e.stopPropagation(); handleDeleteRes(res.id); }}>
                                                    <Trash2 size={14} />
                                                </button>
                                                {selectedResId === res.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                        </div>

                                        {selectedResId === res.id && (
                                            <div className="res-details animate-fade-in">
                                                {loadingItemsMap[res.id] ? (
                                                    <div style={{ padding: '20px', textAlign: 'center' }}><Loader2 className="animate-spin" /></div>
                                                ) : (
                                                    <div className="cuts-grid">
                                                        {resItems[res.id]?.length === 0 && <p>Sin cortes registrados.</p>}
                                                        {resItems[res.id]?.map(cut => (
                                                            <div key={cut.id} className="cut-card">
                                                                <span className="cut-name">{cut.tipo_nombre}</span>
                                                                <span className="cut-weight">{parseFloat(cut.peso).toFixed(2)} kg</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Order Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card animate-scale">
                        <div className="modal-header">
                            <h3>Editar Orden #{editingOrder.id}</h3>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="input-group">
                                    <label>Proveedor</label>
                                    <select className="modal-select" value={editingOrder.proveedor_id || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, proveedor_id: e.target.value })}>
                                        <option value="">Seleccionar Proveedor</option>
                                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Matadero</label>
                                    <select className="modal-select" value={editingOrder.matadero_id || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, matadero_id: e.target.value })}>
                                        <option value="">Seleccionar Matadero</option>
                                        {mataderos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Chofer</label>
                                    <input type="text" value={editingOrder.chofer || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, chofer: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Placa</label>
                                    <input type="text" value={editingOrder.placa || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, placa: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Temp Carne (°C)</label>
                                    <input type="number" step="0.1" value={editingOrder.temperatura || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, temperatura: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Temp Termoking (°C)</label>
                                    <input type="number" step="0.1" value={editingOrder.temp_termoking || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, temp_termoking: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Peso Promedio Esperado (kg)</label>
                                    <input type="number" step="0.1" value={editingOrder.peso_promedio || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, peso_promedio: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Fecha Matanza</label>
                                    <input type="date" value={editingOrder.fecha_matanza?.split('T')[0] || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, fecha_matanza: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Condición Vehículo</label>
                                    <select className="modal-select" value={editingOrder.condicion_vehiculo || 'Bien'}
                                        onChange={e => setEditingOrder({ ...editingOrder, condicion_vehiculo: e.target.value })}>
                                        <option>Bien</option><option>Mal</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Condición Cestas</label>
                                    <select className="modal-select" value={editingOrder.condicion_cestas || 'Bien'}
                                        onChange={e => setEditingOrder({ ...editingOrder, condicion_cestas: e.target.value })}>
                                        <option>Bien</option><option>Mal</option>
                                    </select>
                                </div>
                            </div>
                            <div className="input-group" style={{ marginTop: '8px' }}>
                                <label>Observaciones</label>
                                <textarea style={{ width: '100%', minHeight: '64px', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                                    value={editingOrder.observaciones || ''}
                                    onChange={e => setEditingOrder({ ...editingOrder, observaciones: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={saveOrderEdit} disabled={isSaving}>
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .orders-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
                    gap: 24px;
                    padding-bottom: 40px;
                }
                .order-card {
                    background: white;
                    border: 1px solid #fecaca; /* Light border similar to image */
                    border-radius: 24px;
                    padding: 24px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .order-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    border-color: #f87171;
                }
                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .order-id {
                    font-weight: 800;
                    font-size: 18px;
                    color: #1e293b;
                }
                .order-date {
                    font-size: 13px;
                    color: #94a3b8;
                    font-weight: 500;
                }
                .badge.pendiente { background: #fee2e2; color: #991b1b; } /* Slightly more red/orange */
                .badge.procesando { background: #e0f2fe; color: #0369a1; }
                .badge.completado { background: #dcfce7; color: #166534; }
                
                .provider-name {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 4px 0;
                    letter-spacing: -0.025em;
                }
                .matadero-name {
                    font-size: 15px;
                    color: #64748b;
                    margin-bottom: 24px;
                }
                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .footer-pills {
                    display: flex;
                    gap: 12px;
                }
                .footer-pill {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #f1f5f9;
                    padding: 6px 14px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                }
                .card-actions {
                    display: flex;
                    gap: 4px;
                }
                
                .back-btn {
                    background: #9d174d;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .back-btn:hover { background: #830a3aff }

                .search-wrapper { position: relative; display: flex; align-items: center; }
                .search-icon-fixed { position: absolute; left: 18px; color: #94a3b8; pointer-events: none; z-index: 5; }
                .admin-search-input {
                    padding: 14px 16px 14px 52px;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    width: 400px;
                    font-size: 15px;
                    background-color: #ffffff !important;
                    color: #1e293b !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                    font-weight: 500;
                }
                .admin-search-input::placeholder { color: #94a3b8; }
                .admin-search-input:focus {
                    outline: none;
                    border-color: #9d174d;
                    box-shadow: 0 10px 15px -3px rgba(157, 23, 77, 0.1), 0 4px 6px -2px rgba(157, 23, 77, 0.05);
                    width: 460px;
                    transform: translateY(-1px);
                }
                .admin-select {
                    padding: 0 18px;
                    height: 50px;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    background-color: #ffffff !important;
                    color: #1e293b !important;
                    font-weight: 700;
                    font-size: 15px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 16px center;
                    background-size: 18px;
                    padding-right: 48px;
                }
                .admin-select:hover { 
                    border-color: #cbd5e1; 
                    transform: translateY(-1px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
                }
                .admin-select:focus { 
                    outline: none; 
                    border-color: #9d174d; 
                    box-shadow: 0 0 0 4px rgba(157, 23, 77, 0.1);
                }

                .clickable-row { cursor: pointer; transition: background 0.2s; }
                .clickable-row:hover { background: #f8fafc; }

                .res-count-pill {
                    background: #f1f5f9;
                    color: #475569;
                    font-weight: 700;
                    padding: 4px 12px;
                    border-radius: 20px;
                    display: inline-block;
                    font-size: 13px;
                }

                .stat-icon-wrap {
                    padding: 12px;
                    border-radius: 12px;
                    color: white;
                }
                .stat-icon-wrap.info { background: #3b82f6; }
                .stat-icon-wrap.success { background: #10b981; }

                .res-list { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
                .res-item { 
                    border: 1px solid #e2e8f0; 
                    border-radius: 16px; 
                    overflow: hidden; 
                    transition: all 0.3s;
                }
                .res-item.expanded { border-color: #641B2E; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .res-header { 
                    padding: 16px 20px; 
                    display: flex; 
                    align-items: center; 
                    background: white; 
                    cursor: pointer;
                }
                .res-header:hover { background: #fcfcfc; }
                .res-icon { 
                    width: 40px; 
                    height: 40px; 
                    background: #f1f5f9; 
                    border-radius: 10px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-weight: 800;
                    color: #641B2E;
                }
                .res-title { display: block; font-weight: 700; font-size: 14px; color: #1e293b; }
                .res-meta { display: block; font-size: 12px; color: #64748b; }
                .res-actions { display: flex; align-items: center; gap: 12px; color: #94a3b8; }

                .res-details { padding: 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
                .cuts-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
                    gap: 12px; 
                }
                .cut-card {
                    background: white;
                    padding: 12px 16px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .cut-name { font-weight: 600; font-size: 13px; color: #475569; }
                .cut-weight { font-weight: 700; color: #641B2E; }

                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000; backdrop-filter: blur(4px);
                }
                .modal-card {
                    background: white; width: 100%; max-width: 500px;
                    border-radius: 24px; padding: 32px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                }
                .modal-header h3 { color: #1e293b; margin: 0; }
                .input-group { margin-bottom: 20px; }
                .input-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #475569; font-size: 13px; }
                .input-group input, .modal-select { 
                    width: 100%; padding: 12px 16px; border-radius: 12px; 
                    border: 1px solid #e2e8f0; font-size: 15px; 
                    background: white;
                    color: #1e293b;
                }
                .btn-primary { background: #641B2E; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; }
                .btn-secondary { background: #f1f5f9; color: #475569; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; }
                
                .btn-icon {
                    background: none; border: none; color: #64748b; padding: 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s;
                }
                .btn-icon:hover { background: #f1f5f9; color: #1e293b; }
                .btn-icon.delete:hover { background: #fee2e2; color: #ef4444; }
                
                .empty-state { padding: 40px; text-align: center; color: #94a3b8; }
                .loading-state { padding: 40px; text-align: center; color: #641B2E; }
            `}</style>
        </div>
    );
}
