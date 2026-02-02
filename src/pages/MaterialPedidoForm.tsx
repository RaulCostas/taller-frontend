import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ShoppingCart, Plus, Trash2, FileText, Package, Hash, DollarSign, X } from 'lucide-react';
import Swal from 'sweetalert2';
import type { CreateMaterialPedidoData, CreateDetalleMaterialPedidoData } from '../types/materialPedido';
import type { Proveedor } from '../types/proveedor';
import type { Inventario } from '../types/inventario';
import { getProveedores } from '../services/proveedorService';
import { getInventarios } from '../services/inventarioService';
import { createMaterialPedido, updateMaterialPedido, getMaterialPedido } from '../services/materialPedidoService';
import { createDetalleMaterialPedido, getDetallesByPedido, deleteDetalleMaterialPedido } from '../services/detalleMaterialPedidoService';

// Interfaces for UI state vs backend DTO
// We need to manage the details in the form state before saving or creating
// However, creating a master-detail usually requires creating Master first, then Details.
// Strategy:
// 1. If New: 
//    - Fill Header
//    - When adding details, we can't save them to backend until Master exists?
//    - OR: We save everything at once? Backend module didn't implement 'Cascade' on create.
//    - SIMPLEST: Create Master first (save button), then redirect to Edit mode to add details.
//    - BETTER UX: Allow adding details in memory, then save Master + iterate save Details.

interface MaterialPedidoFormProps {
    readOnly?: boolean;
}

const MaterialPedidoForm = ({ readOnly = false }: MaterialPedidoFormProps) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [inventarios, setInventarios] = useState<Inventario[]>([]);

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
        loadCatalogs();
        if (id) {
            loadPedido(parseInt(id));
        }
    }, [id]);

    useEffect(() => {
        calculateTotals();
    }, [detalles, formData.descuento]);

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

            const serverDetalles = await getDetallesByPedido(pedidoId);
            const mappedDetalles = serverDetalles.map(d => ({
                id: d.id,
                idmaterial_pedido: d.material_pedido.id,
                idinventario: d.inventario.id,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                total: d.total,
                inventarioName: d.inventario.descripcion
            }));

            setDetalles(mappedDetalles as any[]);
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
            let pedidoId = id ? parseInt(id) : 0;

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
            navigate('/proveedores/pedidos');

        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error al guardar el pedido', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    {readOnly ? 'Ver Pedido' : (isEditMode ? 'Editar Pedido' : 'Nuevo Pedido')}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                {/* Header Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

                <div className="mb-6">
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
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <ShoppingCart size={20} className="text-blue-600" />
                            Detalle del Pedido
                        </h2>
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

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50">
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase">Ítem / Material</th>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase w-24">Cant.</th>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase w-32">P. Unit</th>
                                    <th className="p-3 text-xs font-bold text-gray-500 uppercase w-32">Total</th>
                                    {!readOnly && <th className="p-3 text-xs font-bold text-gray-500 uppercase w-24 text-center">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {detalles.map((detalle, index) => (
                                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                                        <td className="p-2">
                                            <div className="relative">
                                                <select
                                                    value={detalle.idinventario}
                                                    onChange={(e) => handleDetailChange(index, 'idinventario', parseInt(e.target.value))}
                                                    disabled={readOnly}
                                                    className={`w-full pl-10 pr-4 py-1 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none relative z-10 bg-transparent ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                >
                                                    <option value={0} className="text-gray-500">Seleccione...</option>
                                                    {inventarios.map(i => (
                                                        <option key={i.id} value={i.id} className="text-gray-900 dark:text-white">
                                                            {i.descripcion}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-0">
                                                    <Package size={16} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={detalle.cantidad}
                                                    onChange={(e) => handleDetailChange(index, 'cantidad', parseFloat(e.target.value))}
                                                    disabled={readOnly}
                                                    className={`w-full pl-8 pr-2 py-1 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                />
                                                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                                                    <Hash size={14} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={detalle.precio_unitario}
                                                    onChange={(e) => handleDetailChange(index, 'precio_unitario', parseFloat(e.target.value))}
                                                    disabled={readOnly}
                                                    className={`w-full pl-8 pr-2 py-1 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                />
                                                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                                                    <DollarSign size={14} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-2 text-right font-medium text-gray-900 dark:text-white">
                                            {Number(detalle.total).toFixed(2)}
                                        </td>
                                        {!readOnly && (
                                            <td className="p-2 flex justify-center gap-2">
                                                {/* Edit Button? Already editable inputs. Maybe just Delete */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveDetail(index)}
                                                    className="p-1 bg-red-500 hover:bg-red-600 text-white rounded shadow-sm transition-all"
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
                                        <td colSpan={readOnly ? 4 : 5} className="p-4 text-center text-gray-500 text-sm">No hay ítems en este pedido</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Totals */}
                <div className="flex justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="w-full md:w-1/3 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Sub Total:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{Number(formData.sub_total).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.descuento}
                                onChange={(e) => setFormData({ ...formData, descuento: parseFloat(e.target.value) || 0 })}
                                disabled={readOnly}
                                className={`w-24 p-1 text-right border rounded border-gray-300 bg-white text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                            />
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2">
                            <span className="text-gray-800 dark:text-white">Total:</span>
                            <span className="text-blue-600 dark:text-blue-400">{Number(formData.total).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/proveedores/pedidos')}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 text-sm flex items-center gap-2"
                    >
                        <X size={18} />
                        {readOnly ? 'Volver' : 'Cancelar'}
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
    );
};

export default MaterialPedidoForm;
