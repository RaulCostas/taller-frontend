import type { FormaPago } from '../types/formaPago';

const API_URL = 'http://127.0.0.1:3001/forma-pago';

export const getFormasPago = async (): Promise<FormaPago[]> => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Error fetching formas de pago: ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error('Error in getFormasPago:', error);
        throw error;
    }
};

export const deleteFormaPago = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error deleting forma de pago');
    }
};

export const createFormaPago = async (formaPago: Omit<FormaPago, 'id'>): Promise<FormaPago> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formaPago),
    });
    if (!response.ok) {
        throw new Error('Error creating forma de pago');
    }
    return response.json();
};

export const updateFormaPago = async (id: string, formaPago: Partial<FormaPago>): Promise<FormaPago> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formaPago),
    });
    if (!response.ok) {
        throw new Error('Error updating forma de pago');
    }
    return response.json();
};
