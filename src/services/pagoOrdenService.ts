import axios from 'axios';

const API_URL = 'http://localhost:3001/pago-orden';

export interface PagoOrden {
    id: number;
    idorden_trabajo: number;
    fecha: string;
    monto: number;
    moneda: string;
    tc?: number;
    factura?: string;
    recibo?: string;
    idforma_pago: number;
    observacion?: string;
    idusers: number;
    idcomision_tarjeta?: number;
    monto_comision?: number;
    orden_trabajo?: any;
    forma_pago?: any;
    usuario?: any;
    comision_tarjeta?: any;
}

export interface OrdenConSaldo {
    id: number;
    fecha_registro: string;
    cliente: string;
    placa: string;
    sub_total: number;
    total_pagado: number;
    saldo: number;
    pagos: PagoOrden[];
    moneda: string;
    particular_seguro?: string;
    seguro?: { seguro: string };
}

export const getOrdenesConSaldo = async (): Promise<OrdenConSaldo[]> => {
    const response = await axios.get(`${API_URL}/ordenes-con-saldo`);
    return response.data;
};

export const getPagos = async (): Promise<PagoOrden[]> => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getPagosByOrden = async (idorden: number): Promise<PagoOrden[]> => {
    const response = await axios.get(`${API_URL}/orden/${idorden}`);
    return response.data;
};

export const createPago = async (data: Partial<PagoOrden>): Promise<PagoOrden> => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const updatePago = async (id: number, data: Partial<PagoOrden>): Promise<PagoOrden> => {
    const response = await axios.patch(`${API_URL}/${id}`, data);
    return response.data;
};

export const deletePago = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};
