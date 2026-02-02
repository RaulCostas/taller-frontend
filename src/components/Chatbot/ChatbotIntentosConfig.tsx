import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Swal from 'sweetalert2';
import { Plus, Trash, Edit, Save, Tag, MessageSquare, RefreshCw } from 'lucide-react';

interface Intento {
    id: number;
    keywords: string;
    replyTemplate: string;
    active: boolean;
}

const ChatbotIntentosConfig: React.FC = () => {
    const [intentos, setIntentos] = useState<Intento[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<Intento>>({});

    useEffect(() => {
        fetchIntentos();
    }, []);

    const fetchIntentos = async () => {
        try {
            const res = await api.get('/chatbot-intentos');
            setIntentos(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        if (!formData.keywords || !formData.replyTemplate) {
            Swal.fire('Error', 'Complete todos los campos', 'error');
            return;
        }

        try {
            if (editingId) {
                await api.patch(`/chatbot-intentos/${editingId}`, formData);
            } else {
                await api.post('/chatbot-intentos', { ...formData, active: true });
            }
            setEditingId(null);
            setFormData({});
            fetchIntentos();
            Swal.fire('Guardado', 'Respuesta configurada correctamente.', 'success');
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Desactivar?',
            text: 'La respuesta automática dejará de funcionar.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, desactivar'
        });

        if (result.isConfirmed) {
            try {
                // DELETE method now performs soft delete in backend
                await api.delete(`/chatbot-intentos/${id}`);
                fetchIntentos();
                Swal.fire('Desactivado', 'Registro desactivado.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo desactivar', 'error');
            }
        }
    };

    const handleReactivate = async (id: number) => {
        try {
            await api.patch(`/chatbot-intentos/${id}`, { active: true });
            fetchIntentos();
            Swal.fire('Reactivado', 'Registro activado nuevamente.', 'success');
        } catch (error) {
            Swal.fire('Error', 'No se pudo reactivar', 'error');
        }
    };

    const startEdit = (intento?: Intento) => {
        if (intento) {
            setEditingId(intento.id);
            setFormData(intento);
        } else {
            setEditingId(0); // 0 indicates new
            setFormData({ keywords: '', replyTemplate: '' });
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">Configuración de Respuestas</h3>
                <button
                    onClick={() => startEdit()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all transform hover:-translate-y-0.5 border-none"
                >
                    <Plus size={18} /> Nueva Respuesta
                </button>
            </div>

            {editingId !== null && (
                <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 animate-fade-in">
                    <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-4">
                        {editingId === 0 ? 'Crear Nueva Respuesta' : 'Editar Respuesta'}
                    </h4>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Palabras Clave (separadas por coma)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Tag className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.keywords || ''}
                                    onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
                                    placeholder="Ej: horario, hora, atencion"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Respuesta Automática</label>
                            <div className="relative">
                                <div className="absolute top-3 left-3 pointer-events-none">
                                    <MessageSquare className="h-5 w-5 text-gray-400" />
                                </div>
                                <textarea
                                    value={formData.replyTemplate || ''}
                                    onChange={e => setFormData({ ...formData, replyTemplate: e.target.value })}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white h-24"
                                    placeholder="Ej: Atendemos de 8 a 18hrs."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                onClick={() => setEditingId(null)}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 border-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5 border-none"
                            >
                                <Save size={18} /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">#</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Palabras Clave</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Respuesta</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {intentos.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-sm">
                                    {index + 1}
                                </td>
                                <td className="px-6 py-4 text-sm text-blue-700 dark:text-blue-400 font-bold">{item.keywords}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-md truncate">{item.replyTemplate}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.active
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                        {item.active ? 'ACTIVO' : 'INACTIVO'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => startEdit(item)}
                                            className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 border-none"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        {item.active ? (
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 border-none"
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
                                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 border-none"
                                                title="Reactivar"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {intentos.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No hay respuestas configuradas. Agregue una nueva.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ChatbotIntentosConfig;
