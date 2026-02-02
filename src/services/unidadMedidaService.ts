import type { CreateUnidadMedidaData, UnidadMedida, UpdateUnidadMedidaData } from '../types/unidadMedida';

const API_URL = 'http://127.0.0.1:3001';

export const getUnidadesMedida = async (): Promise<UnidadMedida[]> => {
    const response = await fetch(`${API_URL}/unidad-medida`);
    if (!response.ok) {
        throw new Error('Error al obtener unidades de medida');
    }
    return response.json();
};

export const getUnidadMedida = async (id: string): Promise<UnidadMedida> => {
    const response = await fetch(`${API_URL}/unidad-medida/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener unidad de medida');
    }
    return response.json();
};

export const createUnidadMedida = async (data: CreateUnidadMedidaData): Promise<UnidadMedida> => {
    const response = await fetch(`${API_URL}/unidad-medida`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Error al crear unidad de medida');
    }
    return response.json();
};

export const updateUnidadMedida = async (id: string, data: UpdateUnidadMedidaData): Promise<UnidadMedida> => {
    const response = await fetch(`${API_URL}/unidad-medida/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar unidad de medida');
    }
    return response.json();
};

export const deleteUnidadMedida = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/unidad-medida/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar unidad de medida');
    }
};
