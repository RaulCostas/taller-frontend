import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GrupoInventario, CreateGrupoInventarioData } from '../types/grupoInventario';
import { ArrowLeft, Boxes } from 'lucide-react';
import { getGruposInventario, deleteGrupoInventario, createGrupoInventario, updateGrupoInventario } from '../services/grupoInventarioService';
import { GrupoInventarioForm } from '../components/grupoInventario/GrupoInventarioForm';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from '../components/Pagination';
import ManualModal, { type ManualSection } from '../components/ManualModal';

const GrupoInventarioList = () => {
    const navigate = useNavigate();
    const [gruposInventario, setGruposInventario] = useState<GrupoInventario[]>([]);
    const [filteredGruposInventario, setFilteredGruposInventario] = useState<GrupoInventario[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingGrupoInventario, setEditingGrupoInventario] = useState<GrupoInventario | null>(null);
    const [showManual, setShowManual] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchGruposInventario();
    }, []);

    useEffect(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const filtered = gruposInventario.filter(gi =>
            gi.grupo.toLowerCase().includes(lowerSearchTerm)
        );
        setFilteredGruposInventario(filtered);
        setCurrentPage(1);
    }, [searchTerm, gruposInventario]);

    const fetchGruposInventario = async () => {
        try {
            setLoading(true);
            const data = await getGruposInventario();
            setGruposInventario(data);
            setFilteredGruposInventario(data);
        } catch (err: any) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Error al cargar grupos de inventario: ${err.message || 'Error desconocido'}`
            });
        } finally {
            setLoading(false);
        }
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredGruposInventario.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredGruposInventario.length / itemsPerPage);

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Desactivar grupo?',
            text: 'Pasará a estado inactivo.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteGrupoInventario(id);
                setGruposInventario(gruposInventario.map(gi =>
                    gi.id === id ? { ...gi, estado: 'inactivo' } : gi
                ));
                await Swal.fire({
                    icon: 'success',
                    title: '¡Desactivado!',
                    text: 'Grupo de inventario desactivado exitosamente.',
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
            title: '¿Reactivar grupo?',
            text: 'Volverá a estar activo.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await updateGrupoInventario(id, { estado: 'activo' });
                setGruposInventario(gruposInventario.map(gi =>
                    gi.id === id ? { ...gi, estado: 'activo' } : gi
                ));
                await Swal.fire({
                    icon: 'success',
                    title: '¡Reactivado!',
                    text: 'Grupo de inventario reactivado exitosamente.',
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

    const handleSave = async (grupoInventarioData: CreateGrupoInventarioData) => {
        try {
            if (editingGrupoInventario) {
                await updateGrupoInventario(editingGrupoInventario.id, grupoInventarioData);
                await Swal.fire({
                    icon: 'success',
                    title: 'Actualizado',
                    text: 'Grupo de inventario actualizado exitosamente',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                await createGrupoInventario(grupoInventarioData);
                await Swal.fire({
                    icon: 'success',
                    title: 'Creado',
                    text: 'Grupo de inventario creado exitosamente',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
            setShowModal(false);
            setEditingGrupoInventario(null);
            fetchGruposInventario();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar'
            });
            throw err;
        }
    };

    const openCreateModal = () => {
        setEditingGrupoInventario(null);
        setShowModal(true);
    };

    const openEditModal = (grupoInventario: GrupoInventario) => {
        setEditingGrupoInventario(grupoInventario);
        setShowModal(true);
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredGruposInventario.map(gi => ({
            'Grupo': gi.grupo,
            'Estado': gi.estado
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Grupos de Inventario");
        XLSX.writeFile(workbook, `GruposInventario_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setTextColor(52, 152, 219);
        doc.text('Reporte de Grupos de Inventario', 14, 22);

        doc.setLineWidth(0.5);
        doc.setDrawColor(52, 152, 219);
        doc.line(14, 25, 196, 25);

        autoTable(doc, {
            head: [['Grupo', 'Estado']],
            body: filteredGruposInventario.map(gi => [gi.grupo, gi.estado]),
            startY: 30,
            headStyles: { fillColor: [52, 152, 219] },
            alternateRowStyles: { fillColor: [240, 248, 255] },
        });

        doc.save(`GruposInventario_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const printList = () => {
        window.print();
    };

    const manualSections: ManualSection[] = [
        {
            title: 'Gestión de Grupos de Inventario',
            content: 'Aquí puede administrar las categorías o grupos de inventario (Repuestos, Llantas, Aceites, etc.).'
        },
        {
            title: 'Crear Grupo',
            content: 'Haga clic en "+ Nuevo Grupo", ingrese el nombre y guarde.'
        },
        {
            title: 'Desactivar/Reactivar',
            content: 'Use el botón rojo para desactivar y el verde para reactivar. No se eliminan permanentemente.'
        }
    ];

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="container mx-auto relative min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 no-print">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/configuraciones/general')}
                        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Volver"
                    >
                        <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                            <Boxes className="text-amber-600" size={32} />
                            Grupos de Inventario
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Clasifica los repuestos e insumos en grupos</p>
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
                            <span>+</span> Nuevo Grupo
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
                        placeholder="Buscar por grupo..."
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
                Mostrando {filteredGruposInventario.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredGruposInventario.length)} de {filteredGruposInventario.length} registros
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">#</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grupo</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right no-print">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {currentItems.map((gi, index) => (
                                <tr key={gi.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 text-gray-500 dark:text-gray-400 font-mono text-sm">
                                        {indexOfFirstItem + index + 1}
                                    </td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200 font-medium">{gi.grupo}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${gi.estado === 'activo'
                                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                            : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                            }`}>
                                            {gi.estado}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-2 justify-end no-print">
                                        <button
                                            onClick={() => openEditModal(gi)}
                                            className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        {gi.estado === 'activo' ? (
                                            <button
                                                onClick={() => handleDelete(gi.id)}
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
                                                onClick={() => handleReactivate(gi.id)}
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
                            {filteredGruposInventario.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="font-medium">
                                                {searchTerm ? 'No se encontraron resultados' : 'No hay grupos de inventario registrados'}
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
                title="Manual de Grupos de Inventario"
                sections={manualSections}
            />

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <GrupoInventarioForm
                            initialData={editingGrupoInventario}
                            onSubmit={handleSave}
                            onCancel={() => { setShowModal(false); setEditingGrupoInventario(null); }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default GrupoInventarioList;
