/**
 * Funzione per effettuare richieste API
 * @param method - Metodo HTTP (GET, POST, PUT, PATCH, DELETE)
 * @param endpoint - Endpoint API
 * @param data - Dati da inviare (opzionale)
 * @returns Promise con la risposta
 */
export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<T> {
  const url = endpoint.startsWith('/') ? `${endpoint}` : `/${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `API request failed with status ${response.status}`
    );
  }

  // Per richieste DELETE che restituiscono 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
} 