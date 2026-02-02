import type { TrabajoAsignado, CreateTrabajoAsignadoDto, UpdateTrabajoAsignadoDto } from '../types/trabajoAsignado';

const API_URL = 'http://127.0.0.1:3001/trabajos-asignados';

export const getTrabajosAsignados = async (): Promise<TrabajoAsignado[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error fetching trabajos asignados');
    return response.json();
};

export const getTrabajoAsignado = async (id: number): Promise<TrabajoAsignado> => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Error fetching trabajo asignado');
    return response.json();
};

export const getTrabajoByDetalle = async (idDetalle: number): Promise<TrabajoAsignado | null> => {
    const response = await fetch(`${API_URL}/detalle/${idDetalle}`);
    if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Error fetching trabajo asignado by detalle');
    }

    // Check if response has content
    const text = await response.text();
    if (!text || text.trim() === '') {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        console.error('Error parsing JSON:', error, 'Response:', text);
        return null;
    }
};

export const createTrabajoAsignado = async (data: CreateTrabajoAsignadoDto): Promise<TrabajoAsignado> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error creating trabajo asignado');
    return response.json();
};

export const updateTrabajoAsignado = async (id: number, data: UpdateTrabajoAsignadoDto): Promise<TrabajoAsignado> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error updating trabajo asignado');
    return response.json();
};

export const deleteTrabajoAsignado = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error deleting trabajo asignado');
};
