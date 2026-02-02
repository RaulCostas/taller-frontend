import type { CategoriaServicio } from './categoriaServicio';

export interface PrecioTaller {
    id: string;
    categoria?: CategoriaServicio;
    detalle: string;
    precio: number;
    moneda?: string;
    estado: string;
}

export interface CreatePrecioTallerData {
    idcategoria_servicio: string;
    detalle: string;
    precio: number;
    estado: string;
}
