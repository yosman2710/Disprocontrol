"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Flame, Snowflake, Scissors, Beef, LogOut } from 'lucide-react';
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
    title: 'Recepción',
    description: 'Recepción de materia prima',
    icon: Flame,
    path: '/recepcion',
    colorClass: 'bg-destructive',
  },
  {
    title: 'Corte de Ítems',
    description: 'Control de cortes y mermas',
    icon: Scissors,
    path: '/corte_items',
    colorClass: 'bg-accent',
  },
];

export default function OperacionesPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('dispro_user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      // Redirigir a su sección correspondiente
      switch (user.role) {
        case 'pesador_caliente':
          router.push('/recepcion');
          break;
        case 'deshuesador':
          router.push('/corte_items');
          break;
        case 'registrador':
          router.push('/order');
          break;
        default:
          router.push('/login');
      }
    } else {
      setIsAdmin(true);
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('dispro_user');
    localStorage.removeItem('dispro_token');
    router.push('/login');
  };

  if (loading) return null;
  if (!isAdmin) return null;

  return (
    <div className="op-screen">
      {/* Elementos decorativos de fondo */}
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      
      {/* Iconos flotantes decorativos del rubro */}
      <div className="bg-floating-shapes">
        <div className="floating-shape shape-beef"><Beef /></div>
        <div className="floating-shape shape-flame"><Flame /></div>
        <div className="floating-shape shape-snowflake"><Snowflake /></div>
        <div className="floating-shape shape-ticket"><Ticket /></div>
        <div className="floating-grid-mesh"></div>
      </div>

      {/* Indicador de Status y Logout */}
      <div className="op-status-bar">
        <div className="status-indicator">
          <div className="status-dot" />
          SISTEMA ONLINE
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </div>

      <header className="op-header">
        <div className="op-logo-box">
          <img src="/logo.png" alt="Logo" style={{ width: 50, height: 50, objectFit: 'contain' }} />
        </div>
        <h1 className="op-title">Disprocontrol</h1>
        <p className="op-subtitle">Panel de Control de Operaciones</p>
      </header>

      <main className="op-grid">
        {sections.map((section, index) => (
          <Link
            key={section.path}
            href={section.path}
            className="op-card"
            style={{ animationDelay: `${0.2 + index * 0.1}s` }}
          >
            <div className={`op-icon-circle ${section.colorClass}`}>
              <section.icon size={40} />
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