'use client'

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { apiFetch } from '@/lib/api';
import { Download, Loader2, AlertCircle, FileText, Activity, Layers } from 'lucide-react';

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
        if (data.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>No hay datos para este reporte.</div>;

        const headers = Object.keys(data[0]);

        return (
            <div style={{ overflowX: 'auto', background: '#1e1e1e', borderRadius: '8px', border: '1px solid #333' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ background: '#2d2d2d', borderBottom: '1px solid #444' }}>
                        <tr>
                            {headers.map(h => (
                                <th key={h} style={{ padding: '12px 16px', color: '#aaa', fontWeight: 600, textTransform: 'capitalize' }}>
                                    {h.replace(/_/g, ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #2d2d2d' }}>
                                {headers.map(h => (
                                    <td key={h} style={{ padding: '10px 16px', color: '#e5e5e5' }}>
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
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText /> Reportes del Sistema
                    </h1>
                    <p style={{ color: '#888', marginTop: '4px', fontSize: '14px' }}>Visualiza y exporta los datos operativos</p>
                </div>
                <button 
                    onClick={exportToCSV}
                    disabled={data.length === 0 || loading}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', 
                        padding: '10px 16px', background: '#10b981', color: 'white', 
                        border: 'none', borderRadius: '6px', cursor: (data.length === 0 || loading) ? 'not-allowed' : 'pointer',
                        fontWeight: 600, opacity: (data.length === 0 || loading) ? 0.6 : 1
                    }}
                >
                    <Download size={18} />
                    Exportar CSV
                </button>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                <button
                    onClick={() => setActiveTab('mermas')}
                    style={{
                        padding: '10px 20px', background: activeTab === 'mermas' ? '#2d2d2d' : 'transparent',
                        color: activeTab === 'mermas' ? 'white' : '#888', border: 'none', borderRadius: '6px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500
                    }}
                >
                    <Activity size={18} /> Reporte de Mermas
                </button>
                <button
                    onClick={() => setActiveTab('rendimiento')}
                    style={{
                        padding: '10px 20px', background: activeTab === 'rendimiento' ? '#2d2d2d' : 'transparent',
                        color: activeTab === 'rendimiento' ? 'white' : '#888', border: 'none', borderRadius: '6px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500
                    }}
                >
                    <Layers size={18} /> Rendimiento de Desposte
                </button>
                <button
                    onClick={() => setActiveTab('inventario')}
                    style={{
                        padding: '10px 20px', background: activeTab === 'inventario' ? '#2d2d2d' : 'transparent',
                        color: activeTab === 'inventario' ? 'white' : '#888', border: 'none', borderRadius: '6px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500
                    }}
                >
                    <FileText size={18} /> Stock e Inventario
                </button>
            </div>

            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '20px' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <Loader2 className="animate-spin" size={40} color="#10b981" />
                </div>
            ) : (
                renderTable()
            )}
        </div>
    );
}
