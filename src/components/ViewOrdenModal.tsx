import { User, FileText, Car } from 'lucide-react';
import type { OrdenTrabajo } from '../types/ordenTrabajo';
import type { DetalleOrdenTrabajo } from '../types/detalleOrdenTrabajo';

interface ViewOrdenModalProps {
    orden: OrdenTrabajo | null;
    detalles: DetalleOrdenTrabajo[];
    onClose: () => void;
}

const ViewOrdenModal = ({ orden, detalles, onClose }: ViewOrdenModalProps) => {
    if (!orden) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl z-10">
                    <div>
                        <h2 className="text-2xl font-bold">Orden de Trabajo #{orden.id}</h2>
                        <p className="text-blue-100 text-sm mt-1">
                            Fecha: {new Date(orden.fecha_registro).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Información del Vehículo */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Car size={20} className="text-blue-600" />
                            Información del Vehículo
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Placa</label>
                                <p className="text-gray-900 dark:text-white font-mono font-bold text-lg">{orden.placa}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Marca</label>
                                <p className="text-gray-900 dark:text-white">{orden.marca_auto?.marca || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Modelo</label>
                                <p className="text-gray-900 dark:text-white">{orden.modelo}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</label>
                                <p className="text-gray-900 dark:text-white">{orden.tipo_vehiculo?.tipo || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Color</label>
                                <p className="text-gray-900 dark:text-white">{orden.color || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Año</label>
                                <p className="text-gray-900 dark:text-white">{orden.anio || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Información del Cliente */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <User size={20} className="text-blue-600" />
                            Información del Cliente
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</label>
                                <p className="text-gray-900 dark:text-white font-medium">{orden.cliente}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Celular</label>
                                <p className="text-gray-900 dark:text-white">{orden.celular || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Correo</label>
                                <p className="text-gray-900 dark:text-white">{orden.correo || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">NIT</label>
                                <p className="text-gray-900 dark:text-white">{orden.nit || 'N/A'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Dirección</label>
                                <p className="text-gray-900 dark:text-white">{orden.direccion || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Información del Seguro (si aplica) */}
                    {orden.particular_seguro === 'Seguro' && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-blue-600" />
                                Información del Seguro
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Seguro</label>
                                    <p className="text-gray-900 dark:text-white">{orden.seguro?.seguro || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Inspector</label>
                                    <p className="text-gray-900 dark:text-white">{orden.inspector?.inspector || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detalles de Trabajo */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-blue-600" />
                            Trabajos Realizados
                        </h3>
                        {detalles.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-600">
                                            <th className="text-left p-2 text-gray-600 dark:text-gray-300">#</th>
                                            <th className="text-left p-2 text-gray-600 dark:text-gray-300">Detalle</th>
                                            <th className="text-left p-2 text-gray-600 dark:text-gray-300">Observaciones</th>
                                            <th className="text-center p-2 text-gray-600 dark:text-gray-300">Nivel</th>
                                            <th className="text-center p-2 text-gray-600 dark:text-gray-300">Cant.</th>
                                            <th className="text-right p-2 text-gray-600 dark:text-gray-300">P. Unit.</th>
                                            <th className="text-right p-2 text-gray-600 dark:text-gray-300">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detalles.map((detalle, index) => {
                                            const hasSeguimiento = detalle.seguimiento && (detalle.seguimiento.fecha_recepcion || detalle.seguimiento.encargado || detalle.seguimiento.recibido || detalle.seguimiento.entregado);
                                            return (
                                                <tr key={detalle.id} className={`border - b border - gray - 100 dark: border - gray - 600 / 50 ${hasSeguimiento ? 'bg-green-100 dark:bg-green-900/40 border-l-4 border-l-green-500' : ''} `}>
                                                    <td className="p-2 text-gray-700 dark:text-gray-300">{index + 1}</td>
                                                    <td className="p-2 text-gray-700 dark:text-gray-300">{detalle.detalle || 'N/A'}</td>
                                                    <td className="p-2 text-gray-700 dark:text-gray-300">{detalle.observaciones || '-'}</td>
                                                    <td className="p-2 text-center text-gray-700 dark:text-gray-300">{detalle.nivel || '-'}</td>
                                                    <td className="p-2 text-center text-gray-700 dark:text-gray-300">{detalle.cantidad}</td>
                                                    <td className="p-2 text-right text-gray-700 dark:text-gray-300">{Number(detalle.precio_unitario).toFixed(2)}</td>
                                                    <td className="p-2 text-right font-bold text-gray-900 dark:text-white">{Number(detalle.total).toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay trabajos registrados</p>
                        )}
                    </div>

                    {/* Resumen Financiero */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Moneda</label>
                                <p className="text-gray-900 dark:text-white font-medium">{orden.moneda}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Subtotal</label>
                                <p className="text-gray-900 dark:text-white font-bold">{Number(orden.sub_total).toFixed(2)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Descuento</label>
                                <p className="text-gray-900 dark:text-white font-bold">{Number(orden.descuento).toFixed(2)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</label>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Number(orden.total).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Observaciones */}
                    {orden.observaciones && (
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Observaciones</h3>
                            <p className="text-gray-900 dark:text-white">{orden.observaciones}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-100 dark:bg-gray-700/50 p-4 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewOrdenModal;
