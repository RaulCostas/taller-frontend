import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, FileText, Users, Car } from 'lucide-react';

const ConfiguracionesGeneral = () => {
    const navigate = useNavigate();

    return (
        <div className="content-card">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/configuraciones')}
                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Volver"
                >
                    <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                </button>
                <div className="flex items-center gap-3">
                    <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </span>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                        Configuración General
                    </h2>
                </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                Administración de catálogos y parámetros generales del sistema.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Card - Red Banco */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-rose-100 dark:bg-rose-900 rounded-lg">
                            <CreditCard className="text-rose-600 dark:text-rose-300" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Red Banco
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 min-h-[40px]">
                        Administre las redes de banco y sus comisiones por tarjeta.
                    </p>
                    <Link to="/configuraciones/comision-tarjeta" className="block w-full text-center bg-rose-600 hover:bg-rose-700 text-white hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        Configurar
                    </Link>
                </div>

                {/* Card - Facturación / Formas de Pago */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                            <CreditCard className="text-emerald-600 dark:text-emerald-300" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Formas de Pago
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 min-h-[40px]">
                        Administre los métodos de pago aceptados (Efectivo, Transferencia, QR, etc.)
                    </p>
                    <Link to="/configuraciones/forma-pago" className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        Configurar
                    </Link>
                </div>

                {/* Card - Categorías de Servicios */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-lg">
                            <FileText className="text-teal-600 dark:text-teal-300" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Categorías de Servicios
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 min-h-[40px]">
                        Clasificación para los servicios ofrecidos por el taller.
                    </p>
                    <Link to="/configuraciones/categoria-servicio" className="block w-full text-center bg-teal-600 hover:bg-teal-700 text-white hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        Configurar
                    </Link>
                </div>

                {/* Card - Área de Personal */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                            <Users className="text-indigo-600 dark:text-indigo-300" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Área de Personal
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 min-h-[40px]">
                        Defina las áreas y departamentos para la organización del personal.
                    </p>
                    <Link to="/configuraciones/area-personal" className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        Configurar
                    </Link>
                </div>

                {/* Card - Marcas de Autos */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                            <Car className="text-orange-600 dark:text-orange-300" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Marcas de Autos
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 min-h-[40px]">
                        Gestión del catálogo de marcas de vehículos.
                    </p>
                    <Link to="/configuraciones/marca-auto" className="block w-full text-center bg-orange-600 hover:bg-orange-700 text-white hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        Configurar
                    </Link>
                </div>

                {/* Card - Tipos de Vehículos */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Car className="text-blue-600 dark:text-blue-300" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Tipos de Vehículos
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 min-h-[40px]">
                        Gestión del catálogo de tipos de vehículos (Sedán, SUV, Camioneta, etc.)
                    </p>
                    <Link to="/configuraciones/tipos-vehiculos" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        Configurar
                    </Link>
                </div>

                {/* Card - Unidades de Medida */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                            <FileText className="text-red-600 dark:text-red-300" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Unidades de Medida
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 min-h-[40px]">
                        Gestión de unidades de medida (Metro, Litro, Pieza, etc.)
                    </p>
                    <Link to="/configuraciones/unidad-medida" className="block w-full text-center bg-red-600 hover:bg-red-700 text-white hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        Configurar
                    </Link>
                </div>

                {/* Card - Grupos de Inventario */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <FileText className="text-purple-600 dark:text-purple-300" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Grupos de Inventario
                        </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 min-h-[40px]">
                        Clasificación de grupos de inventario (Repuestos, Aceites, etc.)
                    </p>
                    <Link to="/configuraciones/grupo-inventario" className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white hover:text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        Configurar
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default ConfiguracionesGeneral;
