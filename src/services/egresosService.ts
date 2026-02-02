import axios from 'axios';
import type { Egreso, CreateEgresoData } from '../types/egreso';

const API_URL = 'http://127.0.0.1:3001/egresos';

export interface EgresosResponse {
    data: Egreso[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    totals: Record<string, { bolivianos: number; dolares: number }>;
}

export const getEgresos = async (params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
}): Promise<EgresosResponse> => {
    const response = await axios.get(API_URL, { params });
    return response.data;
};

export const getEgreso = async (id: number): Promise<Egreso> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createEgreso = async (data: CreateEgresoData): Promise<Egreso> => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const updateEgreso = async (id: number, data: Partial<CreateEgresoData>): Promise<Egreso> => {
    const response = await axios.patch(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteEgreso = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};
