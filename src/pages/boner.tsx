import {
    Scissors, Search, Package, Trash2, CheckCircle, ChevronLeft, Loader2, Bone
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { StationLogin } from '@/components/stationLogin';
import { ScaleReal } from '@/components/ScaleReal';
import { apiFetch } from '@/lib/api';
import { WorkstationScaleView } from '@/components/WorkstationScaleView';
import '../styles/boner.css';

export default function BonerPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [carcasses, setCarcasses] = useState<any[]>([]);
    const [currentResIndex, setCurrentResIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingCarcasses, setLoadingCarcasses] = useState(false);

    // Form for cuts
    const [tipoCorte, setTipoCorte] = useState<string>('');
    const [tiposCorte, setTiposCorte] = useState<any[]>([]);
    const [clasificacion, setClasificacion] = useState<string>('Primera');
    const [cortesTemp, setCortesTemp] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchOrders();
        fetchTiposCorte();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/orden-compra/pendientes-deshuese');
            setOrders(data);
        } catch (error: any) {
            toast.error('Error cargando órdenes: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchTiposCorte = async () => {
        try {
            const response = await apiFetch('/tipos-corte');
            if (response.success) {
                setTiposCorte(response.data);
            }
        } catch (error: any) {
            console.error('Error fetching cut types:', error);
        }
    };

    const fetchCarcasses = async (orderId: number) => {
        setLoadingCarcasses(true);
        try {
            const data = await apiFetch(`/reses/by-order/${orderId}`);
            // Solo mostramos las reses que han sido enviadas a deshuese
            const boningCarcasses = data.filter((c: any) =>
                ['desguazado'].includes(c.estado)
            );
            setCarcasses(boningCarcasses);

            // Auto-select first pending res (if any)
            const firstPending = boningCarcasses.findIndex((c: any) => c.estado === 'desguazado');
            if (firstPending !== -1) setCurrentResIndex(firstPending);
            else setCurrentResIndex(0);

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

    const handleBack = () => {
        setSelectedOrder(null);
        setCarcasses([]);
        setCortesTemp([]);
        fetchOrders();
    };

    const handleAddCut = (peso: number) => {
        if (!tipoCorte) {
            toast.error('Seleccione un tipo de corte');
            return;
        }

        const tipoSeleccionado = tiposCorte.find(t => t.id.toString() === tipoCorte);
        if (!tipoSeleccionado) {
            toast.error('Tipo de corte no encontrado');
            return;
        }

        const nuevoCorte = {
            id: Date.now(), // Temp ID for list identification
            tipo_corte_id: tipoSeleccionado.id, // This is a UUID string
            tipo_nombre: tipoSeleccionado.nombre,
            clasificacion,
            peso
        };

        console.log('Agregando corte temporal:', nuevoCorte);
        setCortesTemp([...cortesTemp, nuevoCorte]);
        toast.success(`${tipoSeleccionado.nombre} agregado: ${peso} kg`);
    };

    const handleRemoveCut = (id: number) => {
        setCortesTemp(cortesTemp.filter(c => c.id !== id));
    };

    const handleMarkBone = async (resId: number | string) => {
        setIsSaving(true);
        try {
            await apiFetch('/reses/desguazar', {
                method: 'PUT',
                body: JSON.stringify({ id: resId })
            });
            toast.success('Res marcada para deshuese');
            await fetchCarcasses(selectedOrder.id);
        } catch (error: any) {
            toast.error('Error al marcar para deshuese: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinalizeRes = async () => {
        if (cortesTemp.length === 0) {
            toast.error('Debe registrar al menos un corte');
            return;
        }

        setIsSaving(true);
        const currentRes = carcasses[currentResIndex];

        try {
            const validCuts = cortesTemp.map(c => ({
                tipo_corte_id: c.tipo_corte_id,
                clasificacion: c.clasificacion,
                peso: c.peso
            }));

            if (validCuts.length === 0) {
                toast.error('No hay cortes válidos para registrar');
                return;
            }

            const payload = {
                id: currentRes.id,
                cortes: validCuts
            };

            console.log('Enviando datos de deshuese final:', payload);
            if (payload.cortes.some(c => !c.tipo_corte_id)) {
                console.error('CRÍTICO: El payload contiene IDs nulos:', payload);
                toast.error('Error interno: Datos de corte corruptos');
                return;
            }

            await apiFetch('/deshueze', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            toast.success(`Res #${currentRes.numero} finalizada con éxito`);
            setCortesTemp([]);
            setTipoCorte('');

            // Refresh carcasses
            await fetchCarcasses(selectedOrder.id);

        } catch (error: any) {
            toast.error('Error al finalizar res: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.id?.toString().includes(searchTerm) ||
        o.proveedor_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentRes = carcasses[currentResIndex];
    const totalPesoCortes = cortesTemp.reduce((sum, c) => sum + (Number(c.peso) || 0), 0);
    const rendimiento = currentRes?.peso_frio ? (totalPesoCortes / Number(currentRes.peso_frio)) * 100 : 0;

    if (!selectedOrder) {
        return (
            <StationLogin
                stationName="Deshuesado"
                stationIcon={<Scissors size={24} />}
                stationColor="bg-[#7c3aed]"
                targetRole="deshuesador"
            >
                <div className="boner-container">
                    <div className="boner-header">
                        <div className="boner-title">
                            <h1>Estación de Deshuesado</h1>
                            <p>Registro de cortes extraídos</p>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon"><Package size={24} /></div>
                            <div className="stat-info">
                                <label>Órdenes Listas</label>
                                <span>{orders.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="search-container">
                        <Search className="search-icon" size={20} />
                        <input
                            className="search-input"
                            placeholder="Buscar por ID u orden..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="empty-state"><Loader2 className="animate-spin" size={40} /></div>
                    ) : (
                        <div className="tickets-grid">
                            {filteredOrders.length === 0 ? (
                                <div className="empty-state" style={{ gridColumn: '1/-1' }}>No hay órdenes pendientes para deshuese</div>
                            ) : (
                                filteredOrders.map(order => (
                                    <div key={order.id} className="ticket-card" onClick={() => handleSelectOrder(order)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3>{order.proveedor_nombre}</h3>
                                            <span className="badge badge-violet">Orden #{order.id}</span>
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                            <p>{order.matadero_nombre}</p>
                                            <p>📅 {new Date(order.fecha).toLocaleDateString()}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                            <span className="badge" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                                                🔪 {order.reses_en_deshuese} reses listas
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </StationLogin>
        );
    }

    return (
        <StationLogin
            stationName="Deshuesado"
            stationIcon={<Scissors size={24} />}
            stationColor="bg-[#7c3aed]"
            targetRole="deshuesador"
        >
            <div className="boner-container">
                <WorkstationScaleView
                    type="deshuesado"
                    ticket={{
                        id: selectedOrder.id.toString(),
                        proveedor: selectedOrder.proveedor_nombre,
                        matadero: selectedOrder.matadero_nombre,
                        placa: selectedOrder.placa,
                        temperatura: selectedOrder.temperatura || 0,
                        reses: carcasses.map(c => ({
                            id: c.id,
                            numero: c.numero,
                            peso: c.peso_frio,
                            estado: c.estado
                        }))
                    }}
                    currentResIndex={currentResIndex}
                    onBack={handleBack}
                    onCapture={() => { }} // Not used here directly
                    onFreeze={() => { }} // Not used here
                    onBone={handleMarkBone}
                />

                <div className="boner-grid" style={{ marginTop: '24px' }}>
                    <div className="col-left">
                        {currentRes && currentRes.estado === 'desguazado' ? (
                            <>
                                <div className="boner-card">
                                    <h4 className="card-title"><Bone size={20} /> Registrar Cortes - Res #{currentRes.numero}</h4>

                                    <div className="form-grid">
                                        <div className="field-group">
                                            <label>Tipo de Corte</label>
                                            <select
                                                className="input-select"
                                                value={tipoCorte}
                                                onChange={(e) => setTipoCorte(e.target.value)}
                                            >
                                                <option value="">Seleccione Corte</option>
                                                {tiposCorte.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="field-group">
                                            <label>Clasificación</label>
                                            <select
                                                className="input-select"
                                                value={clasificacion}
                                                onChange={(e) => setClasificacion(e.target.value)}
                                            >
                                                <option value="Premium">Premium</option>
                                                <option value="Primera">Primera</option>
                                                <option value="Segunda">Segunda</option>
                                                <option value="Industrial">Industrial</option>
                                            </select>
                                        </div>
                                    </div>

                                    <ScaleReal
                                        title={`Báscula: ${tipoCorte ? tiposCorte.find(t => t.id.toString() === tipoCorte)?.nombre : 'Nuevo Corte'}`}
                                        icon={<Package size={24} />}
                                        resNumber={currentRes.numero}
                                        onCapture={handleAddCut}
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="yield-summary">
                                    <div className="yield-stat">
                                        <label>Peso Frío (REF)</label>
                                        <span style={{ color: '#7c3aed' }}>{Number(currentRes?.peso_frio || 0).toFixed(2)} kg</span>
                                    </div>
                                    <div className="yield-stat">
                                        <label>Peso Total Cortes</label>
                                        <span>{totalPesoCortes.toFixed(2)} kg</span>
                                    </div>
                                    <div className="yield-stat">
                                        <label>Rendimiento</label>
                                        <span style={{ color: rendimiento > 75 ? '#10b981' : '#f59e0b' }}>
                                            {rendimiento.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>

                                <button
                                    className="btn-finalize"
                                    disabled={cortesTemp.length === 0 || isSaving}
                                    onClick={handleFinalizeRes}
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                    Finalizar Deshuese Res #{currentRes.numero}
                                </button>
                            </>
                        ) : (
                            <div className="boner-card empty-state">
                                <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
                                <h3>Res Completada</h3>
                                <p>Todos los cortes han sido registrados para esta unidad.</p>
                            </div>
                        )}
                    </div>

                    <div className="col-right">
                        <div className="boner-card">
                            <h4 className="card-title"><Package size={20} /> Cortes Registrados ({cortesTemp.length})</h4>
                            <div className="cuts-list">
                                {cortesTemp.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                                        No hay cortes en esta sesión
                                    </p>
                                ) : (
                                    cortesTemp.map(c => (
                                        <div key={c.id} className="cut-item">
                                            <div className="cut-info">
                                                <h5>{c.tipo_nombre}</h5>
                                                <p>{c.clasificacion}</p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div className="cut-weight">
                                                    <span className="weight-val">{c.peso.toFixed(2)}</span>
                                                    <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>kg</span>
                                                </div>
                                                <button className="btn-delete" onClick={() => handleRemoveCut(c.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="boner-card">
                            <h4 className="card-title">Seleccionar Res</h4>
                            <div className="cuts-list">
                                {carcasses.map((res, idx) => (
                                    <div
                                        key={res.id}
                                        className={`cut-item ${idx === currentResIndex ? 'active' : ''}`}
                                        onClick={() => {
                                            if (!isSaving) {
                                                setCurrentResIndex(idx);
                                                setCortesTemp([]);
                                            }
                                        }}
                                        style={{
                                            cursor: 'pointer',
                                            borderColor: idx === currentResIndex ? '#7c3aed' : '#e2e8f0',
                                            background: idx === currentResIndex ? '#f5f3ff' : 'white'
                                        }}
                                    >
                                        <div className="cut-info">
                                            <h5>Res #{res.numero}</h5>
                                            <p>{res.estado.toUpperCase()}</p>
                                        </div>
                                        {res.estado === 'completado' && <CheckCircle size={18} style={{ color: '#10b981' }} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </StationLogin>
    );
}
