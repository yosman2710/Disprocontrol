import { AdminSidebar } from '@/components/AdminSidebar';
import { FloatingChatbot } from '@/components/FloatingChatbot';
import '@/styles/admin.css';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main style={{ flex: 1, overflowY: 'auto' }}>
                {children}
            </main>
            <FloatingChatbot />
        </div>
    );
}
