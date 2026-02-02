import type { Inspector, CreateInspectorData, UpdateInspectorData } from '../types/inspector';

const API_URL = 'http://127.0.0.1:3001/inspectores';

export const getInspectores = async (): Promise<Inspector[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Error fetching inspectores');
    }
    return response.json();
};

export const deleteInspector = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error deleting inspector');
    }
};

export const createInspector = async (inspector: CreateInspectorData): Promise<Inspector> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(inspector),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error creating inspector');
    }
    return response.json();
};

export const updateInspector = async (id: string, inspector: UpdateInspectorData): Promise<Inspector> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(inspector),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error updating inspector');
    }
    return response.json();
};
