import React, { useEffect, useState, useMemo } from 'react';
import { Search, Save, Trash } from 'lucide-react';
import type { DetalleOrdenTrabajo } from '../../types/detalleOrdenTrabajo';
import { getDetallesByOrden } from '../../services/detalleOrdenTrabajoService';
import { getPersonal } from '../../services/personalService';
import { createTrabajoAsignado, updateTrabajoAsignado, getTrabajoByDetalle, deleteTrabajoAsignado } from '../../services/trabajoAsignadoService';
import type { Personal } from '../../types/personal';
import type { TrabajoAsignado } from '../../types/trabajoAsignado';

interface TrabajoAsignadoModalProps {
    isOpen: boolean;
    onClose: () => void;
    idOrdenTrabajo: number;
}

export const TrabajoAsignadoModal: React.FC<TrabajoAsignadoModalProps> = ({ isOpen, onClose, idOrdenTrabajo }) => {
    const [detalles, setDetalles] = useState<DetalleOrdenTrabajo[]>([]);
    const [personalList, setPersonalList] = useState<Personal[]>([]);
    const [trabajosAsignados, setTrabajosAsignados] = useState<Record<number, TrabajoAsignado | null>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<number | null>(null);

    // Form states for each detail
    const [forms, setForms] = useState<Record<number, {
        idpersonal: string;
        fecha_asignado: string;
        fecha_entrega: string;
        monto: string;
        observaciones: string;
    }>>({});

    useEffect(() => {
        if (isOpen && idOrdenTrabajo) {
            fetchData();
        }
    }, [isOpen, idOrdenTrabajo]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [detallesData, personalData] = await Promise.all([
                getDetallesByOrden(idOrdenTrabajo),
                getPersonal()
            ]);
            setDetalles(detallesData);
            setPersonalList(personalData.filter(p => p.estado === 'activo'));

            // Fetch existing assigned works
            const trabajosMap: Record<number, TrabajoAsignado | null> = {};
            const initialForms: Record<number, any> = {};

            for (const detalle of detallesData) {
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
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (detalleId: number, field: string, value: string) => {
        setForms(prev => ({
            ...prev,
            [detalleId]: {
                ...prev[detalleId],
                [field]: value
            }
        }));
    };

    const handleSave = async (detalleId: number) => {
        setSaving(detalleId);
        try {
            const form = forms[detalleId];
            if (!form.idpersonal) {
                alert('Debe seleccionar el personal');
                setSaving(null);
                return;
            }

            const payload = {
                iddetalle_orden_trabajo: detalleId,
                idpersonal: form.idpersonal,
                fecha_asignado: form.fecha_asignado,
                fecha_entrega: form.fecha_entrega || undefined,
                monto: form.monto ? Number(form.monto) : 0,
                observaciones: form.observaciones
            };

            const existingTrabajo = trabajosAsignados[detalleId];

            if (existingTrabajo) {
                const updated = await updateTrabajoAsignado(existingTrabajo.id, payload);
                setTrabajosAsignados(prev => ({ ...prev, [detalleId]: updated }));
            } else {
                const created = await createTrabajoAsignado(payload);
                setTrabajosAsignados(prev => ({ ...prev, [detalleId]: created }));
            }
            // Optional: show quick success feedback
        } catch (error) {
            console.error('Error saving trabajo asignado:', error);
            alert('Error al guardar');
        } finally {
            setSaving(null);
        }
    };

    const handleDelete = async (detalleId: number) => {
        if (!confirm('¿Estás seguro de eliminar esta asignación?')) return;

        const trabajo = trabajosAsignados[detalleId];
        if (!trabajo) return;

        setSaving(detalleId);
        try {
            await deleteTrabajoAsignado(trabajo.id);
            setTrabajosAsignados(prev => {
                const newState = { ...prev };
                delete newState[detalleId];
                return newState;
            });

            // Allow form to be managed again, maybe reset or keep values if user wants to re-assign
            // Keeping values allows for quick re-assignment if deleted by mistake
        } catch (error) {
            console.error('Error deleting trabajo asignado:', error);
            alert('Error al eliminar');
        } finally {
            setSaving(null);
        }
    };

    // Calculate totals
    const totalAsignado = useMemo(() => {
        return Object.values(trabajosAsignados).reduce((sum, trabajo) => {
            const monto = trabajo?.monto ? parseFloat(trabajo.monto.toString()) : 0;
            return sum + monto;
        }, 0);
    }, [trabajosAsignados]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <Search className="text-blue-500" />
                                Asignar Trabajos - Orden #{idOrdenTrabajo}
                            </h3>
                            <button
                                onClick={onClose}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-4">Cargando detalles...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4">Detalle / Trabajo</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-56">Personal</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fechas</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-64">Monto (Bs.)</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Observaciones</th>
                                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {detalles.map((detalle) => {
                                            const form = forms[detalle.id] || {};
                                            const isAssigned = !!trabajosAsignados[detalle.id];

                                            return (
                                                <tr key={detalle.id} className={isAssigned ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}>
                                                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-100 align-top">
                                                        <div className="font-medium text-blue-600 dark:text-blue-400">
                                                            {detalle.precio_taller?.detalle || detalle.precio_seguro?.detalle || 'Trabajo sin descripción'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Cant: {detalle.cantidad} | P.Unit: {Number(detalle.precio_unitario).toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4 align-top">
                                                        <select
                                                            value={form.idpersonal || ''}
                                                            onChange={(e) => handleInputChange(detalle.id, 'idpersonal', e.target.value)}
                                                            className="block w-full min-w-[14rem] pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-gray-900"
                                                        >
                                                            <option value="">Seleccionar...</option>
                                                            {personalList.map((personal) => (
                                                                <option key={personal.id} value={personal.id}>
                                                                    {personal.nombre} {personal.paterno}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-4 align-top space-y-2">
                                                        <div>
                                                            <label className="block text-xs text-gray-500">Asignado</label>
                                                            <input
                                                                type="date"
                                                                value={form.fecha_asignado || ''}
                                                                onChange={(e) => handleInputChange(detalle.id, 'fecha_asignado', e.target.value)}
                                                                className="block w-full py-1 px-2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-gray-500">Entrega</label>
                                                            <input
                                                                type="date"
                                                                value={form.fecha_entrega || ''}
                                                                onChange={(e) => handleInputChange(detalle.id, 'fecha_entrega', e.target.value)}
                                                                className="block w-full py-1 px-2 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4 align-top">
                                                        <input
                                                            type="number"
                                                            value={form.monto || ''}
                                                            onChange={(e) => handleInputChange(detalle.id, 'monto', e.target.value)}
                                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full min-w-[12rem] text-base border-gray-300 rounded-md bg-white text-gray-900 py-2 px-3 font-medium"
                                                            placeholder="0.00"
                                                            step="0.01"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-4 align-top">
                                                        <textarea
                                                            rows={2}
                                                            value={form.observaciones || ''}
                                                            onChange={(e) => handleInputChange(detalle.id, 'observaciones', e.target.value)}
                                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md bg-white text-gray-900 px-2 py-1"
                                                            placeholder="Observaciones..."
                                                        />
                                                    </td>
                                                    <td className="px-3 py-4 text-center align-top pt-8 flex gap-2 justify-center">
                                                        <button
                                                            onClick={() => handleSave(detalle.id)}
                                                            disabled={saving === detalle.id}
                                                            className={`inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white ${isAssigned ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                                                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors`}
                                                            title={isAssigned ? "Actualizar Asignación" : "Guardar Asignación"}
                                                        >
                                                            <Save size={16} />
                                                        </button>
                                                        {isAssigned && (
                                                            <button
                                                                onClick={() => handleDelete(detalle.id)}
                                                                disabled={saving === detalle.id}
                                                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                                                                title="Eliminar Asignación"
                                                            >
                                                                <Trash size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {detalles.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No hay detalles registrados en esta orden.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {/* Totals Section */}
                                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex justify-end px-6">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Total Asignado:
                                            </span>
                                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                Bs. {totalAsignado.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};
