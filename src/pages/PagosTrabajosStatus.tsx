import { useState, useEffect } from 'react';
import { Search, Calendar, User, Filter, AlertCircle, FileCheck, ClipboardList, Printer, RotateCcw } from 'lucide-react';
import { getTrabajosAsignadosFilter } from '../services/trabajosAsignadosService';
import type { TrabajoAsignado } from '../services/trabajosAsignadosService';
import { getPersonal } from '../services/personalService';
import type { Personal } from '../types/personal';
import ManualModal, { type ManualSection } from '../components/ManualModal';

const PagosTrabajosStatus = () => {
    // State
    const [trabajos, setTrabajos] = useState<TrabajoAsignado[]>([]);
    const [personalList, setPersonalList] = useState<Personal[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'cancelados' | 'no_cancelados'>('no_cancelados');
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        { title: 'Filtrado', content: 'Use los filtros de Personal, Fechas y Estado para buscar trabajos específicos.' },
        { title: 'Estados de Pago', content: 'Cambie entre las pestañas "Cancelados" y "No Cancelados" para ver el estado de pago.' },
        { title: 'Impresión', content: 'Use el botón "Imprimir" para generar una vista imprimible de la lista actual.' }
    ];

    // Filters
    const [selectedPersonal, setSelectedPersonal] = useState<string>('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [terminado, setTerminado] = useState<'true' | 'false' | ''>('');

    // Fetch Personal on mount
    useEffect(() => {
        fetchPersonal();
        handleSearch(); // Load all on start
    }, []);

    const fetchPersonal = async () => {
        try {
            const data = await getPersonal();
            if (Array.isArray(data)) {
                setPersonalList(data);
            } else {
                console.error('Data received from getPersonal is not an array:', data);
                setPersonalList([]);
            }
        } catch (error) {
            console.error('Error fetching personal:', error);
            setPersonalList([]);
        }
    };

    const handleReset = () => {
        setSelectedPersonal('');
        setFechaInicio('');
        setFechaFin('');
        setTerminado('');

        setLoading(true);
        // Call with empty filters to reset list
        getTrabajosAsignadosFilter({})
            .then(data => {
                if (Array.isArray(data)) {
                    setTrabajos(data);
                } else {
                    setTrabajos([]);
                }
            })
            .catch(error => {
                console.error('Error resetting filters:', error);
                setTrabajos([]);
            })
            .finally(() => setLoading(false));
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const filters = {
                personalId: selectedPersonal ? Number(selectedPersonal) : undefined,
                fechaInicio: fechaInicio || undefined,
                fechaFin: fechaFin || undefined,
                terminado: terminado || undefined
            };
            const data = await getTrabajosAsignadosFilter(filters);
            if (Array.isArray(data)) {
                setTrabajos(data);
            } else {
                console.error('Data received from getTrabajosAsignadosFilter is not an array:', data);
                setTrabajos([]);
            }
        } catch (error) {
            console.error('Error fetching trabajos:', error);
            setTrabajos([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `Bs ${Number(amount || 0).toFixed(2)}`;
    };

    // Filtered data based on active tab
    const filteredTrabajos = trabajos.filter(t => {
        if (activeTab === 'cancelados') return t.cancelado;
        return !t.cancelado;
    });

    return (
        <div className="container mx-auto p-6 max-w-7xl min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <FileCheck className="text-green-600" size={32} />
                        Cancelados / No Cancelados
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Estado de pagos por trabajos asignados al personal.
                    </p>
                </div>
                <button
                    onClick={() => setShowManual(true)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Ayuda / Manual"
                >
                    ?
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div className="flex flex-col md:flex-row items-end gap-4">
                    {/* Personal */}
                    <div className="w-full md:w-1/4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <User size={14} /> Personal
                        </label>
                        <select
                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            value={selectedPersonal}
                            onChange={(e) => setSelectedPersonal(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {Array.isArray(personalList) && personalList.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre} {p.paterno}</option>
                            ))}
                        </select>
                    </div>

                    {/* Fecha Inicio */}
                    <div className="w-full md:w-1/4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <Calendar size={14} /> Desde
                        </label>
                        <input
                            type="date"
                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                    </div>

                    {/* Fecha Fin */}
                    <div className="w-full md:w-1/4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <Calendar size={14} /> Hasta
                        </label>
                        <input
                            type="date"
                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                        />
                    </div>

                    {/* Terminado - Work Status Filter (kept as requested originally, user might still want to filter by work status within payment status) */}
                    <div className="w-full md:w-1/5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <Filter size={14} /> Estado Trabajo
                        </label>
                        <select
                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            value={terminado}
                            onChange={(e) => setTerminado(e.target.value as any)}
                        >
                            <option value="">Todos</option>
                            <option value="true">Terminados</option>
                            <option value="false">Pendientes</option>
                        </select>
                    </div>

                    {/* Button */}
                    {/* Buttons */}
                    <div className="w-full md:w-auto flex gap-2">
                        <button
                            onClick={handleReset}
                            className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 font-medium rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 flex items-center justify-center p-2"
                            title="Limpiar filtros"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <button
                            onClick={handleSearch}
                            className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 hover:shadow-md flex items-center justify-center gap-2"
                        >
                            <Search size={18} />
                            Buscar
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex-1 md:flex-none px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 hover:shadow-md flex items-center justify-center gap-2"
                        >
                            <Printer size={18} />
                            Imprimir
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button
                    onClick={() => setActiveTab('cancelados')}
                    className={`
                        px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-sm
                        ${activeTab === 'cancelados'
                            ? 'bg-green-600 text-white shadow-md transform scale-[1.02]'
                            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
                    `}
                >
                    <ClipboardList size={18} />
                    Cancelados
                </button>
                <button
                    onClick={() => setActiveTab('no_cancelados')}
                    className={`
                        px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-sm
                        ${activeTab === 'no_cancelados'
                            ? 'bg-red-600 text-white shadow-md transform scale-[1.02]'
                            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
                    `}
                >
                    <AlertCircle size={18} />
                    No Cancelados
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                                {activeTab === 'cancelados' && (
                                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Pagado</th>
                                )}
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Asig.</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orden</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Placa</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marca/Modelo</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalle del Trabajo</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={activeTab === 'cancelados' ? 8 : 7} className="p-8 text-center text-gray-500">Cargando...</td>
                                </tr>
                            ) : (!filteredTrabajos || filteredTrabajos.length === 0) ? (
                                <tr>
                                    <td colSpan={activeTab === 'cancelados' ? 8 : 7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                                            <p>No se encontraron trabajos {activeTab === 'cancelados' ? 'cancelados' : 'pendientes'} con los filtros seleccionados.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTrabajos.map((trabajo, index) => (
                                    <tr key={trabajo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 text-gray-700 dark:text-gray-200 text-sm">
                                            {index + 1}
                                        </td>
                                        {activeTab === 'cancelados' && (
                                            <td className="p-4 text-gray-700 dark:text-gray-200 text-sm">
                                                {trabajo.pago_trabajo?.fecha_pago ? new Date(trabajo.pago_trabajo.fecha_pago).toLocaleDateString() : '-'}
                                            </td>
                                        )}
                                        <td className="p-4 text-gray-700 dark:text-gray-200 text-sm">
                                            {trabajo.fecha_asignado ? new Date(trabajo.fecha_asignado).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-200 text-sm">
                                            <span className="font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs">
                                                #{trabajo.detalle_orden_trabajo?.orden_trabajo?.id || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-200 text-sm font-bold">
                                            {trabajo.detalle_orden_trabajo?.orden_trabajo?.placa || '-'}
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-200 text-sm">
                                            <div className="text-xs">
                                                {trabajo.detalle_orden_trabajo?.orden_trabajo?.marca_auto?.marca}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {trabajo.detalle_orden_trabajo?.orden_trabajo?.modelo}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-200 text-sm">
                                            <div className="font-medium">{trabajo.detalle_orden_trabajo?.nivel || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">{trabajo.detalle_orden_trabajo?.detalle || '-'}</div>
                                        </td>
                                        <td className="p-4 text-right font-bold text-gray-700 dark:text-gray-200">
                                            {formatCurrency(trabajo.monto)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                Total Registros: {filteredTrabajos.length}
            </div>

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Usuario - Estado de Pagos"
                sections={manualSections}
            />
        </div>
    );
};

export default PagosTrabajosStatus;
