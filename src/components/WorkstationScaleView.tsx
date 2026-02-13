'use client';
import {
    Flame, Snowflake, Scale, Scissors, Thermometer,
    ChevronLeft, CheckCircle
} from 'lucide-react';
import { ScaleSimulator } from './ScaleSimulator'; // <--- IMPORTACIÓN CLAVE
import '../styles/WorkstationScaleView.css';

interface Res {
    id: string;
    numero: number;
    peso: number | null;
    estado: string;
}

interface Ticket {
    id: string;
    proveedor: string;
    matadero: string;
    placa: string;
    temperatura: number;
    reses: Res[];
}

interface Props {
    type: 'caliente' | 'frio';
    ticket: Ticket;
    currentResIndex: number;
    onBack: () => void;
    onCapture: (peso: number) => void;
}

export const WorkstationScaleView = ({ type, ticket, currentResIndex, onBack, onCapture }: Props) => {
    const isHot = type === 'caliente';
    const resActual = ticket.reses[currentResIndex];

    return (
        <div className="workstation-wrapper">
            {/* HEADER DE DETALLE */}
            <div className="detail-header-card">
                <div className="header-top-row">
                    <button className="back-btn-circle" onClick={onBack}><ChevronLeft size={20} /></button>
                    <div className="ticket-meta">
                        <h2 className="ticket-id-title">{ticket.id}</h2>
                        <span className="status-label-sub">Procesando ticket de recepción</span>
                    </div>
                </div>

                <div className="info-summary-grid">
                    <div className="summary-item"><label>Proveedor</label><span>{ticket.proveedor}</span></div>
                    <div className="summary-item"><label>Matadero</label><span>{ticket.matadero}</span></div>
                    <div className="summary-item"><label>Vehículo</label><span>{ticket.placa}</span></div>
                    <div className="summary-item"><label>Temperatura</label><span className="temp-val">{ticket.temperatura}°C</span></div>
                    <div className="summary-item"><label>Reses</label><span>{ticket.reses.length} (Mixto)</span></div>
                </div>
            </div>

            {/* SECCION DE PROCESO */}
            <div className="process-flow-card">
                <h3 className="section-title">Flujo de Proceso</h3>

                <div className="flow-steps-grid">
                    <div className="flow-step">
                        <div className="step-circle active">
                            <Thermometer size={24} />
                        </div>
                        <span className="step-label">Pendiente</span>
                        <span className="step-count">{ticket.reses.filter(r => !r.peso).length}</span>
                    </div>

                    <div className="flow-step">
                        <div className="step-circle">
                            <Flame size={24} />
                        </div>
                        <span className="step-label">Peso Caliente</span>
                        <span className="step-count">0</span>
                    </div>

                    <div className="flow-step">
                        <div className="step-circle done">
                            <Snowflake size={24} />
                        </div>
                        <span className="step-label">Congelador</span>
                        <span className="step-count">{ticket.reses.filter(r => r.peso).length}</span>
                    </div>

                    <div className="flow-step disabled">
                        <div className="step-circle">
                            <Scale size={24} />
                        </div>
                        <span className="step-label">Peso Frío</span>
                        <span className="step-count">0</span>
                    </div>

                    <div className="flow-step disabled">
                        <div className="step-circle">
                            <Scissors size={24} />
                        </div>
                        <span className="step-label">Desguazado</span>
                        <span className="step-count">0</span>
                    </div>
                </div>

                <div className="progress-bars-container">
                    <div className="progress-group">
                        <div className="progress-label">
                            <span>Peso Caliente</span>
                            <span>{ticket.reses.filter(r => r.peso).length}/{ticket.reses.length}</span>
                        </div>
                        <div className="progress-track">
                            <div
                                className="progress-fill hot"
                                style={{ width: `${(ticket.reses.filter(r => r.peso).length / ticket.reses.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="progress-group">
                        <div className="progress-label">
                            <span>Peso Frío</span>
                            <span>0/{ticket.reses.length}</span>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill cold" style={{ width: '0%' }}></div>
                        </div>
                    </div>

                    <div className="progress-group">
                        <div className="progress-label">
                            <span>Desguazado</span>
                            <span>0/{ticket.reses.length}</span>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill cut" style={{ width: '0%' }}></div>
                        </div>
                    </div>
                </div>

                <div className="individual-status-section">
                    <label className="status-label-small">Estado individual:</label>
                    <div className="status-row">
                        {ticket.reses.map((res, idx) => (
                            <div
                                key={res.id}
                                className={`status-box ${res.peso ? 'completed' : ''} ${idx === currentResIndex ? 'active' : ''}`}
                            >
                                #{res.numero}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="main-work-grid">
                {/* IMPLEMENTACIÓN DEL SIMULADOR */}
                <ScaleSimulator
                    title={isHot ? "Peso Caliente" : "Peso Frío"}
                    icon={isHot ? <Flame size={20} className="icon-hot" /> : <Snowflake size={20} className="icon-cold" />}
                    resNumber={resActual?.numero}
                    onCapture={onCapture}
                    variant={isHot ? 'hot' : 'cold'}
                />

                {/* LISTA DE RESES (DERECHA) */}
                <div className="res-side-inventory">
                    <div className="inventory-header">
                        Reses del Ticket
                        <span className="count-pill">{ticket.reses.filter(r => r.peso).length} / {ticket.reses.length}</span>
                    </div>
                    <div className="inventory-list">
                        {ticket.reses.map((res, idx) => (
                            <div key={res.id} className={`inventory-item ${idx === currentResIndex ? 'is-current' : ''}`}>
                                <div className="res-id-box">#{res.numero}</div>
                                <div className="res-data">
                                    <h4>Cuerda #{res.numero}</h4>
                                    <p>{res.peso ? `${res.peso} kg registrados` : 'Pendiente de pesaje'}</p>
                                </div>
                                {res.peso && <CheckCircle size={20} className="check-done" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}; 