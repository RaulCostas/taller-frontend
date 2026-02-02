import api from './api';
import type { Cotizacion, CreateCotizacionData, UpdateCotizacionData } from '../types/cotizacion';

export const getCotizaciones = async (): Promise<Cotizacion[]> => {
    const response = await api.get('/cotizaciones');
    return response.data;
};

export const getCotizacion = async (id: number): Promise<Cotizacion> => {
    const response = await api.get(`/cotizaciones/${id}`);
    return response.data;
};

export const createCotizacion = async (data: CreateCotizacionData): Promise<Cotizacion> => {
    const response = await api.post('/cotizaciones', data);
    return response.data;
};

export const updateCotizacion = async (id: number, data: UpdateCotizacionData): Promise<Cotizacion> => {
    const response = await api.patch(`/cotizaciones/${id}`, data);
    return response.data;
};

export const deleteCotizacion = async (id: number): Promise<void> => {
    await api.delete(`/cotizaciones/${id}`);
};
