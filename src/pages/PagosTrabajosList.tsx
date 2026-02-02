import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2, DollarSign, User, FileText, CheckSquare, Square, Tag, MessageSquare, ArrowLeft } from 'lucide-react';
import { getPersonal } from '../services/personalService';
import { getTrabajosAsignadosFilter } from '../services/trabajosAsignadosService';
import type { Personal } from '../types/personal';
import type { TrabajoAsignado } from '../services/trabajosAsignadosService';
import Swal from 'sweetalert2';
import api from '../services/api';
import ManualModal, { type ManualSection } from '../components/ManualModal';

const PagosTrabajosList = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const editId = searchParams.get('edit');

    // State
    const [personalList, setPersonalList] = useState<Personal[]>([]);
    const [selectedPersonalId, setSelectedPersonalId] = useState<number | ''>('');
    const [allPotentialTrabajos, setAllPotentialTrabajos] = useState<TrabajoAsignado[]>([]); // Works to show in list (Pending + Current Payment's)
    const [selectedTrabajosInfo, setSelectedTrabajosInfo] = useState<TrabajoAsignado[]>([]);
    const [loading, setLoading] = useState(false);
    const [showManual, setShowManual] = useState(false);

    // Payment Form State
    const [subTotal, setSubTotal] = useState(0);
    const [descuento, setDescuento] = useState(0);
    const [total, setTotal] = useState(0);
    const [observaciones, setObservaciones] = useState('');
    const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);

    const manualSections: ManualSection[] = [
        { title: 'Selección de Personal', content: 'Seleccione un empleado de la lista para ver sus trabajos pendientes de pago.' },
        { title: 'Selección de Trabajos', content: 'Marque las casillas de los trabajos que desea pagar. Use "Seleccionar Todo" para marcar todos rápidamente.' },
        { title: 'Resumen de Pago', content: 'Ingrese la fecha del pago (por defecto hoy), descuentos, y observaciones si es necesario.' },
        { title: 'Registro de Pago', content: 'Verifique el total y haga clic en "Registrar Pago". Puede cancelar la operación con el botón gris.' }
    ];

    useEffect(() => {
        fetchPersonal();
    }, []);

    useEffect(() => {
        if (editId) {
            loadPaymentForEdit(Number(editId));
        }
    }, [editId]);

    // Recalculate totals when selected items change or discount changes
    useEffect(() => {
        const calculatedSubTotal = selectedTrabajosInfo.reduce((sum, item) => sum + Number(item.monto), 0);
        const calculatedTotal = Math.max(0, calculatedSubTotal - descuento);

        setSubTotal(calculatedSubTotal);
        setTotal(calculatedTotal);
    }, [selectedTrabajosInfo, descuento]);

    const fetchPersonal = async () => {
        try {
            const data = await getPersonal();
            if (Array.isArray(data)) setPersonalList(data);
        } catch (error) {
            console.error('Error fetching personal:', error);
        }
    };

    const loadPaymentForEdit = async (id: number) => {
        setLoading(true);
        try {
            // 1. Get Payment Details
            const response = await api.get(`/pagos-trabajos-asignados/${id}`);
            const payment = response.data;

            // 2. Set Form Data
            setSelectedPersonalId(payment.idpersonal);
            setObservaciones(payment.detalle || '');
            setDescuento(Number(payment.descuento));
            if (payment.fecha_pago) {
                setFechaPago(new Date(payment.fecha_pago).toISOString().split('T')[0]);
            }

            // 3. Load Works
            // We need: (Unpaid Works for this Person) + (Works ALREADY in this Payment)

            // A. Fetch Unpaid (Pending)
            const unpaidData = await getTrabajosAsignadosFilter({
                personalId: payment.idpersonal,
                terminado: 'true'
            });
            const pendingWorks = Array.isArray(unpaidData) ? unpaidData.filter(t => !t.cancelado) : [];

            // B. The works from the payment are in payment.trabajos
            // Ensure types match
            const currentPaymentWorks = payment.trabajos || [];

            // Combine for display list
            // Use Map to avoid duplicates if any weird state exists
            const worksMap = new Map();
            [...pendingWorks, ...currentPaymentWorks].forEach(w => worksMap.set(w.id, w));
            const distinctWorks = Array.from(worksMap.values());

            // Sort by date desc
            distinctWorks.sort((a, b) => new Date(b.fecha_asignado).getTime() - new Date(a.fecha_asignado).getTime());

            setAllPotentialTrabajos(distinctWorks);
            setSelectedTrabajosInfo(currentPaymentWorks); // Pre-select existing ones

        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo cargar el pago para editar', 'error');
            navigate('/pagos-trabajos/historial');
        } finally {
            setLoading(false);
        }
    };

    const handlePersonalChange = async (id: number) => {
        // If in edit mode, warn user that changing personal resets everything
        if (editId && id !== selectedPersonalId) {
            const result = await Swal.fire({
                title: '¿Cambiar Personal?',
                text: 'Si cambia el personal, saldrá del modo de edición de este pago. ¿Desea continuar?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, cambiar',
                cancelButtonText: 'Cancelar'
            });
            if (!result.isConfirmed) return;

            // Exit edit mode
            navigate('/pagos-trabajos/lista');
            return;
        }

        setSelectedPersonalId(id);
        setSelectedTrabajosInfo([]); // Clear selection/draft
        setDescuento(0);
        setObservaciones('');
        setFechaPago(new Date().toISOString().split('T')[0]);

        if (!id) {
            setAllPotentialTrabajos([]);
            return;
        }

        setLoading(true);
        try {
            const data = await getTrabajosAsignadosFilter({
                personalId: id,
                terminado: 'true',
            });

            if (Array.isArray(data)) {
                // In create mode, we only show unpaid
                const pending = data.filter(t => !t.cancelado);
                setAllPotentialTrabajos(pending);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar los trabajos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleWorkSelection = (trabajo: TrabajoAsignado) => {
        const isSelected = selectedTrabajosInfo.some(t => t.id === trabajo.id);

        if (isSelected) {
            // Remove from selection
            setSelectedTrabajosInfo(prev => prev.filter(t => t.id !== trabajo.id));
        } else {
            // Add to selection
            setSelectedTrabajosInfo(prev => [...prev, trabajo]);
        }
    };

    const handleSelectAll = () => {
        if (selectedTrabajosInfo.length === allPotentialTrabajos.length) {
            setSelectedTrabajosInfo([]); // Deselect all
        } else {
            setSelectedTrabajosInfo([...allPotentialTrabajos]); // Select all
        }
    };

    const handleCancel = () => {
        if (editId) {
            navigate('/pagos-trabajos/historial');
        } else {
            // Reset form
            setSelectedPersonalId('');
            setAllPotentialTrabajos([]);
            setSelectedTrabajosInfo([]);
            setSubTotal(0);
            setDescuento(0);
            setTotal(0);
            setObservaciones('');
            setFechaPago(new Date().toISOString().split('T')[0]);
        }
    };

    const handleSavePayment = async () => {
        if (!selectedPersonalId) {
            Swal.fire('Atención', 'Seleccione al personal', 'warning');
            return;
        }
        if (selectedTrabajosInfo.length === 0) {
            Swal.fire('Atención', 'Seleccione al menos un trabajo para pagar', 'warning');
            return;
        }

        const actionText = editId ? 'Actualizar' : 'Registrar';

        const result = await Swal.fire({
            title: `¿${actionText} Pago?`,
            text: `Se ${editId ? 'actualizará el' : 'generará un'} pago por Bs ${total.toFixed(2)} para ${selectedTrabajosInfo.length} trabajos.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: `Sí, ${actionText.toLowerCase()}`,
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const payload = {
                    idpersonal: Number(selectedPersonalId),
                    detalle: observaciones,
                    sub_total: Number(subTotal),
                    descuento: Number(descuento),
                    total: Number(total),
                    fecha_pago: fechaPago,
                    idusuario: 1, // TODO: Replace with auth user id,
                    trabajosIds: selectedTrabajosInfo.map(t => t.id)
                };

                if (editId) {
                    await api.patch(`/pagos-trabajos-asignados/${editId}`, payload);
                    await Swal.fire({
                        title: '¡Éxito!',
                        text: 'Pago actualizado correctamente',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    navigate('/pagos-trabajos/historial');
                } else {
                    await api.post('/pagos-trabajos-asignados', payload);
                    await Swal.fire({
                        title: '¡Éxito!',
                        text: 'Pago registrado correctamente',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    handlePersonalChange(Number(selectedPersonalId)); // Refresh
                }

            } catch (error) {
                console.error(error);
                Swal.fire('Error', `No se pudo ${actionText.toLowerCase()} el pago`, 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const formatCurrency = (val: number) => `Bs ${Number(val).toFixed(2)}`;

    return (
        <div className="container mx-auto p-6 max-w-7xl min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    {editId && (
                        <button
                            onClick={() => navigate('/pagos-trabajos/historial')}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                    )}
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <DollarSign className="text-green-600" /> {editId ? 'Editar Pago' : 'Registrar Pagos a Personal'}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/pagos-trabajos/historial')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-md transition-all transform hover:-translate-y-1 text-sm"
                    >
                        <FileText size={18} />
                        Ver Historial
                    </button>
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all transform hover:-translate-y-1"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                </div>
            </div>

            {/* Selection Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Seleccionar Personal
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                        <select
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            value={selectedPersonalId}
                            onChange={(e) => handlePersonalChange(Number(e.target.value))}
                            disabled={!!editId} // Disable personal change in edit mode for simplicity
                        >
                            <option value="">-- Seleccione --</option>
                            {personalList.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} {p.paterno} {p.materno}</option>
                            ))}
                        </select>
                    </div>
                    {editId && <p className="text-xs text-yellow-600 mt-2">Editando pago existente. No puede cambiar el personal.</p>}
                </div>
            </div>

            {selectedPersonalId && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Available Works */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                {editId ? 'Trabajos (Incluye items del pago actual)' : 'Trabajos Pendientes'}
                            </h2>
                            <button
                                onClick={handleSelectAll}
                                className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-all transform hover:-translate-y-0.5"
                            >
                                {selectedTrabajosInfo.length === allPotentialTrabajos.length && allPotentialTrabajos.length > 0 ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                            </button>
                        </div>

                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-3 w-10">
                                            <div className="flex items-center justify-center">
                                                <CheckSquare size={18} className="text-gray-400" />
                                            </div>
                                        </th>
                                        <th className="p-3 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                                        <th className="p-3 text-xs font-bold text-gray-500 uppercase">Detalle</th>
                                        <th className="p-3 text-xs font-bold text-gray-500 uppercase">Vehículo</th>
                                        <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {allPotentialTrabajos.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                                No hay trabajos disponibles.
                                            </td>
                                        </tr>
                                    ) : (
                                        allPotentialTrabajos.map(t => {
                                            const isSelected = selectedTrabajosInfo.some(s => s.id === t.id);
                                            // In edit mode, maybe highlight originally paid ones differently? Not strict req.
                                            return (
                                                <tr
                                                    key={t.id}
                                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                                    onClick={() => toggleWorkSelection(t)}
                                                >
                                                    <td className="p-3 text-center">
                                                        {isSelected ? (
                                                            <CheckSquare className="text-blue-600 mx-auto" size={20} />
                                                        ) : (
                                                            <Square className="text-gray-300 mx-auto" size={20} />
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-sm text-gray-600 dark:text-gray-300">
                                                        {new Date(t.fecha_asignado).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-3 text-sm">
                                                        <div className="font-medium text-gray-800 dark:text-gray-200">
                                                            {t.detalle_orden_trabajo?.detalle || 'Sin detalle'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Nivel: {t.detalle_orden_trabajo?.nivel}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-sm text-gray-600 dark:text-gray-300">
                                                        <div className="font-bold">{t.detalle_orden_trabajo?.orden_trabajo?.placa}</div>
                                                        <div className="text-xs">{t.detalle_orden_trabajo?.orden_trabajo?.marca_auto?.marca}</div>
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-gray-700 dark:text-gray-200">
                                                        {formatCurrency(t.monto)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right: Payment Summary */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 h-fit sticky top-6">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <FileText size={20} /> Resumen de Pago
                        </h2>

                        <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between text-sm mb-2 text-gray-700 dark:text-gray-300">
                                    <span>Items seleccionados:</span>
                                    <span className="font-bold">{selectedTrabajosInfo.length}</span>
                                </div>
                                <div className="flex justify-between text-base font-bold mb-1 text-gray-900 dark:text-white">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(subTotal)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                                    Fecha de Pago
                                </label>
                                <input
                                    type="date"
                                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={fechaPago}
                                    onChange={(e) => setFechaPago(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                                    Descuento (Bs)
                                </label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right font-bold text-lg"
                                        value={descuento}
                                        onChange={(e) => setDescuento(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                                    Observaciones / Detalle
                                </label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <textarea
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-20 text-sm"
                                        placeholder="Nota opcional..."
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                                <div className="flex justify-between items-center text-xl font-bold text-gray-900 dark:text-white">
                                    <span>Total a Pagar:</span>
                                    <span className="text-green-600 dark:text-green-400">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleCancel}
                                    disabled={loading}
                                    className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl shadow transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={20} />
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSavePayment}
                                    disabled={total <= 0 || loading}
                                    className={`flex-1 py-3 px-4 rounded-xl text-white font-bold shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2
                                        ${total > 0 && !loading ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}
                                    `}
                                >
                                    <DollarSign size={20} />
                                    {loading ? 'Procesando...' : (editId ? 'Actualizar Pago' : 'Registrar Pago')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Pagos"
                sections={manualSections}
            />
        </div>
    );
};

export default PagosTrabajosList;
