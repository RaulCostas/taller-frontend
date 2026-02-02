import { useState } from 'react';
import { ClipboardList, LayoutList, Calculator } from 'lucide-react';
import PlanillaGenerar from '../components/planillas/PlanillaGenerar';
import PlanillaHistorial from '../components/planillas/PlanillaHistorial';

const PersonalPlanilla = () => {
    const [activeTab, setActiveTab] = useState<'generar' | 'historial'>('generar');

    return (
        <div className="container mx-auto p-6 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <ClipboardList className="text-green-600" size={32} />
                        Planilla de Sueldos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de haberes mensuales</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
                <button
                    onClick={() => setActiveTab('generar')}
                    className={`nav-btn px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${activeTab === 'generar'
                        ? 'bg-green-600 text-white shadow-md transform -translate-y-0.5'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                >
                    <Calculator size={20} />
                    Generar / Editar
                </button>
                <button
                    onClick={() => setActiveTab('historial')}
                    className={`nav-btn px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${activeTab === 'historial'
                        ? 'bg-green-600 text-white shadow-md transform -translate-y-0.5'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                >
                    <LayoutList size={20} />
                    Historial y Pagos
                </button>
            </div>

            {/* Content */}
            <div className="animate-fadeIn">
                {activeTab === 'generar' ? <PlanillaGenerar /> : <PlanillaHistorial />}
            </div>
        </div>
    );
};

export default PersonalPlanilla;
