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
      {/* Indicador de Status y Logout arriba a la derecha */}
      <div style={{ position: 'absolute', top: 20, right: 40, display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '14px' }}>
          ● SISTEMA ONLINE
        </div>
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '8px 16px', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>

      <header className="op-header">
        <div className="op-logo-box">
          <Beef size={60} strokeWidth={2.5} color='white' />
        </div>
        <h1 className="op-title">Disprocontrol</h1>
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