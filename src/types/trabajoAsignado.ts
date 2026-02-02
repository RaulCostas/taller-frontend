import type { DetalleOrdenTrabajo } from './detalleOrdenTrabajo';
import type { Personal } from './personal';

export interface TrabajoAsignado {
    id: number;
    detalle_orden_trabajo: DetalleOrdenTrabajo;
    personal: Personal;
    fecha_asignado: string;
    fecha_entrega?: string;
    observaciones?: string;
    monto: number;
    cancelado: boolean;
    estado: string;
    pago_trabajo?: {
        id: number;
        fecha_pago: string;
    };
}

export interface CreateTrabajoAsignadoDto {
    iddetalle_orden_trabajo: number;
    idpersonal: string;
    fecha_asignado: string;
    fecha_entrega?: string;
    observaciones?: string;
    monto?: number;
    cancelado?: boolean;
}

export interface UpdateTrabajoAsignadoDto extends Partial<CreateTrabajoAsignadoDto> { }
