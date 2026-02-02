import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDetallesByOrden } from '../services/detalleOrdenTrabajoService';
import { getPersonal } from '../services/personalService';
import { createTrabajoAsignado, updateTrabajoAsignado, getTrabajoByDetalle, deleteTrabajoAsignado } from '../services/trabajoAsignadoService'; // Confirm import path
import type { DetalleOrdenTrabajo } from '../types/detalleOrdenTrabajo';
import type { Personal } from '../types/personal';
import type { TrabajoAsignado } from '../types/trabajoAsignado'; // Confirm type path
import Swal from 'sweetalert2';
import { Save, Trash2, ArrowLeft, User, Calendar, DollarSign, FileText, Printer, ClipboardList } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TrabajoAsignadoForm = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const idOrdenTrabajo = Number(id);

    const [detalles, setDetalles] = useState<DetalleOrdenTrabajo[]>([]);
    const [personalList, setPersonalList] = useState<Personal[]>([]);
    const [loading, setLoading] = useState(true);
    const [trabajosAsignados, setTrabajosAsignados] = useState<Record<number, TrabajoAsignado | null>>({});

    // Form state for each detail
    const [forms, setForms] = useState<Record<number, {
        idpersonal: number | string;
        fecha_asignado: string;
        fecha_entrega: string;
        monto: string;
        observaciones: string;
    }>>({});

    useEffect(() => {
        if (idOrdenTrabajo) {
            fetchData();
        }
    }, [idOrdenTrabajo]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [detallesData, personalData] = await Promise.all([
                getDetallesByOrden(idOrdenTrabajo),
                getPersonal()
            ]);

            // Filter out 'Repuestos'
            const filteredDetalles = detallesData.filter(d => {
                const catName = d.precio_taller?.categoria?.categoria_servicio ||
                    d.precio_seguro?.categoria?.categoria_servicio || '';
                return !catName.toLowerCase().includes('repuesto');
            });

            setDetalles(filteredDetalles);
            setPersonalList(personalData.filter(p => p.estado === 'activo'));

            // Fetch existing assigned works
            const trabajosMap: Record<number, TrabajoAsignado | null> = {};
            const initialForms: Record<number, any> = {};

            for (const detalle of filteredDetalles) {
                const trabajo = await getTrabajoByDetalle(detalle.id);
                trabajosMap[detalle.id] = trabajo;

                initialForms[detalle.id] = {
                    idpersonal: trabajo?.personal?.id || '',
                    fecha_asignado: trabajo?.fecha_asignado ? new Date(trabajo.fecha_asignado).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    fecha_entrega: trabajo?.fecha_entrega ? new Date(trabajo.fecha_entrega).toISOString().split('T')[0] : '',
                    monto: trabajo?.monto?.toString() || '',
                    observaciones: trabajo?.observaciones || ''
                };
            }
            setTrabajosAsignados(trabajosMap);
            setForms(initialForms);

        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (detalleId: number, field: string, value: any) => {
        setForms(prev => ({
            ...prev,
            [detalleId]: {
                ...prev[detalleId],
                [field]: value
            }
        }));
    };

    const handleSave = async (detalleId: number) => {
        const form = forms[detalleId];
        if (!form.idpersonal || !form.fecha_asignado || !form.monto) {
            Swal.fire('Atención', 'Personal, Fecha Asignado y Monto son obligatorios', 'warning');
            return;
        }

        try {
            const data = {
                iddetalle_orden_trabajo: detalleId,
                idpersonal: String(form.idpersonal),
                fecha_asignado: new Date(form.fecha_asignado).toISOString(),
                fecha_entrega: form.fecha_entrega ? new Date(form.fecha_entrega).toISOString() : undefined,
                monto: parseFloat(form.monto),
                observaciones: form.observaciones
            };

            const existingTrabajo = trabajosAsignados[detalleId];

            let savedTrabajo;
            if (existingTrabajo) {
                savedTrabajo = await updateTrabajoAsignado(existingTrabajo.id, data);
                Swal.fire({
                    icon: 'success',
                    title: 'Actualizado',
                    text: 'Trabajo asignado actualizado correctamente',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                savedTrabajo = await createTrabajoAsignado(data);
                Swal.fire({
                    icon: 'success',
                    title: 'Guardado',
                    text: 'Trabajo asignado correctamente',
                    showConfirmButton: false,
                    timer: 1500
                });
            }

            // Update local state directly with returned entity
            if (savedTrabajo) {
                setTrabajosAsignados(prev => ({
                    ...prev,
                    [detalleId]: savedTrabajo
                }));
            } else {
                // Fallback re-fetch if backend doesn't return (though we fixed it)
                fetchData();
            }

        } catch (error) {
            console.error('Error saving trabajo asignado:', error);
            Swal.fire('Error', 'No se pudo guardar la asignación', 'error');
        }
    };

    const handleDelete = async (detalleId: number) => {
        const existingTrabajo = trabajosAsignados[detalleId];
        if (!existingTrabajo) return;

        const result = await Swal.fire({
            title: '¿Eliminar asignación?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteTrabajoAsignado(existingTrabajo.id);

                // Reset form and removed from assigned map
                setTrabajosAsignados(prev => {
                    const newState = { ...prev };
                    delete newState[detalleId];
                    return newState;
                });

                setForms(prev => ({
                    ...prev,
                    [detalleId]: {
                        idpersonal: '',
                        fecha_asignado: new Date().toISOString().split('T')[0],
                        fecha_entrega: '',
                        monto: '',
                        observaciones: ''
                    }
                }));

                Swal.fire('Eliminado', 'La asignación ha sido eliminada', 'success');
            } catch (error) {
                console.error('Error deleting assignment:', error);
                Swal.fire('Error', 'No se pudo eliminar la asignación', 'error');
            }
        }
    };

    // Calculate totals
    const totalAsignado = useMemo(() => {
        return Object.values(trabajosAsignados).reduce((sum, trabajo) => {
            const monto = trabajo?.monto ? parseFloat(trabajo.monto.toString()) : 0;
            return sum + monto;
        }, 0);
    }, [trabajosAsignados]);

    // Group assignments by personnel for totals and printing
    const assignmentsByPersonal = useMemo(() => {
        const grouped: Record<string, {
            nombre: string;
            total: number;
            items: TrabajoAsignado[];
        }> = {};

        Object.values(trabajosAsignados).forEach(trabajo => {
            if (trabajo && trabajo.personal) {
                const idPersonal = trabajo.personal.id.toString();
                const nombreCompleto = `${trabajo.personal.nombre} ${trabajo.personal.paterno}`;
                const monto = trabajo.monto ? parseFloat(trabajo.monto.toString()) : 0;

                if (!grouped[idPersonal]) {
                    grouped[idPersonal] = {
                        nombre: nombreCompleto,
                        total: 0,
                        items: []
                    };
                }

                grouped[idPersonal].total += monto;
                grouped[idPersonal].items.push(trabajo);
            }
        });

        return grouped;
    }, [trabajosAsignados]);

    const handlePrintPersonal = (personalName: string, items: TrabajoAsignado[]) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('REPORTE DE TRABAJOS ASIGNADOS', 105, 15, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`Orden de Trabajo: #${idOrdenTrabajo}`, 14, 25);
        doc.text(`Personal: ${personalName}`, 14, 32);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 39);

        // Table
        const tableData = items.map(item => [
            // Try to get work description from linked detail if possible, currently we might not have it directly in 'item' 
            // if 'item' is just TrabajoAsignado. However, we have 'detalles' state.
            // Let's rely on what we have or map it back. 
            // Actually, TrabajoAsignado entity usually has relation to Detalle?
            // Checking types... TrabajoAsignado might not have the full deep relation loaded or we need to look it up.
            // We have 'detalles' array. We can value lookup.
            detalles.find(d => d.id === item.detalle_orden_trabajo.id)?.precio_taller?.detalle ||
            detalles.find(d => d.id === item.detalle_orden_trabajo.id)?.precio_seguro?.detalle || 'Trabajo #' + item.detalle_orden_trabajo.id,
            item.fecha_asignado ? new Date(item.fecha_asignado).toLocaleDateString() : '',
            item.monto ? `Bs. ${Number(item.monto).toFixed(2)}` : '0.00',
            item.observaciones || ''
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Trabajo', 'Fecha Asignado', 'Monto', 'Observaciones']],
            body: tableData,
            foot: [['', 'Total:', `Bs. ${items.reduce((sum, i) => sum + (Number(i.monto) || 0), 0).toFixed(2)}`, '']],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
        });

        doc.save(`asignacion_${personalName.replace(/\s+/g, '_')}_OT${idOrdenTrabajo}.pdf`);
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/ordenes-trabajo/list')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-all transform hover:-translate-y-0.5 shadow-sm"
                        title="Volver"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                                <ClipboardList size={28} />
                            </span>
                            Asignar Trabajos
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1 ml-1">
                            Orden de Trabajo N° {idOrdenTrabajo}
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Cargando detalles...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">Detalle / Trabajo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-56">Personal</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fechas</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">Monto (Bs.)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[20rem]">Observaciones</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {detalles.map((detalle) => {
                                    const form = forms[detalle.id] || {};
                                    const isAssigned = !!trabajosAsignados[detalle.id];

                                    return (
                                        <tr key={detalle.id} className={isAssigned ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}>
                                            <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 align-top">
                                                <div className="font-medium text-blue-600 dark:text-blue-400 text-base">
                                                    {detalle.precio_taller?.detalle || detalle.precio_seguro?.detalle || 'Trabajo sin descripción'}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    Cant: {detalle.cantidad} | P.Unit: {Number(detalle.precio_unitario).toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <User size={16} className="text-gray-400" />
                                                    </div>
                                                    <select
                                                        value={form.idpersonal || ''}
                                                        onChange={(e) => handleInputChange(detalle.id, 'idpersonal', e.target.value)}
                                                        className="block w-full min-w-[14rem] pl-10 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        {personalList.map((personal) => (
                                                            <option key={personal.id} value={personal.id}>
                                                                {personal.nombre} {personal.paterno}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 align-top space-y-3">
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Asignado</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                            <Calendar size={14} className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="date"
                                                            value={form.fecha_asignado || ''}
                                                            onChange={(e) => handleInputChange(detalle.id, 'fecha_asignado', e.target.value)}
                                                            className="block w-full py-1.5 pl-8 pr-2 text-sm border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Entrega</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                            <Calendar size={14} className="text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="date"
                                                            value={form.fecha_entrega || ''}
                                                            onChange={(e) => handleInputChange(detalle.id, 'fecha_entrega', e.target.value)}
                                                            className="block w-full py-1.5 pl-8 pr-2 text-sm border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <DollarSign size={16} className="text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={form.monto || ''}
                                                        onChange={(e) => handleInputChange(detalle.id, 'monto', e.target.value)}
                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full min-w-[8rem] pl-10 text-lg border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-3 font-medium"
                                                        placeholder="0.00"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                <div className="relative">
                                                    <div className="absolute top-2 left-3 pointer-events-none">
                                                        <FileText size={16} className="text-gray-400" />
                                                    </div>
                                                    <textarea
                                                        rows={2}
                                                        value={form.observaciones || ''}
                                                        onChange={(e) => handleInputChange(detalle.id, 'observaciones', e.target.value)}
                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:placeholder-gray-400"
                                                        placeholder="Observaciones..."
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center align-top">
                                                <div className="flex flex-col gap-2 items-center">
                                                    <button
                                                        onClick={() => handleSave(detalle.id)}
                                                        className={`p-2 rounded-full text-white shadow-sm transition-all transform hover:-translate-y-0.5 ${isAssigned ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                                                            }`}
                                                        title={isAssigned ? "Actualizar Asignación" : "Guardar Asignación"}
                                                    >
                                                        <Save size={20} />
                                                    </button>

                                                    {isAssigned && (
                                                        <button
                                                            onClick={() => handleDelete(detalle.id)}
                                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition-all transform hover:-translate-y-0.5"
                                                            title="Eliminar Asignación"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col items-end gap-2">
                        {Object.values(assignmentsByPersonal).map((group) => (
                            <div key={group.nombre} className="flex justify-between items-center w-full max-w-md text-sm text-gray-600 dark:text-gray-300">
                                <span>{group.nombre}:</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-medium">Bs. {group.total.toFixed(2)}</span>
                                    <button
                                        onClick={() => handlePrintPersonal(group.nombre, group.items)}
                                        className="p-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-all transform hover:-translate-y-0.5 shadow-sm"
                                        title="Imprimir Detalle"
                                    >
                                        <Printer size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {Object.keys(assignmentsByPersonal).length > 0 && (
                            <div className="w-full max-w-md border-t border-gray-300 dark:border-gray-600 my-1"></div>
                        )}
                        <div className="flex justify-between w-full max-w-md pr-10">
                            <span className="text-gray-800 dark:text-gray-200 font-bold text-lg">Total General:</span>
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                Bs. {totalAsignado.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrabajoAsignadoForm;
