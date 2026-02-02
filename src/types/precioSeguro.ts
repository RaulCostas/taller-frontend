import type { Seguro } from './seguro';
import type { CategoriaServicio } from './categoriaServicio';

export interface PrecioSeguro {
    id: string;
    seguro: Seguro;
    categoria: CategoriaServicio;
    detalle: string;
    nivel1: number;
    nivel2: number;
    nivel3: number;
    pintado: number;
    instalacion: number;
    moneda?: string;
    estado: string;
}

export interface CreatePrecioSeguroData {
    idseguro: string;
    idcategoria_servicio: string;
    detalle: string;
    nivel1: number;
    nivel2: number;
    nivel3: number;
    pintado: number;
    instalacion: number;
    estado?: string;
}
