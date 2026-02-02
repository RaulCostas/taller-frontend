import { useState, useEffect } from 'react';
import type { Inventario, CreateInventarioData } from '../../types/inventario';
import type { UnidadMedida } from '../../types/unidadMedida';
import type { GrupoInventario } from '../../types/grupoInventario';
import { getUnidadesMedida } from '../../services/unidadMedidaService';
import { getGruposInventario } from '../../services/grupoInventarioService';
import { Tag, Package, Box, Layers, BarChart, Ruler, Power, Save, X } from 'lucide-react';
import Swal from 'sweetalert2';

interface InventarioFormProps {
    initialData?: Inventario | null;
    onSubmit: (data: CreateInventarioData) => Promise<void>;
    onCancel: () => void;
}

export const InventarioForm = ({ initialData, onSubmit, onCancel }: InventarioFormProps) => {
    const [formData, setFormData] = useState<CreateInventarioData>({
        descripcion: '',
        cantidad_existente: 0,
        stock_minimo: 0,
        estado: 'activo',
        idunidad_medida: '',
        id_grupo_inventario: ''
    });

    const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
    const [grupos, setGrupos] = useState<GrupoInventario[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fetchedUnidades, fetchedGrupos] = await Promise.all([
                    getUnidadesMedida(),
                    getGruposInventario()
                ]);
                // Ensure we are filtering correctly, assuming API returns array
                setUnidades(Array.isArray(fetchedUnidades) ? fetchedUnidades.filter(u => u.estado === 'activo') : []);
                setGrupos(Array.isArray(fetchedGrupos) ? fetchedGrupos.filter(g => g.estado === 'activo') : []);
            } catch (err) {
                console.error('Error loading selects:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al cargar listas desplegables'
                });
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                descripcion: initialData.descripcion,
                cantidad_existente: initialData.cantidad_existente,
                stock_minimo: initialData.stock_minimo,
                estado: initialData.estado,
                idunidad_medida: initialData.idunidad_medida,
                id_grupo_inventario: initialData.id_grupo_inventario
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation
        if (!formData.idunidad_medida || !formData.id_grupo_inventario) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'Debe seleccionar Unidad de Medida y Grupo.'
            });
            setLoading(false);
            return;
        }

        try {
            await onSubmit(formData);
        } catch (err: any) {
            // Check if error was already handled by parent (e.g. parent showed Swal)
            // But usually parent throws so we can catch it here.
            // If parent handles it and doesn't throw, we won't get here.
            // If parent handles it AND throws, we get here.
            // We'll show a generic message if parent didn't already?
            // Safer to just log, assuming parent handles major UI feedback for submit actions,
            // OR show it here if we want to be sure.
            // Given user feedback "no sale mensajes", let's ensure it shows here too if something slips through.
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar. Por favor verifique los datos.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <span className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-indigo-600 dark:text-indigo-300">
                        <Box className="h-6 w-6" />
                    </span>
                    {initialData ? 'Editar Inventario' : 'Nuevo Item de Inventario'}
                </h2>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Descripcion */}
                <div className="mb-4">
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Descripción:</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Tag className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={formData.descripcion}
                            onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                            required
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej: Aceite 20W50, Filtro de Aire..."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Cantidad */}
                    <div className="mb-4">
                        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Cantidad:</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Package className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="number"
                                step="any"
                                value={formData.cantidad_existente}
                                onChange={e => setFormData({ ...formData, cantidad_existente: Number(e.target.value) })}
                                required
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    {/* Stock Minimo */}
                    <div className="mb-4">
                        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Stock Mínimo:</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <BarChart className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="number"
                                step="any"
                                value={formData.stock_minimo}
                                onChange={e => setFormData({ ...formData, stock_minimo: Number(e.target.value) })}
                                required
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Unidad de Medida */}
                    <div className="mb-4">
                        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Unidad:</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Ruler className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                value={formData.idunidad_medida}
                                onChange={e => setFormData({ ...formData, idunidad_medida: e.target.value })}
                                required
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="">Seleccione...</option>
                                {unidades.map(u => (
                                    <option key={u.id} value={u.id}>{u.medida}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Grupo */}
                    <div className="mb-4">
                        <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Grupo:</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Layers className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                value={formData.id_grupo_inventario}
                                onChange={e => setFormData({ ...formData, id_grupo_inventario: e.target.value })}
                                required
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="">Seleccione...</option>
                                {grupos.map(g => (
                                    <option key={g.id} value={g.id}>{g.grupo}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Estado */}
                <div className="mb-4">
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">Estado:</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Power className="h-5 w-5 text-gray-400" />
                        </div>
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

                <div className="flex gap-3 mt-6 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
};
