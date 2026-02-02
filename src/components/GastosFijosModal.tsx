import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, FileText, Building } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';

interface GastoFijo {
    id?: number;
    gasto_fijo: string;
    monto: number;
    moneda: string;
    dia: number;
    mes?: string;
    anual: boolean;
    destino: string;
}

interface GastosFijosModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    gastoToEdit?: GastoFijo | null;
}

const GastosFijosModal: React.FC<GastosFijosModalProps> = ({ isOpen, onClose, onSuccess, gastoToEdit }) => {
    const [destino, setDestino] = useState('Taller');
    const [dia, setDia] = useState<number>(1);
    const [anual, setAnual] = useState(false);
    const [mes, setMes] = useState('');
    const [gastoFijo, setGastoFijo] = useState('');
    const [monto, setMonto] = useState<number>(0);
    const [moneda, setMoneda] = useState('Bolivianos');
    const [error, setError] = useState('');
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Gastos Fijos',
            content: 'Registre gastos recurrentes mensuales o anuales. Especifique el destino (Consultorio/Casa), día de pago, monto y moneda.'
        },
        {
            title: 'Gastos Anuales',
            content: 'Para gastos que se pagan una vez al año, marque "Anual" y seleccione el mes correspondiente. El sistema recordará el pago anual.'
        }
    ];

    useEffect(() => {
        if (isOpen) {
            if (gastoToEdit) {
                setDestino(gastoToEdit.destino);
                setDia(gastoToEdit.dia);
                setAnual(gastoToEdit.anual);
                setMes(gastoToEdit.mes || '');
                setGastoFijo(gastoToEdit.gasto_fijo);
                setMonto(gastoToEdit.monto);
                setMoneda(gastoToEdit.moneda);
            } else {
                resetForm();
            }
            setError('');
        }
    }, [isOpen, gastoToEdit]);

    const resetForm = () => {
        setDestino('Taller');
        setDia(1);
        setAnual(false);
        setMes('');
        setGastoFijo('');
        setMonto(0);
        setMoneda('Bolivianos');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (anual && !mes) {
            setError('Debe seleccionar un mes para gastos anuales.');
            return;
        }

        const data = {
            destino,
            dia,
            anual,
            mes: anual ? mes : null,
            gasto_fijo: gastoFijo,
            monto,
            moneda
        };

        try {
            if (gastoToEdit?.id) {
                await api.patch(`/gastos-fijos/${gastoToEdit.id}`, data);
                await Swal.fire({
                    icon: 'success',
                    title: 'Calculado',
                    text: 'Gasto fijo actualizado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/gastos-fijos', data);
                await Swal.fire({
                    icon: 'success',
                    title: 'Creado',
                    text: 'Gasto fijo creado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving gasto fijo:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.message || 'Error al guardar el gasto fijo. Intente nuevamente.';
            setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
        }
    };

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-yellow-600 dark:text-yellow-300">
                            <DollarSign size={20} />
                        </span>
                        {gastoToEdit ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}
                    </h2>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4" role="alert">
                            <strong className="font-bold">Error!</strong> <span className="block sm:inline ml-1">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Destino</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <select
                                        value={destino}
                                        onChange={(e) => setDestino(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none transition duration-200"
                                    >
                                        <option value="Taller">Taller</option>
                                        <option value="Casa">Casa</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Día de Pago</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={dia}
                                        onChange={(e) => setDia(parseInt(e.target.value))}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                            <label className="flex items-center cursor-pointer group w-full">
                                <input
                                    type="checkbox"
                                    checked={anual}
                                    onChange={(e) => {
                                        setAnual(e.target.checked);
                                        if (!e.target.checked) setMes('');
                                    }}
                                    className="form-checkbox h-5 w-5 text-blue-600 dark:text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-2 font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">¿Es un Gasto Anual?</span>
                            </label>
                        </div>

                        {anual && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Mes de Pago</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <select
                                        value={mes}
                                        onChange={(e) => setMes(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none transition duration-200"
                                        required={anual}
                                    >
                                        <option value="">Seleccione un mes</option>
                                        {months.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Concepto del Gasto</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={gastoFijo}
                                    onChange={(e) => setGastoFijo(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Ej. Alquiler, Internet, Sueldos..."
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Monto</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={monto}
                                        onChange={(e) => setMonto(parseFloat(e.target.value))}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition duration-200"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Moneda</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <select
                                        value={moneda}
                                        onChange={(e) => setMoneda(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none transition duration-200"
                                    >
                                        <option value="Bolivianos">Bolivianos</option>
                                        <option value="Dólares">Dólares</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                <X size={20} /> Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md"
                            >
                                <Save size={20} />
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Gastos Fijos"
                sections={manualSections}
            />
        </div>
    );
};

export default GastosFijosModal;
