import { useState, useEffect } from 'react';
import { Save, User, Calendar, FileText, Hash, DollarSign, CreditCard } from 'lucide-react';
import Swal from 'sweetalert2';
import { createCompraInsumo, updateCompraInsumo, type CompraInsumo, type CreateCompraInsumoData } from '../../services/compraInsumosService';
import { getProveedores } from '../../services/proveedorService';
import { getFormasPago } from '../../services/formaPagoService';
import type { Proveedor } from '../../types/proveedor';
import type { FormaPago } from '../../types/formaPago';

interface CompraInsumosFormProps {
    record?: CompraInsumo;
    ordenId?: number;
    onSuccess: () => void;
    onCancel: () => void;
}

const CompraInsumosForm = ({ record, ordenId, onSuccess, onCancel }: CompraInsumosFormProps) => {
    const [loading, setLoading] = useState(false);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);

    // Form State
    const [formData, setFormData] = useState<CreateCompraInsumoData>({
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        cantidad: 0,
        precio_unitario: 0,
        moneda: 'Bolivianos',
        nro_factura: '',
        nro_recibo: '',
        idorden_trabajo: ordenId,
        idproveedor: '',
        idforma_pago: ''
    });

    useEffect(() => {
        fetchDependencies();
        if (record) {
            setFormData({
                fecha: record.fecha,
                descripcion: record.descripcion,
                cantidad: record.cantidad,
                precio_unitario: record.precio_unitario,
                moneda: record.moneda,
                nro_factura: record.nro_factura || '',
                nro_recibo: record.nro_recibo || '',
                idorden_trabajo: record.idorden_trabajo,
                idproveedor: record.idproveedor,
                idforma_pago: record.idforma_pago
            });
        } else {
            // Reset form when switching to "New" mode
            setFormData({
                fecha: new Date().toISOString().split('T')[0],
                descripcion: '',
                cantidad: 0,
                precio_unitario: 0,
                moneda: 'Bolivianos',
                nro_factura: '',
                nro_recibo: '',
                idorden_trabajo: ordenId, // Preserve the passed order ID
                idproveedor: '',
                idforma_pago: ''
            });
        }
    }, [record, ordenId]);

    const fetchDependencies = async () => {
        try {
            const [provData, fpData] = await Promise.all([
                getProveedores(),
                getFormasPago()
            ]);
            setProveedores(provData.filter(p => p.estado === 'activo'));
            setFormasPago(fpData);
        } catch (error) {
            console.error(error);
            Swal.fire({ title: 'Error', text: 'No se pudieron cargar los datos', icon: 'error', timer: 1500, showConfirmButton: false });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'cantidad' || name === 'precio_unitario') {
            setFormData(prev => ({ ...prev, [name]: Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (!formData.idproveedor || !formData.idforma_pago || !formData.descripcion || formData.cantidad <= 0 || formData.precio_unitario <= 0) {
            Swal.fire({ title: 'Atención', text: 'Complete los campos obligatorios', icon: 'warning', timer: 1500, showConfirmButton: false });
            setLoading(false);
            return;
        }

        try {
            if (record) {
                await updateCompraInsumo(record.id, formData);
                Swal.fire({ title: 'Actualizado', text: 'Registro actualizado', icon: 'success', timer: 1500, showConfirmButton: false });
            } else {
                await createCompraInsumo(formData);
                Swal.fire({ title: 'Creado', text: 'Registro creado', icon: 'success', timer: 1500, showConfirmButton: false });
            }
            onSuccess();
        } catch (error: any) {
            console.error(error);
            Swal.fire({ title: 'Error', text: error.response?.data?.message || 'Error al guardar', icon: 'error', timer: 1500, showConfirmButton: false });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full h-full border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    {record ? 'Editar Compra' : 'Nueva Compra'}
                </h2>
                {record && (
                    <button onClick={onCancel} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition-colors">
                        Cancelar Edición
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="date"
                                name="fecha"
                                value={formData.fecha}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proveedor</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <select
                                name="idproveedor"
                                value={formData.idproveedor}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                            >
                                <option value="">Seleccione Proveedor...</option>
                                {proveedores.map(p => (
                                    <option key={p.id} value={p.id}>{p.proveedor}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            required
                            rows={2}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                            placeholder="Detalle de la compra..."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad</label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="number"
                                name="cantidad"
                                step="0.01"
                                min="0"
                                value={formData.cantidad}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio Unitario</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="number"
                                name="precio_unitario"
                                step="0.01"
                                min="0"
                                value={formData.precio_unitario}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moneda</label>
                        <select
                            name="moneda"
                            value={formData.moneda}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="Bolivianos">Bolivianos</option>
                            <option value="Dólares">Dólares</option>
                        </select>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Total Estimado:</span>
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                        {formData.moneda === 'Bolivianos' ? 'Bs' : '$us'} {(formData.cantidad * formData.precio_unitario).toFixed(2)}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forma de Pago</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <select
                                name="idforma_pago"
                                value={formData.idforma_pago}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                            >
                                <option value="">Seleccione Forma de Pago...</option>
                                {formasPago.map(fp => (
                                    <option key={fp.id} value={fp.id}>{fp.forma_pago}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nro. Factura</label>
                        <input
                            type="text"
                            name="nro_factura"
                            value={formData.nro_factura || ''}
                            onChange={handleChange}
                            placeholder="Opcional"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nro. Recibo</label>
                        <input
                            type="text"
                            name="nro_recibo"
                            value={formData.nro_recibo || ''}
                            onChange={handleChange}
                            placeholder="Opcional"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex-1 py-2 px-4 text-white rounded-lg transition-all font-medium flex justify-center items-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg hover:animate-bounce transform hover:-translate-y-0.5 ${record ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Save size={20} />}
                        {record ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompraInsumosForm;
