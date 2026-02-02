import { useEffect, useState } from 'react';
import { Save, ShoppingCart, Plus, Trash2, FileText, Package, DollarSign, X, CreditCard, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import type { CreateMaterialPedidoData, CreateDetalleMaterialPedidoData } from '../types/materialPedido';
import type { Proveedor } from '../types/proveedor';
import type { Inventario } from '../types/inventario';
import { getProveedores } from '../services/proveedorService';
import { getInventarios } from '../services/inventarioService';
import { createMaterialPedido, updateMaterialPedido, getMaterialPedido } from '../services/materialPedidoService';
import { createDetalleMaterialPedido, getDetallesByPedido, deleteDetalleMaterialPedido } from '../services/detalleMaterialPedidoService';
import { getPagoByPedido } from '../services/pagoPedidoService';

interface MaterialPedidoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    orderId: number | null; // null for new
    readOnly?: boolean;
}

const MaterialPedidoModal = ({ isOpen, onClose, onSuccess, orderId, readOnly = false }: MaterialPedidoModalProps) => {
    const isEditMode = !!orderId;

    const [loading, setLoading] = useState(false);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [inventarios, setInventarios] = useState<Inventario[]>([]);
    const [pagoInfo, setPagoInfo] = useState<any>(null);

    const [formData, setFormData] = useState<CreateMaterialPedidoData>({
        idproveedor: '', // UUID string
        fecha: new Date().toISOString().split('T')[0],
        sub_total: 0,
        descuento: 0,
        total: 0,
        observaciones: '',
        pagado: false,
        estado: 'activo'
    });

    const [detalles, setDetalles] = useState<CreateDetalleMaterialPedidoData[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadCatalogs();
            if (orderId) {
                loadPedido(orderId);
            } else {
                resetForm();
            }
        }
    }, [isOpen, orderId]);

    useEffect(() => {
        calculateTotals();
    }, [detalles, formData.descuento]);

    const resetForm = () => {
        setFormData({
            idproveedor: '',
            fecha: new Date().toISOString().split('T')[0],
            sub_total: 0,
            descuento: 0,
            total: 0,
            observaciones: '',
            pagado: false,
            estado: 'activo'
        });
        setDetalles([]);
        setPagoInfo(null);
    };

    const loadCatalogs = async () => {
        try {
            const [provData, invData] = await Promise.all([
                getProveedores(),
                getInventarios()
            ]);
            setProveedores(provData.filter((p: Proveedor) => p.estado === 'activo'));
            setInventarios(invData.filter((i: Inventario) => i.estado === 'activo'));
        } catch (error) {
            console.error(error);
        }
    };

    const loadPedido = async (pedidoId: number) => {
        try {
            const pedido = await getMaterialPedido(pedidoId);
            setFormData({
                idproveedor: String(pedido.proveedor.id),
                fecha: pedido.fecha.split('T')[0],
                sub_total: pedido.sub_total,
                descuento: pedido.descuento,
                total: pedido.total,
                observaciones: pedido.observaciones || '',
                pagado: pedido.pagado,
                estado: pedido.estado
            });

            console.log('Pedido cargado:', pedido);
            console.log('Estado Pagado:', pedido.pagado);

            if (pedido.pagado) {
                try {
                    console.log('Fetching pago info for pedido:', pedidoId);
                    const pago = await getPagoByPedido(pedidoId);
                    console.log('Pago Info recibido:', pago);
                    setPagoInfo(pago);
                } catch (pagoError) {
                    console.error('Error fetching pago info:', pagoError);
                    setPagoInfo(null);
                }
            } else {
                setPagoInfo(null);
            }

            const serverDetalles = await getDetallesByPedido(pedidoId);
            const mappedDetalles = serverDetalles.map((d: any) => ({
                id: d.id,
                idmaterial_pedido: d.material_pedido.id,
                idinventario: d.inventario.id,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                total: d.total,
                inventarioName: d.inventario.descripcion
            }));

            setDetalles(mappedDetalles);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo cargar el pedido', 'error');
        }
    };

    const calculateTotals = () => {
        const subTotal = detalles.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        const total = subTotal - (Number(formData.descuento) || 0);
        setFormData(prev => ({
            ...prev,
            sub_total: subTotal,
            total: Math.max(0, total)
        }));
    };

    const handleAddDetail = () => {
        if (readOnly) return;
        setDetalles([
            ...detalles,
            {
                idmaterial_pedido: 0,
                idinventario: 0,
                cantidad: 1,
                precio_unitario: 0,
                total: 0
            }
        ]);
    };

    const handleRemoveDetail = async (index: number) => {
        if (readOnly) return;
        const detalle = detalles[index] as any;
        if (detalle.id && isEditMode) {
            const result = await Swal.fire({
                title: '¿Eliminar ítem?',
                text: 'Se eliminará inmediatamente de la base de datos',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar'
            });
            if (result.isConfirmed) {
                try {
                    await deleteDetalleMaterialPedido(detalle.id);
                    const newDetalles = [...detalles];
                    newDetalles.splice(index, 1);
                    setDetalles(newDetalles);
                } catch (e) {
                    Swal.fire('Error', 'No se pudo eliminar el detalle', 'error');
                }
            }
        } else {
            const newDetalles = [...detalles];
            newDetalles.splice(index, 1);
            setDetalles(newDetalles);
        }
    };

    const handleDetailChange = (index: number, field: keyof CreateDetalleMaterialPedidoData, value: number) => {
        if (readOnly) return;
        const newDetalles = [...detalles] as any[];
        newDetalles[index][field] = value;

        if (field === 'cantidad' || field === 'precio_unitario') {
            const qty = Number(newDetalles[index].cantidad) || 0;
            const price = Number(newDetalles[index].precio_unitario) || 0;
            newDetalles[index].total = qty * price;
        }

        if (field === 'idinventario') {
            const item = inventarios.find(i => i.id === value);
            if (item) {
                newDetalles[index].inventarioName = item.descripcion;
            }
        }

        setDetalles(newDetalles);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        setLoading(true);

        try {
            let pedidoId = orderId ? orderId : 0;

            if (isEditMode) {
                await updateMaterialPedido(pedidoId, formData);
            } else {
                const newPedido = await createMaterialPedido(formData);
                pedidoId = newPedido.id;
            }

            for (const detalle of detalles as any[]) {
                const payload = {
                    idmaterial_pedido: pedidoId,
                    idinventario: detalle.idinventario,
                    cantidad: detalle.cantidad,
                    precio_unitario: detalle.precio_unitario,
                    total: detalle.total
                };

                if (!detalle.id) {
                    await createDetalleMaterialPedido(payload);
                }
            }

            Swal.fire({
                icon: 'success',
                title: 'Guardado',
                text: 'Pedido guardado exitosamente',
                timer: 1500,
                showConfirmButton: false
            });
            onSuccess();
            onClose();

        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error al guardar el pedido', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="text-blue-600" size={28} />
                        {readOnly ? 'Detalle del Pedido' : (isEditMode ? 'Editar Pedido' : 'Nuevo Pedido')}
                        {orderId && <span className="text-sm font-normal text-gray-500 ml-2">#{orderId}</span>}
                    </h2>
                </div>

                <div className="overflow-y-auto p-6 flex-grow">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Header Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Proveedor *</label>
                                <div className="relative">
                                    <select
                                        value={formData.idproveedor}
                                        onChange={(e) => setFormData({ ...formData, idproveedor: e.target.value })}
                                        required
                                        disabled={readOnly}
                                        className={`w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="" className="text-gray-500">Seleccione...</option>
                                        {proveedores.map(p => (
                                            <option key={p.id} value={p.id} className="text-gray-900 dark:text-white">
                                                {p.proveedor}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <ShoppingCart size={18} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha *</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        required
                                        disabled={readOnly}
                                        className={`w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <FileText size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                            <div className="relative">
                                <textarea
                                    rows={2}
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    disabled={readOnly}
                                    className={`w-full pl-10 pr-4 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                />
                                <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
                                    <FileText size={18} />
                                </div>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div>
                            <div className="flex justify-between items-center mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <ShoppingCart size={20} className="text-blue-600" />
                                    Ítems
                                </h3>
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={handleAddDetail}
                                        className="text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-full flex items-center gap-1 transition-all transform hover:-translate-y-0.5"
                                    >
                                        <Plus size={16} /> Agregar Ítem
                                    </button>
                                )}
                            </div>

                            <div className="overflow-x-auto border rounded-lg border-gray-200 dark:border-gray-700">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="p-3 text-xs font-bold text-gray-500 uppercase">Material</th>
                                            <th className="p-3 text-xs font-bold text-gray-500 uppercase w-24">Cant.</th>
                                            <th className="p-3 text-xs font-bold text-gray-500 uppercase w-32">P. Unit</th>
                                            <th className="p-3 text-xs font-bold text-gray-500 uppercase w-32">Total</th>
                                            {!readOnly && <th className="p-3 text-xs font-bold text-gray-500 uppercase w-16 text-center"></th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {detalles.map((detalle, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                <td className="p-2">
                                                    <div className="relative">
                                                        <select
                                                            value={detalle.idinventario}
                                                            onChange={(e) => handleDetailChange(index, 'idinventario', parseInt(e.target.value))}
                                                            disabled={readOnly}
                                                            className={`w-full text-sm pl-8 pr-4 py-1.5 border rounded border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none ${readOnly ? 'opacity-80' : ''}`}
                                                        >
                                                            <option value={0} className="text-gray-500">Seleccione...</option>
                                                            {inventarios.map(i => (
                                                                <option key={i.id} value={i.id}>{i.descripcion}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                                                            <Package size={14} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={detalle.cantidad}
                                                        onChange={(e) => handleDetailChange(index, 'cantidad', parseFloat(e.target.value))}
                                                        disabled={readOnly}
                                                        className={`w-full text-sm text-right px-2 py-1.5 border rounded border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${readOnly ? 'opacity-80' : ''}`}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">$</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={detalle.precio_unitario}
                                                            onChange={(e) => handleDetailChange(index, 'precio_unitario', parseFloat(e.target.value))}
                                                            disabled={readOnly}
                                                            className={`w-full text-sm text-right pl-5 pr-2 py-1.5 border rounded border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${readOnly ? 'opacity-80' : ''}`}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-2 text-right font-medium text-gray-900 dark:text-white text-sm">
                                                    {Number(detalle.total).toFixed(2)}
                                                </td>
                                                {!readOnly && (
                                                    <td className="p-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveDetail(index)}
                                                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {detalles.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-gray-500 text-sm italic">
                                                    No se han agregado materiales.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end">
                            <div className="w-full md:w-1/2 lg:w-1/3 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Sub Total:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{Number(formData.sub_total).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
                                    {readOnly ? (
                                        <span className="font-medium text-gray-900 dark:text-white">{Number(formData.descuento).toFixed(2)}</span>
                                    ) : (
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.descuento}
                                            onChange={(e) => setFormData({ ...formData, descuento: parseFloat(e.target.value) || 0 })}
                                            className="w-24 text-right text-sm border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-1"
                                        />
                                    )}
                                </div>
                                <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2 text-blue-600 dark:text-blue-400">
                                    <span>Total:</span>
                                    <span>{Number(formData.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info Section */}
                        {pagoInfo && (
                            <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-lg p-4 animate-fade-in">
                                <h3 className="text-md font-bold text-green-700 dark:text-green-400 flex items-center gap-2 mb-3">
                                    <DollarSign size={18} />
                                    Detalle del Pago
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <label className="block text-gray-500 dark:text-gray-400 text-xs">Fecha Pago</label>
                                        <span className="font-medium text-gray-800 dark:text-white flex items-center gap-1">
                                            <Calendar size={12} />
                                            {pagoInfo.fecha ? new Date(pagoInfo.fecha).toLocaleDateString() : '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-gray-500 dark:text-gray-400 text-xs">Forma Pago</label>
                                        <span className="font-medium text-gray-800 dark:text-white flex items-center gap-1">
                                            <CreditCard size={12} />
                                            {pagoInfo.forma_pago?.forma_pago || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-gray-500 dark:text-gray-400 text-xs">Factura / Recibo</label>
                                        <span className="font-medium text-gray-800 dark:text-white flex items-center gap-1">
                                            <FileText size={12} />
                                            {pagoInfo.factura || '-'}/{pagoInfo.recibo || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-gray-500 dark:text-gray-400 text-xs">Pagado Por</label>
                                        <span className="font-medium text-gray-800 dark:text-white">
                                            {/* Assuming usuario has nombre or username */}
                                            {pagoInfo.usuario?.name || 'Usuario'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 text-sm flex items-center gap-2"
                            >
                                <X size={18} />
                                {readOnly ? 'Cerrar' : 'Cancelar'}
                            </button>
                            {!readOnly && (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5"
                                >
                                    <Save size={18} />
                                    {loading ? 'Guardando...' : 'Guardar Pedido'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MaterialPedidoModal;
