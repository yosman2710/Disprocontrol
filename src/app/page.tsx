"use client"; // Necesario para que Link y el renderizado funcionen correctamente en este caso

import Link from 'next/link';
import { Ticket, Flame, Snowflake, Scissors, Beef } from 'lucide-react';
import '../styles/operations.css';

const sections = [
  {
    title: 'Registrar Orden',
    description: 'Orden de ingreso de reses',
    icon: Ticket,
    path: '/order',
    colorClass: 'bg-primary',
  },
  {
    title: 'Peso Caliente',
    description: 'Báscula de sacrificio',
    icon: Flame,
    path: '/heavy_hot',
    colorClass: 'bg-destructive',
  },
  {
    title: 'Peso Frío',
    description: 'Salida de cava fría',
    icon: Snowflake,
    path: '/heavy_cold',
    colorClass: 'bg-info',
  },
  {
    title: 'Deshuesado',
    description: 'Control de cortes y mermas',
    icon: Scissors,
    path: '/boner',
    colorClass: 'bg-accent',
  },
];

export default function OperacionesPage() {
  return (
    <div className="op-screen">
      {/* Indicador de Status arriba a la derecha opcional */}
      <div style={{ position: 'absolute', top: 20, right: 40, color: '#22c55e', fontWeight: 'bold' }}>
        ● SISTEMA ONLINE
      </div>

      <header className="op-header">
        <div className="op-logo-box">
          <Beef size={60} strokeWidth={2.5} />
        </div>
        <h1 className="op-title">Disprocar</h1>
        <p className="op-subtitle">Panel de Control de Operaciones</p>
      </header>

      <main className="op-grid">
        {sections.map((section) => (
          <Link
            key={section.path}
            href={section.path}
            className="op-card"
          >
            <div className={`op-icon-circle ${section.colorClass}`}>
              <section.icon size={48} />
            </div>
            <h2 className="op-card-title">{section.title}</h2>
            <p className="op-card-desc">{section.description}</p>
          </Link>
        ))}
      </main>

      <Link href="/admin/dashboard">
        <button className="op-footer-nav">
          Acceder al Dashboard Administrativo
        </button>
      </Link>
    </div>
  );
}