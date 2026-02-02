import type { PrecioSeguro, CreatePrecioSeguroData } from '../types/precioSeguro';

const API_URL = 'http://127.0.0.1:3001/precios-seguros';

export const getPreciosSeguros = async (): Promise<PrecioSeguro[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Error fetching precios seguros');
    }
    return response.json();
};

export const createPrecioSeguro = async (data: CreatePrecioSeguroData): Promise<PrecioSeguro> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error creating precio seguro');
    }
    return response.json();
};

export const updatePrecioSeguro = async (id: string, data: Partial<CreatePrecioSeguroData>): Promise<PrecioSeguro> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error updating precio seguro');
    }
    return response.json();
};

export const deletePrecioSeguro = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error deleting precio seguro');
    }
};

export const reactivatePrecioSeguro = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}/reactivate`, {
        method: 'PATCH',
    });
    if (!response.ok) {
        throw new Error('Error reactivating precio seguro');
    }
};
