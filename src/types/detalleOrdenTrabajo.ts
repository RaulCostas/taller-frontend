import type { OrdenTrabajo } from './ordenTrabajo';
import type { PrecioTaller } from './precioTaller';
import type { PrecioSeguro } from './precioSeguro';

export interface DetalleOrdenTrabajo {
    id: number;
    orden_trabajo?: OrdenTrabajo;
    precio_taller?: PrecioTaller;
    precio_seguro?: PrecioSeguro;
    cantidad: number;
    precio_unitario: number;
    total: number;
    nivel?: string;
    detalle?: string;
    observaciones?: string;
    imagenes?: string[];
    seguimiento?: any; // Using any to avoid circular dependency issues for now, or define a simplified type
}

export interface CreateDetalleOrdenTrabajoData {
    idorden_trabajo: number;
    idprecio_taller?: string;
    idprecio_seguro?: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
    nivel?: string;
    detalle?: string;
    observaciones?: string;
    imagenes?: string[];
}
