export interface GrupoInventario {
    id: string;
    grupo: string;
    estado: string;
}

export interface CreateGrupoInventarioData {
    grupo: string;
    estado?: string;
}

export interface UpdateGrupoInventarioData extends Partial<CreateGrupoInventarioData> { }
