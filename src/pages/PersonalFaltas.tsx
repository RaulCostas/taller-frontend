import { CalendarX } from 'lucide-react';

const PersonalFaltas = () => {
    return (
        <div className="container mx-auto p-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <CalendarX className="text-red-600" size={32} />
                    Faltas y Vacaciones
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona las faltas, permisos y vacaciones del personal</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-300">
                    Módulo de Faltas y Vacaciones en construcción.
                </p>
            </div>
        </div>
    );
};

export default PersonalFaltas;
