import { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, Save, Users, AlignLeft, X, FileEdit } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Personal } from '../types/personal';
import ManualModal, { type ManualSection } from '../components/ManualModal';

interface Falta {
    id: number;
    personal: Personal;
    personal_id: number;
    fecha: string;
    motivo: string;
    observaciones: string;
}

const FaltasList = () => {
    const [faltas, setFaltas] = useState<Falta[]>([]);

    const [personalList, setPersonalList] = useState<Personal[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showManual, setShowManual] = useState(false);

    // Form State
    const [selectedPersonalId, setSelectedPersonalId] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [motivo, setMotivo] = useState('');
    const [observaciones, setObservaciones] = useState('');

    useEffect(() => {
        fetchFaltas();
        fetchPersonal();
    }, []);

    const fetchFaltas = async () => {
        try {
            const response = await api.get('/faltas');
            setFaltas(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPersonal = async () => {
        try {
            const response = await api.get('/personal');
            setPersonalList(response.data.filter((p: Personal) => p.estado === 'activo'));
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
                motivo,
                observaciones
            };

            if (editingId) {
                await api.patch(`/faltas/${editingId}`, data);
                Swal.fire('Actualizado', 'Registro de falta actualizado', 'success');
            } else {
                await api.post('/faltas', data);
                Swal.fire('Registrado', 'Falta registrada correctamente', 'success');
            }
            closeModal();
            fetchFaltas();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo guardar el registro', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar registro?',
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
                await api.delete(`/faltas/${id}`);
                Swal.fire('Eliminado', 'Registro eliminado', 'success');
                fetchFaltas();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo eliminar el registro', 'error');
            }
        }
    };

    const openEdit = (falta: Falta) => {
        setEditingId(falta.id);
        setSelectedPersonalId(falta.personal.id.toString());
        setFecha(falta.fecha);
        setMotivo(falta.motivo);
        setObservaciones(falta.observaciones);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
        setSelectedPersonalId('');
        setFecha(new Date().toISOString().split('T')[0]);
        setMotivo('');
        setObservaciones('');
    };

    const manualSections: ManualSection[] = [
        { title: 'Gestión de Faltas', content: 'Administre las inasistencias del personal.' },
        { title: 'Registrar Falta', content: 'Utilice el botón "Nueva Falta" para registrar una inasistencia.' },
        { title: 'Editar/Eliminar', content: 'Use los botones correspondientes en la tabla para modificar o eliminar registros.' }
    ];

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <Calendar className="text-blue-600" size={32} />
                        Control de Asistencia / Faltas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona las inasistencias del personal</p>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>

                    <div className="w-px h-10 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                    <button
                        onClick={() => setModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition-all transform hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        Nueva Falta
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Personal</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Motivo</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Observaciones</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {faltas.map((falta) => (
                                <tr key={falta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{new Date(falta.fecha).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {falta.personal?.nombre} {falta.personal?.paterno}
                                        </div>
                                        <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded inline-block mt-1">
                                            {falta.personal?.tipo}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">{falta.motivo}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400 text-sm max-w-xs truncate">{falta.observaciones || '-'}</td>
                                    <td className="p-4 flex gap-2 justify-center">
                                        <button onClick={() => openEdit(falta)} className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5" title="Editar">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(falta.id)} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5" title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {faltas.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">No hay faltas registradas</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Faltas"
                sections={manualSections}
            />

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <FileEdit size={20} className="text-blue-600" />
                                {editingId ? 'Editar Falta' : 'Registrar Falta'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Personal</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Users className="text-gray-400" size={18} />
                                    </div>
                                    <select
                                        required
                                        value={selectedPersonalId}
                                        onChange={(e) => setSelectedPersonalId(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 invalid:text-gray-400"
                                    >
                                        <option value="">Seleccione personal...</option>
                                        {personalList.map(p => (
                                            <option key={p.id} value={p.id} className="text-gray-900 dark:text-white">{p.nombre} {p.paterno} ({p.tipo})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="text-gray-400" size={18} />
                                    </div>
                                    <input
                                        type="date"
                                        required
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FileEdit className="text-gray-400" size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={motivo}
                                        onChange={(e) => setMotivo(e.target.value)}
                                        placeholder="Ej: Enfermedad, Personal, Sin aviso"
                                        className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 pointer-events-none">
                                        <AlignLeft className="text-gray-400" size={18} />
                                    </div>
                                    <textarea
                                        value={observaciones}
                                        onChange={(e) => setObservaciones(e.target.value)}
                                        rows={3}
                                        className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-all transform hover:-translate-y-0.5">
                                    <X size={18} />
                                    Cancelar
                                </button>
                                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-all transform hover:-translate-y-0.5">
                                    <Save size={18} />
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaltasList;
