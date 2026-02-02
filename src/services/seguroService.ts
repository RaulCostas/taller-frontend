import type { Seguro } from '../types/seguro';

const API_URL = 'http://127.0.0.1:3001/seguros';

export const getSeguros = async (): Promise<Seguro[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Error fetching seguros');
    }
    return response.json();
};

export const deleteSeguro = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error deleting seguro');
    }
};

export const createSeguro = async (seguro: Omit<Seguro, 'id'>): Promise<Seguro> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(seguro),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error creating seguro');
    }
    return response.json();
};

export const updateSeguro = async (id: string, seguro: Partial<Seguro>): Promise<Seguro> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(seguro),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error updating seguro');
    }
    return response.json();
};
