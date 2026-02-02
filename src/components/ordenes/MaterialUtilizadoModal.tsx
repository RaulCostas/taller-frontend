import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Package, Calendar, User, Hash } from 'lucide-react';
import Swal from 'sweetalert2';
import { createMaterialUtilizado, getMaterialUtilizadoByOrden, type MaterialUtilizado } from '../../services/materialUtilizadoService';
import { getInventarios } from '../../services/inventarioService';
import { getPersonal } from '../../services/personalService';
import type { Inventario } from '../../types/inventario';
import type { Personal } from '../../types/personal';

interface MaterialUtilizadoModalProps {
    isOpen: boolean;
    onClose: () => void;
    ordenId: number | null;
}

const MaterialUtilizadoModal = ({ isOpen, onClose, ordenId }: MaterialUtilizadoModalProps) => {
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Form Data
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [selectedPersonal, setSelectedPersonal] = useState('');
    const [selectedInventario, setSelectedInventario] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [precio, setPrecio] = useState('');

    // Lists
    const [personalList, setPersonalList] = useState<Personal[]>([]);
    const [inventarioList, setInventarioList] = useState<Inventario[]>([]);
    const [history, setHistory] = useState<MaterialUtilizado[]>([]);

    // Filtered Inventario for Search
    const [inventarioSearch, setInventarioSearch] = useState('');

    useEffect(() => {
        if (isOpen && ordenId) {
            fetchInitialData();
            fetchHistory();
        } else {
            // Reset form when closed
            setFecha(new Date().toISOString().split('T')[0]);
            setSelectedPersonal('');
            setSelectedInventario('');
            setCantidad('');
            setPrecio('');
            setInventarioSearch('');
            setHistory([]);
        }
    }, [isOpen, ordenId]);

    const fetchInitialData = async () => {
        try {
            const [pData, iData] = await Promise.all([
                getPersonal(),
                getInventarios()
            ]);
            setPersonalList(pData.filter(p => p.estado === 'activo'));
            setInventarioList(iData.filter(i => i.estado === 'activo'));
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error al cargar datos iniciales', 'error');
        }
    };

    const fetchHistory = async () => {
        if (!ordenId) return;
        setHistoryLoading(true);
        try {
            const data = await getMaterialUtilizadoByOrden(ordenId);
            setHistory(data);
        } catch (error) {
            console.error(error); // Fail silently or show toast
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ordenId || !selectedPersonal || !selectedInventario || !cantidad) {
            Swal.fire('Atención', 'Todos los campos son obligatorios', 'warning');
            return;
        }

        const selectedItem = inventarioList.find(i => i.id.toString() === selectedInventario);
        if (!selectedItem) return;

        if (Number(cantidad) > selectedItem.cantidad_existente) {
            Swal.fire('Stock Insuficiente', `Solo hay ${selectedItem.cantidad_existente} unidades disponibles.`, 'error');
            return;
        }

        setLoading(true);
        try {
            await createMaterialUtilizado({
                idorden_trabajo: ordenId,
                personalId: selectedPersonal,
                id_inventario: Number(selectedInventario),
                fecha,
                cantidad: Number(cantidad),
                precio: Number(precio) || 0
            });

            await Swal.fire({
                icon: 'success',
                title: 'Registrado',
                text: 'Material asignado exitosamente',
                timer: 1500,
                showConfirmButton: false
            });

            // Clear specific fields to allow rapid entry
            setSelectedInventario('');
            setCantidad('');
            setInventarioSearch('');

            // Refresh history/inventory
            fetchHistory();
            fetchInitialData(); // To update stock levels

        } catch (error: any) {
            console.error(error);
            Swal.fire('Error', error.response?.data?.message || 'No se pudo registrar el material', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredInventarioList = inventarioList.filter(item =>
        item.descripcion.toLowerCase().includes(inventarioSearch.toLowerCase())
    );

    const getStockLabelColor = (item: Inventario) => {
        if (item.cantidad_existente <= 0) return 'text-red-500 font-bold';
        if (item.cantidad_existente <= item.stock_minimo) return 'text-amber-500 font-bold';
        return 'text-green-600';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl transform transition-all h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Package size={24} />
                        Asignar Material Utilizado
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Form Section */}
                    <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-blue-500" />
                                        Fecha de Uso
                                    </div>
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <div className="flex items-center gap-2">
                                        <User size={16} className="text-purple-500" />
                                        Personal Responsable
                                    </div>
                                </label>
                                <select
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={selectedPersonal}
                                    onChange={(e) => setSelectedPersonal(e.target.value)}
                                >
                                    <option value="">Seleccione personal...</option>
                                    {personalList.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre} {p.paterno} {p.materno}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <div className="flex items-center gap-2">
                                        <Package size={16} className="text-amber-500" />
                                        Seleccionar Material / Insumo
                                    </div>
                                </label>

                                <input
                                    type="text"
                                    placeholder="Buscar material..."
                                    className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={inventarioSearch}
                                    onChange={(e) => setInventarioSearch(e.target.value)}
                                />

                                <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                                    {filteredInventarioList.length > 0 ? (
                                        filteredInventarioList.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    setSelectedInventario(item.id.toString());
                                                    setInventarioSearch(item.descripcion); // Optional: Set search to selected
                                                }}
                                                className={`p-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-b last:border-0 border-gray-100 dark:border-gray-600
                                                    ${selectedInventario === item.id.toString() ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">{item.descripcion}</span>
                                                    <span className={`text-xs ${getStockLabelColor(item)}`}>
                                                        Stock: {item.cantidad_existente}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {item.grupo_inventario?.grupo}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-sm text-gray-500">No se encontraron materiales</div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <div className="flex items-center gap-2">
                                        <Hash size={16} className="text-green-500" />
                                        Precio Unitario (Bs)
                                    </div>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={precio}
                                    onChange={(e) => setPrecio(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <div className="flex items-center gap-2">
                                        <Hash size={16} className="text-green-500" />
                                        Cantidad a Utilizar
                                    </div>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(e.target.value)}
                                />
                                {selectedInventario && (
                                    <p className="text-xs text-blue-600 mt-1 text-right">
                                        Unidad: {inventarioList.find(i => i.id.toString() === selectedInventario)?.unidad_medida?.medida || 'N/A'}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 hover:animate-bounce text-white font-medium py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Registrar Uso
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* History Section */}
                    <div className="w-full md:w-1/2 p-6 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-orange-500" />
                            Materiales ya Utilizados
                        </h3>

                        {historyLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : history.length > 0 ? (
                            <div className="space-y-3">
                                {history.map((record) => (
                                    <div key={record.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-gray-800 dark:text-gray-200">
                                                {record.inventario?.descripcion}
                                            </span>
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">
                                                {record.cantidad} {record.inventario?.unidad_medida?.medida}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <div>
                                                <span className="block font-medium text-gray-400 text-[10px] uppercase">Fecha</span>
                                                {new Date(record.fecha).toLocaleDateString()}
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-medium text-gray-400 text-[10px] uppercase">Responsable</span>
                                                {record.personal?.nombre} {record.personal?.paterno}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                <Package size={32} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    No se ha registrado material utilizado para esta orden.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaterialUtilizadoModal;
