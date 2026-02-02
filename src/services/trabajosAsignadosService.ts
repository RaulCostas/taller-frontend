import api from './api';

export interface TrabajoAsignado {
    id: number;
    iddetalle_orden_trabajo: number;
    detalle_orden_trabajo: any; // Define properly if needed
    idpersonal: number;
    personal: any; // Define properly if needed
    fecha_asignado: string;
    fecha_entrega?: string;
    observaciones?: string;
    monto: number;
    cancelado: boolean;
    pago_trabajo?: {
        fecha_pago: string;
    };
}

export interface FilterTrabajoAsignado {
    personalId?: number;
    fechaInicio?: string;
    fechaFin?: string;
    terminado?: string; // 'true' | 'false'
}

export const getTrabajosAsignadosFilter = async (filters: FilterTrabajoAsignado): Promise<TrabajoAsignado[]> => {
    // Clean filters to remove undefined/empty values
    const params = new URLSearchParams();
    if (filters.personalId) params.append('personalId', filters.personalId.toString());
    if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
    if (filters.terminado) params.append('terminado', filters.terminado);

    const response = await api.get<TrabajoAsignado[]>(`/trabajos-asignados/filter?${params.toString()}`);
    return response.data;
};
