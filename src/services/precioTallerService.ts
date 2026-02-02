import type { PrecioTaller, CreatePrecioTallerData } from '../types/precioTaller';

const API_URL = 'http://127.0.0.1:3001/precios-taller';

export const getPreciosTaller = async (): Promise<PrecioTaller[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error fetching precios taller');
    return response.json();
};

export const getPrecioTaller = async (id: string): Promise<PrecioTaller> => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Error fetching precio taller');
    return response.json();
};

export const createPrecioTaller = async (data: CreatePrecioTallerData): Promise<PrecioTaller> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error creating precio taller');
    return response.json();
};

export const updatePrecioTaller = async (id: string, data: CreatePrecioTallerData): Promise<PrecioTaller> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error updating precio taller');
    return response.json();
};

export const deletePrecioTaller = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error deleting precio taller');
};

export const reactivatePrecioTaller = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}/reactivate`, {
        method: 'PATCH',
    });
    if (!response.ok) throw new Error('Error reactivating precio taller');
};
