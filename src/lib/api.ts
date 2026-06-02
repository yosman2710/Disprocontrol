export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://backend-disprocar.onrender.com').replace(/\/$/, '');

export async function apiFetch(endpoint: string, options: any = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('dispro_token') : null;

    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    try {
        const response = await fetch(`${API_URL}${cleanEndpoint}`, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers },
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { message: `Error del servidor (${response.status})` };
            }

            if (response.status >= 500) {
                console.error('API Error:', { endpoint, status: response.status, errorData });
            } else {
                console.warn('API Warning:', { endpoint, status: response.status, errorData });
            }

            // Si el token es inválido o expiró (401), forzamos cierre de sesión
            // No cerramos sesión si el error es 403 (Forbidden) ya que es un tema de permisos, no de sesión expirada
            if (response.status === 401) {
                // Solo cerramos sesión si NO estamos en la página de login y NO es la propia verificación
                if (typeof window !== 'undefined' && 
                    window.location.pathname !== '/login' && 
                    endpoint !== '/auth/verify') {
                    handleLogout();
                }
            }

            const exactMessage = errorData.details
                ? `Error ${response.status}: ${errorData.error} (${errorData.details})`
                : (errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`);

            throw new Error(exactMessage);
        }

        return response.json();
    } catch (err: any) {
        // Manejo de errores de conexión (ej: servidor apagado, sin internet)
        if (err.name === 'TypeError' || err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
            console.error('Network Error:', err);
            throw new Error('Error de conexión: No se pudo contactar con el servidor. Verifique su internet o el estado del backend.');
        }
        throw err;
    }
}

export async function verifySession() {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('dispro_token');
    const user = localStorage.getItem('dispro_user');
    
    if (!token || !user) return false;
    
    try {
        await apiFetch('/auth/verify');
        return true;
    } catch (err: any) {
        // Si el endpoint no existe (404), es probable que el backend no esté actualizado.
        // En este caso, dejamos pasar la sesión como válida para no bloquear al usuario,
        // confiando en que el token existe. Las peticiones posteriores fallarán si el token es inválido.
        if (err.message.includes('404')) {
            console.warn('Endpoint /auth/verify no encontrado. Verifique la versión del backend.');
            return true;
        }
        console.warn('Session verification failed:', err);
        return false;
    }
}

export const handleLogout = () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dispro_token');
    localStorage.removeItem('dispro_user');
    
    // Evitar bucles si ya estamos en login
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};