import { useState, useEffect } from 'react';
import type { CreatePrecioTallerData, PrecioTaller } from '../../types/precioTaller';
import type { CategoriaServicio } from '../../types/categoriaServicio';
import { getCategoriasServicio } from '../../services/categoriaServicioService';
import { List, FileText, DollarSign, Power, Save, X } from 'lucide-react';

interface PrecioTallerFormProps {
    initialData?: PrecioTaller | null;
    onSubmit: (data: CreatePrecioTallerData) => Promise<void>;
    onCancel: () => void;
}

export const PrecioTallerForm = ({ initialData, onSubmit, onCancel }: PrecioTallerFormProps) => {
    const [formData, setFormData] = useState<CreatePrecioTallerData>({
        idcategoria_servicio: initialData?.categoria?.id || '',
        detalle: initialData?.detalle || '',
        precio: initialData?.precio || 0,
        estado: initialData?.estado || 'activo'
    });

    const [categorias, setCategorias] = useState<CategoriaServicio[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadCategorias = async () => {
            try {
                const categoriasData = await getCategoriasServicio();
                setCategorias(categoriasData.filter(c => c.estado === 'activo'));
            } catch (error) {
                console.error('Error cargando categorías', error);
            }
        };
        loadCategorias();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                <span className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-indigo-600 dark:text-indigo-300">
                    <PlusCircleIcon />
                </span>
                {initialData ? 'Editar Precio' : 'Nuevo Precio'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                    <div className="relative">
                        <List className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <select
                            value={formData.idcategoria_servicio}
                            onChange={e => setFormData({ ...formData, idcategoria_servicio: e.target.value })}
                            required
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <option value="">Seleccione categoría</option>
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.categoria_servicio}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Detalle</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <input
                            type="text"
                            value={formData.detalle}
                            onChange={e => setFormData({ ...formData, detalle: e.target.value })}
                            required
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Descripción del servicio"
                        />
                    </div>
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Precio</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <input
                            type="number"
                            step="0.01"
                            value={formData.precio}
                            onChange={e => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                            required
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                    <div className="relative">
                        <Power className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <select
                            value={formData.estado}
                            onChange={e => setFormData({ ...formData, estado: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50"
                    >
                        <X size={20} />
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50"
                    >
                        <Save size={20} />
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const PlusCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
