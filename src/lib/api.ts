const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiFetch(endpoint: string, options: any = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dispro_token') : null;

    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la petición');
    }

    return response.json();
}

export const handleLogout = () => {
    localStorage.removeItem('dispro_token');
    localStorage.removeItem('dispro_user');
    window.location.href = '/';
};