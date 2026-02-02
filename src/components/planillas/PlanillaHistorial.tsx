import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, XCircle, Search, CreditCard, User as UserIcon, FileText, RotateCcw, Eye } from 'lucide-react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import type { User } from '../../types/user';

interface Planilla {
    id: number;
    mes: number;
    anio: number;
    fecha_generacion: string;
    total_planilla: number;
    estado: string;
    pago_planilla?: {
        id: number;
        fecha_pago: string;
    };
    detalles: {
        id: number;
        personal: {
            nombre: string;
            paterno: string;
            ci: string;
            area: { area: string };
            salario: number;
        };
        dias_trabajados: number;
        faltas: number;
        bonos: number;
        descuentos: number;
        anticipos: number;
        liquido_pagable: number;
    }[];
}

interface FormaPago {
    id: number;
    forma_pago: string;
}

const PlanillaHistorial = () => {
    const [planillas, setPlanillas] = useState<Planilla[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedPlanilla, setSelectedPlanilla] = useState<Planilla | null>(null);
    const [viewPlanilla, setViewPlanilla] = useState<Planilla | null>(null);
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Payment Form State
    const [idFormaPago, setIdFormaPago] = useState('');
    const [idUser, setIdUser] = useState(''); // Ideally this should be auto-selected based on logged-in user context
    const [monto, setMonto] = useState('');
    const [observaciones, setObservaciones] = useState('');

    useEffect(() => {
        fetchPlanillas();
        fetchFormasPago();
        fetchUsers();
    }, []);

    const fetchPlanillas = async () => {
        try {
            const res = await api.get('/planillas');
            // Sort by year descending, then month descending
            const sorted = res.data.sort((a: Planilla, b: Planilla) => {
                if (a.anio !== b.anio) return b.anio - a.anio;
                return b.mes - a.mes;
            });
            setPlanillas(sorted);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchFormasPago = async () => {
        try {
            const res = await api.get('/forma-pago');
            setFormasPago(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
            // Basic auto-select active user if possible, for now just select first active
            const activeUser = res.data.find((u: User) => u.estado === 'activo');
            if (activeUser) setIdUser(activeUser.id.toString());
        } catch (error) {
            console.error(error);
        }
    };


    const openPaymentModal = (planilla: Planilla) => {
        setSelectedPlanilla(planilla);
        setMonto(Number(planilla.total_planilla).toFixed(2));
        setModalOpen(true);
    };

    const closePaymentModal = () => {
        setModalOpen(false);
        setSelectedPlanilla(null);
        setIdFormaPago('');
        setObservaciones('');
    };

    const openViewModal = (planilla: Planilla) => {
        setViewPlanilla(planilla);
        setViewModalOpen(true);
    };

    const closeViewModal = () => {
        setViewModalOpen(false);
        setViewPlanilla(null);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlanilla) return;

        try {
            await api.post('/pagos-planillas', {
                planilla_id: selectedPlanilla.id,
                idforma_pago: Number(idFormaPago),
                iduser: Number(idUser),
                monto: Number(monto),
                observaciones
            });

            Swal.fire({
                title: 'Pagado',
                text: 'Pago registrado correctamente',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            closePaymentModal();
            fetchPlanillas();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo registrar el pago', 'error');
        }
    };

    const handleRevertPayment = async (planilla: Planilla) => {
        if (!planilla.pago_planilla?.id) return;

        const result = await Swal.fire({
            title: '¿Revertir Pago?',
            text: "Esta acción eliminará el registro del pago y devolverá la planilla a estado 'GENERADO'.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, revertir',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/pagos-planillas/${planilla.pago_planilla.id}`);
                Swal.fire({
                    title: 'Revertido',
                    text: 'El pago ha sido eliminado.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchPlanillas();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo revertir el pago', 'error');
            }
        }
    };

    const getMonthName = (month: number) => {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return months[month - 1] || 'Desconocido';
    };

    const filteredPlanillas = planillas.filter(p =>
        p.anio.toString().includes(searchTerm) ||
        getMonthName(p.mes).toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.estado.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 w-full max-w-sm">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por año, mes o estado..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                            title="Limpiar búsqueda"
                            type="button"
                        >
                            <XCircle size={20} />
                        </button>
                    )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium pl-1">
                    Mostrando {filteredPlanillas.length > 0 ? 1 : 0} - {filteredPlanillas.length} de {planillas.length} registros
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-gray-600 dark:text-gray-300">
                        <tr>
                            <th className="p-4 font-bold border-b dark:border-gray-600 w-16">#</th>
                            <th className="p-4 font-bold border-b dark:border-gray-600">Periodo</th>
                            <th className="p-4 font-bold border-b dark:border-gray-600">Fecha Generación</th>
                            <th className="p-4 font-bold border-b dark:border-gray-600">Fecha Pago</th>
                            <th className="p-4 font-bold border-b dark:border-gray-600 text-right">Total Planilla</th>
                            <th className="p-4 font-bold border-b dark:border-gray-600 text-center">Estado</th>
                            <th className="p-4 font-bold border-b dark:border-gray-600 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredPlanillas.map((planilla, index) => (
                            <tr key={planilla.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-medium text-gray-900 dark:text-white">
                                    {index + 1}
                                </td>
                                <td className="p-4 font-medium text-gray-900 dark:text-white">
                                    {getMonthName(planilla.mes)} {planilla.anio}
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                    {new Date(planilla.fecha_generacion).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                    {planilla.pago_planilla?.fecha_pago
                                        ? new Date(planilla.pago_planilla.fecha_pago).toLocaleDateString()
                                        : '-'}
                                </td>
                                <td className="p-4 text-right font-mono text-gray-700 dark:text-gray-300">
                                    Bs {Number(planilla.total_planilla).toFixed(2)}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${planilla.estado === 'PAGADO'
                                        ? 'bg-green-100 text-green-800 border-green-200'
                                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                        }`}>
                                        {planilla.estado}
                                    </span>
                                </td>
                                <td className="p-4 flex justify-center gap-2">
                                    {planilla.estado !== 'PAGADO' && (
                                        <button
                                            onClick={() => openPaymentModal(planilla)}
                                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-transform hover:-translate-y-0.5"
                                            title="Registrar Pago"
                                        >
                                            <DollarSign size={18} />
                                        </button>
                                    )}
                                    {planilla.estado === 'PAGADO' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openViewModal(planilla)}
                                                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg shadow-sm transition-transform hover:-translate-y-0.5"
                                                title="Ver Detalle"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <div className="text-green-600" title="Pagado">
                                                <CheckCircle size={24} />
                                            </div>
                                            <button
                                                onClick={() => handleRevertPayment(planilla)}
                                                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg shadow-sm transition-transform hover:-translate-y-0.5"
                                                title="Revertir Pago"
                                            >
                                                <RotateCcw size={18} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Payment Modal */}
            {modalOpen && selectedPlanilla && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <DollarSign size={20} className="text-blue-600" />
                                Registrar Pago de Planilla
                            </h3>

                        </div>
                        <form onSubmit={handlePayment} className="p-6 space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                    Planilla: {getMonthName(selectedPlanilla.mes)} {selectedPlanilla.anio}
                                </p>
                                <p className="text-xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                                    Total: Bs {Number(selectedPlanilla.total_planilla).toFixed(2)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forma de Pago</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <CreditCard size={18} className="text-gray-400" />
                                    </div>
                                    <select
                                        required
                                        value={idFormaPago}
                                        onChange={(e) => setIdFormaPago(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="">Seleccione...</option>
                                        {formasPago.map(fp => (
                                            <option key={fp.id} value={fp.id}>{fp.forma_pago}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuario Responsable</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon size={18} className="text-gray-400" />
                                    </div>
                                    <select
                                        required
                                        disabled
                                        value={idUser}
                                        onChange={(e) => setIdUser(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-blue-500 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                                    >
                                        <option value="">Seleccione...</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto a Pagar</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        value={monto}
                                        readOnly
                                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 cursor-not-allowed dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 pointer-events-none">
                                        <FileText size={18} className="text-gray-400" />
                                    </div>
                                    <textarea
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 mt-4">
                                <button
                                    type="button"
                                    onClick={closePaymentModal}
                                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all transform hover:-translate-y-0.5 font-medium flex items-center gap-2"
                                >
                                    <XCircle size={18} />
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 font-medium"
                                >
                                    <CheckCircle size={18} />
                                    Confirmar Pago
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewModalOpen && viewPlanilla && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 flex-shrink-0">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <Eye size={20} className="text-gray-600" />
                                Detalle de Planilla - {getMonthName(viewPlanilla.mes)} {viewPlanilla.anio}
                            </h3>

                        </div>
                        <div className="p-0 overflow-auto flex-grow">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-gray-600 dark:text-gray-300 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 font-bold border-b dark:border-gray-600">Personal</th>
                                        <th className="p-3 font-bold border-b dark:border-gray-600">Area</th>
                                        <th className="p-3 font-bold border-b dark:border-gray-600 text-right">Haber Básico</th>
                                        <th className="p-3 font-bold border-b dark:border-gray-600 text-center">Faltas</th>
                                        <th className="p-3 font-bold border-b dark:border-gray-600 text-right">Bonos</th>
                                        <th className="p-3 font-bold border-b dark:border-gray-600 text-right">Descuentos</th>
                                        <th className="p-3 font-bold border-b dark:border-gray-600 text-right">Anticipos</th>
                                        <th className="p-3 font-bold border-b dark:border-gray-600 text-right bg-green-50 dark:bg-green-900/20">Líquido Pagable</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {viewPlanilla.detalles?.map((detalle) => (
                                        <tr key={detalle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="p-3">
                                                <div className="font-medium text-gray-900 dark:text-white">{detalle.personal.nombre} {detalle.personal.paterno}</div>
                                                <div className="text-xs text-gray-500">{detalle.personal.ci}</div>
                                            </td>
                                            <td className="p-3 text-sm text-gray-600 dark:text-gray-300">
                                                {detalle.personal.area?.area || '-'}
                                            </td>
                                            <td className="p-3 text-right font-mono text-gray-700 dark:text-gray-300">
                                                {Number(detalle.personal.salario).toFixed(2)}
                                            </td>
                                            <td className="p-3 text-center text-gray-700 dark:text-gray-300">
                                                {detalle.faltas}
                                            </td>
                                            <td className="p-3 text-right text-gray-700 dark:text-gray-300">
                                                {Number(detalle.bonos).toFixed(2)}
                                            </td>
                                            <td className="p-3 text-right text-red-600 dark:text-red-400">
                                                {Number(detalle.descuentos).toFixed(2)}
                                            </td>
                                            <td className="p-3 text-right text-gray-700 dark:text-gray-300">
                                                {Number(detalle.anticipos).toFixed(2)}
                                            </td>
                                            <td className="p-3 text-right font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/10">
                                                {Number(detalle.liquido_pagable).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-600 sticky bottom-0 z-10">
                                    <tr>
                                        <td colSpan={7} className="p-3 text-right font-bold text-gray-700 dark:text-gray-300 uppercase">Total Planilla:</td>
                                        <td className="p-3 text-right font-bold text-green-700 dark:text-green-400 text-lg">
                                            Bs {Number(viewPlanilla.total_planilla).toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end">
                            <button
                                onClick={closeViewModal}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanillaHistorial;
