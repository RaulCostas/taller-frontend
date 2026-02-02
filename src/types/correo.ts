import type { User } from './user';

export interface Correo {
    id: number; // Correos probably still uses numeric ID from AutoIncrement
    remitente: User;
    destinatario: User;
    copia?: User;
    asunto: string;
    mensaje: string;
    fecha_envio: string; // ISO date string
    leido_destinatario: boolean;
    leido_copia: boolean;
}
