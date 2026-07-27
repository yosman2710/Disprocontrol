'use client'

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { apiFetch } from '@/lib/api';
import { Download, Loader2, AlertCircle, FileText, Activity, Layers } from 'lucide-react';
import styles from '@/styles/Reportes.module.css';

export default function ReportesPage() {
    const [activeTab, setActiveTab] = useState<'mermas' | 'rendimiento' | 'inventario'>('mermas');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiFetch(`/reportes/${activeTab}`);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar reporte');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const exportToExcel = async () => {
        if (!data || !data.length) return;
        
        try {
            const ExcelJS = (await import('exceljs')).default;
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Reporte');

            const headers = Object.keys(data[0]);
            
            // Configurar columnas
            worksheet.columns = headers.map(h => ({
                header: h.replace(/_/g, ' ').toUpperCase(),
                key: h,
                width: 22
            }));

            // Agregar datos
            data.forEach(row => {
                worksheet.addRow(row);
            });

            // Estilos a la cabecera
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF10B981' } // Color esmeralda de tu UI
            };

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reporte_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error exportando a Excel:", error);
            setError("Error al generar el archivo Excel");
        }
    };

    const renderTable = () => {
        if (data.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                        <FileText size={48} />
                    </div>
                    <p>No hay datos disponibles para este reporte.</p>
                </div>
            );
        }

        const headers = Object.keys(data[0]);

        return (
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                        <tr>
                            {headers.map(h => (
                                <th key={h}>
                                    {h.replace(/_/g, ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                        {data.map((row, i) => (
                            <tr key={i}>
                                {headers.map(h => (
                                    <td key={h}>
                                        {row[h]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <>
            <Head>
                <title>Reportes - Disprocontrol</title>
            </Head>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.titleWrapper}>
                        <div className={styles.titleIcon}>
                            <FileText size={32} />
                        </div>
                        <div>
                            <h1 className={styles.title}>Reportes del Sistema</h1>
                            <p className={styles.subtitle}>Visualiza y exporta los datos operativos</p>
                        </div>
                    </div>
                    <button 
                        onClick={exportToExcel}
                        disabled={data.length === 0 || loading}
                        className={styles.exportButton}
                    >
                        <Download size={18} />
                        Exportar a Excel
                    </button>
                </header>

                {/* Tabs */}
                <div className={styles.tabsContainer}>
                    <button
                        onClick={() => setActiveTab('mermas')}
                        className={`${styles.tabButton} ${activeTab === 'mermas' ? styles.activeTab : ''}`}
                    >
                        <Activity size={18} /> Reporte de Mermas
                    </button>
                    <button
                        onClick={() => setActiveTab('rendimiento')}
                        className={`${styles.tabButton} ${activeTab === 'rendimiento' ? styles.activeTab : ''}`}
                    >
                        <Layers size={18} /> Rendimiento de Desposte
                    </button>
                    <button
                        onClick={() => setActiveTab('inventario')}
                        className={`${styles.tabButton} ${activeTab === 'inventario' ? styles.activeTab : ''}`}
                    >
                        <FileText size={18} /> Stock e Inventario
                    </button>
                </div>

                {error && (
                    <div className={styles.errorContainer}>
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className={styles.loadingContainer}>
                        <Loader2 className="animate-spin" size={40} color="var(--emerald-500)" />
                    </div>
                ) : (
                    renderTable()
                )}
            </div>
        </>
    );
}
