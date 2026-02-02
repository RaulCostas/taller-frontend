import { useState, useEffect } from 'react';
import type { Inspector, CreateInspectorData } from '../../types/inspector';
import type { Seguro } from '../../types/seguro';
import { getSeguros } from '../../services/seguroService';

interface InspectoresFormProps {
    initialData?: Inspector | null;
    onSubmit: (data: CreateInspectorData) => Promise<void>;
    onCancel: () => void;
}

export const InspectoresForm = ({ initialData, onSubmit, onCancel }: InspectoresFormProps) => {
    const [formData, setFormData] = useState<CreateInspectorData>({
        seguroId: '',
        inspector: '',
        celular: '',
        correo: '',
        estado: 'activo'
    });
    const [seguros, setSeguros] = useState<Seguro[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Default country code
    const [countryCode, setCountryCode] = useState('+591');
    const [phoneWithoutCode, setPhoneWithoutCode] = useState('');

    useEffect(() => {
        loadSeguros();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                seguroId: initialData.seguro.id,
                inspector: initialData.inspector,
                celular: initialData.celular || '',
                correo: initialData.correo || '',
                estado: initialData.estado
            });

            // Parse phone if it exists
            if (initialData.celular) {
                // Remove spaces
                const cleanPhone = initialData.celular.replace(/\s/g, '');
                // Check if starts with +
                if (cleanPhone.startsWith('+')) {
                    // Simple heuristic: assume first 4 chars are code if matches +591, else try to guess or just set code to match
                    if (cleanPhone.startsWith('+591')) {
                        setCountryCode('+591');
                        setPhoneWithoutCode(cleanPhone.substring(4));
                    } else {
                        // Just split manually? For now, we only support +591 explicitly or custom
                        // If it doesn't match default, we might just put everything in phone input or handle logic.
                        // Let's assume standard +591 for now as requested.
                        setCountryCode('+591');
                        setPhoneWithoutCode(cleanPhone.replace('+591', ''));
                    }
                } else {
                    setPhoneWithoutCode(cleanPhone);
                }
            }
        }
    }, [initialData]);

    const loadSeguros = async () => {
        try {
            const data = await getSeguros();
            setSeguros(data.filter(s => s.estado === 'activo'));
        } catch (err) {
            console.error('Error loading seguros', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const finalPhone = phoneWithoutCode ? `${countryCode} ${phoneWithoutCode}` : '';
            await onSubmit({
                ...formData,
                celular: finalPhone
            });
        } catch (err: any) {
            setError(err.message || 'Error al guardar. Verifique los datos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <span className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-indigo-600 dark:text-indigo-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </span>
                    {initialData ? 'Editar Inspector' : 'Nuevo Inspector'}
                </h2>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Seguro Select */}
                    <div>
                        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Seguro:</label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            <select
                                value={formData.seguroId}
                                onChange={e => setFormData({ ...formData, seguroId: e.target.value })}
                                required
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="">Seleccione un seguro</option>
                                {seguros.map(seguro => (
                                    <option key={seguro.id} value={seguro.id}>
                                        {seguro.seguro}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Inspector Name */}
                    <div>
                        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Nombre Inspector:</label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <input
                                type="text"
                                value={formData.inspector}
                                onChange={e => setFormData({ ...formData, inspector: e.target.value })}
                                required
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nombre completo"
                            />
                        </div>
                    </div>

                    {/* Celular with Code */}
                    <div>
                        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Celular:</label>
                        <div className="flex gap-2">
                            <div className="relative w-24">
                                <input
                                    type="text"
                                    value={countryCode}
                                    onChange={e => setCountryCode(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                />
                            </div>
                            <div className="relative flex-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                </svg>
                                <input
                                    type="text"
                                    value={phoneWithoutCode}
                                    onChange={e => setPhoneWithoutCode(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej: 77712345"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Correo */}
                    <div>
                        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Correo:</label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <input
                                type="email"
                                value={formData.correo}
                                onChange={e => setFormData({ ...formData, correo: e.target.value })}
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="inspector@seguros.com"
                            />
                        </div>
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Estado:</label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                                <line x1="12" y1="2" x2="12" y2="12"></line>
                            </svg>
                            <select
                                value={formData.estado}
                                onChange={e => setFormData({ ...formData, estado: e.target.value })}
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="activo">Activo</option>
                                <option value="inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-6 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
};
