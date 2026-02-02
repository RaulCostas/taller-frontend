import { useEffect, useState } from 'react';
import { getInventarios } from '../services/inventarioService';
import { getOrdenesTrabajo, updateOrdenTrabajo, getOrdenTrabajo } from '../services/ordenTrabajoService';
import { getDetallesByOrden } from '../services/detalleOrdenTrabajoService';
import type { Inventario } from '../types/inventario';
import type { OrdenTrabajo } from '../types/ordenTrabajo';
import type { DetalleOrdenTrabajo } from '../types/detalleOrdenTrabajo';
import { AlertTriangle, CheckCircle, LayoutDashboard, Timer, Eye, Landmark, DollarSign, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api';
import ViewOrdenModal from '../components/ViewOrdenModal';

interface GastoFijo {
    id: number;
    gasto_fijo: string;
    monto: number;
    moneda: string;
    dia: number;
    destino: string;
    estado: string;
    paid?: boolean;
}

const Home = () => {
    const [lowStockItems, setLowStockItems] = useState<Inventario[]>([]);
    const [inProgressOrders, setInProgressOrders] = useState<OrdenTrabajo[]>([]);
    const [todayExpenses, setTodayExpenses] = useState<GastoFijo[]>([]);
    const [loading, setLoading] = useState(true);

    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedOrden, setSelectedOrden] = useState<OrdenTrabajo | null>(null);
    const [ordenDetalles, setOrdenDetalles] = useState<DetalleOrdenTrabajo[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const now = new Date();
                const todayDay = now.getDate();
                const currentMonth = now.getMonth() + 1;
                const currentYear = now.getFullYear();

                // Define month range for payments
                const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
                const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

                const [inventariosData, ordenesData, gastosData, pagosData] = await Promise.all([
                    getInventarios(),
                    getOrdenesTrabajo(),
                    api.get('/gastos-fijos'),
                    api.get(`/pagos-gastos-fijos?startDate=${startDate}&endDate=${endDate}`)
                ]);

                // Filter Low Stock
                const lowStock = inventariosData.filter(item =>
                    item.estado === 'activo' &&
                    item.cantidad_existente <= item.stock_minimo
                );
                setLowStockItems(lowStock);

                // Filter In Progress Orders
                const inProgress = ordenesData
                    .filter(order => order.estado === 'en_proceso')
                    .sort((a, b) => new Date(b.fecha_inicio || '').getTime() - new Date(a.fecha_inicio || '').getTime());
                setInProgressOrders(inProgress);

                // Filter Today's Fixed Expenses and check if paid this month
                const pagosList = Array.isArray(pagosData.data) ? pagosData.data : [];
                const expenses = (gastosData.data as GastoFijo[])
                    .filter(g => g.estado === 'activo' && g.dia === todayDay)
                    .map(g => {
                        const isPaid = pagosList.some((p: any) =>
                            p.gastoFijoId === g.id ||
                            p.gasto_fijo_id === g.id ||
                            p.idgasto_fijo === g.id ||
                            p.gastoFijo?.id === g.id
                        );
                        return { ...g, paid: isPaid };
                    });
                setTodayExpenses(expenses);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleViewWorks = async (id: number) => {
        try {
            const [ordenData, detallesData] = await Promise.all([
                getOrdenTrabajo(id),
                getDetallesByOrden(id)
            ]);
            setSelectedOrden(ordenData);
            setOrdenDetalles(detallesData);
            setShowViewModal(true);
        } catch (error) {
            console.error('Error loading order details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los detalles de la orden'
            });
        }
    };

    const handleFinishWork = async (id: number) => {
        const now = new Date();
        const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

        await Swal.fire({
            title: 'Finalizar Trabajo',
            html: `
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2 text-left">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Finalización</label>
                        <div class="relative flex items-center">
                            <span class="absolute left-3 text-gray-400">
                               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </span>
                            <input type="datetime-local" id="swal-date" class="swal2-input pl-10 h-10" style="padding-left: 2.5rem; width: 100%; box-sizing: border-box; margin: 0;" value="${localIso}" />
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-2">
                         <button id="swal-cancel-btn" class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 font-medium flex items-center gap-2">
                            Cancelar
                        </button>
                        <button id="swal-confirm-btn" class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 font-medium flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Finalizar
                        </button>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCancelButton: false,
            focusConfirm: false,
            didOpen: () => {
                const confirmBtn = document.getElementById('swal-confirm-btn');
                const cancelBtn = document.getElementById('swal-cancel-btn');
                const dateInput = document.getElementById('swal-date') as HTMLInputElement;

                if (confirmBtn && dateInput) {
                    confirmBtn.addEventListener('click', async () => {
                        const date = dateInput.value;
                        if (date) {
                            Swal.close();
                            try {
                                await updateOrdenTrabajo(id, {
                                    estado: 'terminado',
                                    fecha_fin: new Date(date).toISOString(),
                                    idusuario: "1"
                                } as any);

                                setInProgressOrders(current => current.filter(o => o.id !== id));

                                await Swal.fire({
                                    icon: 'success',
                                    title: '¡Trabajo Finalizado!',
                                    text: 'La orden ha sido marcada como terminada.',
                                    timer: 1500,
                                    showConfirmButton: false
                                });
                            } catch (error) {
                                console.error(error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'No se pudo finalizar la orden'
                                });
                            }
                        }
                    });
                }

                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        Swal.close();
                    });
                }
            }
        });
    };



    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500 dark:text-gray-400">Cargando Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <LayoutDashboard className="text-blue-600" size={32} />
                    Panel Principal
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Resumen general del estado del taller</p>
            </div>

            {/* Órdenes en Proceso */}
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Timer className="text-blue-600" size={20} />
                        Órdenes En Proceso
                    </h2>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                        {inProgressOrders.length}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3 font-semibold">N° Orden</th>
                                <th className="px-6 py-3 font-semibold">Placa</th>
                                <th className="px-6 py-3 font-semibold">Marca/Modelo</th>
                                <th className="px-6 py-3 font-semibold">Tipo</th>
                                <th className="px-6 py-3 font-semibold">Cliente</th>
                                <th className="px-6 py-3 font-semibold">Fecha Inicio</th>
                                <th className="px-6 py-3 font-semibold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {inProgressOrders.length > 0 ? (
                                inProgressOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                                            #{order.id}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium text-gray-900 dark:text-gray-200">
                                            {order.placa}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                            {order.marca_auto?.marca || '-'} {order.modelo}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.particular_seguro === 'Seguro'
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}>
                                                {order.particular_seguro}
                                            </span>
                                            {order.particular_seguro === 'Seguro' && order.seguro && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {order.seguro.seguro}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                            {order.cliente}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                            {order.fecha_inicio ? new Date(order.fecha_inicio).toLocaleDateString() + ' ' + new Date(order.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 flex gap-2 justify-center">
                                            <button
                                                onClick={() => handleViewWorks(order.id)}
                                                className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                                                title="Ver Trabajos"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleFinishWork(order.id)}
                                                className="p-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
                                                title="Finalizar Trabajo"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No hay órdenes en proceso actualmente
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Alertas de Stock */}
            {lowStockItems.length > 0 ? (
                <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 bg-red-100 dark:bg-red-900/40 border-b border-red-200 dark:border-red-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-200 dark:bg-red-800 rounded-full">
                                <AlertTriangle className="h-6 w-6 text-red-700 dark:text-red-200" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-red-800 dark:text-red-200">
                                    Alerta de Stock Bajo
                                </h2>
                                <p className="text-sm text-red-600 dark:text-red-300">
                                    Hay {lowStockItems.length} items con stock crítico.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-red-50 dark:bg-red-900/20 text-xs uppercase text-red-800 dark:text-red-300">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Item</th>
                                    <th className="px-6 py-3 font-semibold">Grupo</th>
                                    <th className="px-6 py-3 font-semibold text-right">Stock Actual</th>
                                    <th className="px-6 py-3 font-semibold text-right">Mínimo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-red-100 dark:divide-red-800">
                                {lowStockItems.map(item => (
                                    <tr key={item.id} className="hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                                            {item.descripcion}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                            {item.grupo_inventario?.grupo || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-red-600 dark:text-red-400">
                                            {item.cantidad_existente}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">
                                            {item.stock_minimo}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-green-800 dark:text-green-200">
                            Inventario Saludable
                        </h2>
                        <p className="text-green-600 dark:text-green-300">
                            No hay items con stock bajo en este momento.
                        </p>
                    </div>
                </div>
            )}
            {showViewModal && (
                <ViewOrdenModal
                    orden={selectedOrden}
                    detalles={ordenDetalles}
                    onClose={() => setShowViewModal(false)}
                />
            )}

            {/* Gastos Fijos Programados para Hoy */}
            <div className="mt-8 mb-8 pb-12">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                                <Landmark className="text-indigo-600 dark:text-indigo-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                                    Gastos Fijos Programados para Hoy
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Gastos recurrentes con vencimiento el día {new Date().getDate()}
                                </p>
                            </div>
                        </div>
                        <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-indigo-900 dark:text-indigo-300">
                            {todayExpenses.length}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Concepto</th>
                                    <th className="px-6 py-3 font-semibold">Destino</th>
                                    <th className="px-6 py-3 font-semibold text-right">Monto</th>
                                    <th className="px-6 py-3 font-semibold">Moneda</th>
                                    <th className="px-6 py-3 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {todayExpenses.length > 0 ? (
                                    todayExpenses.map(gasto => (
                                        <tr key={gasto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                                                {gasto.gasto_fijo}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${gasto.destino === 'Taller'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                    }`}>
                                                    {gasto.destino}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-gray-100">
                                                {Number(gasto.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
                                                {gasto.moneda === 'Bolivianos' ? 'Bs.' : '$us.'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {gasto.paid ? (
                                                    <div className="flex items-center justify-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 py-1 px-3 rounded-full border border-green-100 dark:border-green-800/50">
                                                        <CheckCircle size={14} />
                                                        Pagado
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 py-1 px-3 rounded-full border border-amber-100 dark:border-amber-800/50">
                                                        <Calendar size={14} />
                                                        Pendiente
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-full">
                                                    <CheckCircle className="h-6 w-6 text-gray-400" />
                                                </div>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                    No hay gastos fijos programados para el día {new Date().getDate()}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
