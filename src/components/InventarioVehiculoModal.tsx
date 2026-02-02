import { useEffect, useState } from 'react';
import { X, Save, Car, Layers, Wrench, Box } from 'lucide-react'; // Added icons for tabs
import Swal from 'sweetalert2';
import { getInventarioByOrden, saveInventarioVehiculo } from '../services/inventarioVehiculoService';

// Checklist Items based on the image
const ITEMS_EXTERIOR = [
    'Parabrisas', 'Vidrios Fijos', 'Vidrios de puertas', 'Antenas', 'Limpiaparabrisas',
    'Brazos', 'Escobillas', 'Espejos laterales', 'Faldones', 'Molduras',
    'Tapa de gasolina', 'Tapas de ruedas', 'Biseles', 'Cantoneras', 'Faroles',
    'Stops', 'Emblemas', 'Tap. de aire de llantas', 'Guiñadores', 'Máscara'
];

const ITEMS_INTERIOR = [
    'Radio', 'Tocacintas/CD', 'Encendedor', 'Pisos', 'Tapasol',
    'Retrovisor', 'Fundas', 'Llaves de contacto', 'Ceniceros', 'Parlantes',
    'Tapetes', 'Cant. de vidrios', 'Roceta', 'Soat', 'Tapiz',
    'Techo', 'Manual', 'Gasolina'
];

const ITEMS_BAJO_CAPO = [
    'Batería', 'Tapa Liq. Hidr', 'Tapa Liq. Freno', 'Tapa de radiador', 'Tapa Tq. de agua'
];

const ITEMS_ACCESORIOS = [
    'Llanta de Rep.', 'Herramientas', 'Gatas', 'Manija', 'Llave de ruedas',
    'Dado de Seguridad', 'Triángulo'
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    ordenId: number;
    placa: string;
}

export default function InventarioVehiculoModal({ isOpen, onClose, ordenId, placa }: Props) {
    const [activeTab, setActiveTab] = useState<'exterior' | 'interior' | 'bajo_capo' | 'accesorios'>('exterior');
    const [loading, setLoading] = useState(false);

    // State for checklist: { 'Parabrisas': 'compl', 'Radio': 'incompl', ... }
    const [exteriorData, setExteriorData] = useState<Record<string, string>>({});
    const [interiorData, setInteriorData] = useState<Record<string, string>>({});
    const [bajoCapoData, setBajoCapoData] = useState<Record<string, string>>({});
    const [accesoriosData, setAccesoriosData] = useState<Record<string, string>>({});
    const [observaciones, setObservaciones] = useState('');

    useEffect(() => {
        if (isOpen && ordenId) {
            loadData();
        }
    }, [isOpen, ordenId]);

    const loadData = async () => {
        setLoading(true);
        const data = await getInventarioByOrden(ordenId);
        if (data) {
            setExteriorData(data.exterior || {});
            setInteriorData(data.interior || {});
            setBajoCapoData(data.bajo_capo || {});
            setAccesoriosData(data.accesorios || {});
            setObservaciones(data.observaciones || '');
        } else {
            // Reset if new
            setExteriorData({});
            setInteriorData({});
            setBajoCapoData({});
            setAccesoriosData({});
            setObservaciones('');
        }
        setLoading(false);
    };

    const handleCheck = (section: 'exterior' | 'interior' | 'bajo_capo' | 'accesorios', item: string, status: string) => {
        if (section === 'exterior') setExteriorData(prev => ({ ...prev, [item]: status }));
        if (section === 'interior') setInteriorData(prev => ({ ...prev, [item]: status }));
        if (section === 'bajo_capo') setBajoCapoData(prev => ({ ...prev, [item]: status }));
        if (section === 'accesorios') setAccesoriosData(prev => ({ ...prev, [item]: status }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await saveInventarioVehiculo({
                id_orden_trabajo: ordenId,
                exterior: exteriorData,
                interior: interiorData,
                bajo_capo: bajoCapoData,
                accesorios: accesoriosData,
                observaciones
            });
            Swal.fire({
                icon: 'success',
                title: 'Guardado',
                text: 'Inventario del vehículo guardado correctamente',
                timer: 1500,
                showConfirmButton: false
            });
            onClose();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo guardar el inventario', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderChecklist = (items: string[], data: Record<string, string>, section: 'exterior' | 'interior' | 'bajo_capo' | 'accesorios') => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 max-h-[400px] overflow-y-auto px-2">
            {items.map(item => (
                <div key={item} className="flex items-center justify-between border-b border-gray-100 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 px-2 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium w-1/2">{item}</span>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                type="radio"
                                name={`${section}-${item}`}
                                checked={data[item] === 'compl'}
                                onChange={() => handleCheck(section, item, 'compl')}
                                className="w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer"
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Compl.</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                type="radio"
                                name={`${section}-${item}`}
                                checked={data[item] === 'incompl'}
                                onChange={() => handleCheck(section, item, 'incompl')}
                                className="w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Incompl.</span>
                        </label>
                    </div>
                </div>
            ))}
        </div>
    );

    // Helper for tab styling
    const getTabClass = (tabName: string) => {
        const isActive = activeTab === tabName;
        return `nav-btn px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-sm ${isActive
            ? 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none translate-y-[-1px]'
            : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-700'
            }`;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Car className="text-blue-600" size={24} />
                            Inventario del Vehículo
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                Placa: {placa}
                            </span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Marque el estado de cada componente.</p>
                    </div>
                </div>

                {/* Tabs - Button Style */}
                <div className="flex flex-wrap gap-2 px-6 mt-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('exterior')}
                        className={getTabClass('exterior')}
                    >
                        <Car size={16} />
                        EXTERIOR
                    </button>
                    <button
                        onClick={() => setActiveTab('interior')}
                        className={getTabClass('interior')}
                    >
                        <Layers size={16} />
                        INTERIOR
                    </button>
                    <button
                        onClick={() => setActiveTab('bajo_capo')}
                        className={getTabClass('bajo_capo')}
                    >
                        <Wrench size={16} />
                        BAJO CAPÓ
                    </button>
                    <button
                        onClick={() => setActiveTab('accesorios')}
                        className={getTabClass('accesorios')}
                    >
                        <Box size={16} />
                        ACCESORIOS
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'exterior' && renderChecklist(ITEMS_EXTERIOR, exteriorData, 'exterior')}
                            {activeTab === 'interior' && renderChecklist(ITEMS_INTERIOR, interiorData, 'interior')}
                            {activeTab === 'bajo_capo' && renderChecklist(ITEMS_BAJO_CAPO, bajoCapoData, 'bajo_capo')}
                            {activeTab === 'accesorios' && renderChecklist(ITEMS_ACCESORIOS, accesoriosData, 'accesorios')}

                            <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones Generales</label>
                                <textarea
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Ingrese observaciones sobre rayaduras, golpes u otros detalles..."
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                ></textarea>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2"
                    >
                        <X size={18} />
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 font-bold flex items-center gap-2"
                        disabled={loading}
                    >
                        <Save size={18} />
                        Guardar Inventario
                    </button>
                </div>
            </div>
        </div>
    );
}
