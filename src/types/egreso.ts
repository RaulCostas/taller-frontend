import type { FormaPago } from './formaPago';

export interface Egreso {
    id: number;
    fecha: string;
    destino: 'Taller' | 'Casa';
    detalle: string;
    monto: number;
    moneda: 'Bolivianos' | 'Dólares';
    formaPago: FormaPago;
    forma_pago_id?: string;
}

export interface CreateEgresoData {
    fecha: string;
    destino: string;
    detalle: string;
    monto: number | string;
    moneda: string;
    formaPagoId: string;
}
