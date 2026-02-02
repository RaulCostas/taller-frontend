import type { DetalleOrdenTrabajo, CreateDetalleOrdenTrabajoData } from '../types/detalleOrdenTrabajo';

const API_URL = 'http://127.0.0.1:3001/detalle-orden-trabajo';

export const getDetallesOrdenTrabajo = async (): Promise<DetalleOrdenTrabajo[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error fetching detalles');
    return response.json();
};

export const getDetallesByOrden = async (idorden: number): Promise<DetalleOrdenTrabajo[]> => {
    const response = await fetch(`${API_URL}/orden/${idorden}`);
    if (!response.ok) throw new Error('Error fetching detalles by orden');
    return response.json();
};

export const getDetalleOrdenTrabajo = async (id: number): Promise<DetalleOrdenTrabajo> => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Error fetching detalle');
    return response.json();
};

export const createDetalleOrdenTrabajo = async (data: CreateDetalleOrdenTrabajoData): Promise<DetalleOrdenTrabajo> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error creating detalle');
    return response.json();
};

export const updateDetalleOrdenTrabajo = async (id: number, data: Partial<CreateDetalleOrdenTrabajoData>): Promise<DetalleOrdenTrabajo> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error updating detalle');
    return response.json();
};

export const deleteDetalleOrdenTrabajo = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error deleting detalle');
};

export const deleteDetalleOrdenTrabajoHard = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}/hard`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error deleting detalle permanently');
};

export const reactivateDetalleOrdenTrabajo = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}/reactivate`, {
        method: 'PATCH',
    });
    if (!response.ok) throw new Error('Error reactivating detalle');
};
