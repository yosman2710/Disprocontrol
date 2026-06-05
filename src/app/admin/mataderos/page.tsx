'use client'

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Factory, MapPin, FileText, X, Loader2, AlertCircle, Building2 } from 'lucide-react';
import Head from 'next/head';
import { apiFetch } from '@/lib/api';
import styles from '@/styles/Mataderos.module.css';

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
        case 'procesando':
        case 'en_proceso': return { label: 'En Proceso', color: '#f59e0b' };
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
            <div className={styles.container}>
                {/* Header */}
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Mataderos</h1>
                        <p className={styles.subtitle}>Gestión y movimientos de mataderos</p>
                    </div>
                    <button onClick={() => setShowForm(true)} className={styles.newButton}>
                        <Plus size={20} />
                        <span>Nuevo Matadero</span>
                    </button>
                </header>

                {/* Search */}
                <div className={styles.searchContainer}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o registro..."
                        className={styles.searchInput}
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
                    <div className={styles.grid}>
                        {filtered.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#666' }}>
                                No se encontraron mataderos.
                            </div>
                        ) : (
                            filtered.map(mat => (
                                <button
                                    key={mat.id}
                                    onClick={() => handleSelectMatadero(mat)}
                                    className={styles.mataderoCard}
                                    aria-label={`Ver detalles de ${mat.nombre}`}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.cardIcon}>
                                            <Factory size={24} />
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <h3 className={styles.cardTitle}>{mat.nombre}</h3>
                                            <p className={styles.cardRegistro}>{mat.registro}</p>
                                        </div>
                                    </div>
                                    {(() => {
                                        const r = resumen[String(mat.id)];
                                        return (
                                            <div className={styles.statsGrid}>
                                                <div className={styles.statItem}>
                                                    <span className={styles.statValue}>{r ? r.total_ordenes : '0'}</span>
                                                    <span className={styles.statLabel}>Ordenes</span>
                                                </div>
                                                <div className={styles.statItem}>
                                                    <span className={styles.statValue}>{r ? r.total_reses : '0'}</span>
                                                    <span className={styles.statLabel}>Reses</span>
                                                </div>
                                                <div className={styles.statItem}>
                                                    <span className={styles.statValue}>{r ? Number(r.total_kg_caliente).toLocaleString('es-VE', { maximumFractionDigits: 0 }) : '0'}</span>
                                                    <span className={styles.statLabel}>Kg Cal.</span>
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
                    <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
                        <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', width: '95vw' }}>
                            <div className={styles.modalHeader}>
                                <button className={styles.closeButton} onClick={() => setSelected(null)}>
                                    <X size={24} />
                                </button>
                                <div className={styles.modalIcon}>
                                    <Factory size={40} />
                                </div>
                                <h2 className={styles.modalTitle}>{selected.nombre}</h2>
                            </div>

                            {/* Info */}
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <FileText size={16} />
                                    <span>{selected.registro}</span>
                                </div>
                                {selected.ubicacion && (
                                    <div className={styles.infoItem}>
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
                                <div className={styles.totalsGrid}>
                                    {[
                                        { label: 'Ordenes', value: totals.totalOrdenes },
                                        { label: 'Reses', value: totals.totalReses },
                                        { label: 'Kg Caliente', value: totals.totalKgCaliente.toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) },
                                        { label: 'Merma Prom.', value: `${totals.mermaPromedio.toFixed(1)}%` },
                                    ].map((stat, i) => (
                                        <div key={i} className={styles.totalItem}>
                                            <span className={styles.totalValue}>{stat.value}</span>
                                            <span className={styles.totalLabel}>{stat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Lista de órdenes */}
                            <div className={styles.movimientosSection}>
                                <h4 className={styles.sectionTitle}>Órdenes de Compra</h4>

                                {errorOrdenes && (
                                    <div style={{ color: '#ef4444', padding: '10px', textAlign: 'center', fontSize: '14px' }}>
                                        {errorOrdenes}
                                    </div>
                                )}

                                {!loadingOrdenes && !errorOrdenes && ordenes.length === 0 && (
                                    <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No hay órdenes registradas.</p>
                                )}

                                {!loadingOrdenes && ordenes.length > 0 && (
                                    <div className={styles.movimientosList}>
                                        {/* Header de la tabla */}
                                        <div className={styles.tableHeader}>
                                            <span># Orden</span>
                                            <span>Fecha</span>
                                            <span style={{ textAlign: 'right' }}>Reses</span>
                                            <span style={{ textAlign: 'right' }}>Kg Caliente</span>
                                            <span style={{ textAlign: 'right' }}>Merma Total</span>
                                            <span style={{ textAlign: 'right' }}>Merma %</span>
                                            <span style={{ textAlign: 'center' }}>Estado</span>
                                        </div>

                                        {ordenes.map(orden => {
                                            const { label, color } = estadoLabel(orden.estado);
                                            return (
                                                <div key={orden.id} className={styles.tableRow}>
                                                    <span className={styles.orderNumber}>#{orden.id}</span>
                                                    <span className={styles.orderDate}>{new Date(orden.fecha).toLocaleDateString('es-VE')}</span>
                                                    <span className={styles.orderReses}>{orden.cantidad_res}</span>
                                                    <span className={styles.orderWeight}>
                                                        {Number(orden.peso_total_caliente || 0).toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
                                                    </span>
                                                    <span className={styles.orderMermaKg}>
                                                        {Number(orden.merma_total_kg || 0).toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg
                                                    </span>
                                                    <span className={styles.orderMermaPct}>
                                                        {Number(orden.merma_total_porcentaje || 0).toFixed(1)}%
                                                    </span>
                                                    <div className={styles.statusWrapper}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '2px 10px',
                                                            borderRadius: '20px',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            background: `${color}22`,
                                                            color: color,
                                                            border: `1px solid ${color}44`,
                                                            textAlign: 'center',
                                                            width: '100%'
                                                        }}>{label}</span>
                                                    </div>
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
                    <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
                        <div className={styles.formModal} onClick={e => e.stopPropagation()}>
                            {/* Encabezado con gradiente */}
                            <div className={styles.formModalHeader}>
                                <button className={styles.formModalCloseBtn} onClick={() => setShowForm(false)}>
                                    <X size={18} />
                                </button>
                                <div className={styles.formModalIcon}>
                                    <Factory size={30} />
                                </div>
                                <h2 className={styles.formModalTitle}>Nuevo Matadero</h2>
                                <p className={styles.formModalSubtitle}>Completa los datos para registrarlo</p>
                            </div>

                            {/* Cuerpo del formulario */}
                            <div className={styles.formModalBody}>
                                <div className={styles.formFields}>
                                    {[
                                        { key: 'nombre', label: 'Nombre *', placeholder: 'Ej. Matadero Central Norte' },
                                        { key: 'ubicacion', label: 'Ubicación', placeholder: 'Ej. Maracaibo, Zulia' },
                                        { key: 'registro', label: 'Registro *', placeholder: 'Ej. MAT-001-MZ' },
                                    ].map(field => (
                                        <div key={field.key} className={styles.formField}>
                                            <label className={styles.formLabel}>{field.label}</label>
                                            <input
                                                value={form[field.key as keyof typeof form]}
                                                onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                placeholder={field.placeholder}
                                                className={styles.formInput}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleCreate}
                                    className={styles.createButton}
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
