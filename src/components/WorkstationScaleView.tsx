'use client';
import {
    Flame, Snowflake, Scale, Scissors, Thermometer,
    ChevronLeft, CheckCircle
} from 'lucide-react';
import { ScaleReal } from './ScaleReal';
import '../styles/WorkstationScaleView.css';

interface Res {
    id: string | number;
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
    type: 'caliente' | 'frio' | 'deshuesado';
    ticket: Ticket;
    currentResIndex: number;
    onBack: () => void;
    onCapture: (peso: number) => void;
    onFreeze: (resId: number | string) => void;
    onBone: (resId: number | string) => void;
}

export const WorkstationScaleView = ({ type, ticket, currentResIndex, onBack, onCapture, onFreeze, onBone }: Props) => {
    const isHot = type === 'caliente';
    const isCold = type === 'frio';
    const isBoning = type === 'deshuesado';

    const resActual = ticket.reses[currentResIndex];

    // Get theme class
    const themeClass = isHot ? 'theme-hot' : (isCold ? 'theme-cold' : 'theme-boning');

    // Counts for Hot View
    const resesPendientesCaliente = ticket.reses.filter(r => r.peso === null).length;
    const resesProcesadasCaliente = ticket.reses.filter(r => r.peso !== null && r.estado !== 'congelador').length;
    const resesCongeladas = ticket.reses.filter(r => r.estado === 'congelador').length;

    // Counts for Cold View
    const resesPesoFrio = ticket.reses.filter(r => r.estado === 'pesado_frio').length;
    const resesDesguazadas = ticket.reses.filter(r => r.estado === 'desguazado' || r.estado === 'completado').length;

    return (
        <div className={`workstation-wrapper ${themeClass}`}>
            {/* HEADER DE DETALLE */}
            <div className="detail-header-card">
                <div className="header-top-row">
                    <button className="back-btn-circle" onClick={onBack}><ChevronLeft size={20} /></button>
                    <div className="ticket-meta">
                        <h2 className="ticket-id-title">ORD-{ticket.id}</h2>
                        <span className="status-label-sub">
                            {isHot ? 'Pesaje Caliente' : (isCold ? 'Pesaje Frío' : 'Estación de Deshuese')}
                        </span>
                    </div>
                </div>

                <div className="info-summary-grid" style={{ gridTemplateColumns: isBoning ? 'repeat(6, 1fr)' : 'repeat(5, 1fr)' }}>
                    <div className="summary-item"><label>Proveedor</label><span>{ticket.proveedor}</span></div>
                    <div className="summary-item"><label>Matadero</label><span>{ticket.matadero}</span></div>
                    <div className="summary-item"><label>Vehículo</label><span>{ticket.placa}</span></div>
                    {isBoning && (
                        <div className="summary-item" style={{ borderLeft: '3px solid #7c3aed' }}>
                            <label>Peso Frío (REF)</label>
                            <span style={{ color: '#7c3aed' }}>{resActual?.peso ? `${resActual.peso} kg` : '---'}</span>
                        </div>
                    )}
                    <div className="summary-item"><label>Temperatura</label><span className="temp-val">{ticket.temperatura}°C</span></div>
                    <div className="summary-item"><label>Reses</label><span>{ticket.reses.length}</span></div>
                </div>
            </div>

            {/* SECCION DE PROCESO */}
            <div className="process-flow-card">
                <h3 className="section-title">Flujo de Proceso</h3>

                <div className="flow-steps-grid">
                    <div className={`flow-step ${isHot && resesProcesadasCaliente < ticket.reses.length ? 'active' : 'done'}`}>
                        <div className="step-circle done">
                            <Thermometer size={24} />
                        </div>
                        <span className="step-label">Recepción</span>
                        <span className="step-count">{isHot ? resesPendientesCaliente : 0}</span>
                    </div>

                    <div className={`flow-step ${isHot ? 'active' : 'done'}`}>
                        <div className={`step-circle ${(isHot ? resesProcesadasCaliente > 0 : true) ? 'done' : ''}`}>
                            <Flame size={24} />
                        </div>
                        <span className="step-label">Peso Caliente</span>
                        <span className="step-count">{isHot ? resesProcesadasCaliente : ticket.reses.length}</span>
                    </div>

                    <div className={`flow-step ${isCold || resesCongeladas > 0 ? 'active' : (isBoning ? 'done' : '')}`}>
                        <div className={`step-circle ${isCold || resesCongeladas > 0 || isBoning ? 'done' : ''}`}>
                            <Snowflake size={24} />
                        </div>
                        <span className="step-label">Congelador</span>
                        <span className="step-count">{resesCongeladas}</span>
                    </div>

                    <div className={`flow-step ${isCold ? 'active' : (isBoning ? 'done' : 'disabled')} ${resesPesoFrio > 0 ? 'done' : ''}`}>
                        <div className={`step-circle ${resesPesoFrio > 0 || isBoning ? 'done' : ''}`}>
                            <Scale size={24} />
                        </div>
                        <span className="step-label">Peso Frío</span>
                        <span className="step-count">{resesPesoFrio}</span>
                    </div>

                    <div className={`flow-step ${isBoning ? 'active' : 'disabled'} ${resesDesguazadas > 0 ? 'done' : ''}`}>
                        <div className={`step-circle ${resesDesguazadas > 0 ? 'done' : ''}`}>
                            <Scissors size={24} />
                        </div>
                        <span className="step-label">Deshuese</span>
                        <span className="step-count">{resesDesguazadas}</span>
                    </div>
                </div>

                <div className="progress-bars-container">
                    <div className="progress-group">
                        <div className="progress-label">
                            <span>Peso Caliente</span>
                            <span>{isHot ? resesProcesadasCaliente : ticket.reses.length}/{ticket.reses.length}</span>
                        </div>
                        <div className="progress-track">
                            <div
                                className="progress-fill hot"
                                style={{ width: `${((isHot ? resesProcesadasCaliente : ticket.reses.length) / ticket.reses.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="progress-group">
                        <div className="progress-label">
                            <span>En Congelador</span>
                            <span>{resesCongeladas}/{ticket.reses.length}</span>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill cold" style={{ width: `${(resesCongeladas / ticket.reses.length) * 100}%` }}></div>
                        </div>
                    </div>

                    <div className="progress-group">
                        <div className="progress-label">
                            <span>Peso Frío / Desguace</span>
                            <span>{resesPesoFrio}/{ticket.reses.length}</span>
                        </div>
                        <div className="progress-track">
                            <div
                                className="progress-fill cut"
                                style={{ width: `${((resesPesoFrio + resesDesguazadas) / ticket.reses.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="individual-status-section">
                    <label className="status-label-small">Estado individual:</label>
                    <div className="status-row">
                        {ticket.reses.map((res, idx) => (
                            <div
                                key={res.id}
                                className={`status-box ${res.peso !== null ? 'completed' : ''} ${idx === currentResIndex ? 'active' : ''}`}
                            >
                                #{res.numero}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="main-work-grid">
                {resActual && !isBoning && (
                    <ScaleReal
                        title={isHot ? "Peso Caliente" : "Peso Frío"}
                        icon={isHot ? <Flame size={20} className="icon-hot" /> : <Snowflake size={20} className="icon-cold" />}
                        resNumber={resActual.numero}
                        onCapture={onCapture}
                        variant={isHot ? 'hot' : 'cold'}
                        disabled={!isHot && resActual.estado !== 'congelador'}
                    />
                )}

                <div className="res-side-inventory">
                    <div className="inventory-header">
                        Reses de la Orden
                        <span className="count-pill">{ticket.reses.filter(r => r.peso !== null).length} / {ticket.reses.length}</span>
                    </div>
                    <div className="inventory-list">
                        {ticket.reses
                            .filter(res => {
                                if (isHot) {
                                    return res.peso === null || res.estado === 'pesado_caliente';
                                }
                                return true;
                            })
                            .map((res) => (
                                <div key={res.id} className={`inventory-item ${res.numero - 1 === currentResIndex ? 'is-current' : ''}`}>
                                    <div className="res-id-box">#{res.numero}</div>
                                    <div className="res-data">
                                        <h4>Res #{res.numero}</h4>
                                        <p>{res.peso !== null ? `${res.peso} kg registrados (${isHot ? 'Caliente' : 'Frío'})` : 'Pendiente de pesaje'}</p>
                                    </div>
                                    {res.peso !== null && res.estado !== 'congelador' && isHot && (
                                        <button
                                            className="btn-freeze-action"
                                            title="Enviar al congelador"
                                            onClick={() => onFreeze(res.id)}
                                        >
                                            <Snowflake size={18} />
                                        </button>
                                    )}
                                    {!isHot && !isBoning && res.estado === 'pesado_frio' && (
                                        <button
                                            className="btn-freeze-action"
                                            style={{ background: '#7c3aed', color: '#fff', border: 'none' }}
                                            title="Enviar a Deshuese"
                                            onClick={() => onBone(res.id)}
                                        >
                                            <Scissors size={18} />
                                        </button>
                                    )}
                                    {res.estado === 'congelador' && <Snowflake size={20} className="status-frozen" />}
                                    {(res.estado === 'desguazado' || res.estado === 'completado') && <Scissors size={22} className="check-done" style={{ color: '#7c3aed' }} />}
                                    {res.peso !== null && res.estado !== 'congelador' && res.estado !== 'pesado_frio' && res.estado !== 'desguazado' && <CheckCircle size={20} className="check-done" />}
                                    {res.estado === 'pesado_frio' && <CheckCircle size={20} className="check-done" style={{ color: '#3182ce' }} />}
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};