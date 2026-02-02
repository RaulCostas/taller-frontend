import { useEffect, useState } from 'react';
import { DollarSign, Search, CheckCircle, Clock, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import type { MaterialPedido } from '../types/materialPedido';
import { getMaterialPedidos } from '../services/materialPedidoService';
import { getPagoPedidos } from '../services/pagoPedidoService';
import PagoPedidoModal from '../components/PagoPedidoModal';
import MaterialPedidoModal from './MaterialPedidoModal';

// Define Interface for PagoPedido since it might not be in a shared type file yet
interface PagoPedido {
    id: number;
    fecha: string;
    factura: string;
    recibo: string;
    moneda: string;
    tc?: number;
    material_pedido: MaterialPedido;
    usuario: { id: number; name: string };
    forma_pago: { id: number; forma_pago: string };
}

const ProveedoresPagos = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [pendingOrders, setPendingOrders] = useState<MaterialPedido[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<PagoPedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPedidoForPayment, setSelectedPedidoForPayment] = useState<MaterialPedido | null>(null);

    // Order Details Modal State
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'pending') {
                const data = await getMaterialPedidos();
                // Filter for unpaid orders
                setPendingOrders(data.filter((p: any) => !p.pagado && p.estado === 'activo'));
            } else {
                const data = await getPagoPedidos();
                setPaymentHistory(data);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePay = (pedido: MaterialPedido) => {
        setSelectedPedidoForPayment(pedido);
        setIsPaymentModalOpen(true);
    };

    const handleViewOrder = (id: number) => {
        setSelectedOrderId(id);
        setIsOrderModalOpen(true);
    };

    const handlePaymentSuccess = () => {
        loadData(); // Reload current tab data
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString();
    };

    const filteredPending = pendingOrders.filter(p =>
        p.proveedor.proveedor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredHistory = paymentHistory.filter(p =>
        p.material_pedido?.proveedor?.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.factura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.recibo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentListLength = activeTab === 'pending' ? filteredPending.length : filteredHistory.length;

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <DollarSign className="text-green-600" size={32} />
                        Pago a Proveedores
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los pagos pendientes y revisa el historial</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-700/50 p-1 mb-6 max-w-md">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-offset-2 focus:outline-none focus:ring-2 transition-all duration-200 border-0
                        ${activeTab === 'pending'
                            ? 'bg-blue-600 text-white shadow-md ring-white/60 ring-offset-blue-400'
                            : 'bg-transparent text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Clock size={16} />
                        Pendientes ({pendingOrders.length})
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-offset-2 focus:outline-none focus:ring-2 transition-all duration-200 border-0
                        ${activeTab === 'history'
                            ? 'bg-blue-600 text-white shadow-md ring-white/60 ring-offset-blue-400'
                            : 'bg-transparent text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <CheckCircle size={16} />
                        Historial
                    </div>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[400px]">
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={activeTab === 'pending' ? "Buscar por proveedor..." : "Buscar por proveedor, factura o recibo..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                    Mostrando {currentListLength === 0 ? 0 : 1} - {currentListLength} de {currentListLength} registros
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="p-4">#</th>
                                    <th className="p-4">Fecha {activeTab === 'history' ? 'Pago' : 'Pedido'}</th>
                                    <th className="p-4">Proveedor</th>
                                    {activeTab === 'history' && <th className="p-4">Documento</th>}
                                    <th className="p-4 text-right">Monto</th>
                                    {activeTab === 'history' && <th className="p-4">Forma Pago</th>}
                                    <th className="p-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {activeTab === 'pending' ? (
                                    filteredPending.length > 0 ? (
                                        filteredPending.map((pedido, index) => (
                                            <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="p-4 text-gray-900 dark:text-gray-200 font-medium">{index + 1}</td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300">
                                                    {formatDate(pedido.fecha)}
                                                </td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{pedido.proveedor.proveedor}</td>
                                                <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                                                    {Number(pedido.total).toFixed(2)} Bs
                                                </td>
                                                <td className="p-4 flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewOrder(pedido.id)}
                                                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                                        title="Ver Detalle"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePay(pedido)}
                                                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                                        title="Registrar Pago"
                                                    >
                                                        <DollarSign size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col items-center gap-3">
                                                    <CheckCircle size={48} className="text-green-200 dark:text-green-900" />
                                                    <p className="text-lg">¡Al día! No tienes pagos pendientes.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                ) : (
                                    filteredHistory.length > 0 ? (
                                        filteredHistory.map((pago, index) => (
                                            <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="p-4 text-gray-900 dark:text-gray-200 font-medium">{index + 1}</td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300">
                                                    {formatDate(pago.fecha)}
                                                </td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">
                                                    {pago.material_pedido?.proveedor?.proveedor || 'N/A'}
                                                </td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300">
                                                    <div className="flex flex-col text-sm">
                                                        {pago.factura && <span>F: {pago.factura}</span>}
                                                        {pago.recibo && <span>R: {pago.recibo}</span>}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                                                    {Number(pago.material_pedido?.total || 0).toFixed(2)} Bs
                                                    {pago.moneda === 'Dólares' && (
                                                        <span className="block text-xs text-green-600 font-normal">
                                                            (Pagado en USD)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300 text-sm">
                                                    {pago.forma_pago?.forma_pago}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => pago.material_pedido && handleViewOrder(pago.material_pedido.id)}
                                                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                                        title="Ver Detalle del Pedido"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                                No hay historial de pagos registrado.
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                {activeTab === 'pending' && filteredPending.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800 flex justify-end items-center">
                        <span className="text-gray-600 dark:text-gray-300 font-semibold mr-4">Total Deuda:</span>
                        <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {filteredPending.reduce((sum, p) => sum + Number(p.total), 0).toFixed(2)} Bs
                        </span>
                    </div>
                )}
            </div>

            <PagoPedidoModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onPaymentSuccess={handlePaymentSuccess}
                pedido={selectedPedidoForPayment}
            />

            <MaterialPedidoModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                onSuccess={() => { }} // Read only, so success doesn't matter much
                orderId={selectedOrderId}
                readOnly={true}
            />
        </div >
    );
};


export default ProveedoresPagos;
