import type { UnidadMedida } from './unidadMedida';
import type { GrupoInventario } from './grupoInventario';

export interface Inventario {
    id: number;
    descripcion: string;
    cantidad_existente: number;
    stock_minimo: number;
    estado: string;
    idunidad_medida: string; // Foreign key
    unidad_medida?: UnidadMedida; // Relation
    id_grupo_inventario: string; // Foreign key
    grupo_inventario?: GrupoInventario; // Relation
}

export type CreateInventarioData = Omit<Inventario, 'id' | 'unidad_medida' | 'grupo_inventario'>;
export type UpdateInventarioData = Partial<CreateInventarioData>;
