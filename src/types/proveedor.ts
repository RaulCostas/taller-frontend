export interface Proveedor {
    id: string;
    proveedor: string;
    nit: string;
    direccion?: string;
    telefono?: string;
    celular?: string;
    email?: string;
    contacto?: string;
    estado: string;
}

export interface CreateProveedorData {
    proveedor: string;
    nit: string;
    direccion?: string;
    telefono?: string;
    celular?: string;
    email?: string;
    contacto?: string;
    estado?: string;
}

export interface UpdateProveedorData extends Partial<CreateProveedorData> { }
