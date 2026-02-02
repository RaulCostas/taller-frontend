import type { CategoriaServicio } from '../types/categoriaServicio';

const API_URL = 'http://127.0.0.1:3001/categoria-servicio';

export const getCategoriasServicio = async (): Promise<CategoriaServicio[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Error fetching categorias servicio');
    }
    return response.json();
};

export const deleteCategoriaServicio = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error deleting categoria servicio');
    }
};

export const createCategoriaServicio = async (categoria: Omit<CategoriaServicio, 'id'>): Promise<CategoriaServicio> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoria),
    });
    if (!response.ok) {
        throw new Error('Error creating categoria servicio');
    }
    return response.json();
};

export const updateCategoriaServicio = async (id: string, categoria: Partial<CategoriaServicio>): Promise<CategoriaServicio> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoria),
    });
    if (!response.ok) {
        throw new Error('Error updating categoria servicio');
    }
    return response.json();
};
