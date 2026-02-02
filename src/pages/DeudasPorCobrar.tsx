import { useState, useEffect } from 'react';
import { Search, User, AlertCircle, FileText, Shield, DollarSign } from 'lucide-react';
import api from '../services/api';
import type { OrdenTrabajo } from '../types/ordenTrabajo';
import Pagination from '../components/Pagination';
import ManualModal, { type ManualSection } from '../components/ManualModal';

// Extend OrdenTrabajo to include the extra fields returned by the endpoint
interface DeudaOrden extends OrdenTrabajo {
    total_pagado: number;
    saldo: number;
    pagos: any[];
}

const DeudasPorCobrar = () => {
    const [ordenes, setOrdenes] = useState<DeudaOrden[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Particular' | 'Seguro'>('Particular');
    const [searchTerm, setSearchTerm] = useState('');
    const [showManual, setShowManual] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchDeudas();
    }, []);

    const fetchDeudas = async () => {
        try {
            setLoading(true);
            const response = await api.get<DeudaOrden[]>('/pago-orden/ordenes-con-saldo');
            setOrdenes(response.data);
        } catch (error) {
            console.error('Error fetching deudas:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const filteredOrdenes = ordenes.filter(orden => {
        const matchesTab = orden.particular_seguro === activeTab;
        if (!matchesTab) return false;

        const lowerSearch = searchTerm.toLowerCase();
        const matchesSearch =
            orden.cliente.toLowerCase().includes(lowerSearch) ||
            orden.placa.toLowerCase().includes(lowerSearch) ||
            (orden.marca_auto?.marca || '').toLowerCase().includes(lowerSearch) ||
            (orden.modelo || '').toLowerCase().includes(lowerSearch) ||
            (orden.seguro?.seguro || '').toLowerCase().includes(lowerSearch);

        return matchesSearch;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrdenes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrdenes.length / itemsPerPage);

    const manualSections: ManualSection[] = [
        { title: 'Deudas por Cobrar', content: 'Este módulo muestra todas las órdenes de trabajo que tienen saldo pendiente.' },
        { title: 'Pestañas', content: 'Utilice las pestañas "Particulares" y "Seguros" para filtrar la lista según el tipo de cliente.' },
        { title: 'Búsqueda', content: 'Puede buscar por nombre de cliente, placa, marca, modelo o nombre del seguro.' },
        { title: 'Información', content: 'La tabla muestra el total de la orden, lo que se ha pagado hasta el momento y el saldo restante.' }
    ];

    const formatCurrency = (amount: number, currency: string) => {
        const symbol = currency === 'Dólares' ? '$us' : 'Bs';
        return `${symbol} ${Number(amount).toFixed(2)}`;
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <FileText className="text-red-600" size={32} />
                        Deudas por Cobrar
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Visualiza y gestiona las cuentas pendientes ({activeTab === 'Particular' ? 'Particulares' : 'Seguros'})
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    {/* Refresh Button */}
                    <button
                        onClick={fetchDeudas}
                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all transform hover:-translate-y-1"
                        title="Actualizar lista"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-6">
                <button
                    className={`nav-btn px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-sm ${activeTab === 'Particular'
                        ? 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none translate-y-[-1px]'
                        : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-700'
                        }`}
                    onClick={() => { setActiveTab('Particular'); setCurrentPage(1); }}
                >
                    <User size={18} />
                    Particulares
                </button>
                <button
                    className={`nav-btn px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-sm ${activeTab === 'Seguro'
                        ? 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none translate-y-[-1px]'
                        : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-700'
                        }`}
                    onClick={() => { setActiveTab('Seguro'); setCurrentPage(1); }}
                >
                    <Shield size={18} />
                    Seguros
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 flex items-center gap-2">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por cliente, placa, marca o seguro..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Info Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Deuda ({activeTab})</p>
                        <p className="text-2xl font-bold text-red-600">
                            Bs {filteredOrdenes.reduce((acc, curr) => {
                                // Simple sum assuming conversion handled or just display raw. 
                                // Ideally converting dollar to boliviano if needed, but for 'Total Deuda' let's just sum raw saldo considering most are in same currency or just an approximation.
                                // Actually, let's just show count. Summing mixed currencies is tricky without current rate.
                                return acc + (curr.moneda === 'Bolivianos' ? Number(curr.saldo) : Number(curr.saldo) * 6.96); // Approx exchange rate
                            }, 0).toFixed(2)}
                        </p>
                    </div>
                    <div className="p-3 bg-red-100 text-red-600 rounded-full">
                        <DollarSign size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Órdenes Pendientes</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{filteredOrdenes.length}</p>
                    </div>
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                        <FileText size={24} />
                    </div>
                </div>
            </div>

            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Mostrando {filteredOrdenes.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrdenes.length)} de {filteredOrdenes.length} registros
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16"># Orden</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {activeTab === 'Seguro' ? 'Seguro / Inspector' : 'Cliente'}
                                </th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehículo</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Total</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Pagado</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Saldo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">Cargando...</td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                                            <p>No hay deudas pendientes en esta categoría</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((orden) => (
                                    <tr key={orden.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 text-gray-500 dark:text-gray-400 font-mono text-sm">#{orden.id}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-200 text-sm">
                                            {new Date(orden.fecha_registro).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-200">
                                            <div className="font-medium">
                                                {activeTab === 'Seguro' ? (orden.seguro?.seguro || 'N/A') : orden.cliente}
                                            </div>
                                            {activeTab === 'Seguro' && (
                                                <div className="text-xs text-gray-500">{orden.inspector?.inspector}</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-200">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">{orden.placa}</span>
                                                <span className="text-xs text-gray-500">{orden.marca_auto?.marca} {orden.modelo}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-200 text-right font-medium">
                                            {formatCurrency(orden.total, orden.moneda)}
                                        </td>
                                        <td className="p-4 text-green-600 dark:text-green-400 text-right font-medium">
                                            {formatCurrency(orden.total_pagado, orden.moneda)}
                                        </td>
                                        <td className="p-4 text-red-600 dark:text-red-400 text-right font-bold">
                                            {formatCurrency(orden.saldo, orden.moneda)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual - Deudas por Cobrar"
                sections={manualSections}
            />
        </div>
    );
};

export default DeudasPorCobrar;
