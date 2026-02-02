import type { Seguro } from './seguro';

export interface Inspector {
    id: string;
    seguro: Seguro;
    inspector: string;
    celular?: string;
    correo?: string;
    estado: string;
}

export interface CreateInspectorData {
    seguroId: string;
    inspector: string;
    celular?: string;
    correo?: string;
    estado?: string;
}

export interface UpdateInspectorData extends Partial<CreateInspectorData> { }
