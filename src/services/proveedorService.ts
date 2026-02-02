import type { Proveedor, CreateProveedorData, UpdateProveedorData } from '../types/proveedor';

const API_URL = 'http://127.0.0.1:3001/proveedores';

export const getProveedores = async (): Promise<Proveedor[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Error fetching proveedores');
    }
    return response.json();
};

export const deleteProveedor = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error deleting proveedor');
    }
};

export const createProveedor = async (proveedor: CreateProveedorData): Promise<Proveedor> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(proveedor),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error creating proveedor');
    }
    return response.json();
};

export const updateProveedor = async (id: string, proveedor: UpdateProveedorData): Promise<Proveedor> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(proveedor),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error updating proveedor');
    }
    return response.json();
};
