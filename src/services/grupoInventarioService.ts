import type { CreateGrupoInventarioData, GrupoInventario, UpdateGrupoInventarioData } from '../types/grupoInventario';

const API_URL = 'http://127.0.0.1:3001';

export const getGruposInventario = async (): Promise<GrupoInventario[]> => {
    const response = await fetch(`${API_URL}/grupo-inventario`);
    if (!response.ok) {
        throw new Error('Error al obtener grupos de inventario');
    }
    return response.json();
};

export const getGrupoInventario = async (id: string): Promise<GrupoInventario> => {
    const response = await fetch(`${API_URL}/grupo-inventario/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener grupo de inventario');
    }
    return response.json();
};

export const createGrupoInventario = async (data: CreateGrupoInventarioData): Promise<GrupoInventario> => {
    const response = await fetch(`${API_URL}/grupo-inventario`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Error al crear grupo de inventario');
    }
    return response.json();
};

export const updateGrupoInventario = async (id: string, data: UpdateGrupoInventarioData): Promise<GrupoInventario> => {
    const response = await fetch(`${API_URL}/grupo-inventario/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar grupo de inventario');
    }
    return response.json();
};

export const deleteGrupoInventario = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/grupo-inventario/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar grupo de inventario');
    }
};
