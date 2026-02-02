export interface AreaPersonal {
    id: string;
    area: string;
    estado: string;
}

export interface CreateAreaPersonalData {
    area: string;
    estado?: string;
}

export interface UpdateAreaPersonalData extends Partial<CreateAreaPersonalData> { }
