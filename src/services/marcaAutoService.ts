import type { MarcaAuto, CreateMarcaAutoData, UpdateMarcaAutoData } from '../types/marcaAuto';

const API_URL = 'http://127.0.0.1:3001/marca-auto';

export const getMarcasAuto = async (search?: string, limit: number = 10, offset: number = 0): Promise<{ data: MarcaAuto[], total: number }> => {
    // Construct query parameters
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await fetch(`${API_URL}?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Error fetching marcas');
    }
    return response.json();
};

export const getAllMarcasAuto = async (): Promise<MarcaAuto[]> => {
    const response = await fetch(`${API_URL}/all`);
    if (!response.ok) {
        throw new Error('Error fetching all marcas');
    }
    return response.json();
};


export const createMarcaAuto = async (data: CreateMarcaAutoData): Promise<MarcaAuto> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Error creating marca');
    }
    return response.json();
};

export const updateMarcaAuto = async (id: number, data: UpdateMarcaAutoData): Promise<MarcaAuto> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Error updating marca');
    }
    return response.json();
};

export const deleteMarcaAuto = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error deleting marca');
    }
};

export const reactivateMarcaAuto = async (id: number): Promise<MarcaAuto> => {
    const response = await fetch(`${API_URL}/${id}/reactivate`, {
        method: 'PATCH',
    });
    if (!response.ok) {
        throw new Error('Error reactivating marca');
    }
    return response.json();
};
