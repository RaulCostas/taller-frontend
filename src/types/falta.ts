import type { Personal } from './personal';

export interface Falta {
    id: number;
    personal: Personal;
    personal_id: number;
    fecha: string;
    motivo: string;
    observaciones?: string;
}
