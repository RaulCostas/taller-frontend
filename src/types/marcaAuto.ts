export interface MarcaAuto {
    id: number;
    marca: string;
    estado: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateMarcaAutoData {
    marca: string;
    estado?: string;
}

export interface UpdateMarcaAutoData extends Partial<CreateMarcaAutoData> { }
