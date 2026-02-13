
'use client';
import React, { useState } from 'react';
import {
    Flame, Search, Scale, Truck, Thermometer, ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { WorkstationScaleView } from '@/components/WorkstationScaleView';
import '../styles/heavy_hot.css';

// --- MOCK DATA ---
const INITIAL_TICKETS = [
    {
        id: 'TK-001',
        proveedor: 'Hacienda La Aurora',
        matadero: 'Matadero Industrial Zulia',
        placa: 'ABC-123',
        temperatura: 4.2,
        reses: [
            { id: 'r1', numero: 1, estado: 'pendiente', pesoCaliente: null, pesoFrio: null },
            { id: 'r2', numero: 2, estado: 'pendiente', pesoCaliente: null, pesoFrio: null },
            { id: 'r3', numero: 3, estado: 'pendiente', pesoCaliente: null, pesoFrio: null },
        ]
    },
    {
        id: 'TK-002',
        proveedor: 'Finca El Rodeo',
        matadero: 'Frigorífico del Norte',
        placa: 'XYZ-789',
        temperatura: 3.8,
        reses: [
            { id: 'r4', numero: 1, estado: 'pendiente', pesoCaliente: null, pesoFrio: null },
            { id: 'r5', numero: 2, estado: 'pendiente', pesoCaliente: null, pesoFrio: null },
        ]
    }
];

export default function PesoCalientePage() {
    const [tickets, setTickets] = useState(INITIAL_TICKETS);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [currentResIndex, setCurrentResIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    // --- LÓGICA ---
    const handleSelectTicket = (ticket: any) => {
        setSelectedTicket(ticket);
        const firstPending = ticket.reses.findIndex((r: any) => !r.pesoCaliente);
        setCurrentResIndex(firstPending !== -1 ? firstPending : 0);
    };

    const handleCapture = (peso: number) => {
        if (peso <= 0) return toast.error("Peso inválido");

        const newReses = [...selectedTicket.reses];
        newReses[currentResIndex] = {
            ...newReses[currentResIndex],
            pesoCaliente: peso,
            estado: 'congelador'
        };

        const updatedTicket = { ...selectedTicket, reses: newReses };
        setSelectedTicket(updatedTicket);
        setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));

        toast.success(`Res #${newReses[currentResIndex].numero} capturada: ${peso}kg`);

        const next = newReses.findIndex(r => !r.pesoCaliente);
        if (next !== -1) setCurrentResIndex(next);
    };

    // --- RENDERS ---
    if (selectedTicket) {
        return (
            <div className="container-main">
                <WorkstationScaleView
                    type="caliente"
                    ticket={selectedTicket}
                    currentResIndex={currentResIndex}
                    onBack={() => setSelectedTicket(null)}
                    onCapture={handleCapture}
                />
            </div>
        );
    }

    return (
        <div className="container-main">
            <div className="header-section">
                <div className="icon-box"><Flame size={24} /></div>
                <div className="header-titles">
                    <h1>Pesado en Caliente</h1>
                    <p>Registro de peso inicial de reses recién recibidas</p>
                </div>
            </div>

            <div className="search-container">
                <Search className="search-icon-pos" size={18} />
                <input
                    className="search-input"
                    placeholder="Buscar por ID, proveedor o placa..."
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="stats-grid">
                <div className="stat-item">
                    <div className="stat-circle" style={{ background: '#fffaf0', color: '#dd6b20' }}><Flame size={20} /></div>
                    <div><b style={{ fontSize: '20px' }}>{tickets.length}</b><br /><span className="stat-label">Tickets Pendientes</span></div>
                </div>
                <div className="stat-item">
                    <div className="stat-circle" style={{ background: '#faf5ff', color: '#805ad5' }}><Scale size={20} /></div>
                    <div><b style={{ fontSize: '20px' }}>{tickets.reduce((acc, t) => acc + t.reses.length, 0)}</b><br /><span className="stat-label">Reses totales</span></div>
                </div>
            </div>

            <h3 style={{ fontFamily: 'serif', marginBottom: '15px' }}>Seleccionar Ticket</h3>
            {tickets.filter(t => t.id.includes(searchTerm) || t.proveedor.includes(searchTerm)).map(tk => (
                <div key={tk.id} className="ticket-card" onClick={() => handleSelectTicket(tk)}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ background: '#fdf2f4', color: '#641B2E', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold' }}>{tk.id}</div>
                        <div>
                            <h4 style={{ margin: 0 }}>{tk.proveedor}</h4>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{tk.matadero}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#64748b' }}>
                        <span><Truck size={14} /> {tk.placa}</span>
                        <span style={{ color: '#dd6b20' }}><Thermometer size={14} /> {tk.temperatura}°C</span>
                        <div className="data-item">
                            <span className="res-count">{tk.reses.length}</span>
                            <span className="res-label">Reses</span>
                        </div>
                        <span style={{ background: '#edf2f7', padding: '2px 8px', borderRadius: '10px' }}>Pendiente</span>
                    </div>
                </div>
            ))}
        </div>
    );
}