export interface UnidadMedida {
    id: string;
    medida: string;
    estado: string;
}

export interface CreateUnidadMedidaData {
    medida: string;
    estado?: string;
}

export interface UpdateUnidadMedidaData extends Partial<CreateUnidadMedidaData> { }
