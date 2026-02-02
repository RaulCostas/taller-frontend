
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import type { DetalleOrdenTrabajo } from '../types/detalleOrdenTrabajo';
import { getDetallesByOrden } from '../services/detalleOrdenTrabajoService';
import {
    getSeguimientoByDetalleId,
    createSeguimiento,
    updateSeguimiento,
    type SeguimientoRepuesto
} from '../services/seguimientoRepuestoService';
import { X, Check, Package, Calendar, User, Truck, Save } from 'lucide-react';

interface RegistrarRepuestosModalProps {
    ordenId: number;
    onClose: () => void;
}

interface DetalleWithSeguimiento extends DetalleOrdenTrabajo {
    seguimiento?: SeguimientoRepuesto | null;
}

const RegistrarRepuestosModal = ({ ordenId, onClose }: RegistrarRepuestosModalProps) => {
    const [loading, setLoading] = useState(true);
    const [repuestos, setRepuestos] = useState<DetalleWithSeguimiento[]>([]);

    useEffect(() => {
        fetchRepuestos();
    }, [ordenId]);

    const fetchRepuestos = async () => {
        try {
            setLoading(true);
            const detalles = await getDetallesByOrden(ordenId);

            // Filter strictly for Repuestos
            const repuestosOnly = detalles.filter(d => {
                const categoria = d.precio_taller?.categoria?.categoria_servicio || d.precio_seguro?.categoria?.categoria_servicio || '';
                return categoria.toUpperCase().includes('REPUESTO');
            });

            // Fetch tracking info for each repuesto
            const repuestosWithTracking = await Promise.all(repuestosOnly.map(async (repuesto) => {
                const seguimiento = await getSeguimientoByDetalleId(repuesto.id);
                return { ...repuesto, seguimiento };
            }));

            setRepuestos(repuestosWithTracking);
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los repuestos',
                target: document.getElementById('repuestos-modal')
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSeguimiento = (detalleId: number, field: keyof SeguimientoRepuesto, value: any) => {
        setRepuestos(prev => prev.map(r => {
            if (r.id === detalleId) {
                const currentSeguimiento = r.seguimiento || {
                    id: 0, // 0 indicates new
                    id_detalle_orden_trabajo: detalleId,
                    fecha_recepcion: null,
                    encargado: '',
                    recibido: '',
                    entregado: ''
                };

                return {
                    ...r,
                    seguimiento: { ...currentSeguimiento, [field]: value } as SeguimientoRepuesto
                };
            }
            return r;
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            const promises = repuestos.map(async (r) => {
                // If no changes or no tracking info initiated, skip
                if (!r.seguimiento) return;

                // Ensure we send correct types
                const payload = {
                    id_detalle_orden_trabajo: r.id,
                    fecha_recepcion: r.seguimiento.fecha_recepcion,
                    encargado: r.seguimiento.encargado,
                    recibido: r.seguimiento.recibido,
                    entregado: r.seguimiento.entregado
                };

                if (r.seguimiento.id === 0) {
                    // Create only if it has some data
                    if (payload.fecha_recepcion || payload.encargado || payload.recibido || payload.entregado) {
                        await createSeguimiento(payload);
                    }
                } else {
                    // Update existing
                    await updateSeguimiento(r.seguimiento.id, payload);
                }
            });

            await Promise.all(promises);

            await Swal.fire({
                icon: 'success',
                title: 'Guardado',
                text: 'Información registrada exitosamente',
                timer: 1500,
                showConfirmButton: false
            });
            onClose();
        } catch (error: any) {
            console.error('Error details:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
            Swal.fire({
                icon: 'error',
                title: 'Error al Guardar',
                text: `No se pudieron guardar los cambios: ${errorMessage}`
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" id="repuestos-modal">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Package size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Seguimiento de Repuestos</h2>
                            <p className="text-blue-100 text-sm">Orden #{ordenId}</p>
                        </div>
                    </div>
                    {/* Botón de cerrar (X) removido por solicitud */}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : repuestos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400">
                            <Package size={48} className="mb-4 opacity-50" />
                            <p className="text-lg">No hay repuestos registrados en esta orden.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {repuestos.map((item) => (
                                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Item Info */}
                                        <div className="flex-1 min-w-[300px]">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                                                    {item.detalle || item.precio_taller?.detalle || item.precio_seguro?.detalle || 'Repuesto sin nombre'}
                                                </h3>
                                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                                    Cant: {item.cantidad}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                                                {item.observaciones || ''}
                                            </p>
                                        </div>

                                        {/* Tracking Forms */}
                                        <div className="flex flex-wrap gap-4 items-end">
                                            {/* Fecha Recepción */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                                                    <Calendar size={14} /> Fecha Recepción
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all w-48"
                                                    value={item.seguimiento?.fecha_recepcion ? (() => {
                                                        const date = new Date(item.seguimiento.fecha_recepcion);
                                                        const offset = date.getTimezoneOffset() * 60000;
                                                        const localDate = new Date(date.getTime() - offset);
                                                        return localDate.toISOString().slice(0, 16);
                                                    })() : ''}
                                                    onChange={(e) => handleUpdateSeguimiento(item.id, 'fecha_recepcion', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                                />
                                            </div>

                                            {/* Encargado */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                                                    <User size={14} /> Encargado
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Nombre..."
                                                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all w-40"
                                                    value={item.seguimiento?.encargado || ''}
                                                    onChange={(e) => handleUpdateSeguimiento(item.id, 'encargado', e.target.value)}
                                                />
                                            </div>

                                            {/* Recibido Text Input */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                                                    <Check size={14} /> Recibido
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Detalle de recepción..."
                                                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all w-48"
                                                    value={item.seguimiento?.recibido || ''}
                                                    onChange={(e) => handleUpdateSeguimiento(item.id, 'recibido', e.target.value)}
                                                />
                                            </div>

                                            {/* Entregado Text Input */}
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                                                    <Truck size={14} /> Entregado
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Detalle de entrega..."
                                                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all w-48"
                                                    value={item.seguimiento?.entregado || ''}
                                                    onChange={(e) => handleUpdateSeguimiento(item.id, 'entregado', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <X size={18} />
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all font-medium flex items-center gap-2 transform active:scale-95"
                        >
                            <Save size={18} />
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrarRepuestosModal;
