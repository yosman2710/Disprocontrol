'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Scale, Search, Truck, Thermometer, Loader2,
    CheckCircle, LogOut, LayoutDashboard, ChevronLeft, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { ScaleReal } from '@/components/ScaleReal';
import { apiFetch, handleLogout } from '@/lib/api';
import '../styles/recepcion.css';
import { StationLogin } from '@/components/stationLogin';

export default function RecepcionPage() {
    const router = useRouter();

    // ── STATE ─────────────────────────────────────────────────
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [carcasses, setCarcasses] = useState<any[]>([]);
    const [currentResIndex, setCurrentResIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingCarcasses, setLoadingCarcasses] = useState(false);

    const [resForm, setResForm] = useState({
        peso_ticket: '',
        tipo_res: 'Novillo',
        sexo: 'Macho',
        clasificacion: 'AA',
        piezas: '2',
        temperatura: ''
    });

    // ── EFFECTS ───────────────────────────────────────────────
    useEffect(() => { fetchPendingOrders(); }, []);

    // ── API ───────────────────────────────────────────────────
    const fetchPendingOrders = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/orden-compra/pendientes-recepcion');
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
            setCurrentResIndex(data.length);
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

    const handleBackToList = () => {
        setSelectedOrder(null);
        setCarcasses([]);
        setCurrentResIndex(0);
        setResForm({ peso_ticket: '', tipo_res: 'Novillo', sexo: 'Macho', clasificacion: 'AA', piezas: '2', temperatura: '' });
    };

    const handleCapture = async (pesoRomana: number) => {
        if (pesoRomana <= 0) return toast.error('Peso romana inválido');
        if (!resForm.peso_ticket) return toast.error('Debe ingresar el peso del ticket');
        try {
            await apiFetch('/reses', {
                method: 'POST',
                body: JSON.stringify({
                    orden_id: selectedOrder.id,
                    peso_romana: pesoRomana,
                    peso_ticket: parseFloat(resForm.peso_ticket),
                    tipo_de_res: resForm.tipo_res,
                    sexo: resForm.sexo,
                    clasificacion: resForm.clasificacion,
                    piezas: parseInt(resForm.piezas),
                    temperatura: parseFloat(resForm.temperatura || '0')
                })
            });
            toast.success(`Res #${carcasses.length + 1} capturada ✓`);
            setResForm({ ...resForm, peso_ticket: '', temperatura: '' });
            await fetchCarcasses(selectedOrder.id);
            if (carcasses.length + 1 >= selectedOrder.cantidad_res) {
                toast.success('¡Orden completada! 🎉');
                handleBackToList();
                fetchPendingOrders();
            }
        } catch (error: any) {
            toast.error('Error al guardar res: ' + error.message);
        }
    };

    // ── DERIVED ───────────────────────────────────────────────
    const filteredOrders = orders.filter(o =>
        o.id.toString().includes(searchTerm) ||
        o.proveedor_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.placa.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const progressPct = selectedOrder
        ? Math.round((carcasses.length / selectedOrder.cantidad_res) * 100)
        : 0;

    // ═══════════════════════════════════════════════════════════
    //  VISTA B — ESTACIÓN DE PESADO
    //  Diseño propio, independiente de la recepción
    // ═══════════════════════════════════════════════════════════
    if (selectedOrder) {
        return (
            <StationLogin
                stationName="Recepción de Materia Prima"
                stationIcon={<Scale size={24} />}
                stationColor="bg-[#641B2E]"
                targetRole="pesador_caliente"
            >
                <div className="ws-page">

                    {/* ── Top bar ── */}
                    <div className="ws-topbar">
                        <div className="ws-topbar-left">
                            <button className="ws-back-btn" onClick={handleBackToList}>
                                <ChevronLeft size={16} />
                            </button>
                            <div className="ws-order-id">
                                <span className="ws-station-badge">
                                    <Activity size={10} /> Estación de Pesado
                                </span>
                                <h2>ORD-{selectedOrder.id} <span>{selectedOrder.proveedor_nombre}</span></h2>
                            </div>
                        </div>

                        <div className="ws-topbar-meta">
                            <div className="ws-meta-item">
                                <label>Matadero</label>
                                <span>{selectedOrder.matadero_nombre}</span>
                            </div>
                            <div className="ws-meta-item">
                                <label>Placa</label>
                                <span>{selectedOrder.placa}</span>
                            </div>
                            <div className="ws-meta-item">
                                <label>Temp. Termo</label>
                                <span className="ws-temp">{selectedOrder.temperatura}°C</span>
                            </div>
                            <div className="ws-meta-item">
                                <label>Total Reses</label>
                                <span>{selectedOrder.cantidad_res}</span>
                            </div>
                        </div>

                        <div className="ws-progress-wrap">
                            <div className="ws-progress-info">
                                <span>Progreso Recepción</span>
                                <strong>{carcasses.length}/{selectedOrder.cantidad_res}</strong>
                            </div>
                            <div className="ws-progress-track">
                                <div className="ws-progress-fill" style={{ width: `${progressPct}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* ── Main content ── */}
                    {loadingCarcasses ? (
                        <div className="ws-loading">
                            <Loader2 className="animate-spin" size={40} color="#742a2a" />
                            <span>Cargando reses...</span>
                        </div>
                    ) : (
                        <div className="ws-content">

                            {/* Left work column */}
                            <div className="ws-left-card">

                                {/* Res number row */}
                                <div className="ws-res-row-wrap">
                                    <div className="ws-res-row-label">
                                        Progreso individual — res en proceso resaltada
                                    </div>
                                    <div className="ws-res-row">
                                        {Array.from({ length: selectedOrder.cantidad_res }, (_, i) => {
                                            const isDone = carcasses.some(c => c.numero === i + 1);
                                            const isActive = i === currentResIndex;
                                            return (
                                                <div
                                                    key={i}
                                                    id={`res-num-${i + 1}`}
                                                    className={`ws-res-num${isDone ? ' done' : isActive ? ' active' : ''}`}
                                                >
                                                    {i + 1}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Scale widget */}
                                <div className="ws-scale-box">
                                    <div className="ws-scale-box-header">
                                        <div className="ws-scale-dot" />
                                        <span>Báscula Romana — Res #{currentResIndex + 1}</span>
                                    </div>
                                    <ScaleReal
                                        title={`Peso Romana — Res #${currentResIndex + 1}`}
                                        icon={<Scale size={20} />}
                                        resNumber={currentResIndex + 1}
                                        onCapture={handleCapture}
                                        variant="hot"
                                        disabled={carcasses.some(c => c.numero === currentResIndex + 1)}
                                    />
                                </div>

                                {/* Form */}
                                <div className="ws-form-grid">
                                    <div className="ws-field">
                                        <label>Peso Ticket (kg)</label>
                                        <input id="ws-peso-ticket" type="number" step="0.01"
                                            value={resForm.peso_ticket}
                                            onChange={e => setResForm({ ...resForm, peso_ticket: e.target.value })}
                                            placeholder="0.00" />
                                    </div>
                                    <div className="ws-field">
                                        <label>Tipo de Res</label>
                                        <select id="ws-tipo-res" value={resForm.tipo_res}
                                            onChange={e => setResForm({ ...resForm, tipo_res: e.target.value })}>
                                            <option>Novillo</option><option>Novilla</option>
                                            <option>Torete</option><option>Toro</option>
                                            <option>Buvillo</option><option>Buvilla</option>
                                            <option>Vaca</option>
                                        </select>
                                    </div>
                                    <div className="ws-field">
                                        <label>Sexo</label>
                                        <select id="ws-sexo" value={resForm.sexo}
                                            onChange={e => setResForm({ ...resForm, sexo: e.target.value })}>
                                            <option>Macho</option><option>Hembra</option>
                                        </select>
                                    </div>
                                    <div className="ws-field">
                                        <label>Clasificación</label>
                                        <select id="ws-clasificacion" value={resForm.clasificacion}
                                            onChange={e => setResForm({ ...resForm, clasificacion: e.target.value })}>
                                            <option>AA</option><option>A</option>
                                            <option>B</option><option>C</option><option>D</option>
                                        </select>
                                    </div>
                                    <div className="ws-field ws-field--full">
                                        <label>Temperatura (°C) — opcional</label>
                                        <input id="ws-temp" type="number" step="0.1"
                                            value={resForm.temperatura}
                                            onChange={e => setResForm({ ...resForm, temperatura: e.target.value })}
                                            placeholder="Ej: 4.5" />
                                    </div>
                                </div>
                            </div>

                            {/* Right res list */}
                            <div className="ws-right-card">
                                <div className="ws-list-header">
                                    <h3>Reses de la Orden</h3>
                                    <span className="ws-list-pill">{carcasses.length}/{selectedOrder.cantidad_res}</span>
                                </div>
                                <div className="ws-list-scroll">
                                    {Array.from({ length: selectedOrder.cantidad_res }, (_, i) => {
                                        const res = carcasses.find(c => c.numero === i + 1);
                                        const isCurrent = i === currentResIndex;
                                        return (
                                            <div key={i}
                                                id={`ws-res-${i + 1}`}
                                                className={`ws-res-item${res ? ' done' : isCurrent ? ' current' : ''}`}
                                            >
                                                <div className="ws-res-num-badge">#{i + 1}</div>
                                                <div className="ws-res-info">
                                                    <strong>Res #{i + 1}</strong>
                                                    <span>{res
                                                        ? `${res.peso_romana} kg romana · ${res.peso_ticket} kg ticket`
                                                        : isCurrent ? 'En proceso...' : 'Pendiente'
                                                    }</span>
                                                </div>
                                                {res
                                                    ? <CheckCircle size={18} className="ws-check" />
                                                    : <div className={`ws-dot${isCurrent ? ' active' : ''}`} />
                                                }
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </StationLogin>
        );
    }

    // ═══════════════════════════════════════════════════════════
    //  VISTA A — RECEPCIÓN DE ÓRDENES
    // ═══════════════════════════════════════════════════════════
    return (
        <StationLogin
            stationName="Recepción de Materia Prima"
            stationIcon={<Scale size={24} />}
            stationColor="bg-[#641B2E]"
            targetRole="pesador_caliente"
        >
            <div className="recepcion-page-wrapper">
                <div className="top-nav-dark">
                    <button className="nav-btn-light" onClick={() => router.push('/')}>
                        <LayoutDashboard size={15} /> Panel Principal
                    </button>
                    <h1>Recepción de Materia Prima</h1>
                    <button className="nav-btn-light" onClick={handleLogout}>
                        <LogOut size={15} /> Cerrar Sesión
                    </button>
                </div>

                <div className="recepcion-body">
                    <div className="recepcion-search-wrap">
                        <Search className="search-icon-pos" size={18} />
                        <input id="recepcion-search" className="search-input"
                            placeholder="Buscar por ID, proveedor o placa..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)} />
                    </div>

                    {loading ? (
                        <div className="orders-loading">
                            <Loader2 className="animate-spin" size={48} color="#742a2a" />
                        </div>
                    ) : (
                        <div className="orders-grid">
                            {filteredOrders.length === 0 ? (
                                <div className="orders-empty">No se encontraron órdenes pendientes.</div>
                            ) : filteredOrders.map(o => {
                                const pct = (o.reses_procesadas / o.cantidad_res) * 100;
                                return (
                                    <div key={o.id} id={`order-card-${o.id}`}
                                        className="order-card"
                                        onClick={() => handleSelectOrder(o)}>
                                        <div className="order-card-top">
                                            <span className="order-badge">ORD #{o.id}</span>
                                            <span className="order-placa"><Truck size={12} /> {o.placa}</span>
                                        </div>
                                        <h3>{o.proveedor_nombre}</h3>
                                        <p className="order-card-sub">{o.matadero_nombre}</p>
                                        <div className="order-card-footer">
                                            <span className="order-temp"><Thermometer size={13} /> {o.temperatura}°C Termo</span>
                                            <span className="order-reses-count">{o.reses_procesadas} / {o.cantidad_res} reses</span>
                                        </div>
                                        <div className="order-progress-bar">
                                            <div className="order-progress-fill" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </StationLogin>
    );
}
