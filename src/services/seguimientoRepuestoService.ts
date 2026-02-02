import api from './api';

export interface SeguimientoRepuesto {
    id: number;
    id_detalle_orden_trabajo: number;
    fecha_recepcion?: string;
    encargado?: string;
    recibido?: string;
    entregado?: string;
}

export type CreateSeguimientoRepuesto = Omit<SeguimientoRepuesto, 'id'>;
export type UpdateSeguimientoRepuesto = Partial<CreateSeguimientoRepuesto>;

export const getSeguimientos = async () => {
    const response = await api.get<SeguimientoRepuesto[]>('/seguimiento-repuesto');
    return response.data;
};

export const getSeguimientoById = async (id: number) => {
    const response = await api.get<SeguimientoRepuesto>(`/seguimiento-repuesto/${id}`);
    return response.data;
};

export const getSeguimientoByDetalleId = async (idDetalle: number) => {
    try {
        const response = await api.get<SeguimientoRepuesto>(`/seguimiento-repuesto/detalle/${idDetalle}`);
        return response.data;
    } catch (error) {
        return null;
    }
};

export const createSeguimiento = async (data: CreateSeguimientoRepuesto) => {
    const response = await api.post<SeguimientoRepuesto>('/seguimiento-repuesto', data);
    return response.data;
};

export const updateSeguimiento = async (id: number, data: UpdateSeguimientoRepuesto) => {
    const response = await api.patch<SeguimientoRepuesto>(`/seguimiento-repuesto/${id}`, data);
    return response.data;
};
