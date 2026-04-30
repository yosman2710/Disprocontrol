'use client';
import {
    Scissors, Search, Trash2, CheckCircle, ChevronLeft,
    Loader2, LogOut, LayoutDashboard, Activity, Package, Truck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { StationLogin } from '@/components/stationLogin';
import { ScaleReal } from '@/components/ScaleReal';
import { apiFetch, handleLogout } from '@/lib/api';
import '../styles/corte_items.css';

export default function CorteItemsPage() {
    const router = useRouter();

    // ── STATE ─────────────────────────────────────────────────
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [carcasses, setCarcasses] = useState<any[]>([]);
    const [currentResIndex, setCurrentResIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingCarcasses, setLoadingCarcasses] = useState(false);

    const [tipoCorte, setTipoCorte] = useState<string>('');
    const [tiposCorte, setTiposCorte] = useState<any[]>([]);
    const [clasificacion, setClasificacion] = useState<string>('AA');
    const [almacen, setAlmacen] = useState<string>('Almacén 1');
    const [cortesTemp, setCortesTemp] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const almacenes = ['Almacén 1', 'Almacén 2', 'Almacén 3', 'Almacén 4', 'Almacén 5'];

    // ── EFFECTS ───────────────────────────────────────────────
    useEffect(() => { fetchOrders(); fetchTiposCorte(); }, []);

    // ── API ───────────────────────────────────────────────────
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/orden-compra/pendientes-corte');
            setOrders(data);
        } catch (error: any) {
            toast.error('Error cargando órdenes: ' + error.message);
        } finally { setLoading(false); }
    };

    const fetchTiposCorte = async () => {
        try {
            const response = await apiFetch('/tipos-corte');
            if (response.success) setTiposCorte(response.data);
        } catch (error: any) { console.error('Error fetching cut types:', error); }
    };

    const fetchCarcasses = async (orderId: number) => {
        setLoadingCarcasses(true);
        try {
            const data = await apiFetch(`/reses/by-order/${orderId}`);
            const corteCarcasses = data.filter((c: any) =>
                ['congelador', 'desguazado', 'completado'].includes(c.estado)
            );
            setCarcasses(corteCarcasses);
            const firstPending = corteCarcasses.findIndex((c: any) => c.estado === 'congelador');
            setCurrentResIndex(firstPending !== -1 ? firstPending : 0);
        } catch (error: any) {
            toast.error('Error cargando reses: ' + error.message);
        } finally { setLoadingCarcasses(false); }
    };

    const handleSelectOrder = (order: any) => {
        setSelectedOrder(order);
        fetchCarcasses(order.id);
    };

    const handleBack = () => {
        setSelectedOrder(null);
        setCarcasses([]);
        setCortesTemp([]);
        fetchOrders();
    };

    const handleSelectRes = (idx: number) => {
        if (carcasses[idx]?.estado === 'completado') return;
        setCurrentResIndex(idx);
        setCortesTemp([]);
        setTipoCorte('');
    };

    const handleAddCut = (peso: number) => {
        if (!tipoCorte) { toast.error('Seleccione un tipo de ítem'); return; }
        const tipoSeleccionado = tiposCorte.find(t => t.id.toString() === tipoCorte);
        if (!tipoSeleccionado) { toast.error('Tipo de ítem no encontrado'); return; }
        setCortesTemp([...cortesTemp, {
            id: Date.now(),
            tipo_corte_id: tipoSeleccionado.id,
            tipo_nombre: tipoSeleccionado.nombre,
            clasificacion, almacen, peso
        }]);
        toast.success(`${tipoSeleccionado.nombre}: ${peso} kg`);
    };

    const handleRemoveCut = (id: number) => setCortesTemp(cortesTemp.filter(c => c.id !== id));

    const handleFinalizeRes = async () => {
        if (cortesTemp.length === 0) { toast.error('Debe registrar al menos un ítem'); return; }
        setIsSaving(true);
        const currentRes = carcasses[currentResIndex];
        try {
            await apiFetch('/deshueze', {
                method: 'POST',
                body: JSON.stringify({
                    id: currentRes.id,
                    cortes: cortesTemp.map(c => ({
                        tipo_corte_id: c.tipo_corte_id,
                        clasificacion: c.clasificacion,
                        almacen: c.almacen,
                        peso: c.peso
                    }))
                })
            });
            toast.success(`Res #${currentRes.numero} finalizada ✓`);
            setCortesTemp([]);
            setTipoCorte('');
            await fetchCarcasses(selectedOrder.id);
        } catch (error: any) {
            toast.error('Error al finalizar res: ' + error.message);
        } finally { setIsSaving(false); }
    };

    // ── DERIVED ───────────────────────────────────────────────
    const filteredOrders = orders.filter(o =>
        o.id?.toString().includes(searchTerm) ||
        o.proveedor_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentRes = carcasses[currentResIndex];
    const totalPesoCortes = cortesTemp.reduce((sum, c) => sum + (Number(c.peso) || 0), 0);
    const rendimiento = currentRes?.peso_romana
        ? (totalPesoCortes / Number(currentRes.peso_romana)) * 100 : 0;
    const completadas = carcasses.filter(c => c.estado === 'completado').length;
    const progressPct = carcasses.length > 0 ? Math.round((completadas / carcasses.length) * 100) : 0;

    // ═══════════════════════════════════════════════════════════
    //  VISTA A — LISTA DE ÓRDENES PARA CORTE
    // ═══════════════════════════════════════════════════════════
    if (!selectedOrder) {
        return (
            <StationLogin
                stationName="Corte de Ítems"
                stationIcon={<Scissors size={24} />}
                stationColor="bg-[#7c3aed]"
                targetRole="deshuesador"
            >
                <div className="ci-page-wrapper">
                    <div className="ci-top-nav">
                        <button className="ci-nav-btn" onClick={() => router.push('/')}>
                            <LayoutDashboard size={15} /> Panel Principal
                        </button>
                        <h1>Corte de Ítems</h1>
                        <button className="ci-nav-btn" onClick={handleLogout}>
                            <LogOut size={15} /> Cerrar Sesión
                        </button>
                    </div>

                    <div className="ci-body">
                        <div className="ci-search-wrap">
                            <Search className="ci-search-icon" size={18} />
                            <input
                                id="ci-search"
                                className="ci-search-input"
                                placeholder="Buscar por ID u orden..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {loading ? (
                            <div className="ci-loading">
                                <Loader2 className="animate-spin" size={48} color="#7c3aed" />
                            </div>
                        ) : (
                            <div className="ci-orders-grid">
                                {filteredOrders.length === 0 ? (
                                    <div className="ci-empty">No hay órdenes pendientes para corte.</div>
                                ) : filteredOrders.map(order => (
                                    <div
                                        key={order.id}
                                        id={`ci-order-${order.id}`}
                                        className="ci-order-card"
                                        onClick={() => handleSelectOrder(order)}
                                    >
                                        <div className="ci-card-top">
                                            <span className="ci-badge">ORD #{order.id}</span>
                                            <span className="ci-placa"><Truck size={12} /> {order.placa || '—'}</span>
                                        </div>
                                        <h3>{order.proveedor_nombre}</h3>
                                        <p>{order.matadero_nombre}</p>
                                        <div className="ci-card-footer">
                                            <span className="ci-reses-chip">
                                                <Package size={12} />
                                                {order.reses_en_congelador} reses listas
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </StationLogin>
        );
    }

    // ═══════════════════════════════════════════════════════════
    //  VISTA B — ESTACIÓN DE CORTE DE ÍTEMS
    // ═══════════════════════════════════════════════════════════
    return (
        <StationLogin
            stationName="Corte de Ítems"
            stationIcon={<Scissors size={24} />}
            stationColor="bg-[#7c3aed]"
            targetRole="deshuesador"
        >
            <div className="ci-station-page">

                {/* ── Top bar ── */}
                <div className="ci-topbar">
                    <div className="ci-topbar-left">
                        <button className="ci-back-btn" onClick={handleBack}>
                            <ChevronLeft size={16} />
                        </button>
                        <div className="ci-order-id">
                            <span className="ci-station-badge">
                                <Activity size={10} /> Estación de Corte
                            </span>
                            <h2>ORD-{selectedOrder.id} <span>{selectedOrder.proveedor_nombre}</span></h2>
                        </div>
                    </div>

                    <div className="ci-topbar-meta">
                        <div className="ci-meta-item">
                            <label>Matadero</label>
                            <span>{selectedOrder.matadero_nombre}</span>
                        </div>
                        <div className="ci-meta-item">
                            <label>Placa</label>
                            <span>{selectedOrder.placa || '—'}</span>
                        </div>
                        <div className="ci-meta-item">
                            <label>Total Reses</label>
                            <span>{carcasses.length}</span>
                        </div>
                    </div>

                    <div className="ci-progress-wrap">
                        <div className="ci-progress-info">
                            <span>Progreso Corte</span>
                            <strong>{completadas}/{carcasses.length}</strong>
                        </div>
                        <div className="ci-progress-track">
                            <div className="ci-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                {loadingCarcasses ? (
                    <div className="ci-loading-full">
                        <Loader2 className="animate-spin" size={40} color="#7c3aed" />
                        <span>Cargando reses...</span>
                    </div>
                ) : (
                    <div className="ci-content">

                        {/* ── Left: trabajo ── */}
                        <div className="ci-left-card">

                            {/* Res selector row — cuadros pequeños clickeables */}
                            <div className="ci-res-row-wrap">
                                <div className="ci-res-row-label">
                                    Seleccionar Res — clic para cambiar
                                </div>
                                <div className="ci-res-row">
                                    {carcasses.map((res, idx) => (
                                        <div
                                            key={res.id}
                                            id={`ci-res-num-${res.numero}`}
                                            className={`ci-res-num${idx === currentResIndex ? ' active' : ''}${res.estado === 'completado' ? ' done' : ''}`}
                                            onClick={() => handleSelectRes(idx)}
                                            title={`Res #${res.numero} — ${res.estado}`}
                                        >
                                            {res.numero}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Res info strip */}
                            {currentRes && (
                                <div className="ci-res-info-strip">
                                    <div className="ci-res-stat">
                                        <label>Res Actual</label>
                                        <span>#{currentRes.numero} — {currentRes.tipo_de_res || 'N/A'}</span>
                                    </div>
                                    <div className="ci-res-stat">
                                        <label>Peso Romana</label>
                                        <span>{Number(currentRes.peso_romana || 0).toFixed(2)} kg</span>
                                    </div>
                                    <div className="ci-res-stat">
                                        <label>Total Ítems</label>
                                        <span>{totalPesoCortes.toFixed(2)} kg</span>
                                    </div>
                                    <div className="ci-res-stat">
                                        <label>Rendimiento</label>
                                        <span className={
                                            rendimiento > 75 ? 'ci-stat-green' :
                                            rendimiento > 0 ? 'ci-stat-amber' : ''
                                        }>
                                            {rendimiento.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Form — tipo + clasificación + almacén */}
                            <div className="ci-form-row">
                                <div className="ci-field">
                                    <label>Tipo de Ítem</label>
                                    <select
                                        id="ci-tipo-corte"
                                        value={tipoCorte}
                                        onChange={e => setTipoCorte(e.target.value)}
                                        disabled={currentRes?.estado === 'completado'}
                                    >
                                        <option value="">— Seleccionar —</option>
                                        {tiposCorte.map(t => (
                                            <option key={t.id} value={t.id}>{t.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="ci-field">
                                    <label>Clasificación</label>
                                    <select
                                        id="ci-clasificacion"
                                        value={clasificacion}
                                        onChange={e => setClasificacion(e.target.value)}
                                        disabled={currentRes?.estado === 'completado'}
                                    >
                                        {['AA','A','B','C','D'].map(v => <option key={v}>{v}</option>)}
                                    </select>
                                </div>
                                <div className="ci-field">
                                    <label>Almacén</label>
                                    <select
                                        id="ci-almacen"
                                        value={almacen}
                                        onChange={e => setAlmacen(e.target.value)}
                                        disabled={currentRes?.estado === 'completado'}
                                    >
                                        {almacenes.map(a => <option key={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Scale */}
                            <div className="ci-scale-box">
                                <div className="ci-scale-box-header">
                                    <div className="ci-scale-dot" />
                                    <span>
                                        Báscula — {tipoCorte
                                            ? tiposCorte.find(t => t.id.toString() === tipoCorte)?.nombre
                                            : 'Nuevo Ítem'
                                        } — Res #{currentRes?.numero}
                                    </span>
                                </div>
                                <ScaleReal
                                    title={`Báscula — Res #${currentRes?.numero}`}
                                    icon={<Scissors size={20} />}
                                    resNumber={currentRes?.numero}
                                    onCapture={handleAddCut}
                                    variant="corte"
                                    disabled={currentRes?.estado === 'completado' || isSaving}
                                />
                            </div>
                        </div>

                        {/* ── Right: items registrados ── */}
                        <div className="ci-right-card">
                            <div className="ci-list-header">
                                <h3>Ítems Registrados</h3>
                                <span className="ci-list-pill">{cortesTemp.length} ítems</span>
                            </div>

                            <div className="ci-items-scroll">
                                {cortesTemp.length === 0 ? (
                                    <div className="ci-items-empty">
                                        <Scissors size={28} style={{ opacity: 0.3 }} />
                                        <p>Pesea el primer ítem<br />para registrarlo aquí</p>
                                    </div>
                                ) : cortesTemp.map(c => (
                                    <div key={c.id} className="ci-cut-item">
                                        <div className="ci-cut-icon">
                                            <Scissors size={14} />
                                        </div>
                                        <div className="ci-cut-info">
                                            <strong>{c.tipo_nombre}</strong>
                                            <span>{c.clasificacion} · {c.almacen}</span>
                                        </div>
                                        <div className="ci-cut-weight">
                                            {Number(c.peso).toFixed(2)} kg
                                        </div>
                                        <button
                                            className="ci-delete-btn"
                                            onClick={() => handleRemoveCut(c.id)}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Total strip */}
                            {cortesTemp.length > 0 && (
                                <div className="ci-total-strip">
                                    <span>Total registrado</span>
                                    <strong>{totalPesoCortes.toFixed(2)} kg</strong>
                                </div>
                            )}

                            {/* Finalize button */}
                            <div className="ci-finalize-wrap">
                                <button
                                    id="ci-finalize-btn"
                                    className={`ci-finalize-btn${cortesTemp.length > 0 && !isSaving ? ' ready' : ''}`}
                                    disabled={cortesTemp.length === 0 || isSaving || currentRes?.estado === 'completado'}
                                    onClick={handleFinalizeRes}
                                >
                                    {isSaving
                                        ? <><Loader2 className="animate-spin" size={18} /> Guardando...</>
                                        : <><CheckCircle size={18} /> Finalizar Res #{currentRes?.numero}</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StationLogin>
    );
}
