'use client';
import { useState } from 'react';
import '../styles/order.css';
import { StationLogin } from '@/components/stationLogin';

const MOCK_orders = [
    { id: 'TK-001', proveedor: 'Hacienda La Aurora', matadero: 'Ind. Zulia', placa: 'ABC-123', estado: 'completado', fecha: '2024-01-28', reses: 8 },
    { id: 'TK-002', proveedor: 'Finca El Rodeo', matadero: 'Frig. del Norte', placa: 'XYZ-789', estado: 'pendiente', fecha: '2024-01-29', reses: 5 },
];

export default function Order() {
    const [modalNuevo, setModalNuevo] = useState(false);
    const [ticketDetalle, setTicketDetalle] = useState<any>(null);

    return (
        <div className="container">
            {/* HEADER PRINCIPAL */}
            <header className="header">
                <div className="title">
                    <h1>Registro de Ordenes</h1>
                    <p>Gestión de recepción de ganado</p>
                </div>
                <button className="btnNuevo" onClick={() => setModalNuevo(true)}>+ Nueva Orden</button>
            </header>

            <input type="text" className="searchBox" placeholder="Buscar por ID, proveedor o chofer..." />

            {/* GRID DE TICKETS */}
            <div className="grid">
                {MOCK_orders.map(tk => (
                    <div key={tk.id} className="card" onClick={() => setTicketDetalle(tk)}>
                        <div className="cardHeader">
                            <span className="id">{tk.id}</span>
                            <span className={`badge ${tk.estado}`}>{tk.estado}</span>
                            <span style={{ color: '#a0aec0' }}>{tk.fecha}</span>
                        </div>
                        <div className="cardBody">
                            <h2>{tk.proveedor}</h2>
                            <p className="subtext">{tk.matadero}</p>
                            <div className="tags">
                                <span className="tag">🚛 {tk.placa}</span>
                                <span className="tag">{tk.reses} reses</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL: NUEVO TICKET */}
            {modalNuevo && (
                <div className="overlay">
                    <div className="modal">
                        <button className="closeBtn" onClick={() => setModalNuevo(false)}>&times;</button>
                        <h2 style={{ fontFamily: 'serif' }}>Registrar Nueva Orden</h2>

                        <form onSubmit={(e) => e.preventDefault()}>
                            <p className="sectionTitle">Origen</p>
                            <div className="formGrid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="fieldGroup">
                                    <label>Proveedor</label>
                                    <select><option>Hacienda La Aurora</option></select>
                                </div>
                                <div className="fieldGroup">
                                    <label>Matadero</label>
                                    <select><option>Matadero Industrial Zulia</option></select>
                                </div>
                            </div>

                            <p className="sectionTitle">Transporte</p>
                            <div className="formGrid">
                                <div className="fieldGroup"><label>Placa</label><input placeholder="ABC-123" /></div>
                                <div className="fieldGroup"><label>Chofer</label><input placeholder="Nombre" /></div>
                                <div className="fieldGroup"><label>Temp (°C)</label><input type="number" placeholder="4.0" /></div>
                            </div>

                            <p className="sectionTitle">Ganado</p>
                            <div className="formGrid">
                                <div className="fieldGroup"><label>Cantidad</label><input type="number" /></div>
                                <div className="fieldGroup">
                                    <label>Sexo</label>
                                    <select><option>Mixto</option><option>Macho</option></select>
                                </div>
                                <div className="fieldGroup">
                                    <label>Clasificación</label>
                                    <select><option>Premium</option></select>
                                </div>
                            </div>

                            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setModalNuevo(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ccc', background: 'none' }}>Cancelar</button>
                                <button type="submit" className="btnNuevo">Registrar Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: DETALLE TICKET */}
            {ticketDetalle && (
                <div className="overlay">
                    <div className="modal">
                        <button className="closeBtn" onClick={() => setTicketDetalle(null)}>&times;</button>
                        <h2 style={{ fontFamily: 'serif' }}>⚖️ Detalle de Ticket {ticketDetalle.id}</h2>

                        <div className="detailHeaderInfo">
                            <div className="fieldGroup"><label>Proveedor</label><span>{ticketDetalle.proveedor}</span></div>
                            <div className="fieldGroup"><label>Placa</label><span>{ticketDetalle.placa}</span></div>
                            <div className="fieldGroup"><label>Reses</label><span>{ticketDetalle.reses}</span></div>
                            <div className="fieldGroup"><label>Temp</label><span style={{ color: 'green' }}>4.2°C</span></div>
                        </div>

                        <p className="sectionTitle">Reses de la Orden</p>
                        <div className="resList">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="resItem">
                                    <div className="resInfo">
                                        <div className="resCircle">🐄</div>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>Res #{i}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>Pendiente</div>
                                        </div>
                                    </div>
                                    <div className="weightInfo">
                                        <div><span className="weightLabel">Caliente</span><span className="weightVal">310 kg</span></div>
                                        <div><span className="weightLabel">Frío</span><span className="weightVal">—</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}