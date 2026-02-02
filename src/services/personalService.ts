import type { Personal, CreatePersonalData, UpdatePersonalData } from '../types/personal';

const API_URL = 'http://127.0.0.1:3001/personal';

export const getPersonal = async (): Promise<Personal[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Error fetching personal');
    }
    return response.json();
};

export const deletePersonal = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error deleting personal');
    }
};

export const createPersonal = async (personal: CreatePersonalData): Promise<Personal> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(personal),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error creating personal');
    }
    return response.json();
};

export const updatePersonal = async (id: string, personal: UpdatePersonalData): Promise<Personal> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(personal),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error updating personal');
    }
    return response.json();
};
