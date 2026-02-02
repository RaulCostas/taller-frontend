import axios from 'axios';
import type { Correo } from '../types/correo';

const API_URL = 'http://127.0.0.1:3001/correos';

export interface CreateCorreoData {
    remitente_id: string;
    destinatario_id: string;
    copia_id?: string;
    asunto: string;
    mensaje: string;
}

export const getInbox = async (userId: string): Promise<Correo[]> => {
    const response = await axios.get(`${API_URL}/inbox/${userId}`);
    return response.data;
};

export const getSent = async (userId: string): Promise<Correo[]> => {
    const response = await axios.get(`${API_URL}/sent/${userId}`);
    return response.data;
};

export const createCorreo = async (data: CreateCorreoData): Promise<Correo> => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const markAsRead = async (id: number, userId: string): Promise<Correo> => {
    const response = await axios.patch(`${API_URL}/${id}/read`, { userId });
    return response.data;
};

export const getUnreadCount = async (userId: string): Promise<number> => {
    const response = await axios.get(`${API_URL}/unread-count/${userId}`);
    return response.data;
};
