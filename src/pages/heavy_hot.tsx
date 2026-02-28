'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Flame, Search, Scale, Truck, Thermometer, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { WorkstationScaleView } from '@/components/WorkstationScaleView';
import { apiFetch } from '@/lib/api';
import '../styles/heavy_hot.css';
import { StationLogin } from '@/components/stationLogin';

export default function PesoCalientePage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [carcasses, setCarcasses] = useState<any[]>([]);
    const [currentResIndex, setCurrentResIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingCarcasses, setLoadingCarcasses] = useState(false);

    useEffect(() => {
        fetchPendingOrders();
    }, []);

    const fetchPendingOrders = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/orden-compra/pendientes-caliente');
            setOrders(data);
        } catch (error: any) {
            toast.error('Error cargando órdenes: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCarcasses = async (orderId: number) => {
        setLoadingCarcasses(true);
        try {
            const data = await apiFetch(`/reses/by-order/${orderId}`);
            setCarcasses(data);

            // Find first pending index (we assume if it comes from by-order it might have some processed)
            // But for hot weighing, we actually create NEW reses one by one until order.cantidad_res is reached.
            // So we need to know how many are already there.
            const nextIndex = data.length;
            setCurrentResIndex(nextIndex);
        } catch (error: any) {
            toast.error('Error cargando reses: ' + error.message);
        } finally {
            setLoadingCarcasses(false);
        }
    };

    const handleSelectOrder = (order: any) => {
        setSelectedOrder(order);
        fetchCarcasses(order.id);
    };

    const handleCapture = async (peso: number) => {
        if (peso <= 0) return toast.error("Peso inválido");

        try {
            const resData = {
                orden_id: selectedOrder.id,
                estado: 'pesado_caliente',
                peso_caliente: peso,
                fecha_peso_caliente: new Date().toISOString(),
                clasificacion: selectedOrder.clasificacion
            };

            await apiFetch('/reses', {
                method: 'POST',
                body: JSON.stringify(resData)
            });

            toast.success(`Res #${carcasses.length + 1} capturada: ${peso}kg`);

            // Refresh carcasses to see progress
            await fetchCarcasses(selectedOrder.id);

            // Check if order is complete
            if (carcasses.length + 1 >= selectedOrder.cantidad_res) {
                toast.success("¡Orden completada!");
                setSelectedOrder(null);
                fetchPendingOrders();
            }
        } catch (error: any) {
            toast.error('Error al guardar peso: ' + error.message);
        }
    };

    const handleFreeze = async (resId: number | string) => {
        try {
            await apiFetch('/reses/congelar', {
                method: 'PUT',
                body: JSON.stringify({ id: resId })
            });

            toast.success("Res enviada al congelador");
            // Refresh carcasses to see updated status
            if (selectedOrder) {
                await fetchCarcasses(selectedOrder.id);
            }
        } catch (error: any) {
            toast.error('Error al congelar res: ' + error.message);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.id.toString().includes(searchTerm) ||
        o.proveedor_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.placa.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedOrder) {
        return (
            <StationLogin
                stationName="Pesado en Caliente"
                stationIcon={<Flame size={24} />}
                stationColor="bg-destructive"
                targetRole="pesador_caliente"
            >
                <div className="container-main">
                    {loadingCarcasses ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Loader2 className="animate-spin" size={48} color="#641B2E" />
                        </div>
                    ) : (
                        <WorkstationScaleView
                            type="caliente"
                            ticket={{
                                id: `ORD-${selectedOrder.id}`,
                                proveedor: selectedOrder.proveedor_nombre,
                                matadero: selectedOrder.matadero_nombre,
                                placa: selectedOrder.placa,
                                temperatura: selectedOrder.temperatura,
                                reses: Array.from({ length: selectedOrder.cantidad_res }, (_, i) => {
                                    const existing = carcasses.find(c => c.numero === i + 1);
                                    return {
                                        id: existing?.id || `new-${i}`,
                                        numero: i + 1,
                                        peso: existing?.peso_caliente || null,
                                        estado: existing?.estado || 'pendiente'
                                    };
                                })
                            }}
                            currentResIndex={currentResIndex}
                            onBack={() => {
                                setSelectedOrder(null);
                                fetchPendingOrders();
                            }}
                            onCapture={handleCapture}
                            onFreeze={handleFreeze}
                            onBone={() => { }}
                        />
                    )}
                </div>
            </StationLogin>
        );
    }

    return (
        <StationLogin
            stationName="Pesado en Caliente"
            stationIcon={<Flame size={24} />}
            stationColor="bg-destructive"
            targetRole="pesador_caliente"
        >
            <div className="container-main">
                <div className="header-section">
                    <div className="icon-box"><Flame size={24} /></div>
                    <div className="header-titles">
                        <h1>Pesado en Caliente</h1>
                        <p>Registro de peso inicial de reses recién recibidas</p>
                    </div>
                </div>

                <div className="search-container">
                    <Search className="search-icon-pos" size={18} />
                    <input
                        className="search-input"
                        placeholder="Buscar por ID, proveedor o placa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                        <Loader2 className="animate-spin" size={48} color="#641B2E" />
                    </div>
                ) : (
                    <>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <div className="stat-circle" style={{ background: '#fffaf0', color: '#dd6b20' }}><Flame size={20} /></div>
                                <div><b style={{ fontSize: '20px' }}>{orders.length}</b><br /><span className="stat-label">Ordenes Pendientes</span></div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-circle" style={{ background: '#faf5ff', color: '#805ad5' }}><Scale size={20} /></div>
                                <div><b style={{ fontSize: '20px' }}>{orders.reduce((acc, o) => acc + o.cantidad_res, 0)}</b><br /><span className="stat-label">Reses totales</span></div>
                            </div>
                        </div>

                        <h3 style={{ fontFamily: 'serif', marginBottom: '15px' }}>Seleccionar Orden</h3>
                        {filteredOrders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                No se encontraron órdenes pendientes.
                            </div>
                        ) : (
                            filteredOrders.map(o => (
                                <div key={o.id} className="ticket-card" onClick={() => handleSelectOrder(o)}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ background: '#fdf2f4', color: '#641B2E', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold' }}>#{o.id}</div>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{o.proveedor_nombre}</h4>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{o.matadero_nombre}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#64748b' }}>
                                        <span><Truck size={14} /> {o.placa}</span>
                                        <span style={{ color: '#dd6b20' }}><Thermometer size={14} /> {o.temperatura}°C</span>
                                        <div className="data-item">
                                            <span className="res-count">{o.reses_procesadas} / {o.cantidad_res}</span>
                                            <span className="res-label">Reses</span>
                                        </div>
                                        <span style={{ background: '#edf2f7', padding: '2px 8px', borderRadius: '10px' }}>
                                            {o.reses_pendientes_congelador > 0 ? 'Pendiente Enviar Frío' : (o.reses_procesadas > 0 ? 'En proceso' : 'Pendiente')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>
        </StationLogin>
    );
}
