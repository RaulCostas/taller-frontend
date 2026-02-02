import api from './api';
import type { ComisionTarjeta } from '../types/comisionTarjeta';

export const getComisionesTarjeta = async (): Promise<ComisionTarjeta[]> => {
    const response = await api.get('/comision-tarjeta');
    return response.data;
};

export const getComisionTarjeta = async (id: string): Promise<ComisionTarjeta> => {
    const response = await api.get(`/comision-tarjeta/${id}`);
    return response.data;
};

export const createComisionTarjeta = async (comisionTarjeta: Omit<ComisionTarjeta, 'id'>): Promise<ComisionTarjeta> => {
    const response = await api.post('/comision-tarjeta', comisionTarjeta);
    return response.data;
};

export const updateComisionTarjeta = async (id: number, comisionTarjeta: Partial<ComisionTarjeta>): Promise<ComisionTarjeta> => {
    const response = await api.patch(`/comision-tarjeta/${id}`, comisionTarjeta);
    return response.data;
};

export const deleteComisionTarjeta = async (id: number): Promise<void> => {
    await api.delete(`/comision-tarjeta/${id}`);
};
