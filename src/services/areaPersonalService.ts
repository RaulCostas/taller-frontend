import type { AreaPersonal, CreateAreaPersonalData, UpdateAreaPersonalData } from '../types/areaPersonal';

const API_URL = 'http://127.0.0.1:3001/area-personal';

export const getAreasPersonal = async (): Promise<AreaPersonal[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Error fetching areas personal');
    }
    return response.json();
};

export const deleteAreaPersonal = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error deleting area personal');
    }
};

export const createAreaPersonal = async (areaPersonal: CreateAreaPersonalData): Promise<AreaPersonal> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(areaPersonal),
    });
    if (!response.ok) {
        throw new Error('Error creating area personal');
    }
    return response.json();
};

export const updateAreaPersonal = async (id: string, areaPersonal: UpdateAreaPersonalData): Promise<AreaPersonal> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(areaPersonal),
    });
    if (!response.ok) {
        throw new Error('Error updating area personal');
    }
    return response.json();
};
