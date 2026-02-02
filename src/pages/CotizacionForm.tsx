import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, FileText, User, Phone, Car, Hash, Edit, Upload } from 'lucide-react';
import Swal from 'sweetalert2';
import type { CreateCotizacionData, DetalleCotizacion } from '../types/cotizacion';
import { createCotizacion, updateCotizacion, getCotizacion } from '../services/cotizacionesService';
import { getAllMarcasAuto } from '../services/marcaAutoService';
import { getTiposVehiculos } from '../services/tipoVehiculoService';
import { getSeguros } from '../services/seguroService';
import { getInspectores } from '../services/inspectorService';
import { getPreciosTaller } from '../services/precioTallerService';
import { getPreciosSeguros as fetchPreciosSeguros } from '../services/precioSeguroService'; // Explicit import to avoid conflicts
import type { MarcaAuto } from '../types/marcaAuto';
import type { TipoVehiculo } from '../types/tipoVehiculo';
import type { Seguro } from '../types/seguro';
import type { Inspector } from '../types/inspector';
import type { PrecioTaller } from '../types/precioTaller';
import type { PrecioSeguro } from '../types/precioSeguro';
import { useAuth } from '../context/AuthContext';

const CotizacionForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [marcas, setMarcas] = useState<MarcaAuto[]>([]);
    const [tiposVehiculos, setTiposVehiculos] = useState<TipoVehiculo[]>([]);
    const [seguros, setSeguros] = useState<Seguro[]>([]);
    const [inspectores, setInspectores] = useState<Inspector[]>([]);
    const [preciosTaller, setPreciosTaller] = useState<PrecioTaller[]>([]);
    const [preciosSeguros, setPreciosSeguros] = useState<PrecioSeguro[]>([]);

    const [celularCode, setCelularCode] = useState('+591');
    const [celularNumber, setCelularNumber] = useState('');

    const [detalles, setDetalles] = useState<Partial<DetalleCotizacion>[]>([]);

    // Default empty detail line
    const [newDetalle, setNewDetalle] = useState<Partial<DetalleCotizacion>>({
        cantidad: 1,
        detalle: '',
        precio_unitario: 0,
        total: 0
    });

    const [formData, setFormData] = useState<CreateCotizacionData>({
        cliente: '',
        direccion: '',
        celular: '',
        nit: '',
        correo: '',
        particular_seguro: 'Particular',
        idseguro: 0,
        idinspector: 0,
        idmarca_auto: 0,
        modelo: '',
        placa: '',
        color: '',
        anio: new Date().getFullYear(),
        idtipo_vehiculo: 0,
        motor: '',
        chasis: '',
        moneda: 'Bolivianos',
        sub_total: 0,
        descuento: 0,
        total: 0,
        observaciones: '',
        idusuario: user?.id ? Number(user.id) : 0,
        detalles: []
    });

    useEffect(() => {
        loadRelatedData();
        if (isEditMode) {
            loadCotizacionData();
        }
    }, [id]);

    useEffect(() => {
        if (user?.id && !formData.idusuario) {
            setFormData(prev => ({ ...prev, idusuario: Number(user.id) }));
        }
    }, [user]);

    useEffect(() => {
        const combined = `${celularCode} ${celularNumber}`.trim();
        setFormData(prev => prev.celular !== combined ? { ...prev, celular: combined } : prev);
    }, [celularCode, celularNumber]);

    // Calculate totals automatically
    useEffect(() => {
        const subTotal = detalles.reduce((sum, d) => sum + (Number(d.total) || 0), 0);
        const total = Math.max(0, subTotal - (Number(formData.descuento) || 0));

        setFormData(prev => ({
            ...prev,
            sub_total: subTotal,
            total: total
        }));
    }, [detalles, formData.descuento]);

    const loadRelatedData = async () => {
        try {
            const [marcasData, tiposData, segurosData, inspectoresData, preciosTallerData, preciosSegurosData] = await Promise.all([
                getAllMarcasAuto(),
                getTiposVehiculos(),
                getSeguros(),
                getInspectores(),
                getPreciosTaller(),
                fetchPreciosSeguros()
            ]);
            setMarcas(marcasData.filter((m: MarcaAuto) => m.estado === 'activo'));
            setTiposVehiculos(tiposData.filter((t: TipoVehiculo) => t.estado === 'activo'));
            setSeguros(segurosData.filter((s: Seguro) => s.estado === 'activo'));
            setInspectores(inspectoresData.filter((i: Inspector) => i.estado === 'activo'));
            setPreciosTaller(preciosTallerData.filter((p: PrecioTaller) => p.estado === 'activo'));
            setPreciosSeguros(preciosSegurosData.filter((p: PrecioSeguro) => p.estado === 'activo'));
        } catch (error) {
            console.error('Error loading related data:', error);
        }
    };

    const loadCotizacionData = async () => {
        try {
            const cotizacion = await getCotizacion(Number(id!));

            if (cotizacion.celular) {
                const parts = cotizacion.celular.split(' ');
                if (parts.length > 1 && parts[0].startsWith('+')) {
                    setCelularCode(parts[0]);
                    setCelularNumber(parts.slice(1).join(' '));
                } else {
                    setCelularNumber(cotizacion.celular);
                }
            }

            setFormData({
                cliente: cotizacion.cliente,
                direccion: cotizacion.direccion || '',
                celular: cotizacion.celular || '',
                nit: cotizacion.nit || '',
                correo: cotizacion.correo || '',
                particular_seguro: cotizacion.particular_seguro || 'Particular',
                idseguro: cotizacion.seguro?.id ? Number(cotizacion.seguro.id) : 0,
                idinspector: cotizacion.inspector?.id ? Number(cotizacion.inspector.id) : 0,
                idmarca_auto: cotizacion.marca_auto?.id || 0,
                modelo: cotizacion.modelo,
                placa: cotizacion.placa,
                color: cotizacion.color || '',
                anio: cotizacion.anio || new Date().getFullYear(),
                idtipo_vehiculo: cotizacion.tipo_vehiculo?.id || 0,
                motor: cotizacion.motor || '',
                chasis: cotizacion.chasis || '',
                moneda: cotizacion.moneda,
                sub_total: cotizacion.sub_total,
                descuento: cotizacion.descuento,
                total: cotizacion.total,
                observaciones: cotizacion.observaciones || '',
                idusuario: cotizacion.usuario?.id ? Number(cotizacion.usuario.id) : 0,
                detalles: [] // We manage details in separate state for editing
            });

            if (cotizacion.detalles) {
                setDetalles(cotizacion.detalles);
            }

        } catch (error) {
            Swal.fire('Error', 'No se pudo cargar la cotización', 'error');
            navigate('/cotizaciones');
        }
    };

    const handleAddDetalle = () => {
        if (!newDetalle.detalle) return;

        const totalLine = (newDetalle.cantidad || 0) * (newDetalle.precio_unitario || 0);
        const itemToAdd = { ...newDetalle, total: totalLine };

        setDetalles([...detalles, itemToAdd]);
        setNewDetalle({ cantidad: 1, detalle: '', precio_unitario: 0, total: 0 });
    };

    const handleRemoveDetalle = (index: number) => {
        setDetalles(detalles.filter((_, i) => i !== index));
    };

    const handleNewDetalleChange = (field: keyof DetalleCotizacion, value: any) => {
        setNewDetalle(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'cantidad' || field === 'precio_unitario') {
                updated.total = (updated.cantidad || 0) * (updated.precio_unitario || 0);
            }
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            detalles: detalles.map(d => ({
                cantidad: Number(d.cantidad),
                precio_unitario: Number(d.precio_unitario),
                total: Number(d.total),
                detalle: d.detalle || '',
                observaciones: d.observaciones
            }))
        };

        // Validate required fields explicitly
        if (!payload.cliente) {
            Swal.fire('Error', 'Debe ingresar el nombre del cliente', 'warning');
            setLoading(false);
            return;
        }
        if (!payload.idmarca_auto || payload.idmarca_auto <= 0) {
            Swal.fire('Error', 'Debe seleccionar una marca de vehículo', 'warning');
            setLoading(false);
            return;
        }
        if (!payload.idtipo_vehiculo || payload.idtipo_vehiculo <= 0) {
            Swal.fire('Error', 'Debe seleccionar un tipo de vehículo', 'warning');
            setLoading(false);
            return;
        }
        if (!payload.modelo) {
            Swal.fire('Error', 'Debe ingresar el modelo del vehículo', 'warning');
            setLoading(false);
            return;
        }

        // Clean optional FKs to avoid FK constraint violations (ID 0)
        // We use 'any' casting temporarily to match the DTO flexibility or we adjust the type locally
        const cleanPayload: any = { ...payload };

        if (!cleanPayload.idseguro || cleanPayload.idseguro === 0) {
            delete cleanPayload.idseguro;
        }
        if (!cleanPayload.idinspector || cleanPayload.idinspector === 0) {
            delete cleanPayload.idinspector;
        }
        // Ensure idusuario is at least 0 or handled. If 0, backend might fail if FK exists but usually we should have a user.
        if (!cleanPayload.idusuario) {
            console.warn("Usuario no definido, enviando 1 por defecto (si existe) o fallará");
            // cleanPayload.idusuario = 1; // Potential fallback or let it fail? 
            // Better to alert if critical
        }

        try {
            if (isEditMode) {
                await updateCotizacion(Number(id), cleanPayload);
                Swal.fire({
                    title: 'Actualizado',
                    text: 'Cotización actualizada',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                await createCotizacion(cleanPayload);
                Swal.fire({
                    title: 'Creado',
                    text: 'Cotización creada exitosamente',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
            navigate('/cotizaciones');
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error al guardar la cotización', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/cotizaciones')}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all flex items-center gap-2"
                >
                    <ArrowLeft size={20} /> Volver
                </button>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    {isEditMode ? 'Editar Cotización' : 'Nueva Cotización'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">

                {/* Header Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                    {/* Cliente */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b pb-2 flex items-center gap-2 text-gray-800 dark:text-white">
                            <User size={20} className="text-blue-600" /> Datos del Cliente
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Cliente *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        required
                                        className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        value={formData.cliente}
                                        onChange={e => setFormData({ ...formData, cliente: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Celular</label>
                                    <div className="flex gap-2">
                                        <input
                                            className="w-20 p-2 border rounded-lg text-center bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            value={celularCode}
                                            onChange={e => setCelularCode(e.target.value)}
                                            placeholder="+591"
                                        />
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Phone size={16} className="text-gray-400" />
                                            </div>
                                            <input
                                                className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                                value={celularNumber}
                                                onChange={e => setCelularNumber(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">NIT</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FileText size={16} className="text-gray-400" />
                                        </div>
                                        <input
                                            className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            value={formData.nit || ''}
                                            onChange={e => setFormData({ ...formData, nit: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tipo de Atención */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b pb-2 flex items-center gap-2 text-gray-800 dark:text-white">
                            <FileText size={20} className="text-blue-600" /> Tipo de Atención
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo *</label>
                                <select
                                    className="w-full p-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    value={formData.particular_seguro}
                                    onChange={e => setFormData({ ...formData, particular_seguro: e.target.value })}
                                >
                                    <option value="Particular">Particular</option>
                                    <option value="Seguro">Seguro</option>
                                </select>
                            </div>

                            {formData.particular_seguro === 'Seguro' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-down">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Seguro *</label>
                                        <select
                                            className="w-full p-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            value={formData.idseguro}
                                            onChange={e => setFormData({ ...formData, idseguro: Number(e.target.value) })}
                                        >
                                            <option value="0">Seleccione...</option>
                                            {seguros.map(s => <option key={s.id} value={s.id}>{s.seguro}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Inspector</label>
                                        <select
                                            className="w-full p-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            value={formData.idinspector}
                                            onChange={e => setFormData({ ...formData, idinspector: Number(e.target.value) })}
                                        >
                                            <option value="0">Seleccione...</option>
                                            {inspectores
                                                .filter(i => formData.idseguro ? Number(i.seguro?.id) === Number(formData.idseguro) : true)
                                                .map(i => <option key={i.id} value={i.id}>{i.inspector}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vehículo */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold border-b pb-2 flex items-center gap-2 text-gray-800 dark:text-white">
                            <Car size={20} className="text-blue-600" /> Datos del Vehículo
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Marca *</label>
                                <select
                                    required
                                    className="w-full p-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    value={formData.idmarca_auto}
                                    onChange={e => setFormData({ ...formData, idmarca_auto: Number(e.target.value) })}
                                >
                                    <option value="">Seleccione...</option>
                                    {marcas.map(m => <option key={m.id} value={m.id}>{m.marca}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Modelo *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Car size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        required
                                        className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        value={formData.modelo}
                                        onChange={e => setFormData({ ...formData, modelo: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Placa</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        className="w-full pl-10 pr-3 py-2 border rounded-lg uppercase bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        value={formData.placa || ''}
                                        onChange={e => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Tipo</label>
                                <select
                                    required
                                    className="w-full p-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    value={formData.idtipo_vehiculo}
                                    onChange={e => setFormData({ ...formData, idtipo_vehiculo: Number(e.target.value) })}
                                >
                                    <option value="">Seleccione...</option>
                                    {tiposVehiculos.map(t => <option key={t.id} value={t.id}>{t.tipo}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detalles Grid */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold border-b pb-2 mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
                        <FileText size={20} className="text-blue-600" /> Detalles de Cotización
                    </h2>

                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-4">
                        <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-6 md:col-span-5">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Descripción</label>
                                <div className="flex flex-col gap-2">
                                    {formData.particular_seguro === 'Particular' ? (
                                        <select
                                            className="w-full p-2 border rounded text-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            value=""
                                            onChange={e => {
                                                const selected = preciosTaller.find(p => Number(p.id) === Number(e.target.value));
                                                if (selected) {
                                                    setNewDetalle(prev => ({
                                                        ...prev,
                                                        detalle: selected.detalle,
                                                        precio_unitario: Number(selected.precio),
                                                        // idprecio_taller: selected.id // If we want to save the relation
                                                        total: (prev.cantidad || 1) * Number(selected.precio)
                                                    }));
                                                }
                                            }}
                                        >
                                            <option value="">Seleccionar Trabajo...</option>
                                            {preciosTaller.map(p => (
                                                <option key={p.id} value={p.id}>{p.detalle} - {p.precio} Bs</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <select
                                            className="w-full p-2 border rounded text-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            value=""
                                            onChange={e => {
                                                const selected = preciosSeguros.find(p => Number(p.id) === Number(e.target.value));
                                                if (selected) {
                                                    setNewDetalle(prev => ({
                                                        ...prev,
                                                        detalle: selected.detalle,
                                                        precio_unitario: Number(selected.nivel1), // Default to nivel1
                                                        // idprecio_seguro: selected.id // If we want to save the relation
                                                        total: (prev.cantidad || 1) * Number(selected.nivel1)
                                                    }));
                                                }
                                            }}
                                        >
                                            <option value="">Seleccionar Trabajo (Seguro)...</option>
                                            {preciosSeguros
                                                .filter(p => !formData.idseguro || Number(p.seguro?.id) === Number(formData.idseguro))
                                                .map(p => (
                                                    <option key={p.id} value={p.id}>{p.detalle} - {p.nivel1} Bs</option>
                                                ))}
                                        </select>
                                    )}
                                    <input
                                        className="w-full p-2 border rounded text-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        placeholder="Descripción del item..."
                                        value={newDetalle.detalle}
                                        onChange={e => handleNewDetalleChange('detalle', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Cant.</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full p-2 border rounded text-sm text-center bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    value={newDetalle.cantidad}
                                    onChange={e => handleNewDetalleChange('cantidad', Number(e.target.value))}
                                />
                            </div>
                            <div className="col-span-2 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">P. Unit.</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2 border rounded text-sm text-right bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    value={newDetalle.precio_unitario}
                                    onChange={e => handleNewDetalleChange('precio_unitario', Number(e.target.value))}
                                />
                            </div>
                            <div className="col-span-2 md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Total</label>
                                <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded text-sm text-right font-bold text-gray-900 dark:text-white">
                                    {Number(newDetalle.total).toFixed(2)}
                                </div>
                            </div>
                            <div className="col-span-12 md:col-span-1 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleAddDetalle}
                                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="p-3 text-left text-gray-700 dark:text-gray-300">Descripción</th>
                                    <th className="p-3 text-center w-20 text-gray-700 dark:text-gray-300">Cant.</th>
                                    <th className="p-3 text-right w-32 text-gray-700 dark:text-gray-300">P. Unit.</th>
                                    <th className="p-3 text-right w-32 text-gray-700 dark:text-gray-300">Total</th>
                                    <th className="p-3 w-32 text-center text-gray-700 dark:text-gray-300">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {detalles.map((d, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-3 text-gray-800 dark:text-gray-300">{d.detalle}</td>
                                        <td className="p-3 text-center text-gray-800 dark:text-gray-300">{d.cantidad}</td>
                                        <td className="p-3 text-right text-gray-800 dark:text-gray-300">{Number(d.precio_unitario).toFixed(2)}</td>
                                        <td className="p-3 text-right font-medium text-gray-900 dark:text-white">{Number(d.total).toFixed(2)}</td>
                                        <td className="p-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    type="button"
                                                    title="Subir imágenes"
                                                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                    onClick={() => {/* Implement Image Logic later or here */ Swal.fire('Info', 'Funcionalidad de imágenes pendiente', 'info') }}
                                                >
                                                    <Upload size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Editar"
                                                    className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                                                    onClick={() => {
                                                        const itemToEdit = detalles[index];
                                                        setNewDetalle(itemToEdit);
                                                        handleRemoveDetalle(index);
                                                    }}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Eliminar"
                                                    onClick={() => handleRemoveDetalle(index)}
                                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {detalles.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            No hay items agregados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Totals */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-t pt-6 dark:border-gray-700">
                    <div className="w-full md:w-1/2">
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Observaciones</label>
                        <textarea
                            className="w-full p-3 border rounded-lg bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            rows={3}
                            value={formData.observaciones}
                            onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                        />
                    </div>

                    <div className="w-full md:w-1/3 space-y-3 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Moneda</span>
                            <select
                                className="w-32 h-10 px-2 py-1 border border-gray-300 rounded bg-white text-base text-gray-900 dark:bg-gray-600 dark:text-white dark:border-gray-500 text-right focus:ring-2 focus:ring-blue-500"
                                value={formData.moneda}
                                onChange={e => setFormData({ ...formData, moneda: e.target.value })}
                            >
                                <option value="Bolivianos">Bob (Bs)</option>
                                <option value="Dolares">Sus ($us)</option>
                            </select>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                            <span className="font-bold text-gray-900 dark:text-white">{Number(formData.sub_total || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Descuento</span>
                            <input
                                type="number"
                                className="w-24 p-1 text-right border border-gray-300 rounded text-sm bg-white text-gray-900 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                value={formData.descuento}
                                onChange={e => setFormData({ ...formData, descuento: Number(e.target.value) })}
                            />
                        </div>
                        <div className="border-t pt-3 flex justify-between items-center text-xl font-bold text-blue-700 dark:text-blue-400">
                            <span>TOTAL</span>
                            <span className="text-2xl">{Number(formData.total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/cotizaciones')}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                        <ArrowLeft size={20} />
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center gap-2 px-6 py-3 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        <Save size={20} />
                        {loading ? (isEditMode ? 'Actualizando...' : 'Guardando...') : (isEditMode ? 'Actualizar Cotización' : 'Guardar Cotización')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CotizacionForm;
