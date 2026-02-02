import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, AlertTriangle, Package, Calendar, User, Hash, ArrowLeft, Trash2, Edit, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { createMaterialUtilizado, getMaterialUtilizadoByOrden, deleteMaterialUtilizado, updateMaterialUtilizado, type MaterialUtilizado } from '../services/materialUtilizadoService';
import { getInventarios } from '../services/inventarioService';
import { getPersonal } from '../services/personalService';
import type { Inventario } from '../types/inventario';
import type { Personal } from '../types/personal';

const MaterialUtilizadoPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const ordenId = id ? parseInt(id) : null;

    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Form Data
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [selectedPersonal, setSelectedPersonal] = useState('');
    const [selectedInventario, setSelectedInventario] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [precio, setPrecio] = useState('');

    // Edit Mode State
    const [editingId, setEditingId] = useState<number | null>(null);

    // Lists
    const [personalList, setPersonalList] = useState<Personal[]>([]);
    const [inventarioList, setInventarioList] = useState<Inventario[]>([]);
    const [history, setHistory] = useState<MaterialUtilizado[]>([]);

    // Filtered Inventario for Search
    const [inventarioSearch, setInventarioSearch] = useState('');

    useEffect(() => {
        if (ordenId) {
            fetchInitialData();
            fetchHistory();
        }
    }, [ordenId]);

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
            console.log('History data:', data);
            setHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error); // Fail silently or show toast
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleEdit = (record: MaterialUtilizado) => {
        setEditingId(record.id);
        setFecha(record.fecha);
        // Ensure we handle personalId properly. Backend sends object 'personal'.
        // If entity has personalId property it sends it, if not check record.personal.id
        const pId = record.personalId || (record.personal ? record.personal.id : '');
        setSelectedPersonal(pId);

        setSelectedInventario(record.id_inventario.toString());
        setCantidad(record.cantidad.toString());
        setPrecio(record.precio?.toString() || '');

        // Update search text
        const inv = inventarioList.find(i => i.id === record.id_inventario);
        if (inv) setInventarioSearch(inv.descripcion);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFecha(new Date().toISOString().split('T')[0]);
        setSelectedPersonal('');
        setSelectedInventario('');
        setCantidad('');
        setPrecio('');
        setInventarioSearch('');
    };

    const handleDelete = async (recordId: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "El stock será devuelto al inventario.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteMaterialUtilizado(recordId);
                Swal.fire('Eliminado!', 'El registro ha sido eliminado.', 'success');
                fetchHistory(); // Refresh list
                fetchInitialData(); // Refresh stock
            } catch (error: any) {
                Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ordenId || !selectedPersonal || !selectedInventario || !cantidad || !precio) {
            Swal.fire('Atención', 'Todos los campos son obligatorios', 'warning');
            return;
        }

        const selectedItem = inventarioList.find(i => i.id.toString() === selectedInventario);
        if (!selectedItem) return;

        // Validation for CREATE ONLY (Update logic handles stock check in backend usually, or we can add complex check here)
        // For simplicity, we rely on backend check for update, or basic check here.
        if (!editingId && Number(cantidad) > selectedItem.cantidad_existente) {
            Swal.fire('Stock Insuficiente', `Solo hay ${selectedItem.cantidad_existente} unidades disponibles.`, 'error');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                idorden_trabajo: ordenId,
                personalId: selectedPersonal,
                id_inventario: Number(selectedInventario),
                fecha,
                cantidad: Number(cantidad),
                precio: Number(precio)
            };

            if (editingId) {
                await updateMaterialUtilizado(editingId, payload);
                Swal.fire('Actualizado', 'Registro actualizado correctamente', 'success');
                cancelEdit();
            } else {
                await createMaterialUtilizado(payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Registrado',
                    text: 'Material asignado exitosamente',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Clear form
                setSelectedInventario('');
                setCantidad('');
                setPrecio('');
                setInventarioSearch('');
            }

            // Refresh history/inventory
            fetchHistory();
            fetchInitialData(); // To update stock levels

        } catch (error: any) {
            console.error('Registration/Update Error:', error);
            const errorMessage = error.response?.data?.message
                ? (Array.isArray(error.response.data.message)
                    ? error.response.data.message.join(', ')
                    : error.response.data.message)
                : 'No se pudo procesar la solicitud';

            Swal.fire('Error', errorMessage, 'error');
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

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/ordenes-trabajo/list')}
                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Package className="text-blue-600" size={32} />
                        Asignar Material Utilizado
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Orden de Trabajo N° {ordenId}</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* Form Section */}
                <div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex justify-between items-center mb-6 border-b pb-2 border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                            {editingId ? 'Editar Registro' : 'Registrar Nuevo Material'}
                        </h2>
                        {editingId && (
                            <button onClick={cancelEdit} className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 font-medium">
                                <X size={16} /> Cancelar Edición
                            </button>
                        )}
                    </div>


                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Fecha de Uso
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="text-gray-400" size={18} />
                                    </div>
                                    <input
                                        type="date"
                                        required
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Personal Responsable
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="text-gray-400" size={18} />
                                    </div>
                                    <select
                                        required
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
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
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Seleccionar Material / Insumo
                            </label>

                            <div className="relative mb-2">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Package className="text-gray-400" size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar material por nombre..."
                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    value={inventarioSearch}
                                    onChange={(e) => setInventarioSearch(e.target.value)}
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                                {filteredInventarioList.length > 0 ? (
                                    filteredInventarioList.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedInventario(item.id.toString());
                                                setInventarioSearch(item.descripcion);
                                            }}
                                            className={`p-3 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-b last:border-0 border-gray-100 dark:border-gray-600
                                                ${selectedInventario === item.id.toString() ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-gray-800 dark:text-gray-200">{item.descripcion}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 ${getStockLabelColor(item)}`}>
                                                    Stock: {item.cantidad_existente}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                                <span>{item.grupo_inventario?.grupo}</span>
                                                <span>Unidad: {item.unidad_medida?.medida}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        {inventarioSearch ? 'No se encontraron coincidentes' : 'Escribe para buscar...'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Cantidad a Utilizar
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash className="text-gray-400" size={18} />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-20"
                                        value={cantidad}
                                        onChange={(e) => setCantidad(e.target.value)}
                                    />
                                    {selectedInventario && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">
                                                {inventarioList.find(i => i.id.toString() === selectedInventario)?.unidad_medida?.medida}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Precio Unitario (Bs)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-400 font-bold">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={precio}
                                        onChange={(e) => setPrecio(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-lg
                                ${editingId ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Save size={20} />
                                    {editingId ? 'Actualizar Registro' : 'Registrar Material Utilizado'}
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* History Section */}
                <div className="w-full lg:w-1/2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6 overflow-hidden flex flex-col h-[600px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                            <AlertTriangle size={20} className="text-orange-500" />
                            Historial
                        </h3>
                        <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg border border-green-200 dark:border-green-700">
                            <span className="text-sm font-bold text-green-700 dark:text-green-400">
                                Total: Bs {history.reduce((sum, item) => sum + (item.cantidad * (item.precio || 0)), 0).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {historyLoading ? (
                        <div className="flex justify-center p-12 h-full items-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                    ) : history.length > 0 ? (
                        <div className="overflow-y-auto pr-2 space-y-4 flex-1">
                            {history.map((record) => (
                                <div key={record.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative group">

                                    {/* Action Buttons */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(record)}
                                            className="p-1.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-md transition-colors shadow-sm"
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(record.id)}
                                            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors shadow-sm"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-start mb-2 pr-16 bg">
                                        <span className="font-bold text-lg text-gray-800 dark:text-gray-200 truncate pr-2">
                                            {record.inventario?.descripcion || 'Material Desconocido'}
                                        </span>
                                    </div>

                                    <div className="mb-2 flex gap-4 items-center flex-wrap">
                                        <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-bold whitespace-nowrap">
                                            {record.cantidad} {record.inventario?.unidad_medida?.medida}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                            Bs {record.precio ? Number(record.precio).toFixed(2) : '0.00'}
                                        </span>
                                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                            Subtotal: Bs {(record.cantidad * (record.precio || 0)).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-end text-sm text-gray-500 dark:text-gray-400 mt-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                                        <div>
                                            <span className="block text-xs uppercase text-gray-400 font-semibold">Fecha Uso</span>
                                            {new Date(record.fecha).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-xs uppercase text-gray-400 font-semibold">Responsable</span>
                                            {record.personal ? `${record.personal.nombre} ${record.personal.paterno}` : 'Sin Asignar'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50/50">
                            <Package size={48} className="mx-auto text-gray-300 mb-4" />
                            <h4 className="text-gray-600 dark:text-gray-300 font-medium mb-1">Sin Registros</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                                No se ha registrado ningún material utilizado para esta orden de trabajo todavía.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MaterialUtilizadoPage;
