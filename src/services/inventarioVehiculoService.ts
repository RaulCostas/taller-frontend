import api from './api';

export interface InventarioVehiculo {
    id: number;
    id_orden_trabajo: number;
    exterior?: Record<string, string>;
    interior?: Record<string, string>;
    bajo_capo?: Record<string, string>;
    accesorios?: Record<string, string>;
    observaciones?: string;
}

export interface CreateInventarioVehiculoData {
    id_orden_trabajo: number;
    exterior?: Record<string, string>;
    interior?: Record<string, string>;
    bajo_capo?: Record<string, string>;
    accesorios?: Record<string, string>;
    observaciones?: string;
}

export const getInventarioByOrden = async (idOrden: number): Promise<InventarioVehiculo | null> => {
    try {
        const response = await api.get(`/inventario-vehiculo/orden/${idOrden}`);
        return response.data;
    } catch (error) {
        return null;
    }
};

export const saveInventarioVehiculo = async (data: CreateInventarioVehiculoData) => {
    const response = await api.post('/inventario-vehiculo', data);
    return response.data;
};
