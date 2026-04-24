export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://backend-disprocar.onrender.com').replace(/\/$/, '');

export async function apiFetch(endpoint: string, options: any = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dispro_token') : null;

    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    // Asegurar que el endpoint empiece con /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const response = await fetch(`${API_URL}${cleanEndpoint}`, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('API Error:', { endpoint, status: response.status, errorData });

        // Si el token es inválido o expiró, forzamos cierre de sesión
        if (response.status === 401 || response.status === 403) {
            handleLogout();
        }

        const exactMessage = errorData.details
            ? `${errorData.error} (${errorData.details})`
            : (errorData.message || errorData.error || 'Error en la petición');

        throw new Error(exactMessage);
    }

    return response.json();
}

export const handleLogout = () => {
    localStorage.removeItem('dispro_token');
    localStorage.removeItem('dispro_user');
    window.location.href = '/';
};