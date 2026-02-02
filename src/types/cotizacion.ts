import type { MarcaAuto } from './marcaAuto';
import type { TipoVehiculo } from './tipoVehiculo';
import type { User } from './user';
import type { Seguro } from './seguro';
import type { Inspector } from './inspector';

export interface DetalleCotizacion {
    id: number;
    cantidad: number;
    precio_unitario: number;
    total: number;
    detalle: string;
    observaciones?: string;
    // Fields aligned with DetalleOrdenTrabajo
    precio_taller?: any;
    precio_seguro?: any;
    nivel?: string;
    imagenes?: string[];
}

export interface Cotizacion {
    id: number;
    fecha_registro: string;
    cliente: string;
    direccion?: string;
    celular?: string;
    nit?: string;

    correo?: string;
    particular_seguro?: string;
    seguro?: Seguro;
    idseguro?: number;
    inspector?: Inspector;
    idinspector?: number;
    marca_auto?: MarcaAuto;
    idmarca_auto: number;
    modelo: string;
    placa?: string;
    color?: string;
    anio?: number;
    tipo_vehiculo?: TipoVehiculo;
    idtipo_vehiculo: number;
    motor?: string;
    chasis?: string;
    moneda: string;
    sub_total: number;
    descuento: number;
    total: number;
    observaciones?: string;
    usuario?: User;
    estado: string;
    detalles?: DetalleCotizacion[];
}

export interface CreateCotizacionData {
    cliente: string;
    direccion?: string;
    celular?: string;
    nit?: string;
    correo?: string;
    particular_seguro?: string;
    idseguro?: number;
    idinspector?: number;
    idmarca_auto: number;
    modelo: string;
    placa?: string;
    color?: string;
    anio?: number;
    idtipo_vehiculo: number;
    motor?: string;
    chasis?: string;
    moneda: string;
    sub_total: number;
    descuento: number;
    total: number;
    observaciones?: string;
    idusuario: number;
    detalles: Omit<DetalleCotizacion, 'id'>[];
}

export interface UpdateCotizacionData extends Partial<CreateCotizacionData> { }
