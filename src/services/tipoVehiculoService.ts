import type { TipoVehiculo, CreateTipoVehiculoData } from '../types/tipoVehiculo';

const API_URL = 'http://127.0.0.1:3001/tipos-vehiculos';

export const getTiposVehiculos = async (): Promise<TipoVehiculo[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error fetching tipos vehiculos');
    return response.json();
};

export const getTipoVehiculo = async (id: number): Promise<TipoVehiculo> => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error('Error fetching tipo vehiculo');
    return response.json();
};

export const createTipoVehiculo = async (data: CreateTipoVehiculoData): Promise<TipoVehiculo> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error creating tipo vehiculo');
    return response.json();
};

export const updateTipoVehiculo = async (id: number, data: CreateTipoVehiculoData): Promise<TipoVehiculo> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error updating tipo vehiculo');
    return response.json();
};

export const deleteTipoVehiculo = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error deleting tipo vehiculo');
};

export const reactivateTipoVehiculo = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/${id}/reactivate`, {
        method: 'PATCH',
    });
    if (!response.ok) throw new Error('Error reactivating tipo vehiculo');
};
