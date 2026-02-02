import type { OrdenTrabajo, CreateOrdenTrabajoData } from '../types/ordenTrabajo';

const API_URL = 'http://127.0.0.1:3001/ordenes-trabajo';

export const getOrdenesTrabajo = async (): Promise<OrdenTrabajo[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error fetching ordenes trabajo');
    return response.json();
};

export const getOrdenTrabajo = async (id: number): Promise<OrdenTrabajo> => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Error fetching orden trabajo');
    return response.json();
};

export const getOrdenTrabajoByPlaca = async (placa: string): Promise<OrdenTrabajo | null> => {
    const response = await fetch(`${API_URL}/by-placa/${placa}`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Error fetching orden trabajo by placa');
    }
    return response.json();
};

export const createOrdenTrabajo = async (data: CreateOrdenTrabajoData): Promise<OrdenTrabajo> => {
    console.log('Sending Create Payload:', JSON.stringify(data, null, 2));
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error creating orden trabajo');
    }
    return response.json();
};

export const updateOrdenTrabajo = async (id: number, data: CreateOrdenTrabajoData): Promise<OrdenTrabajo> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error updating orden trabajo');
    }
    return response.json();
};

export const deleteOrdenTrabajo = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error deleting orden trabajo');
};

export const reactivateOrdenTrabajo = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}/reactivate`, {
        method: 'PATCH',
    });
    if (!response.ok) throw new Error('Error reactivating orden trabajo');
};
