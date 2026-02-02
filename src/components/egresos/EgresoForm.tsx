import React, { useState, useEffect } from 'react';
import { Save, X, Calendar, FileText, DollarSign, CreditCard, Building } from 'lucide-react';
import Swal from 'sweetalert2';
import { createEgreso, updateEgreso } from '../../services/egresosService';
import { getFormasPago } from '../../services/formaPagoService';
import type { FormaPago } from '../../types/formaPago';
import type { CreateEgresoData, Egreso } from '../../types/egreso';

interface EgresoFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    egreso?: Egreso | null;
}

const EgresoForm: React.FC<EgresoFormProps> = ({ isOpen, onClose, onSuccess, egreso }) => {
    const isEditMode = !!egreso;

    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [destino, setDestino] = useState('Consultorio');
    const [detalle, setDetalle] = useState('');
    const [monto, setMonto] = useState('');
    const [moneda, setMoneda] = useState('Bolivianos');
    const [formaPagoId, setFormaPagoId] = useState('');

    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchFormasPago();
            if (egreso) {
                setFecha(new Date(egreso.fecha).toISOString().split('T')[0]);
                setDestino(egreso.destino);
                setDetalle(egreso.detalle);
                setMonto(egreso.monto.toString());
                setMoneda(egreso.moneda);
                setFormaPagoId(egreso.formaPago.id.toString());
            } else {
                // Reset form for new entry
                setFecha(new Date().toISOString().split('T')[0]);
                setDestino('Taller'); // Changed default to Taller as per request context implication, though 'Consultorio' was previous default. Request said "taller o casa".
                setDetalle('');
                setMonto('');
                setMoneda('Bolivianos');
                setFormaPagoId('');
            }
        }
    }, [isOpen, egreso]);

    const fetchFormasPago = async () => {
        try {
            const data = await getFormasPago();
            setFormasPago(data.filter(f => f.estado === 'activo'));
        } catch (error) {
            console.error('Error fetching formas pago:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formaPagoId) {
            Swal.fire('Error', 'Seleccione una forma de pago', 'error');
            return;
        }

        const egresoData: CreateEgresoData = {
            fecha,
            destino,
            detalle,
            monto: Number(monto),
            moneda,
            formaPagoId
        };

        setLoading(true);
        try {
            if (isEditMode && egreso) {
                await updateEgreso(egreso.id, egresoData);
                Swal.fire({
                    title: 'Actualizado',
                    text: 'Egreso actualizado correctamente',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await createEgreso(egresoData);
                Swal.fire({
                    title: 'Creado',
                    text: 'Egreso registrado correctamente',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.message || 'No se pudo guardar el egreso';
            Swal.fire('Error', Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <CreditCard className="text-green-600" size={24} />
                        {isEditMode ? 'Editar Egreso' : 'Nuevo Egreso Diario'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* ... form fields kept implicitly ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destino</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    value={destino}
                                    onChange={(e) => setDestino(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm appearance-none"
                                >
                                    <option value="Taller">Taller</option>
                                    <option value="Casa">Casa</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detalle del Gasto</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                            <textarea
                                value={detalle}
                                onChange={(e) => setDetalle(e.target.value)}
                                rows={3}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                placeholder="Descripción del egreso..."
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="number"
                                    step="0.01"
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

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
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forma de Pago</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={formaPagoId}
                                onChange={(e) => setFormaPagoId(e.target.value)}
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
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <X size={18} />
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all font-medium flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {loading ? 'Guardando...' : 'Guardar Egreso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EgresoForm;
