import { useState, useEffect } from 'react';
import { DollarSign, Search, Plus, Save, Edit, Trash2, Calendar, User, FileText, List, X, FileEdit } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Personal } from '../types/personal';
import Pagination from '../components/Pagination';

interface Anticipo {
    id: number;
    personal: Personal;
    personal_id: number;
    fecha: string;
    monto: number;
    motivo: string;
    estado: string;
    mes_aplicacion?: string;
}

const AnticiposList = () => {
    const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
    const [filteredAnticipos, setFilteredAnticipos] = useState<Anticipo[]>([]);
    const [personalList, setPersonalList] = useState<Personal[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    // Form State
    const [selectedPersonalId, setSelectedPersonalId] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [monto, setMonto] = useState('');
    const [motivo, setMotivo] = useState('');
    const [estado, setEstado] = useState('Pendiente');
    const [mesAplicacion, setMesAplicacion] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        fetchAnticipos();
        fetchPersonal();
    }, []);

    useEffect(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const filtered = anticipos.filter(ant =>
            ant.personal?.nombre?.toLowerCase().includes(lowerSearchTerm) ||
            ant.personal?.paterno?.toLowerCase().includes(lowerSearchTerm) ||
            ant.motivo?.toLowerCase().includes(lowerSearchTerm) ||
            ant.estado?.toLowerCase().includes(lowerSearchTerm)
        );
        setFilteredAnticipos(filtered);
        setCurrentPage(1);
    }, [searchTerm, anticipos]);

    const fetchAnticipos = async () => {
        setLoading(true);
        try {
            const response = await api.get('/anticipos');
            setAnticipos(response.data);
            setFilteredAnticipos(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPersonal = async () => {
        try {
            const response = await api.get('/personal');
            setPersonalList(response.data.filter((p: Personal) => p.estado === 'activo' && p.tipo === 'Planta'));
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                personal_id: Number(selectedPersonalId),
                fecha,
                monto: Number(monto),
                motivo,
                estado,
                mes_aplicacion: mesAplicacion
            };

            if (editingId) {
                await api.patch(`/anticipos/${editingId}`, data);
                Swal.fire({
                    icon: 'success',
                    title: 'Actualizado',
                    text: 'Anticipo actualizado',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                await api.post('/anticipos', data);
                Swal.fire({
                    icon: 'success',
                    title: 'Registrado',
                    text: 'Solicitud de anticipo registrada',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
            closeModal();
            fetchAnticipos();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo guardar el anticipo', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar anticipo?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/anticipos/${id}`);
                Swal.fire('Eliminado', 'Anticipo eliminado', 'success');
                fetchAnticipos();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo eliminar el anticipo', 'error');
            }
        }
    };

    const openEdit = (ant: Anticipo) => {
        setEditingId(ant.id);
        setSelectedPersonalId(ant.personal.id.toString());
        setFecha(ant.fecha);
        setMonto(ant.monto.toString());
        setMotivo(ant.motivo);
        setEstado(ant.estado);
        setMesAplicacion(ant.mes_aplicacion || new Date().toISOString().slice(0, 7));
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
        setSelectedPersonalId('');
        setFecha(new Date().toISOString().split('T')[0]);
        setMonto('');
        setMotivo('');
        setEstado('Pendiente');
        setMesAplicacion(new Date().toISOString().slice(0, 7));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Aprobado': return 'bg-green-100 text-green-800 border-green-200';
            case 'Pagado': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Descontado': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAnticipos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAnticipos.length / itemsPerPage);

    return (
        <div className="container mx-auto p-6 min-h-screen relative">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <DollarSign className="text-green-600" size={32} />
                        Anticipos de Sueldo
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los adelantos y préstamos al personal</p>
                </div>

                <div className="flex gap-2">
                    <button
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>

                    <div className="w-px h-10 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                    <button
                        onClick={() => setModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 font-medium"
                    >
                        <Plus size={20} />
                        Solicitar Anticipo
                    </button>
                </div>
            </div>

            <div className="mb-6 flex items-center gap-2 no-print">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por personal, motivo..."
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
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Mostrando {filteredAnticipos.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredAnticipos.length)} de {filteredAnticipos.length} registros
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Fecha Solicitud</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Aplicar a Mes</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Personal</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Motivo</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">Monto</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">Cargando anticipos...</td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <DollarSign className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                                            <p className="font-medium">
                                                {searchTerm ? 'No se encontraron resultados' : 'No hay anticipos registrados'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((ant) => (
                                    <tr key={ant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 text-gray-700 dark:text-gray-200">{ant.fecha.split('T')[0].split('-').reverse().join('/')}</td>
                                        <td className="p-4 text-blue-600 dark:text-blue-400 font-medium">{ant.mes_aplicacion || '-'}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {ant.personal?.nombre} {ant.personal?.paterno}
                                            </div>
                                            <div className="text-xs text-gray-500 inline-block mt-1">
                                                {ant.personal?.ci}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">{ant.motivo}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(ant.estado)}`}>
                                                {ant.estado}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-gray-800 dark:text-gray-200">
                                            Bs {Number(ant.monto).toFixed(2)}
                                        </td>
                                        <td className="p-4 flex gap-2 justify-center">
                                            <button
                                                onClick={() => openEdit(ant)}
                                                className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ant.id)}
                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
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

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <FileEdit size={20} className="text-blue-600" />
                                {editingId ? 'Editar Anticipo' : 'Solicitar Anticipo'}
                            </h3>
                            {/* X Button Removed */}
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Personal</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        required
                                        value={selectedPersonalId}
                                        onChange={(e) => setSelectedPersonalId(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Seleccione personal...</option>
                                        {personalList.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre} {p.paterno}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="date"
                                            required
                                            value={fecha}
                                            onChange={(e) => setFecha(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aplicar a Mes</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="month"
                                            required
                                            value={mesAplicacion}
                                            onChange={(e) => setMesAplicacion(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto (Bs)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <DollarSign className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            step="0.01"
                                            value={monto}
                                            onChange={(e) => setMonto(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FileText className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={motivo}
                                        onChange={(e) => setMotivo(e.target.value)}
                                        placeholder="Ej: Emergencia familiar"
                                        className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <List className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        value={estado}
                                        onChange={(e) => setEstado(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                                    >
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Aprobado">Aprobado</option>
                                        <option value="Pagado">Pagado</option>
                                        <option value="Descontado">Descontado</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 mt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-all transform hover:-translate-y-0.5 font-medium"
                                >
                                    <X size={18} />
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 font-medium"
                                >
                                    <Save size={18} />
                                    {editingId ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnticiposList;
