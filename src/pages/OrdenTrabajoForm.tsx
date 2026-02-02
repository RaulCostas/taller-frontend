import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Briefcase, Shield, User, Phone, FileText, MapPin, Mail, Car, Settings, Hash, Gauge } from 'lucide-react';
import Swal from 'sweetalert2';
import type { CreateOrdenTrabajoData } from '../types/ordenTrabajo';
import { createOrdenTrabajo, updateOrdenTrabajo, getOrdenTrabajo, getOrdenTrabajoByPlaca } from '../services/ordenTrabajoService';
import { getSeguros } from '../services/seguroService';
import { getInspectores } from '../services/inspectorService';
import { getAllMarcasAuto } from '../services/marcaAutoService';
import { getTiposVehiculos } from '../services/tipoVehiculoService';
import type { Seguro } from '../types/seguro';
import type { Inspector } from '../types/inspector';
import type { MarcaAuto } from '../types/marcaAuto';
import type { TipoVehiculo } from '../types/tipoVehiculo';
import { createDetalleOrdenTrabajo } from '../services/detalleOrdenTrabajoService';
import { useAuth } from '../context/AuthContext';
import OrdenTrabajoDetalles from './OrdenTrabajoDetalles';


const OrdenTrabajoForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [seguros, setSeguros] = useState<Seguro[]>([]);
    const [inspectores, setInspectores] = useState<Inspector[]>([]);
    const [marcas, setMarcas] = useState<MarcaAuto[]>([]);
    const [tiposVehiculos, setTiposVehiculos] = useState<TipoVehiculo[]>([]);

    // Estados para el número de celular
    const [celularCode, setCelularCode] = useState('+591');
    const [celularNumber, setCelularNumber] = useState('');

    const [localDetalles, setLocalDetalles] = useState<any[]>([]);

    const handleAddLocal = (detalle: any) => {
        setLocalDetalles([...localDetalles, { ...detalle, id: Date.now() }]);
    };

    const handleRemoveLocal = (index: number) => {
        setLocalDetalles(localDetalles.filter((_, i) => i !== index));
    };

    // Memoize onTotalChange to prevent infinite re-renders
    const handleTotalChange = useCallback((total: number) => {
        setFormData(prev => {
            // Only update if the value actually changed
            if (prev.sub_total !== total) {
                return { ...prev, sub_total: total };
            }
            return prev;
        });
    }, []);

    const [formData, setFormData] = useState<CreateOrdenTrabajoData>({
        particular_seguro: 'Particular',
        fecha_recepcion: new Date().toISOString().split('T')[0],
        cliente: '',
        direccion: '',
        celular: '',
        nit: '',
        correo: '',
        idseguro: '',
        idinspector: '',
        idmarca_auto: 0,
        modelo: '',
        placa: '',
        color: '',
        anio: new Date().getFullYear(),
        idtipo_vehiculo: 0,
        motor: '',
        chasis: '',
        km_ingreso: 0,
        km_egreso: 0,
        codigo_pintura: '',
        plazo_entrega: 0,
        moneda: 'Bolivianos',
        sub_total: 0,
        descuento: 0,
        total: 0,
        observaciones: '',
        facturado: false,
        cancelado: false,
        idusuario: user?.id || '',
        estado: 'activo'
    });

    useEffect(() => {
        loadRelatedData();
        if (isEditMode) {
            loadOrdenData();
        }
    }, [id]);

    useEffect(() => {
        // Auto-calculate total
        const subTotal = isNaN(formData.sub_total) ? 0 : formData.sub_total;
        const descuento = isNaN(formData.descuento) ? 0 : formData.descuento;
        const newTotal = Math.max(0, subTotal - descuento);

        // Only update if the total has actually changed
        if (formData.total !== newTotal) {
            setFormData(prev => ({ ...prev, total: newTotal }));
        }
    }, [formData.sub_total, formData.descuento]);

    useEffect(() => {
        // Update idusuario when user is available
        if (user?.id && !formData.idusuario) {
            setFormData(prev => ({ ...prev, idusuario: user.id }));
        }
    }, [user]);

    // Sincronizar código y número con formData
    useEffect(() => {
        const combined = `${celularCode} ${celularNumber}`.trim();
        setFormData(prev => {
            if (prev.celular !== combined) {
                return { ...prev, celular: combined };
            }
            return prev;
        });
    }, [celularCode, celularNumber]);

    // Autocompletar datos basados en la placa
    useEffect(() => {
        const fetchDataByPlaca = async () => {
            // Solo buscar si no estamos en modo edición y la placa tiene al menos 3 caracteres
            if (isEditMode || !formData.placa || formData.placa.length < 3) {
                return;
            }

            try {
                const ordenAnterior = await getOrdenTrabajoByPlaca(formData.placa);

                if (ordenAnterior) {
                    // Parsear celular
                    if (ordenAnterior.celular) {
                        const parts = ordenAnterior.celular.split(' ');
                        if (parts.length > 1 && parts[0].startsWith('+')) {
                            setCelularCode(parts[0]);
                            setCelularNumber(parts.slice(1).join(' '));
                        } else {
                            setCelularNumber(ordenAnterior.celular);
                        }
                    }

                    // Autocompletar datos del vehículo
                    setFormData(prev => ({
                        ...prev,
                        idmarca_auto: ordenAnterior.marca_auto?.id || prev.idmarca_auto,
                        modelo: ordenAnterior.modelo || prev.modelo,
                        idtipo_vehiculo: ordenAnterior.tipo_vehiculo?.id || prev.idtipo_vehiculo,
                        color: ordenAnterior.color || prev.color,
                        anio: ordenAnterior.anio || prev.anio,
                        motor: ordenAnterior.motor || prev.motor,
                        chasis: ordenAnterior.chasis || prev.chasis,
                        codigo_pintura: ordenAnterior.codigo_pintura || prev.codigo_pintura,
                        // Autocompletar datos del cliente
                        cliente: ordenAnterior.cliente || prev.cliente,
                        // celular se maneja via estado separado ahora
                        nit: ordenAnterior.nit || prev.nit,
                        direccion: ordenAnterior.direccion || prev.direccion,
                        correo: ordenAnterior.correo || prev.correo
                    }));
                }
            } catch (error) {
                console.error('Error fetching data by placa:', error);
            }
        };

        // Debounce para evitar demasiadas llamadas
        const timeoutId = setTimeout(fetchDataByPlaca, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.placa, isEditMode]);



    const loadRelatedData = async () => {
        try {
            const [segurosData, inspectoresData, marcasData, tiposData] = await Promise.all([
                getSeguros(),
                getInspectores(),
                getAllMarcasAuto(),
                getTiposVehiculos()
            ]);
            setSeguros(segurosData.filter((s: Seguro) => s.estado === 'activo'));
            setInspectores(inspectoresData.filter((i: Inspector) => i.estado === 'activo'));
            setMarcas(marcasData.filter((m: MarcaAuto) => m.estado === 'activo'));
            setTiposVehiculos(tiposData.filter((t: TipoVehiculo) => t.estado === 'activo'));
        } catch (error) {
            console.error('Error loading related data:', error);
        }
    };

    const loadOrdenData = async () => {
        try {
            const orden = await getOrdenTrabajo(Number(id!));

            // Parsear celular existing
            if (orden.celular) {
                const parts = orden.celular.split(' ');
                if (parts.length > 1 && parts[0].startsWith('+')) {
                    setCelularCode(parts[0]);
                    setCelularNumber(parts.slice(1).join(' '));
                } else {
                    setCelularNumber(orden.celular);
                }
            }

            setFormData({
                particular_seguro: orden.particular_seguro,
                cliente: orden.cliente,
                direccion: orden.direccion || '',
                celular: orden.celular || '',
                nit: orden.nit || '',
                correo: orden.correo || '',
                idseguro: orden.seguro?.id || '',
                idinspector: orden.inspector?.id || '',
                idmarca_auto: orden.marca_auto?.id || 0,
                modelo: orden.modelo,
                placa: orden.placa,
                color: orden.color || '',
                anio: orden.anio || new Date().getFullYear(),
                idtipo_vehiculo: orden.tipo_vehiculo?.id || 0,
                motor: orden.motor || '',
                chasis: orden.chasis || '',
                km_ingreso: orden.km_ingreso || 0,
                km_egreso: orden.km_egreso || 0,
                codigo_pintura: orden.codigo_pintura || '',
                plazo_entrega: orden.plazo_entrega || 0,
                moneda: orden.moneda,
                sub_total: orden.sub_total,
                descuento: orden.descuento,
                total: orden.total,
                observaciones: orden.observaciones || '',
                facturado: orden.facturado,
                cancelado: orden.cancelado,
                idusuario: orden.usuario?.id || user?.id || '',
                estado: orden.estado
            });
        } catch (error) {
            console.error('Error loading orden:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar la orden'
            });
        }
    };




    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);

        try {
            if (isEditMode) {
                const targetId = Number(id);
                await updateOrdenTrabajo(targetId, formData);
                await Swal.fire({
                    icon: 'success',
                    title: 'Actualizado',
                    text: 'Orden actualizada exitosamente',
                    showConfirmButton: false,
                    timer: 1500
                });
                navigate('/ordenes-trabajo/list');
            } else {
                // Crear la orden (Header)
                const { detalles, ...orderData } = formData as any; // Exclude detalles from header creation if present
                const newOrden = await createOrdenTrabajo(orderData);
                console.log('Orden Header Created:', newOrden.id);

                // Guardar detalles secuencialmente
                if (localDetalles.length > 0) {
                    for (const detalle of localDetalles) {
                        try {
                            const detallePayload = {
                                idorden_trabajo: newOrden.id,
                                idprecio_taller: detalle.idprecio_taller || undefined,
                                idprecio_seguro: detalle.idprecio_seguro || undefined,
                                cantidad: detalle.cantidad,
                                precio_unitario: detalle.precio_unitario,
                                total: detalle.total,
                                nivel: detalle.nivel || undefined,
                                detalle: detalle.detalle || undefined,
                                observaciones: detalle.observaciones || undefined
                            };
                            await createDetalleOrdenTrabajo(detallePayload);
                        } catch (err) {
                            console.error('Error saving detail:', err);
                            // Opcional: Mostrar alerta o continuar
                        }
                    }
                }

                await Swal.fire({
                    icon: 'success',
                    title: 'Creado',
                    text: 'Orden guardada exitosamente',
                    showConfirmButton: false,
                    timer: 1500
                });

                // Navigate to order list
                navigate('/ordenes-trabajo/list');
            }
        } catch (error: any) {
            console.error('Error saving orden:', error);
            const errorMessage = error.response?.data?.message || 'Error al guardar la orden';
            const formattedMessage = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: formattedMessage
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => navigate('/ordenes-trabajo/list')}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <ArrowLeft size={20} />
                    Volver
                </button>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    {isEditMode ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}
                </h1>
            </div>

            <form id="orden-form" onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">


                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sección 1: Datos de Recepción */}
                    <div className="md:col-span-4">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <Calendar size={20} className="text-blue-600" />
                            Datos de Recepción
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        value={formData.fecha_recepcion || new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setFormData({ ...formData, fecha_recepcion: e.target.value })}
                                        required
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Orden *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Briefcase size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        value={formData.particular_seguro}
                                        onChange={(e) => setFormData({ ...formData, particular_seguro: e.target.value })}
                                        required
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="Particular">Particular</option>
                                        <option value="Seguro">Seguro</option>
                                    </select>
                                </div>
                            </div>

                            {formData.particular_seguro === 'Seguro' && (
                                <>
                                    <div className="md:col-span-2">
                                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Seguro</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Shield size={16} className="text-gray-400" />
                                            </div>
                                            <select
                                                value={formData.idseguro || ''}
                                                onChange={(e) => setFormData({ ...formData, idseguro: e.target.value })}
                                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                            >
                                                <option value="">Seleccione...</option>
                                                {seguros.map(seguro => (
                                                    <option key={seguro.id} value={seguro.id}>{seguro.seguro}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Inspector</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User size={16} className="text-gray-400" />
                                            </div>
                                            <select
                                                value={formData.idinspector || ''}
                                                onChange={(e) => setFormData({ ...formData, idinspector: e.target.value })}
                                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                            >
                                                <option value="">Seleccione...</option>
                                                {formData.idseguro && inspectores
                                                    .filter(inspector => String(inspector.seguro?.id) === String(formData.idseguro))
                                                    .map(inspector => (
                                                        <option key={inspector.id} value={inspector.id}>{inspector.inspector}</option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sección 2: Datos del Vehículo */}
                    <div className="md:col-span-4">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <Car size={20} className="text-blue-600" />
                            Datos del Vehículo
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Placa *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FileText size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.placa}
                                        onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                                        required
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-bold tracking-wider"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Marca *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Car size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        value={formData.idmarca_auto || ''}
                                        onChange={(e) => setFormData({ ...formData, idmarca_auto: parseInt(e.target.value) || 0 })}
                                        required
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="">Seleccione...</option>
                                        {marcas.map((marca) => (
                                            <option key={marca.id} value={marca.id}>{marca.marca}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Modelo *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Car size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.modelo}
                                        onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                                        required
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo Vehículo *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Car size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        value={formData.idtipo_vehiculo || ''}
                                        onChange={(e) => setFormData({ ...formData, idtipo_vehiculo: parseInt(e.target.value) || 0 })}
                                        required
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="">Seleccione...</option>
                                        {tiposVehiculos.map(tipo => (
                                            <option key={tipo.id} value={tipo.id}>{tipo.tipo}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: formData.color || 'transparent' }}></div>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.color || ''}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Año</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={formData.anio || ''}
                                        onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) || 0 })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Motor</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Settings size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.motor || ''}
                                        onChange={(e) => setFormData({ ...formData, motor: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Chasis</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.chasis || ''}
                                        onChange={(e) => setFormData({ ...formData, chasis: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Cod Pintura</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.codigo_pintura || ''}
                                        onChange={(e) => setFormData({ ...formData, codigo_pintura: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Km Ingreso</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Gauge size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={formData.km_ingreso || ''}
                                        onChange={(e) => setFormData({ ...formData, km_ingreso: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Km Egreso</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Gauge size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={formData.km_egreso || ''}
                                        onChange={(e) => setFormData({ ...formData, km_egreso: parseFloat(e.target.value) || 0 })}
                                        readOnly={!isEditMode}
                                        className={`w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm ${!isEditMode ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 3: Datos del Cliente */}
                    <div className="md:col-span-4">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <User size={20} className="text-blue-600" />
                            Datos del Cliente
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Cliente *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.cliente}
                                        onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                                        required
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Celular</label>
                                <div className="relative flex gap-2">
                                    <div className="w-24 relative">
                                        <input
                                            type="text"
                                            value={celularCode}
                                            onChange={(e) => setCelularCode(e.target.value)}
                                            className="w-full pl-2 pr-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm text-center"
                                            placeholder="+591"
                                        />
                                    </div>
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone size={16} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={celularNumber}
                                            onChange={(e) => setCelularNumber(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                            placeholder="Celular"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">NIT</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FileText size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.nit || ''}
                                        onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.direccion || ''}
                                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Correo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={formData.correo || ''}
                                        onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 4: Información Adicional */}
                    <div className="md:col-span-4">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <FileText size={20} className="text-blue-600" />
                            Información Adicional
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Plazo de Entrega (Días) *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={formData.plazo_entrega || ''}
                                        onChange={(e) => setFormData({ ...formData, plazo_entrega: parseInt(e.target.value) || 0 })}
                                        required
                                        min="1"
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Moneda</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Briefcase size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        value={formData.moneda}
                                        onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="Bolivianos">Bolivianos</option>
                                        <option value="Dolares">Dólares</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Sub Total</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-400 text-sm">{formData.moneda === 'Bolivianos' ? 'Bs' : '$'}</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.sub_total || 0}
                                        readOnly
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-bold cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Descuento</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-400 text-sm">{formData.moneda === 'Bolivianos' ? 'Bs' : '$'}</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.descuento || ''}
                                        onChange={(e) => setFormData({ ...formData, descuento: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Total</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-400 text-sm font-bold">{formData.moneda === 'Bolivianos' ? 'Bs' : '$'}</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.total || 0}
                                        readOnly
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-bold cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-4">
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                                <textarea
                                    value={formData.observaciones || ''}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    rows={2}
                                    className="w-full padding-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm p-2"
                                />
                            </div>
                        </div>
                    </div>







                </div>
            </form >

            {/* Sección de Detalles de Trabajo */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FileText size={24} className="text-blue-600" />
                    Detalles del Trabajo
                </h2>
                <OrdenTrabajoDetalles
                    ordenId={isEditMode ? Number(id) : undefined}
                    localDetalles={!isEditMode ? localDetalles : undefined}
                    onAddLocal={!isEditMode ? handleAddLocal : undefined}
                    onRemoveLocal={!isEditMode ? handleRemoveLocal : undefined}
                    embedded={true}
                    particularSeguro={formData.particular_seguro}
                    onTotalChange={handleTotalChange}
                />
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    onClick={() => navigate('/ordenes-trabajo/list')}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    form="orden-form"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transform hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50 text-sm"
                >
                    <Save size={18} />
                    {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Cambios' : 'Guardar Orden')}
                </button>
            </div>
        </div >
    );
};

export default OrdenTrabajoForm;
