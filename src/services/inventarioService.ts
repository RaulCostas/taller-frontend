import type { CreateInventarioData, Inventario, UpdateInventarioData } from '../types/inventario';

const API_URL = 'http://127.0.0.1:3001';

export const getInventarios = async (): Promise<Inventario[]> => {
    const response = await fetch(`${API_URL}/inventario`);
    if (!response.ok) {
        throw new Error('Failed to fetch inventarios');
    }
    return response.json();
};

export const createInventario = async (data: CreateInventarioData): Promise<Inventario> => {
    const response = await fetch(`${API_URL}/inventario`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to create inventario');
    }
    return response.json();
};

export const updateInventario = async (id: number, data: UpdateInventarioData): Promise<Inventario> => {
    const response = await fetch(`${API_URL}/inventario/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to update inventario');
    }
    return response.json();
};

export const deleteInventario = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/inventario/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete inventario');
    }
};
