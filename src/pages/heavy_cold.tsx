import {
    Snowflake, Search, Scale, Truck, Thermometer,
    CheckCircle, ChevronLeft, Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { WorkstationScaleView } from '@/components/WorkstationScaleView';
import { apiFetch } from '@/lib/api';
import '../styles/heavy_cold.css';
import { StationLogin } from '@/components/stationLogin';

export default function PesoFrioPage() {
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
            const data = await apiFetch('/orden-compra/pendientes-frio');
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
            // Mostramos todas las que llegaron al congelador (congelador, pesado_frio, desguazado, completado)
            const coldCarcasses = data.filter((c: any) =>
                ['congelador', 'pesado_frio', 'desguazado', 'completado'].includes(c.estado)
            );
            setCarcasses(coldCarcasses);

            // Buscar la primera pendiente de peso frío (estado 'congelador')
            const nextIndex = coldCarcasses.findIndex((c: any) => c.estado === 'congelador');
            setCurrentResIndex(nextIndex !== -1 ? nextIndex : 0);
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

    const handleBone = async (resId: number | string) => {
        try {
            await apiFetch('/reses/desguazar', {
                method: 'PUT',
                body: JSON.stringify({ id: resId })
            });
            toast.success('Res enviada a desguace');
            await fetchCarcasses(selectedOrder.id);
        } catch (error: any) {
            toast.error('Error al enviar a desguace: ' + error.message);
        }
    };

    const handleCapture = async (peso: number) => {
        if (peso <= 0) return toast.error("Peso inválido");
        if (!carcasses[currentResIndex]) return;

        try {
            const resData = {
                id: carcasses[currentResIndex].id,
                peso_frio: peso
            };

            await apiFetch('/reses/addPesoFrio', {
                method: 'PUT',
                body: JSON.stringify(resData)
            });

            toast.success(`Res #${carcasses[currentResIndex].numero} capturada: ${peso}kg (Frío)`);

            // Refresh carcasses to see progress and check if done
            const data = await apiFetch(`/reses/by-order/${selectedOrder.id}`);
            const frozenCarcasses = data.filter((c: any) => c.estado === 'congelador' || c.estado === 'desguace' || c.estado === 'pesado_frio');
            // Nota: El estado cambia a 'congelador' a 'pesado_frio' o similar en el backend? 
            // Según reses.service.js: reses.estado !== 'congelador' error, pero no veo que lo cambie explícitamente a otro estado en addPesoFrio.
            // Ah, espera. addPesoFrio en repo: 
            /*
            async addPesoFrio({ id, peso_frio }, merma_kg, merma_porcentaje) {
                const query = `
                UPDATE reses SET
                    peso_frio = $1,
                    merma_kg = $2,
                    merma_porcentaje = $3,
                    fecha_peso_frio = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING *
                `;
            */
            // No cambia el estado. El usuario dijo "solo se ven las reses que estan en el congelador".
            // Si no cambia el estado, seguirán apareciendo.

            await fetchCarcasses(selectedOrder.id);

            // Si ya no quedan pendientes en esta orden (en congelador)
            // Podríamos cerrar la orden si todas las de la orden original ya tienen peso frio.
        } catch (error: any) {
            toast.error('Error al guardar peso frío: ' + error.message);
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
                stationName="Pesado en Frío"
                stationIcon={<Snowflake size={24} />}
                stationColor="bg-info"
                targetRole="pesador_frio"
            >
                <div className="container-main">
                    {loadingCarcasses ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Loader2 className="animate-spin" size={48} color="#2b6cb0" />
                        </div>
                    ) : (
                        <WorkstationScaleView
                            type="frio"
                            ticket={{
                                id: `ORD-${selectedOrder.id}`,
                                proveedor: selectedOrder.proveedor_nombre,
                                matadero: selectedOrder.matadero_nombre,
                                placa: selectedOrder.placa,
                                temperatura: selectedOrder.temperatura,
                                reses: carcasses.map(c => ({
                                    id: c.id,
                                    numero: c.numero,
                                    peso: c.peso_frio || null,
                                    estado: c.estado
                                }))
                            }}
                            currentResIndex={currentResIndex}
                            onBack={() => {
                                setSelectedOrder(null);
                                fetchPendingOrders();
                            }}
                            onCapture={handleCapture}
                            onFreeze={() => { }} // Not used in this view but required by Props
                            onBone={handleBone}
                        />
                    )}
                </div>
            </StationLogin>
        );
    }

    return (
        <StationLogin
            stationName="Pesado en Frío"
            stationIcon={<Snowflake size={24} />}
            stationColor="bg-info"
            targetRole="pesador_frio"
        >
            <div className="container-main">
                <div className="header-section">
                    <div className="icon-box"><Snowflake size={24} /></div>
                    <div className="header-titles">
                        <h1>Pesado en Frío</h1>
                        <p>Registro de peso después del proceso de enfriamiento</p>
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
                        <Loader2 className="animate-spin" size={48} color="#2b6cb0" />
                    </div>
                ) : (
                    <>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <div className="stat-circle" style={{ background: '#ebf8ff', color: '#3182ce' }}><Snowflake size={20} /></div>
                                <div><b style={{ fontSize: '20px' }}>{orders.length}</b><br /><span className="stat-label">Ordenes en Congelador</span></div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-circle" style={{ background: '#e6fffa', color: '#319795' }}><Scale size={20} /></div>
                                <div><b style={{ fontSize: '20px' }}>{orders.reduce((acc, o) => acc + parseInt(o.reses_en_congelador), 0)}</b><br /><span className="stat-label">Reses por Pesar</span></div>
                            </div>
                        </div>

                        <h3 style={{ fontFamily: 'serif', marginBottom: '15px' }}>Seleccionar Orden</h3>
                        {filteredOrders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                No se encontraron órdenes con reses en congelador.
                            </div>
                        ) : (
                            filteredOrders.map(o => (
                                <div key={o.id} className="ticket-card" onClick={() => handleSelectOrder(o)}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ background: '#fEEBC8', color: '#744210', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold' }}>#{o.id}</div>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{o.proveedor_nombre}</h4>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{o.matadero_nombre}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#64748b' }}>
                                        <span><Truck size={14} /> {o.placa}</span>
                                        <span style={{ color: '#dd6b20' }}><Thermometer size={14} /> {o.temperatura}°C</span>
                                        <div className="data-item">
                                            <span className="res-count">{o.reses_en_congelador}</span>
                                            <span className="res-label">Reses</span>
                                        </div>
                                        <span style={{ background: '#fffaf0', color: '#dd6b20', padding: '2px 8px', borderRadius: '10px', border: '1px solid #fbd38d' }}>
                                            En Congelador
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
