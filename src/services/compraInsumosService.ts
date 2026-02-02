import axios from 'axios';

const API_URL = 'http://127.0.0.1:3001/compra-insumos';

export interface CompraInsumo {
    id: number;
    fecha: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
    moneda: 'Bolivianos' | 'Dólares';

    nro_factura?: string;
    nro_recibo?: string;
    idorden_trabajo?: number;
    idproveedor: string;
    proveedor?: {
        id: string;
        proveedor: string;
        contacto: string;
    };
    idforma_pago: string;
    forma_pago?: {
        id: string;
        forma_pago: string;
    };
}

export interface CreateCompraInsumoData {
    fecha: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    moneda: 'Bolivianos' | 'Dólares';
    nro_factura?: string;
    nro_recibo?: string;
    idorden_trabajo?: number;
    idproveedor: string;
    idforma_pago: string;
}

export const getCompraInsumos = async (): Promise<CompraInsumo[]> => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const getCompraInsumo = async (id: number): Promise<CompraInsumo> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const createCompraInsumo = async (data: CreateCompraInsumoData): Promise<CompraInsumo> => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const updateCompraInsumo = async (id: number, data: Partial<CreateCompraInsumoData>): Promise<CompraInsumo> => {
    const response = await axios.patch(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteCompraInsumo = async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
};
