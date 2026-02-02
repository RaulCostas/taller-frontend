import type { Personal } from './personal';

export interface Anticipo {
    id: number;
    personal: Personal;
    personal_id: number;
    fecha: string;
    monto: number;
    motivo: string;
    estado: string;
    mes_aplicacion?: string;
}
