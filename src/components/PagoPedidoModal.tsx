import { useState, useEffect } from 'react';
import { X, Calendar, FileText, DollarSign, CreditCard, Hash } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { getFormasPago } from '../services/formaPagoService';
import { createPagoPedido } from '../services/pagoPedidoService';
import type { FormaPago } from '../types/formaPago';
import type { MaterialPedido } from '../types/materialPedido';

interface PagoPedidoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPaymentSuccess: () => void;
    pedido: MaterialPedido | null;
}

const PagoPedidoModal = ({ isOpen, onClose, onPaymentSuccess, pedido }: PagoPedidoModalProps) => {
    const { user } = useAuth();
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);

    // Form State
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [factura, setFactura] = useState('');
    const [recibo, setRecibo] = useState('');
    const [moneda, setMoneda] = useState('Bolivianos');
    const [tc, setTc] = useState<number>(6.96); // Default TC
    const [idformaPago, setIdFormaPago] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchFormasPago();
            resetForm();
        }
    }, [isOpen]);

    const fetchFormasPago = async () => {
        try {
            const data = await getFormasPago();
            setFormasPago(data.filter(f => f.estado === 'activo'));
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error al cargar formas de pago', 'error');
        }
    };

    const resetForm = () => {
        setFecha(new Date().toISOString().split('T')[0]);
        setFactura('');
        setRecibo('');
        setMoneda('Bolivianos');
        setTc(6.96);
        setIdFormaPago('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!pedido || !user) return;

        if (!factura && !recibo) {
            Swal.fire('Atención', 'Debe ingresar al menos la Factura o el Recibo.', 'warning');
            return;
        }

        try {
            await createPagoPedido({
                idmaterial_pedido: pedido.id,
                idusers: user.id,
                idforma_pago: idformaPago,
                fecha,
                factura: factura || '',
                recibo: recibo || '',
                moneda,
                tc: moneda === 'Dólares' ? tc : undefined
            });

            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Pago registrado correctamente',
                showConfirmButton: false,
                timer: 1500
            });
            onPaymentSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo registrar el pago', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                {/* Header */}
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <DollarSign className="text-green-600" />
                        Registrar Pago
                    </h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-center gap-3 mb-2">
                        <FileText className="text-blue-500" size={20} />
                        <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Pedido #{pedido?.id}</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-white">{pedido?.proveedor?.proveedor}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Pago</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Factura</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={factura}
                                    onChange={(e) => setFactura(e.target.value)}
                                    placeholder="Nº Factura"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recibo</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={recibo}
                                    onChange={(e) => setRecibo(e.target.value)}
                                    placeholder="Nº Recibo"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moneda</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    value={moneda}
                                    onChange={(e) => setMoneda(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm appearance-none"
                                >
                                    <option value="Bolivianos">Bolivianos</option>
                                    <option value="Dólares">Dólares</option>
                                </select>
                            </div>
                        </div>

                        {moneda === 'Dólares' && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">T. Cambio</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={tc}
                                        onChange={(e) => setTc(parseFloat(e.target.value))}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forma de Pago</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={idformaPago}
                                onChange={(e) => setIdFormaPago(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm appearance-none"
                                required
                            >
                                <option value="">Seleccione forma de pago...</option>
                                {formasPago.map(fp => (
                                    <option key={fp.id} value={fp.id}>{fp.forma_pago}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <X size={18} />
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all font-medium flex items-center gap-2 transform active:scale-95"
                        >
                            <DollarSign size={18} />
                            Confirmar Pago
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PagoPedidoModal;
