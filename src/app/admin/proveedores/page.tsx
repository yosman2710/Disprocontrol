'use client'

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Building2, Phone, Mail, MapPin, FileText, X, Loader2, AlertCircle, ChevronDown, ChevronUp, Hash, Weight, TrendingDown, Factory } from 'lucide-react';
import Head from 'next/head';
import { apiFetch } from '@/lib/api';
import styles from '@/styles/Proveedores.module.css';

interface Proveedor {
    id: string;
    nombre: string;
    rif: string;
    direccion: string;
    telefono: string;
    email: string;
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
    matadero_id: number;
    matadero_nombre: string | null;
}

function estadoLabel(estado: string) {
    switch (estado) {
        case 'completado': return { label: 'Completado', color: '#22c55e' };
        case 'procesando': return { label: 'Procesando', color: '#f59e0b' };
        case 'pendiente': return { label: 'Pendiente', color: '#94a3b8' };
        default: return { label: estado, color: '#94a3b8' };
    }
}

function Proveedores() {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Proveedor | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ nombre: '', rif: '', direccion: '', telefono: '', email: '' });

    const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
    const [loadingOrdenes, setLoadingOrdenes] = useState(false);
    const [errorOrdenes, setErrorOrdenes] = useState<string | null>(null);

    // Mapa de resúmenes: { [proveedor_id]: { total_ordenes, total_reses, total_kg_caliente, merma_promedio } }
    const [resumen, setResumen] = useState<Record<string, { total_ordenes: number; total_reses: number; total_kg_caliente: number; merma_promedio: number }>>({});

    const fetchProveedores = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [data, resumenData] = await Promise.all([
                apiFetch('/proveedores'),
                apiFetch('/orden-compra/resumen/proveedor'),
            ]);
            setProveedores(data);
            // Convertir array a mapa por proveedor_id
            const map: Record<string, any> = {};
            for (const r of resumenData) {
                map[String(r.proveedor_id)] = r;
            }
            setResumen(map);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProveedores();
    }, [fetchProveedores]);

    const fetchOrdenes = useCallback(async (proveedorId: string) => {
        try {
            setLoadingOrdenes(true);
            setErrorOrdenes(null);
            const data = await apiFetch(`/orden-compra/proveedor/${proveedorId}`);
            setOrdenes(data);
        } catch (err) {
            setErrorOrdenes(err instanceof Error ? err.message : 'Error al cargar órdenes');
            setOrdenes([]);
        } finally {
            setLoadingOrdenes(false);
        }
    }, []);

    const handleSelectProveedor = (prov: Proveedor) => {
        setSelected(prov);
        setOrdenes([]);
        fetchOrdenes(prov.id);
    };

    const filtered = proveedores.filter(p =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) || p.rif.includes(search)
    );

    // Calcular totales a partir de las órdenes reales
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

    // Calcular totales rápidos por proveedor (sin cargar órdenes previas)
    const handleCreate = async () => {
        if (!form.nombre || !form.rif) return;

        try {
            setIsSubmitting(true);
            await apiFetch('/proveedores', {
                method: 'POST',
                body: JSON.stringify(form)
            });

            await fetchProveedores();
            setForm({ nombre: '', rif: '', direccion: '', telefono: '', email: '' });
            setShowForm(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error al crear proveedor');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totals = getTotals();

    return (
        <>
            <Head>
                <title>Proveedores - Carnes del Zulia</title>
            </Head>
            <div className={styles.container}>
                {/* Header */}
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Proveedores</h1>
                        <p className={styles.subtitle}>Gestión y movimientos de proveedores</p>
                    </div>
                    <button onClick={() => setShowForm(true)} className={styles.newButton}>
                        <Plus size={20} />
                        <span>Nuevo Proveedor</span>
                    </button>
                </header>

                {/* Search */}
                <div className={styles.searchContainer}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o RIF..."
                        className={styles.searchInput}
                    />
                </div>

                {error && (
                    <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '20px' }}>
                        <AlertCircle size={20} />
                        <span>{error}</span>
                        <button onClick={fetchProveedores} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>Reintentar</button>
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
                                No se encontraron proveedores.
                            </div>
                        ) : (
                            filtered.map(prov => (
                                <button
                                    key={prov.id}
                                    onClick={() => handleSelectProveedor(prov)}
                                    className={styles.providerCard}
                                    aria-label={`Ver detalles de ${prov.nombre}`}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.cardIcon}>
                                            <Building2 size={24} />
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <h3 className={styles.cardTitle}>{prov.nombre}</h3>
                                            <p className={styles.cardRif}>{prov.rif}</p>
                                        </div>
                                    </div>
                                    {(() => {
                                        const r = resumen[String(prov.id)];
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
                                    <Building2 size={40} />
                                </div>
                                <h2 className={styles.modalTitle}>{selected.nombre}</h2>
                            </div>

                            {/* Info */}
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <FileText size={16} />
                                    <span>{selected.rif}</span>
                                </div>
                                {selected.telefono && (
                                    <div className={styles.infoItem}>
                                        <Phone size={16} />
                                        <span>{selected.telefono}</span>
                                    </div>
                                )}
                                {selected.email && (
                                    <div className={styles.infoItem}>
                                        <Mail size={16} />
                                        <span>{selected.email}</span>
                                    </div>
                                )}
                                {selected.direccion && (
                                    <div className={styles.infoItem}>
                                        <MapPin size={16} />
                                        <span>{selected.direccion}</span>
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

                            {/* Matadero info adicional */}
                            {ordenes.length > 0 && (
                                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '12px', color: '#888' }}>
                                    <strong style={{ color: '#aaa' }}>Mataderos usados:</strong>{' '}
                                    {[...new Set(ordenes.map(o => o.matadero_nombre).filter(Boolean))].join(', ') || 'Sin información'}
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
                                    <Building2 size={30} />
                                </div>
                                <h2 className={styles.formModalTitle}>Nuevo Proveedor</h2>
                                <p className={styles.formModalSubtitle}>Completa los datos para registrarlo</p>
                            </div>

                            {/* Cuerpo del formulario */}
                            <div className={styles.formModalBody}>
                                <div className={styles.formFields}>
                                    {[
                                        { key: 'nombre', label: 'Nombre *', placeholder: 'Ej. Frigoríficos del Norte S.A.' },
                                        { key: 'rif', label: 'RIF *', placeholder: 'Ej. J-12345678-9' },
                                        { key: 'direccion', label: 'Dirección', placeholder: 'Ej. Av. Principal, Maracaibo' },
                                        { key: 'telefono', label: 'Teléfono', placeholder: 'Ej. 0424-1234567' },
                                        { key: 'email', label: 'Email', placeholder: 'Ej. contacto@empresa.com' },
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
                                    disabled={!form.nombre || !form.rif || isSubmitting}
                                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                >
                                    {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                                    {isSubmitting ? 'Creando...' : 'Crear Proveedor'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default Proveedores;
