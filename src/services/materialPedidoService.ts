import axios from 'axios';
import type { MaterialPedido, CreateMaterialPedidoData } from '../types/materialPedido';

const API_URL = 'http://127.0.0.1:3001'; // Adjust as needed or use env var

export const getMaterialPedidos = async (): Promise<MaterialPedido[]> => {
    const response = await axios.get(`${API_URL}/material-pedido`);
    return response.data;
};

export const getMaterialPedido = async (id: number): Promise<MaterialPedido> => {
    const response = await axios.get(`${API_URL}/material-pedido/${id}`);
    return response.data;
};

export const createMaterialPedido = async (data: CreateMaterialPedidoData): Promise<MaterialPedido> => {
    const response = await axios.post(`${API_URL}/material-pedido`, data);
    return response.data;
};

export const updateMaterialPedido = async (id: number, data: Partial<CreateMaterialPedidoData>): Promise<MaterialPedido> => {
    const response = await axios.patch(`${API_URL}/material-pedido/${id}`, data);
    return response.data;
};

export const deleteMaterialPedido = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/material-pedido/${id}`);
};
