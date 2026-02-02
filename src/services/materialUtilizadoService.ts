import axios from 'axios';

const API_URL = 'http://127.0.0.1:3001/material-utilizado';

export interface CreateMaterialUtilizadoData {
    idorden_trabajo: number;
    personalId: string;
    id_inventario: number;
    fecha: string;
    cantidad: number;
    precio: number;
}

export interface MaterialUtilizado {
    id: number;
    idorden_trabajo: number;
    idpersonal: number;
    personalId: string;
    id_inventario: number;
    fecha: string;
    cantidad: number;
    precio: number;
    personal?: {
        id: string; // Add ID to personal type for edit mode
        nombre: string;
        paterno: string;
        materno: string;
    };
    inventario?: {
        descripcion: string;
        unidad_medida?: {
            medida: string;
        }
    };
}

export const createMaterialUtilizado = async (data: CreateMaterialUtilizadoData): Promise<MaterialUtilizado> => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const getMaterialUtilizadoByOrden = async (ordenId: number): Promise<MaterialUtilizado[]> => {
    const response = await axios.get(`${API_URL}/orden/${ordenId}`);
    return response.data;
};

export const deleteMaterialUtilizado = async (id: number) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};

export const updateMaterialUtilizado = async (id: number, data: any) => {
    const response = await axios.patch(`${API_URL}/${id}`, data);
    return response.data;
};
