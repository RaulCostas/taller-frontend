import type { Proveedor } from './proveedor';
import type { Inventario } from './inventario';

export interface MaterialPedido {
    id: number;
    proveedor: Proveedor;
    fecha: string; // ISO Date string
    sub_total: number;
    descuento: number;
    total: number;
    observaciones?: string;
    pagado: boolean;
    estado: string;
}

export interface CreateMaterialPedidoData {
    idproveedor: number | string;
    fecha: string;
    sub_total: number;
    descuento: number;
    total: number;
    observaciones?: string;
    pagado?: boolean;
    estado?: string;
}

export interface DetalleMaterialPedido {
    id: number;
    material_pedido: MaterialPedido;
    inventario: Inventario;
    cantidad: number;
    precio_unitario: number;
    total: number;
}

export interface CreateDetalleMaterialPedidoData {
    idmaterial_pedido: number;
    idinventario: number;
    cantidad: number;
    precio_unitario: number;
    total: number;
}
