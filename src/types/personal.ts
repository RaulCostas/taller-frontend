import type { AreaPersonal } from './areaPersonal';

export interface Personal {
    id: string;
    nombre: string;
    paterno: string;
    materno: string;
    ci: string;
    fecha_nacimiento?: string;
    direccion?: string;
    telefono?: string;
    celular?: string;
    tipo: string; // 'Planta' | 'Contratista'
    area: AreaPersonal;
    fecha_ingreso?: string;
    salario?: number;
    estado: string;
}

export interface CreatePersonalData {
    nombre: string;
    paterno: string;
    materno: string;
    ci: string;
    fecha_nacimiento?: string;
    direccion?: string;
    telefono?: string;
    celular?: string;
    tipo: string;
    areaId: string;
    fecha_ingreso?: string;
    salario?: number;
    estado?: string;
}

export interface UpdatePersonalData extends Partial<CreatePersonalData> { }
