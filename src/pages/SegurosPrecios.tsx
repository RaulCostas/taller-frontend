import { useEffect, useState } from 'react';

import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Banknote } from 'lucide-react';
import type { PrecioSeguro, CreatePrecioSeguroData } from '../types/precioSeguro';
import { getPreciosSeguros, createPrecioSeguro, updatePrecioSeguro, deletePrecioSeguro, reactivatePrecioSeguro } from '../services/precioSeguroService';
import { PrecioSeguroForm } from '../components/seguros/PrecioSeguroForm';
import Pagination from '../components/Pagination';
import ManualModal, { type ManualSection } from '../components/ManualModal';

const SegurosPrecios = () => {
    // const navigate = useNavigate();
    const [precios, setPrecios] = useState<PrecioSeguro[]>([]);
    const [filteredPrecios, setFilteredPrecios] = useState<PrecioSeguro[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingPrecio, setEditingPrecio] = useState<PrecioSeguro | null>(null);
    const [showManual, setShowManual] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchPrecios();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = precios.filter(p =>
            p.detalle?.toLowerCase().includes(lowerSearch) ||
            p.seguro?.seguro?.toLowerCase().includes(lowerSearch) ||
            p.categoria?.categoria_servicio?.toLowerCase().includes(lowerSearch)
        );
        setFilteredPrecios(filtered);
        setCurrentPage(1);
    }, [searchTerm, precios]);

    const fetchPrecios = async () => {
        try {
            setLoading(true);
            const data = await getPreciosSeguros();
            setPrecios(data);
            setFilteredPrecios(data);
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los precios'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: CreatePrecioSeguroData) => {
        try {
            if (editingPrecio) {
                await updatePrecioSeguro(editingPrecio.id, data);
                await Swal.fire({
                    icon: 'success',
                    title: 'Actualizado',
                    text: 'Precio actualizado correctamente',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                await createPrecioSeguro(data);
                await Swal.fire({
                    icon: 'success',
                    title: 'Creado',
                    text: 'Precio creado correctamente',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
            setShowModal(false);
            setEditingPrecio(null);
            fetchPrecios();
        } catch (error: any) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error al guardar el precio'
            });
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Desactivar precio?',
            text: 'Pasará a estado inactivo',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deletePrecioSeguro(id);
                setPrecios(precios.map(p => p.id === id ? { ...p, estado: 'inactivo' } : p));
                await Swal.fire({
                    icon: 'success',
                    title: '¡Desactivado!',
                    text: 'Precio desactivado exitosamente.',
                    showConfirmButton: false,
                    timer: 1500
                });
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo desactivar'
                });
            }
        }
    };

    const handleReactivate = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Reactivar precio?',
            text: 'Volverá a estar activo',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await reactivatePrecioSeguro(id);
                setPrecios(precios.map(p => p.id === id ? { ...p, estado: 'activo' } : p));
                await Swal.fire({
                    icon: 'success',
                    title: '¡Reactivado!',
                    text: 'Precio reactivado exitosamente.',
                    showConfirmButton: false,
                    timer: 1500
                });
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo reactivar'
                });
            }
        }
    };

    const openCreateModal = () => {
        setEditingPrecio(null);
        setShowModal(true);
    };

    const openEditModal = (precio: PrecioSeguro) => {
        setEditingPrecio(precio);
        setShowModal(true);
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredPrecios.map(p => ({
            'Seguro': p.seguro?.seguro || '',
            'Categoría': p.categoria?.categoria_servicio || '',
            'Detalle': p.detalle,
            'Nivel 1': p.nivel1,
            'Nivel 2': p.nivel2,
            'Nivel 3': p.nivel3,
            'Moneda': p.moneda,
            'Estado': p.estado
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "PreciosSeguros");
        XLSX.writeFile(workbook, `PreciosSeguros_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setTextColor(52, 152, 219);
        doc.text('Lista de Precios de Seguros', 14, 22);

        doc.setLineWidth(0.5);
        doc.setDrawColor(52, 152, 219);
        doc.line(14, 25, 196, 25);

        autoTable(doc, {
            startY: 30,
            head: [['Seguro', 'Categoría', 'Detalle', 'N1', 'N2', 'N3', 'Moneda', 'Estado']],
            body: filteredPrecios.map(p => [
                p.seguro?.seguro || '',
                p.categoria?.categoria_servicio || '',
                p.detalle,
                p.nivel1,
                p.nivel2,
                p.nivel3,
                p.moneda || '',
                p.estado
            ]),
            headStyles: { fillColor: [52, 152, 219] },
            alternateRowStyles: { fillColor: [240, 248, 255] },
        });
        doc.save(`PreciosSeguros_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const printList = () => {
        window.print();
    };

    const manualSections: ManualSection[] = [
        { title: 'Gestión de Precios', content: 'Administre los precios por seguro y categoría.' },
        { title: 'Niveles', content: 'Puede definir hasta 3 niveles de precios, además de costos de pintado e instalación.' }
    ];

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPrecios.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPrecios.length / itemsPerPage);

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="container mx-auto relative min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 no-print">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                            <Banknote className="text-green-600" size={32} />
                            Lista de Precios
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Configura el tarifario de servicios por seguro y categoría</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="relative group">
                            <button
                                onClick={exportToExcel}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-center gap-1 min-w-[60px]"
                                title="Exportar a Excel"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="8" y1="13" x2="16" y2="13"></line>
                                    <line x1="8" y1="17" x2="16" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <span className="text-[10px] font-semibold">Excel</span>
                            </button>
                        </div>

                        <div className="relative group">
                            <button
                                onClick={exportToPDF}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-center gap-1 min-w-[60px]"
                                title="Exportar a PDF"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <span className="text-[10px] font-semibold">PDF</span>
                            </button>
                        </div>

                        <div className="relative group">
                            <button
                                onClick={printList}
                                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-center gap-1 min-w-[60px]"
                                title="Imprimir"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                    <rect x="6" y="14" width="12" height="8"></rect>
                                </svg>
                                <span className="text-[10px] font-semibold">Imprimir</span>
                            </button>
                        </div>

                        <div className="w-px h-10 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                        <button
                            onClick={openCreateModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 font-medium"
                        >
                            <span>+</span> Nuevo Precio
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-6 flex items-center gap-2 no-print">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por detalle, seguro o categoría..."
                        className="w-full md:w-96 pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors border border-red-200 shadow-sm"
                        title="Limpiar búsqueda"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Contador de registros detallado */}
            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Mostrando {filteredPrecios.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredPrecios.length)} de {filteredPrecios.length} registros
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">#</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seguro</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoría</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalle</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nivel 1</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nivel 2</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nivel 3</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pintado</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instalación</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right no-print">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {currentItems.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 text-gray-500 dark:text-gray-400 font-mono text-sm">
                                        {indexOfFirstItem + index + 1}
                                    </td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200 font-medium">{item.seguro?.seguro || 'N/A'}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{item.categoria?.categoria_servicio || 'N/A'}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{item.detalle}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{item.nivel1}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{item.nivel2}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{item.nivel3}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{item.pintado}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{item.instalacion}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${item.estado === 'activo'
                                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                            : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                            }`}>
                                            {item.estado}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-2 justify-end no-print">
                                        <button
                                            onClick={() => openEditModal(item)}
                                            className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        {item.estado === 'activo' ? (
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Desactivar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                                </svg>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleReactivate(item.id)}
                                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Reactivar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredPrecios.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="font-medium">
                                                {searchTerm ? 'No se encontraron resultados' : 'No hay precios registrados'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
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
                title="Manual de Precios"
                sections={manualSections}
            />

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100">
                        <PrecioSeguroForm
                            initialData={editingPrecio}
                            onSubmit={handleSave}
                            onCancel={() => { setShowModal(false); setEditingPrecio(null); }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SegurosPrecios;
