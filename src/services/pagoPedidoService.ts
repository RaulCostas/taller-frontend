const API_URL = 'http://127.0.0.1:3001/pago-pedidos';

export interface CreatePagoPedidoData {
    idmaterial_pedido: number | string;
    idusers: string;
    idforma_pago: string;
    fecha: string;
    factura: string;
    recibo: string;
    moneda: string;
    tc?: number;
}

export const createPagoPedido = async (data: CreatePagoPedidoData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Error creating pago pedido');
    }

    return response.json();
};

export const getPagoByPedido = async (pedidoId: number) => {
    const response = await fetch(`${API_URL}/pedido/${pedidoId}`);
    if (!response.ok) {
        // It might return 404 if not paid? Or handling empty?
        // Let's assume 404 means no payment, or we handle it.
        // If the service returns null for not found, then ok.
        // NestJS findOne returns null or undefined? No, usually generic findOne returns null if not found.
        if (response.status === 404) return null;
        throw new Error('Error fetching pago pedido');
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

export const getPagoPedidos = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Error fetching pago pedidos');
    }
    return response.json();
};
