import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Download, Printer, CreditCard } from 'lucide-react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getEgresos, deleteEgreso } from '../../services/egresosService';
import type { Egreso } from '../../types/egreso';
import EgresoForm from './EgresoForm';
import CalendarWidget from '../CalendarWidget';
import ManualModal, { type ManualSection } from '../ManualModal';
import Pagination from '../Pagination';

const EgresoList = () => {
    const [egresos, setEgresos] = useState<Egreso[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(50);

    const [totals, setTotals] = useState<Record<string, { bolivianos: number; dolares: number }>>({});

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEgreso, setSelectedEgreso] = useState<Egreso | null>(null);
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        { title: 'Gestión de Egresos', content: 'Administre los egresos diarios del taller y casa, filtrando por fecha y detalle.' },
        { title: 'Filtrado', content: 'Use el calendario lateral para seleccionar un día específico o el rango de fechas para búsquedas más amplias.' },
        { title: 'Exportación', content: 'Puede exportar los datos visibles a Excel, PDF o imprimirlos directamente usando los botones superiores.' }
    ];

    useEffect(() => {
        loadEgresos();
    }, [startDate, endDate, currentPage, searchTerm]);

    const loadEgresos = async () => {
        setLoading(true);
        try {
            const response = await getEgresos({
                page: currentPage,
                limit,
                startDate,
                endDate,
                search: searchTerm
            });
            setEgresos(response.data);
            setTotalPages(response.totalPages);
            setTotalItems(response.total);
            setTotals(response.totals);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar los egresos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedEgreso(null);
        setIsModalOpen(true);
    };

    const handleEdit = (egreso: Egreso) => {
        setSelectedEgreso(egreso);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteEgreso(id);
                Swal.fire('Eliminado', 'El egreso ha sido eliminado.', 'success');
                loadEgresos();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo eliminar el egreso', 'error');
            }
        }
    };

    const handleDateSelect = (date: string) => {
        setStartDate(date);
        setEndDate(date);
    };

    const handleToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Reporte de Egresos Diarios', 14, 15);
        doc.setFontSize(10);
        doc.text(`Desde: ${startDate} Hasta: ${endDate}`, 14, 22);

        const tableColumn = ["Fecha", "Destino", "Detalle", "Monto", "Moneda", "Forma Pago"];
        const tableRows = egresos.map(egreso => [
            new Date(egreso.fecha + 'T12:00:00').toLocaleDateString(),
            egreso.destino,
            egreso.detalle,
            egreso.monto,
            egreso.moneda,
            egreso.formaPago?.forma_pago || ''
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
        });
        doc.save(`egresos_${startDate}_${endDate}.pdf`);
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(egresos.map(e => ({
            Fecha: new Date(e.fecha + 'T12:00:00').toLocaleDateString(),
            Destino: e.destino,
            Detalle: e.detalle,
            Monto: e.monto,
            Moneda: e.moneda,
            'Forma Pago': e.formaPago?.forma_pago || ''
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Egresos");
        XLSX.writeFile(wb, `egresos_${startDate}_${endDate}.xlsx`);
    };

    return (
        <div className="container mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar */}
                <div className="lg:col-span-1">
                    <CalendarWidget selectedDate={startDate === endDate ? startDate : ''} onDateSelect={handleDateSelect} />
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                                <CreditCard className="text-red-600" size={32} />
                                Lista de Egresos
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Administra los gastos y salidas de dinero</p>
                            <p className="text-blue-500 text-sm font-medium mt-1">
                                Del {new Date(startDate + 'T12:00:00').toLocaleDateString()}
                            </p>
                        </div>

                        <div className="flex gap-2 items-center flex-wrap">
                            <button
                                onClick={() => setShowManual(true)}
                                className="p-2 text-gray-500 hover:text-gray-700 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 w-9 h-9 flex items-center justify-center transition-colors font-bold"
                                title="Ayuda / Manual"
                            >
                                ?
                            </button>
                            <button
                                onClick={exportToExcel}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-center gap-1 min-w-[60px]"
                                title="Exportar a Excel"
                            >
                                <FileText size={20} />
                                <span className="text-[10px] font-semibold uppercase">Excel</span>
                            </button>
                            <button
                                onClick={exportToPDF}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-center gap-1 min-w-[60px]"
                                title="Exportar a PDF"
                            >
                                <Download size={20} />
                                <span className="text-[10px] font-semibold uppercase">PDF</span>
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-center gap-1 min-w-[60px]"
                                title="Imprimir"
                            >
                                <Printer size={20} />
                                <span className="text-[10px] font-semibold uppercase">Imprimir</span>
                            </button>

                            <div className="w-px h-10 bg-gray-300 dark:bg-gray-700 mx-2 hidden md:block"></div>

                            <button
                                onClick={handleCreate}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                            >
                                <Plus size={18} /> Nuevo Egreso
                            </button>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                            <div className="lg:col-span-6">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">Buscar por Detalle:</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Escribe para buscar..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Desde:</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Hasta:</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <button
                                    onClick={handleToday}
                                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Hoy
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Mostrando {egresos.length > 0 ? (currentPage - 1) * 50 + 1 : 0} - {Math.min(currentPage * 50, totalItems)} de {totalItems} registros
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">#</th>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Destino</th>
                                        <th className="px-6 py-4">Detalle</th>
                                        <th className="px-6 py-4">Monto</th>
                                        <th className="px-6 py-4">Moneda</th>
                                        <th className="px-6 py-4">Forma Pago</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {egresos.map((egreso, index) => (
                                        <tr key={egreso.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm">
                                                {new Date(egreso.fecha + 'T12:00:00').toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${egreso.destino === 'Taller' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {egreso.destino}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm max-w-xs truncate" title={egreso.detalle}>
                                                {egreso.detalle}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white font-bold text-sm">
                                                {Number(egreso.monto).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm uppercase">
                                                {egreso.moneda}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">
                                                {egreso.formaPago?.forma_pago}
                                            </td>
                                            <td className="px-6 py-4 flex gap-2 justify-center">
                                                <button
                                                    onClick={() => handleEdit(egreso)}
                                                    className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                    title="Editar"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(egreso.id)}
                                                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                    title="Eliminar"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {egresos.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="p-12 text-center text-gray-400 dark:text-gray-500">
                                                No hay egresos registrados para esta fecha o criterios de búsqueda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-sm uppercase">Totales por Forma de Pago (Según filtros)</h3>

                        {Object.keys(totals).length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                {Object.entries(totals).map(([fp, amounts]) => (
                                    <div key={fp} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <div className="font-bold text-gray-700 dark:text-gray-300 mb-2 truncate" title={fp}>{fp}</div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Bs:</span>
                                                <span className="font-mono font-bold text-gray-900 dark:text-white">{amounts.bolivianos.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">$us:</span>
                                                <span className="font-mono font-bold text-gray-900 dark:text-white">{amounts.dolares.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic text-sm">No hay totales para mostrar.</p>
                        )}
                    </div>
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <EgresoForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadEgresos}
                egreso={selectedEgreso}
            />

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Egresos Diarios"
                sections={manualSections}
            />

            {loading && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-[60]">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl flex items-center gap-3">
                        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-medium text-gray-700 dark:text-gray-200">Cargando...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EgresoList;
