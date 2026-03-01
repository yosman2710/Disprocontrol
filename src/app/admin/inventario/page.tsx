'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Box, Search, PackageOpen, Loader2, Beef } from 'lucide-react';
import Head from 'next/head';
import '@/styles/Inventario.css';

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

    return (
        <div className="inventario-container">
            <Head>
                <title>Inventario | Disprocontrol</title>
            </Head>

            <div className="inventario-header-card">
                <div className="inventario-header-titles">
                    <h1>Inventario Central</h1>
                    <p>Consulta y filtrado de cortes almacenados</p>
                </div>

                <div className="inventario-controls">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por código, corte o ubicación..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="inventario-table-wrapper">
                {loading ? (
                    <div className="inventario-loader">
                        <Loader2 size={40} className="animate-spin mb-4" style={{ color: '#3b82f6' }} />
                        <span>Cargando existencias del inventario...</span>
                    </div>
                ) : inventario.length === 0 ? (
                    <div className="inventario-empty">
                        <PackageOpen className="empty-icon" />
                        <h2>No hay inventario registrado</h2>
                        <p>No se encontraron cortes en la base de datos de existencias.</p>
                    </div>
                ) : (
                    <table className="inventario-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Corte Extraído</th>
                                <th>Cantidad</th>
                                <th>Peso Total</th>
                                <th>Ubicación</th>
                                <th>Fecha Ingreso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventario.length > 0 ? (
                                filteredInventario.map(item => (
                                    <tr key={item.id}>
                                        <td className="codigo-cell">{item.codigo}</td>
                                        <td className="corte-cell">
                                            <div className="corte-icon">
                                                <Beef size={20} />
                                            </div>
                                            {item.tipo_corte}
                                        </td>
                                        <td>{item.cantidad} ub(s)</td>
                                        <td className="peso-cell">
                                            {Number(item.peso_total).toFixed(2)} kg
                                        </td>
                                        <td>
                                            <span className="ubicacion-badge">
                                                {item.ubicacion || 'ALMACÉN'}
                                                {/* Fallback to 'ALMACÉN' si ubicacion is null */}
                                            </span>
                                        </td>
                                        <td className="fecha-cell">
                                            {new Date(item.fecha_ingreso).toLocaleString('es-VE', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short'
                                            })}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        No se encontraron resultados para la búsqueda "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
