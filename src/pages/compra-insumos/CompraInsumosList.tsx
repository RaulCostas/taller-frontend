import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Edit, Trash2, ArrowLeft, Package } from 'lucide-react';
import Swal from 'sweetalert2';
import { getCompraInsumos, deleteCompraInsumo, type CompraInsumo } from '../../services/compraInsumosService';
import CompraInsumosForm from './CompraInsumosForm';
import { useNavigate, useParams } from 'react-router-dom';

const CompraInsumosList = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const ordenId = id ? Number(id) : undefined;
    const [records, setRecords] = useState<CompraInsumo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingRecord, setEditingRecord] = useState<CompraInsumo | undefined>(undefined);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const data = await getCompraInsumos();
            setRecords(data);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo cargar la lista de compras', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteCompraInsumo(id);
                Swal.fire({
                    title: 'Eliminado!',
                    text: 'El registro ha sido eliminado.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchRecords();
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el registro', 'error');
            }
        }
    };

    const handleEdit = (record: CompraInsumo) => {
        setEditingRecord(record);
    };

    const handleFormSuccess = () => {
        setEditingRecord(undefined);
        fetchRecords();
    };

    const handleCancelEdit = () => {
        setEditingRecord(undefined);
    };

    const filteredRecords = records.filter(record =>
        record.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.proveedor?.proveedor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-4 max-w-full">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/ordenes-trabajo')}
                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                            <ShoppingCart size={28} />
                        </span>
                        Compra de Insumos y Repuestos
                    </h1>
                    {ordenId ? (
                        <p className="text-gray-600 dark:text-gray-400 mt-1 ml-1">
                            Orden de Trabajo N° {ordenId}
                        </p>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Registra y gestiona las compras de insumos
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Side: Form */}
                <div className="w-full lg:w-1/3">
                    <CompraInsumosForm
                        record={editingRecord}
                        ordenId={ordenId}
                        onSuccess={handleFormSuccess}
                        onCancel={handleCancelEdit}
                    />
                </div>

                {/* Right Side: List */}
                <div className="w-full lg:w-2/3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[calc(100vh-150px)]">
                    {/* Header & Search */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por descripción o proveedor..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg border border-green-200 dark:border-green-700 whitespace-nowrap flex gap-3">
                            <span className="text-sm font-bold text-green-700 dark:text-green-400">
                                Total Bs: {filteredRecords
                                    .filter(r => r.moneda === 'Bolivianos')
                                    .reduce((acc, curr) => acc + Number(curr.total), 0)
                                    .toFixed(2)}
                            </span>
                            {filteredRecords.some(r => r.moneda === 'Dólares') && (
                                <span className="text-sm font-bold text-blue-700 dark:text-blue-400 border-l border-green-300 dark:border-green-600 pl-3">
                                    Total $: {filteredRecords
                                        .filter(r => r.moneda === 'Dólares')
                                        .reduce((acc, curr) => acc + Number(curr.total), 0)
                                        .toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Scrollable Table Container */}
                    <div className="overflow-y-auto flex-1 p-4">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredRecords.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                <Package size={48} className="mb-4 text-gray-300" />
                                <p className="text-lg">No se encontraron registros</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredRecords.map((item) => (
                                    <div key={item.id} className="bg-white dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all relative group">
                                        {/* Actions */}
                                        <div className="absolute top-3 right-3 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-1.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-md transition-colors shadow-sm"
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors shadow-sm"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="pr-20">
                                            <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">{item.descripcion}</h3>
                                            <div className="flex flex-wrap gap-y-1 gap-x-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                <span className="flex items-center gap-1">
                                                    <span className="font-semibold">Prov:</span> {item.proveedor?.proveedor}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="font-semibold">Fecha:</span> {new Date(item.fecha).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">
                                                    {item.cantidad} Und.
                                                </span>
                                                <span className="text-sm font-medium">
                                                    P.U: {item.moneda === 'Bolivianos' ? 'Bs' : '$'} {Number(item.precio_unitario).toFixed(2)}
                                                </span>
                                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                                    Total: {item.moneda === 'Bolivianos' ? 'Bs' : '$'} {Number(item.total).toFixed(2)}
                                                </span>

                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompraInsumosList;
