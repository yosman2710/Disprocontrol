"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    MapPin,
    Users,
    Package,
    BarChart3,
    MessageSquare,
    Beef,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'ordenes', label: 'Órdenes de Compra', icon: Package, path: '/admin/ordenes' },
    { id: 'inventario', label: 'Inventario', icon: Package, path: '/admin/inventario' },
    { id: 'proveedores', label: 'Proveedores', icon: Users, path: '/admin/proveedores' },
    { id: 'mataderos', label: 'Mataderos', icon: MapPin, path: '/admin/mataderos' },
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3, path: '/admin/estadisticas' },
    { id: 'asistente', label: 'Asistente IA', icon: MessageSquare, path: '/admin/asistente' },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="admin-sidebar-header">
                <div className="admin-logo-small">
                    <Beef size={20} color="white" />
                </div>
                <div className="header-text" style={{ lineHeight: '1.2' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Disprocontrol</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Administrativo</div>
                </div>
            </div>

            <nav className="admin-sidebar-nav">
                <Link
                    href="/"
                    className="admin-nav-item"
                    style={{ marginBottom: '16px', borderBottom: '1px solid #2d2d2d', borderRadius: '0', paddingBottom: '16px' }}
                    title={isCollapsed ? 'Volver a Operaciones' : undefined}
                >
                    <LayoutDashboard style={{ color: '#10b981' }} />
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>Sección Principal</span>
                </Link>

                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.id}
                            href={item.path}
                            className={`admin-nav-item ${isActive ? 'active' : ''}`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div style={{ padding: '20px', borderTop: '1px solid #2d2d2d', marginTop: 'auto' }}>
                <button
                    className="admin-nav-item"
                    style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', padding: isCollapsed ? '12px' : '12px 16px' }}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? 'Expandir' : 'Colapsar'}
                >
                    {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
                    <span style={{ display: isCollapsed ? 'none' : 'inline' }}>Colapsar</span>
                </button>
            </div>
        </aside>
    );
}
