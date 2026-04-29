'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Box, Search, PackageOpen, Loader2, Beef, X } from 'lucide-react';
import Head from 'next/head';
import styles from '@/styles/Inventario.module.css';

interface InventarioItem {
    id: number;
    codigo: string;
    tipo_corte: string;
    peso_total: string;
    cantidad: number;
    ubicacion: string;
    fecha_ingreso: string;
    corte_extraido_id: number;
}

export default function InventarioPage() {
    const [inventario, setInventario] = useState<InventarioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);
    const [detalles, setDetalles] = useState<any[]>([]);
    const [loadingDetalles, setLoadingDetalles] = useState(false);

    useEffect(() => {
        const fetchInventario = async () => {
            try {
                const result = await apiFetch('/stocks');
                // The backend returns an array under `data` (e.g. { success: true, data: [...] })
                if (result.success && Array.isArray(result.data)) {
                    setInventario(result.data);
                } else if (Array.isArray(result)) {
                    // Fallback just in case the backend changes to return pure array
                    setInventario(result);
                } else {
                    console.error("Formato de respuesta desconocido:", result);
                }
            } catch (error) {
                console.error("Error fetching inventario:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInventario();
    }, []);

    const filteredInventario = inventario.filter(item => {
        const term = searchTerm.toLowerCase();
        return (
            (item.codigo && item.codigo.toLowerCase().includes(term)) ||
            (item.tipo_corte && item.tipo_corte.toLowerCase().includes(term)) ||
            (item.ubicacion && item.ubicacion.toLowerCase().includes(term))
        );
    });

    const handleRowClick = async (item: InventarioItem) => {
        setSelectedItem(item);
        setLoadingDetalles(true);
        setDetalles([]);
        try {
            const result = await apiFetch(`/stocks/${item.codigo}/detalles`);
            if (result.success && Array.isArray(result.data)) {
                setDetalles(result.data);
            }
        } catch (error) {
            console.error("Error fetching detalles:", error);
        } finally {
            setLoadingDetalles(false);
        }
    };

    const closeModal = () => {
        setSelectedItem(null);
        setDetalles([]);
    };

    return (
        <div className={`${styles.container} ${styles.inventarioContainer} animate-up`}>
            <Head>
                <title>Inventario | Disprocontrol</title>
            </Head>

            <div className={styles['inventario-header-card']}>
                <div className={styles['inventario-header-titles']}>
                    <h1>Inventario Central</h1>
                    <p>Consulta y filtrado de cortes almacenados</p>
                </div>

                <div className={styles['inventario-controls']}>
                    <div className={styles['search-box']}>
                        <Search size={18} className={styles['search-icon']} />
                        <input
                            type="text"
                            placeholder="Buscar por código, corte o ubicación..."
                            className={styles['search-input']}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className={styles['inventario-list-wrapper']}>
                {!loading && filteredInventario.length > 0 && (
                    <div className={styles['list-headers']}>
                        <div>Código</div>
                        <div>Corte Extraído</div>
                        <div>Cantidad</div>
                        <div>Peso Total</div>
                        <div>Ubicación</div>
                        <div>Fecha Ingreso</div>
                    </div>
                )}

                {loading ? (
                    <div className={styles['inventario-loader']}>
                        <Loader2 size={48} className="animate-spin" style={{ color: '#641B2E' }} />
                        <span>Sincronizando existencias...</span>
                    </div>
                ) : filteredInventario.length === 0 ? (
                    <div className={styles['inventario-empty']}>
                        <PackageOpen size={64} className={styles['empty-icon']} />
                        <h2>No hay coincidencias</h2>
                        <p>No se encontraron cortes que coincidan con "{searchTerm}"</p>
                    </div>
                ) : (
                    <div className={styles['inventario-list']}>
                        {filteredInventario.map((item, index) => (
                                <div 
                                    key={item.id} 
                                    className={styles['item-row']}
                                    style={{ animationDelay: `${index * 0.05}s`, cursor: 'pointer' }}
                                    onClick={() => handleRowClick(item)}
                                >
                                <div className={styles['codigo-cell']}>
                                    <span className={styles['column-label']}>Código:</span>
                                    {item.codigo}
                                </div>
                                <div className={styles['corte-cell']}>
                                    <div className={styles['corte-icon']}>
                                        <Beef size={22} />
                                    </div>
                                    {item.tipo_corte}
                                </div>
                                <div className={styles['cantidad-text']}>
                                    <span className={styles['column-label']}>Cantidad:</span>
                                    {item.cantidad} ub(s)
                                </div>
                                <div className={styles['peso-value']}>
                                    <span className={styles['column-label']}>Peso:</span>
                                    {Number(item.peso_total).toFixed(2)} <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>kg</span>
                                </div>
                                <div>
                                    <span className={styles['ubicacion-badge']}>
                                        {item.ubicacion || 'ALMACÉN'}
                                    </span>
                                </div>
                                <div className={styles['fecha-text']}>
                                    {new Date(item.fecha_ingreso).toLocaleString('es-VE', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedItem && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalHeaderInfo}>
                                <h2>Detalles del Grupo</h2>
                                <p>Código: {selectedItem.codigo} | Corte: {selectedItem.tipo_corte}</p>
                            </div>
                            <button className={styles.closeButton} onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {loadingDetalles ? (
                                <div className={styles['inventario-loader']} style={{ padding: '40px' }}>
                                    <Loader2 size={32} className="animate-spin" style={{ color: '#641B2E' }} />
                                    <span style={{ fontSize: '0.9rem' }}>Cargando unidades...</span>
                                </div>
                            ) : detalles.length === 0 ? (
                                <div className={styles['inventario-empty']} style={{ padding: '40px' }}>
                                    <PackageOpen size={48} className={styles['empty-icon']} style={{ marginBottom: '16px' }} />
                                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>No hay detalles</h3>
                                    <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>No se encontraron unidades específicas para este código.</p>
                                </div>
                            ) : (
                                <table className={styles.detallesTable}>
                                    <thead>
                                        <tr>
                                            <th>ID Unidad</th>
                                            <th>Calidad</th>
                                            <th>Peso (kg)</th>
                                            <th>Fecha Ingreso</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detalles.map((d, i) => (
                                            <tr key={i}>
                                                <td>#{d.corte_id || d.inventario_id}</td>
                                                <td>
                                                    <span className={styles.badgeClasificacion}>
                                                        {d.calidad || 'Estándar'}
                                                    </span>
                                                </td>
                                                <td className={styles.pesoDestacado}>
                                                    {Number(d.peso).toFixed(2)} kg
                                                </td>
                                                <td>
                                                    {new Date(d.fecha).toLocaleString('es-VE', {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short'
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
