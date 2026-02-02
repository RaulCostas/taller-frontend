import React, { useState, useEffect } from 'react';
import type { CreatePersonalData, Personal } from '../../types/personal';
import type { AreaPersonal } from '../../types/areaPersonal';
import { getAreasPersonal } from '../../services/areaPersonalService';
import { User, CreditCard, Calendar, Phone, MapPin, Smartphone, Briefcase, DollarSign, Activity, Save, X, UserPlus, Users, ChevronDown } from 'lucide-react';

interface PersonalFormProps {
    initialData?: Personal | null;
    onSubmit: (data: CreatePersonalData) => Promise<void>;
    onCancel: () => void;
}

export const PersonalForm: React.FC<PersonalFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<CreatePersonalData>({
        nombre: '',
        paterno: '',
        materno: '',
        ci: '',
        fecha_nacimiento: '',
        direccion: '',
        telefono: '',
        celular: '591 ',
        tipo: 'Planta',
        areaId: '',
        fecha_ingreso: '',
        salario: 0,
        estado: 'activo'
    });
    const [areas, setAreas] = useState<AreaPersonal[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const data = await getAreasPersonal();
                setAreas(data.filter(a => a.estado === 'activo'));
            } catch (error) {
                console.error("Error loading areas", error);
            }
        };
        fetchAreas();

        if (initialData) {
            setFormData({
                nombre: initialData.nombre,
                paterno: initialData.paterno,
                materno: initialData.materno,
                ci: initialData.ci,
                fecha_nacimiento: initialData.fecha_nacimiento || '',
                direccion: initialData.direccion || '',
                telefono: initialData.telefono || '',
                celular: initialData.celular || '591 ',
                tipo: initialData.tipo,
                areaId: initialData.area?.id || '',
                fecha_ingreso: initialData.fecha_ingreso || '',
                salario: initialData.salario || 0,
                estado: initialData.estado
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                        <UserPlus size={24} />
                    </span>
                    {initialData ? 'Editar Personal' : 'Registrar Nuevo Personal'}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Datos Personales */}
                <div className="col-span-1 md:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 bg-gray-100 dark:bg-gray-700 p-2 rounded flex items-center gap-2">
                        <User size={20} />
                        Datos Personales
                    </h3>
                </div>

                <div>
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <input
                            type="text"
                            required
                            value={formData.nombre}
                            onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nombres"
                        />
                    </div>
                </div>
                <div>
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Paterno</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <input
                            type="text"
                            required
                            value={formData.paterno}
                            onChange={e => setFormData({ ...formData, paterno: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Apellido Paterno"
                        />
                    </div>
                </div>
                <div>
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Materno</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <input
                            type="text"
                            required
                            value={formData.materno}
                            onChange={e => setFormData({ ...formData, materno: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Apellido Materno"
                        />
                    </div>
                </div>
                <div>
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">CI</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <input
                            type="text"
                            required
                            value={formData.ci}
                            onChange={e => setFormData({ ...formData, ci: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Cédula de Identidad"
                        />
                    </div>
                </div>
                <div>
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Fecha Nacimiento</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <input
                            type="date"
                            value={formData.fecha_nacimiento}
                            onChange={e => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Contacto */}
                <div className="col-span-1 md:col-span-2 mt-2">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 bg-gray-100 dark:bg-gray-700 p-2 rounded flex items-center gap-2">
                        <Phone size={20} />
                        Datos de Contacto
                    </h3>
                </div>

                <div className="md:col-span-2">
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <input
                            type="text"
                            value={formData.direccion}
                            onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Dirección completa"
                        />
                    </div>
                </div>
                <div>
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Celular</label>
                    <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <input
                            type="text"
                            value={formData.celular}
                            onChange={e => setFormData({ ...formData, celular: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <input
                            type="text"
                            value={formData.telefono}
                            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Teléfono fijo"
                        />
                    </div>
                </div>

                {/* Datos Laborales */}
                <div className="col-span-1 md:col-span-2 mt-2">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 bg-gray-100 dark:bg-gray-700 p-2 rounded flex items-center gap-2">
                        <Briefcase size={20} />
                        Datos Laborales
                    </h3>
                </div>

                <div>
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Tipo Personal</label>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" size={18} />
                        <select
                            value={formData.tipo}
                            onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <option value="Planta">Planta</option>
                            <option value="Contratista">Contratista</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                </div>
                <div>
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Área</label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" size={18} />
                        <select
                            required
                            value={formData.areaId}
                            onChange={e => setFormData({ ...formData, areaId: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <option value="">Seleccione Área...</option>
                            {areas.map(area => (
                                <option key={area.id} value={area.id}>{area.area}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                </div>
                <div>
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Fecha Ingreso</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <input
                            type="date"
                            value={formData.fecha_ingreso}
                            onChange={e => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Salario (Bs.)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                        <input
                            type="number"
                            step="0.01"
                            value={formData.salario}
                            onChange={e => setFormData({ ...formData, salario: parseFloat(e.target.value) || 0 })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Estado</label>
                    <div className="relative">
                        <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" size={18} />
                        <select
                            value={formData.estado}
                            onChange={e => setFormData({ ...formData, estado: e.target.value })}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                    type="button"
                    onClick={onCancel}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <X size={20} />
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50"
                >
                    <Save size={20} />
                    {submitting ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
    );
};
