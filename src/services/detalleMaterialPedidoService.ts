import axios from 'axios';
import type { DetalleMaterialPedido, CreateDetalleMaterialPedidoData } from '../types/materialPedido';

const API_URL = 'http://127.0.0.1:3001';

export const getDetallesByPedido = async (pedidoId: number): Promise<DetalleMaterialPedido[]> => {
    const response = await axios.get(`${API_URL}/detalle-material-pedido/pedido/${pedidoId}`);
    return response.data;
};

export const createDetalleMaterialPedido = async (data: CreateDetalleMaterialPedidoData): Promise<DetalleMaterialPedido> => {
    const response = await axios.post(`${API_URL}/detalle-material-pedido`, data);
    return response.data;
};

export const updateDetalleMaterialPedido = async (id: number, data: Partial<CreateDetalleMaterialPedidoData>): Promise<DetalleMaterialPedido> => {
    const response = await axios.patch(`${API_URL}/detalle-material-pedido/${id}`, data);
    return response.data;
};

export const deleteDetalleMaterialPedido = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/detalle-material-pedido/${id}`);
};
