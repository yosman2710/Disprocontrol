'use client'

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Factory, MapPin, FileText, X, Loader2, AlertCircle, Building2 } from 'lucide-react';
import Head from 'next/head';
import { apiFetch } from '@/lib/api';
import '@/styles/Mataderos.css';

interface Matadero {
    id: string;
    nombre: string;
    ubicacion: string;
    registro: string;
}

interface OrdenCompra {
    id: number;
    fecha: string;
    fecha_matanza: string | null;
    cantidad_res: number;
    peso_total_caliente: number;
    peso_total_frio: number;
    merma_total_kg: number;
    merma_total_porcentaje: number;
    estado: string;
    placa: string;
    chofer: string;
    clasificacion: string;
    sexo: string;
    proveedor_id: number;
    proveedor_nombre: string | null;
}

function estadoLabel(estado: string) {
    switch (estado) {
        case 'completado': return { label: 'Completado', color: '#22c55e' };
        case 'procesando': return { label: 'Procesando', color: '#f59e0b' };
        case 'pendiente': return { label: 'Pendiente', color: '#94a3b8' };
        default: return { label: estado, color: '#94a3b8' };
    }
}

function Mataderos() {
    const [mataderos, setMataderos] = useState<Matadero[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Matadero | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ nombre: '', ubicacion: '', registro: '' });

    const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
    const [loadingOrdenes, setLoadingOrdenes] = useState(false);
    const [errorOrdenes, setErrorOrdenes] = useState<string | null>(null);

    // Mapa de resúmenes: { [matadero_id]: { total_ordenes, total_reses, total_kg_caliente } }
    const [resumen, setResumen] = useState<Record<string, { total_ordenes: number; total_reses: number; total_kg_caliente: number; merma_promedio: number }>>({});

    const fetchMataderos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [data, resumenData] = await Promise.all([
                apiFetch('/mataderos'),
                apiFetch('/orden-compra/resumen/matadero'),
            ]);
            setMataderos(data);
            const map: Record<string, any> = {};
            for (const r of resumenData) {
                map[String(r.matadero_id)] = r;
            }
            setResumen(map);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMataderos();
    }, [fetchMataderos]);

    const fetchOrdenes = useCallback(async (mataderoId: string) => {
        try {
            setLoadingOrdenes(true);
            setErrorOrdenes(null);
            const data = await apiFetch(`/orden-compra/matadero/${mataderoId}`);
            setOrdenes(data);
        } catch (err) {
            setErrorOrdenes(err instanceof Error ? err.message : 'Error al cargar órdenes');
            setOrdenes([]);
        } finally {
            setLoadingOrdenes(false);
        }
    }, []);

    const handleSelectMatadero = (mat: Matadero) => {
        setSelected(mat);
        setOrdenes([]);
        fetchOrdenes(mat.id);
    };

    const filtered = mataderos.filter(m =>
        m.nombre.toLowerCase().includes(search.toLowerCase()) || m.registro.includes(search)
    );

    const getTotals = () => {
        if (!ordenes.length) return { totalOrdenes: 0, totalReses: 0, totalKgCaliente: 0, mermaPromedio: 0 };
        const totalOrdenes = ordenes.length;
        const totalReses = ordenes.reduce((s, o) => s + (o.cantidad_res || 0), 0);
        const totalKgCaliente = ordenes.reduce((s, o) => s + (Number(o.peso_total_caliente) || 0), 0);
        const mermaPorcentajes = ordenes.filter(o => Number(o.merma_total_porcentaje) > 0);
        const mermaPromedio = mermaPorcentajes.length
            ? mermaPorcentajes.reduce((s, o) => s + Number(o.merma_total_porcentaje), 0) / mermaPorcentajes.length
            : 0;
        return { totalOrdenes, totalReses, totalKgCaliente, mermaPromedio };
    };

    const handleCreate = async () => {
        if (!form.nombre || !form.registro) return;

        try {
            setIsSubmitting(true);
            await apiFetch('/mataderos', {
                method: 'POST',
                body: JSON.stringify(form)
            });

            await fetchMataderos();
            setForm({ nombre: '', ubicacion: '', registro: '' });
            setShowForm(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error al crear matadero');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totals = getTotals();

    return (
        <>
            <Head>
                <title>Mataderos - Carnes del Zulia</title>
            </Head>
            <div className={"container"}>
                {/* Header */}
                <header className={"header"}>
                    <div>
                        <h1 className={"title"}>Mataderos</h1>
                        <p className={"subtitle"}>Gestión y movimientos de mataderos</p>
                    </div>
                    <button onClick={() => setShowForm(true)} className={"newButton"}>
                        <Plus size={20} />
                        <span>Nuevo Matadero</span>
                    </button>
                </header>

                {/* Search */}
                <div className={"searchContainer"}>
                    <Search size={20} className={"searchIcon"} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o registro..."
                        className={"searchInput"}
                    />
                </div>

                {error && (
                    <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '20px' }}>
                        <AlertCircle size={20} />
                        <span>{error}</span>
                        <button onClick={fetchMataderos} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>Reintentar</button>
                    </div>
                )}

                {/* Grid */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <Loader2 className="animate-spin" size={40} />
                    </div>
                ) : (
                    <div className={"grid"}>
                        {filtered.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#666' }}>
                                No se encontraron mataderos.
                            </div>
                        ) : (
                            filtered.map(mat => (
                                <button
                                    key={mat.id}
                                    onClick={() => handleSelectMatadero(mat)}
                                    className={"mataderoCard"}
                                    aria-label={`Ver detalles de ${mat.nombre}`}
                                >
                                    <div className={"cardHeader"}>
                                        <div className={"cardIcon"}>
                                            <Factory size={24} />
                                        </div>
                                        <div className={"cardInfo"}>
                                            <h3 className={"cardTitle"}>{mat.nombre}</h3>
                                            <p className={"cardRegistro"}>{mat.registro}</p>
                                        </div>
                                    </div>
                                    {(() => {
                                        const r = resumen[String(mat.id)];
                                        return (
                                            <div className={"statsGrid"}>
                                                <div className={"statItem"}>
                                                    <span className={"statValue"}>{r ? r.total_ordenes : '0'}</span>
                                                    <span className={"statLabel"}>Ordenes</span>
                                                </div>
                                                <div className={"statItem"}>
                                                    <span className={"statValue"}>{r ? r.total_reses : '0'}</span>
                                                    <span className={"statLabel"}>Reses</span>
                                                </div>
                                                <div className={"statItem"}>
                                                    <span className={"statValue"}>{r ? Number(r.total_kg_caliente).toLocaleString('es-VE', { maximumFractionDigits: 0 }) : '0'}</span>
                                                    <span className={"statLabel"}>Kg Cal.</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Detail Modal */}
                {selected && (
                    <div className={"modalOverlay"} onClick={() => setSelected(null)}>
                        <div className={"modalContent"} onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', width: '95vw' }}>
                            <div className={"modalHeader"}>
                                <button className={"closeButton"} onClick={() => setSelected(null)}>
                                    <X size={24} />
                                </button>
                                <div className={"modalIcon"}>
                                    <Factory size={40} />
                                </div>
                                <h2 className={"modalTitle"}>{selected.nombre}</h2>
                            </div>

                            {/* Info */}
                            <div className={"infoGrid"}>
                                <div className={"infoItem"}>
                                    <FileText size={16} />
                                    <span>{selected.registro}</span>
                                </div>
                                {selected.ubicacion && (
                                    <div className={"infoItem"}>
                                        <MapPin size={16} />
                                        <span>{selected.ubicacion}</span>
                                    </div>
                                )}
                            </div>

                            {/* Totals dinámicos */}
                            {loadingOrdenes ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                    <Loader2 className="animate-spin" size={28} />
                                </div>
                            ) : (
                                <div className={"totalsGrid"}>
                                    {[
                                        { label: 'Ordenes', value: totals.totalOrdenes },
                                        { label: 'Reses', value: totals.totalReses },
                                        { label: 'Kg Caliente', value: totals.totalKgCaliente.toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) },
                                        { label: 'Merma Prom.', value: `${totals.mermaPromedio.toFixed(1)}%` },
                                    ].map((stat, i) => (
                                        <div key={i} className={"totalItem"}>
                                            <span className={"totalValue"}>{stat.value}</span>
                                            <span className={"totalLabel"}>{stat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Lista de órdenes */}
                            <div className={"movimientosSection"}>
                                <h4 className={"sectionTitle"}>Órdenes de Compra</h4>

                                {errorOrdenes && (
                                    <div style={{ color: '#ef4444', padding: '10px', textAlign: 'center', fontSize: '14px' }}>
                                        {errorOrdenes}
                                    </div>
                                )}

                                {!loadingOrdenes && !errorOrdenes && ordenes.length === 0 && (
                                    <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No hay órdenes registradas.</p>
                                )}

                                {!loadingOrdenes && ordenes.length > 0 && (
                                    <div className={"movimientosList"}>
                                        {/* Header de la tabla */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '60px 90px 70px 110px 110px 90px 100px',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            color: '#888',
                                            letterSpacing: '0.05em',
                                        }}>
                                            <span># Orden</span>
                                            <span>Fecha</span>
                                            <span>Reses</span>
                                            <span>Kg Caliente</span>
                                            <span>Merma Total</span>
                                            <span>Merma %</span>
                                            <span>Estado</span>
                                        </div>

                                        {ordenes.map(orden => {
                                            const { label, color } = estadoLabel(orden.estado);
                                            return (
                                                <div key={orden.id} style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '60px 90px 70px 110px 110px 90px 100px',
                                                    gap: '8px',
                                                    padding: '10px 12px',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    fontSize: '13px',
                                                    alignItems: 'center',
                                                }}>
                                                    <span style={{ fontWeight: 600, color: '#a78bfa' }}>#{orden.id}</span>
                                                    <span style={{ color: '#54585eff' }}>{new Date(orden.fecha).toLocaleDateString('es-VE')}</span>
                                                    <span style={{ color: '#54585eff', textAlign: 'right' }}>{orden.cantidad_res}</span>
                                                    <span style={{ color: '#38bdf8', textAlign: 'right', fontWeight: 600 }}>
                                                        {Number(orden.peso_total_caliente).toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
                                                    </span>
                                                    <span style={{ color: '#fb923c', textAlign: 'right' }}>
                                                        {Number(orden.merma_total_kg).toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
                                                    </span>
                                                    <span style={{ color: '#fb923c', textAlign: 'right' }}>
                                                        {Number(orden.merma_total_porcentaje).toFixed(1)}%
                                                    </span>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '2px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        background: `${color}22`,
                                                        color: color,
                                                        border: `1px solid ${color}44`,
                                                        textAlign: 'center'
                                                    }}>{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Proveedores info adicional */}
                            {ordenes.length > 0 && (
                                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '12px', color: '#888' }}>
                                    <strong style={{ color: '#aaa' }}>Proveedores atendidos:</strong>{' '}
                                    {[...new Set(ordenes.map(o => o.proveedor_nombre).filter(Boolean))].join(', ') || 'Sin información'}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Create Modal */}
                {showForm && (
                    <div className={"modalOverlay"} onClick={() => setShowForm(false)}>
                        <div className={"formModal"} onClick={e => e.stopPropagation()}>
                            {/* Encabezado con gradiente */}
                            <div className={"formModalHeader"}>
                                <button className={"formModalCloseBtn"} onClick={() => setShowForm(false)}>
                                    <X size={18} />
                                </button>
                                <div className={"formModalIcon"}>
                                    <Factory size={30} />
                                </div>
                                <h2 className={"formModalTitle"}>Nuevo Matadero</h2>
                                <p className={"formModalSubtitle"}>Completa los datos para registrarlo</p>
                            </div>

                            {/* Cuerpo del formulario */}
                            <div className={"formModalBody"}>
                                <div className={"formFields"}>
                                    {[
                                        { key: 'nombre', label: 'Nombre *', placeholder: 'Ej. Matadero Central Norte' },
                                        { key: 'ubicacion', label: 'Ubicación', placeholder: 'Ej. Maracaibo, Zulia' },
                                        { key: 'registro', label: 'Registro *', placeholder: 'Ej. MAT-001-MZ' },
                                    ].map(field => (
                                        <div key={field.key} className={"formField"}>
                                            <label className={"formLabel"}>{field.label}</label>
                                            <input
                                                value={form[field.key as keyof typeof form]}
                                                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                placeholder={field.placeholder}
                                                className={"formInput"}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleCreate}
                                    className={"createButton"}
                                    disabled={!form.nombre || !form.registro || isSubmitting}
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                >
                                    {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                                    {isSubmitting ? 'Creando...' : 'Crear Matadero'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default Mataderos;
