import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Calendar, DollarSign, Trash2, Edit, Save, X, Hash, Layers, Image as ImageIcon, Upload, Check } from 'lucide-react';
import { uploadFile } from '../services/fileService';
import Swal from 'sweetalert2';
import type { DetalleOrdenTrabajo, CreateDetalleOrdenTrabajoData } from '../types/detalleOrdenTrabajo';
import type { PrecioTaller } from '../types/precioTaller';
import type { PrecioSeguro } from '../types/precioSeguro';
import { getDetallesByOrden, createDetalleOrdenTrabajo, deleteDetalleOrdenTrabajo, updateDetalleOrdenTrabajo } from '../services/detalleOrdenTrabajoService';
import { getPreciosTaller } from '../services/precioTallerService';
import { getPreciosSeguros } from '../services/precioSeguroService';
import { getOrdenTrabajo, updateOrdenTrabajo } from '../services/ordenTrabajoService';
import type { OrdenTrabajo } from '../types/ordenTrabajo';


interface OrdenTrabajoDetallesProps {
    ordenId?: number;
    localDetalles?: any[];
    onAddLocal?: (detalle: any) => void;
    onRemoveLocal?: (index: number) => void;
    embedded?: boolean;
    particularSeguro?: string;
    onTotalChange?: (total: number) => void;
}

const OrdenTrabajoDetalles = ({ ordenId, localDetalles, onAddLocal, onRemoveLocal, embedded, particularSeguro, onTotalChange }: OrdenTrabajoDetallesProps) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const activeId = ordenId || (id ? Number(id) : null);

    // Si estamos en modo embebido (por prop o por id), no mostrar ciertas secciones
    const isEmbedded = embedded || !!ordenId;

    const [orden, setOrden] = useState<OrdenTrabajo | null>(null);
    const [detalles, setDetalles] = useState<DetalleOrdenTrabajo[]>([]);
    const [preciosTaller, setPreciosTaller] = useState<PrecioTaller[]>([]);
    const [preciosSeguros, setPreciosSeguros] = useState<PrecioSeguro[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        idprecio_taller: '',
        idprecio_seguro: '',
        cantidad: 1,
        precio_unitario: 0,
        nivel: '',
        detalle: '',
        observaciones: '',
        imagenes: [] as string[]
    });
    const [uploading, setUploading] = useState(false);

    // Estado para edición de detalles (Observaciones e Imágenes)
    const [editingDetalle, setEditingDetalle] = useState<DetalleOrdenTrabajo | null>(null);
    const [detailForm, setDetailForm] = useState({
        observaciones: '',
        imagenes: [] as string[]
    });

    // Estado para edición de detalle completo (todos los campos)
    const [editingDetalleMain, setEditingDetalleMain] = useState<DetalleOrdenTrabajo | null>(null);
    const [editForm, setEditForm] = useState({
        idprecio_taller: '',
        idprecio_seguro: '',
        cantidad: 1,
        precio_unitario: 0,
        nivel: '',
        observaciones: ''
    });

    // Estado para vista previa de imagen
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Estados para edición de información adicional de la orden
    const [ordenForm, setOrdenForm] = useState({
        plazo_entrega: 0,
        moneda: 'bolivianos',
        observaciones: ''
    });
    const [savingOrden, setSavingOrden] = useState(false);

    const handleToggleForm = () => {
        if (!showForm) {
            setFormData({
                idprecio_taller: '',
                idprecio_seguro: '',
                cantidad: 1,
                precio_unitario: 0,
                nivel: '',
                detalle: '',
                observaciones: '',
                imagenes: []
            });
        }
        setShowForm(!showForm);
    };
    useEffect(() => {
        loadData();
    }, [activeId]);

    // Sync localDetalles to detalles for display
    useEffect(() => {
        if (!activeId && localDetalles) {
            setDetalles(localDetalles as DetalleOrdenTrabajo[]);
        }
    }, [localDetalles, activeId]);

    // Calculate total and notify parent whenever details change
    useEffect(() => {
        if (onTotalChange) {
            const total = detalles.reduce((sum, d) => sum + Number(d.total), 0);
            onTotalChange(total);
        }
    }, [detalles, onTotalChange]);

    // Sync particularSeguro prop to orden state
    useEffect(() => {
        if (!activeId && particularSeguro) {
            setOrden(prev => prev ? { ...prev, particular_seguro: particularSeguro } : { moneda: 'Bolivianos', particular_seguro: particularSeguro } as any);
        }
    }, [particularSeguro, activeId]);

    useEffect(() => {
        // Auto-set detalle and precio_unitario when selecting a price for Particular
        if (formData.idprecio_taller) {
            const precio = preciosTaller.find(p => String(p.id) === String(formData.idprecio_taller));
            if (precio) {
                setFormData(prev => ({
                    ...prev,
                    detalle: precio.detalle,
                    precio_unitario: Number(precio.precio)
                }));
            }
        }
    }, [formData.idprecio_taller, preciosTaller]);

    useEffect(() => {
        // Auto-set detalle when selecting a price for Seguro (precio depends on nivel)
        if (formData.idprecio_seguro) {
            const precio = preciosSeguros.find(p => String(p.id) === String(formData.idprecio_seguro));
            if (precio) {
                setFormData(prev => ({
                    ...prev,
                    detalle: precio.detalle
                }));
            }
        }
    }, [formData.idprecio_seguro, preciosSeguros]);

    // if (!activeId || isNaN(activeId)) return null; // Permitir renderizar sin ID para modo creación

    const loadData = async () => {
        try {
            setLoading(true);
            const [tallerData, segurosData] = await Promise.all([
                getPreciosTaller(),
                getPreciosSeguros()
            ]);
            setPreciosTaller(tallerData.filter(p => p.estado === 'activo'));
            setPreciosSeguros(segurosData.filter(p => p.estado === 'activo'));

            if (activeId) {
                const [ordenData, detallesData] = await Promise.all([
                    getOrdenTrabajo(Number(activeId)),
                    getDetallesByOrden(Number(activeId))
                ]);
                setOrden(ordenData);
                setDetalles(detallesData);

                // Inicializar formulario de orden
                setOrdenForm({
                    plazo_entrega: ordenData.plazo_entrega || 0,
                    moneda: ordenData.moneda || 'bolivianos',
                    observaciones: ordenData.observaciones || ''
                });
            } else if (localDetalles) {
                setDetalles(localDetalles as DetalleOrdenTrabajo[]);
                setOrden({ moneda: 'Bolivianos', particular_seguro: particularSeguro || 'Particular' } as any);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los datos'
            });
        } finally {
            setLoading(false);
        }
    };


    // Autocompletar precio unitario cuando se selecciona un nivel en órdenes de Seguro (formulario de creación)
    useEffect(() => {
        if (orden?.particular_seguro === 'Seguro' && formData.idprecio_seguro && formData.nivel && formData.nivel !== 'otro') {
            const precioSeleccionado = preciosSeguros.find(p => String(p.id) === String(formData.idprecio_seguro));

            if (precioSeleccionado) {
                let precioNivel: number | undefined;

                switch (formData.nivel) {
                    case 'nivel1':
                        precioNivel = precioSeleccionado.nivel1;
                        break;
                    case 'nivel2':
                        precioNivel = precioSeleccionado.nivel2;
                        break;
                    case 'nivel3':
                        precioNivel = precioSeleccionado.nivel3;
                        break;
                    case 'pintado':
                        precioNivel = precioSeleccionado.pintado;
                        break;
                    case 'instalacion':
                        precioNivel = precioSeleccionado.instalacion;
                        break;
                }

                if (precioNivel !== undefined && precioNivel !== null) {
                    setFormData(prev => ({
                        ...prev,
                        precio_unitario: Number(precioNivel)
                    }));
                }
            }
        }
    }, [formData.idprecio_seguro, formData.nivel, orden?.particular_seguro, preciosSeguros]);

    // Autocompletar precio unitario en formulario de edición
    useEffect(() => {
        if (orden?.particular_seguro === 'Seguro' && editForm.idprecio_seguro && editForm.nivel && editForm.nivel !== 'otro') {
            const precioSeleccionado = preciosSeguros.find(p => String(p.id) === String(editForm.idprecio_seguro));

            if (precioSeleccionado) {
                let precioNivel: number | undefined;

                switch (editForm.nivel) {
                    case 'nivel1':
                        precioNivel = precioSeleccionado.nivel1;
                        break;
                    case 'nivel2':
                        precioNivel = precioSeleccionado.nivel2;
                        break;
                    case 'nivel3':
                        precioNivel = precioSeleccionado.nivel3;
                        break;
                    case 'pintado':
                        precioNivel = precioSeleccionado.pintado;
                        break;
                    case 'instalacion':
                        precioNivel = precioSeleccionado.instalacion;
                        break;
                }

                if (precioNivel !== undefined && precioNivel !== null) {
                    setEditForm(prev => ({
                        ...prev,
                        precio_unitario: Number(precioNivel)
                    }));
                }
            }
        }
    }, [editForm.idprecio_seguro, editForm.nivel, orden?.particular_seguro, preciosSeguros]);


    const handleUpdateOrden = async () => {
        if (!orden) return;
        try {
            setSavingOrden(true);
            await updateOrdenTrabajo(Number(orden.id), {
                ...orden,
                plazo_entrega: ordenForm.plazo_entrega,
                moneda: ordenForm.moneda,
                observaciones: ordenForm.observaciones,
                idseguro: orden.seguro?.id || '',
                idinspector: orden.inspector?.id || '',
                idmarca_auto: orden.marca_auto?.id || 0,
                idtipo_vehiculo: orden.tipo_vehiculo?.id || 0,
                idusuario: orden.usuario?.id || ''
            });
            await Swal.fire({
                icon: 'success',
                title: 'Actualizado',
                text: 'Información actualizada correctamente',
                showConfirmButton: false,
                timer: 1500
            });
            setTimeout(() => {
                window.location.href = '/ordenes-trabajo/list';
            }, 1600);
        } catch (error) {
            console.error('Error updating orden:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al actualizar la información'
            });
        } finally {
            setSavingOrden(false);
        }
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!activeId && !onAddLocal) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se encontró el ID de la orden de trabajo'
            });
            return;
        }

        if (!formData.idprecio_taller && !formData.idprecio_seguro) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'Debe seleccionar un precio'
            });
            return;
        }

        const total = formData.cantidad * formData.precio_unitario;

        const data: CreateDetalleOrdenTrabajoData = {
            idorden_trabajo: Number(activeId || 0),
            idprecio_taller: formData.idprecio_taller || undefined,
            idprecio_seguro: formData.idprecio_seguro || undefined,
            cantidad: formData.cantidad,
            precio_unitario: formData.precio_unitario,
            total,
            nivel: formData.nivel || undefined,
            detalle: formData.detalle || undefined,
            observaciones: formData.observaciones || undefined
        };

        if (!activeId && onAddLocal) {
            // Agregar localmente
            // Enriquecer con datos del precio para mostrar en la tabla sin recargar
            const enrichedData: any = { ...data };
            if (data.idprecio_taller) {
                enrichedData.precio_taller = preciosTaller.find(p => String(p.id) === String(data.idprecio_taller));
            }
            if (data.idprecio_seguro) {
                enrichedData.precio_seguro = preciosSeguros.find(p => String(p.id) === String(data.idprecio_seguro));
            }
            onAddLocal(enrichedData);
            setFormData({
                idprecio_taller: '',
                idprecio_seguro: '',
                cantidad: 1,
                precio_unitario: 0,
                nivel: '',
                detalle: '',
                observaciones: '',
                imagenes: []
            });
            setShowForm(false);
            return;
        }

        if (!activeId) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se encontró el ID de la orden de trabajo'
            });
            return;
        }

        try {
            await createDetalleOrdenTrabajo(data);
            // Guardar directamente sin mostrar mensaje de confirmación para mayor rapidez
            setShowForm(false);
            loadData();
            // Limpiar el formulario para el siguiente trabajo
            setFormData({
                idprecio_taller: '',
                idprecio_seguro: '',
                cantidad: 1,
                precio_unitario: 0,

                nivel: '',
                detalle: '',
                observaciones: '',
                imagenes: []
            });
        } catch (error) {
            console.error('Error creating detalle:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al agregar trabajo'
            });
        }
    };

    // Manejadores para el Modal de Detalles
    const handleEditDetails = (detalle: DetalleOrdenTrabajo) => {
        setEditingDetalle(detalle);
        setDetailForm({
            observaciones: detalle.observaciones || '',
            imagenes: detalle.imagenes || []
        });
    };

    const handleCloseModal = () => {
        setEditingDetalle(null);
        setDetailForm({ observaciones: '', imagenes: [] });
    };

    const handleSaveDetails = async () => {
        if (!editingDetalle) return;
        try {
            await updateDetalleOrdenTrabajo(Number(editingDetalle.id), {
                observaciones: detailForm.observaciones,
                imagenes: detailForm.imagenes
            });
            handleCloseModal();
            loadData();
            Swal.fire({
                icon: 'success',
                title: 'Actualizado',
                text: 'Detalles actualizados correctamente',
                showConfirmButton: false,
                timer: 1500
            });
        } catch (error) {
            console.error('Error updating details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al actualizar detalles'
            });
        }
    };

    const handleDetailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            try {
                setUploading(true);
                const files = Array.from(e.target.files);
                const uploadedFiles = await Promise.all(files.map(file => uploadFile(file)));
                setDetailForm(prev => ({ ...prev, imagenes: [...prev.imagenes, ...uploadedFiles] }));
            } catch (error) {
                console.error('Error uploading file:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al subir imagen'
                });
            } finally {
                setUploading(false);
            }
        }
    };

    const removeDetailImage = (index: number) => {
        setDetailForm(prev => ({
            ...prev,
            imagenes: prev.imagenes.filter((_, i) => i !== index)
        }));
    };

    // Manejadores para edición de detalle principal
    const handleEditMain = (detalle: DetalleOrdenTrabajo) => {
        setEditingDetalleMain(detalle);
        setEditForm({
            idprecio_taller: detalle.precio_taller?.id || '',
            idprecio_seguro: detalle.precio_seguro?.id || '',
            cantidad: detalle.cantidad,
            precio_unitario: Number(detalle.precio_unitario),
            nivel: detalle.nivel || '',
            observaciones: detalle.observaciones || ''
        });
    };

    const handleCloseEditMain = () => {
        setEditingDetalleMain(null);
        setEditForm({
            idprecio_taller: '',
            idprecio_seguro: '',
            cantidad: 1,
            precio_unitario: 0,
            nivel: '',
            observaciones: ''
        });
    };

    const handleSaveEditMain = async () => {
        if (!editingDetalleMain) return;
        try {
            const total = editForm.cantidad * editForm.precio_unitario;
            await updateDetalleOrdenTrabajo(Number(editingDetalleMain.id), {
                idprecio_taller: editForm.idprecio_taller || undefined,
                idprecio_seguro: editForm.idprecio_seguro || undefined,
                cantidad: editForm.cantidad,
                precio_unitario: editForm.precio_unitario,
                total,
                nivel: editForm.nivel || undefined,
                observaciones: editForm.observaciones || undefined
            });
            handleCloseEditMain();
            loadData();
            Swal.fire({
                icon: 'success',
                title: 'Actualizado',
                text: 'Detalle actualizado correctamente',
                showConfirmButton: false,
                timer: 1500
            });
        } catch (error) {
            console.error('Error updating detail:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al actualizar detalle'
            });
        }
    };



    const handleDelete = async (detalleId: number, localIndex?: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar trabajo?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            if (!activeId && onRemoveLocal && localIndex !== undefined) {
                onRemoveLocal(localIndex);
                Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'Trabajo eliminado exitosamente',
                    showConfirmButton: false,
                    timer: 1500
                });
                return;
            }

            try {
                await deleteDetalleOrdenTrabajo(detalleId);
                await Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'Trabajo eliminado exitosamente',
                    showConfirmButton: false,
                    timer: 1500
                });
                loadData();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar'
                });
            }
        }
    };

    const calcularTotal = () => {
        return detalles.reduce((sum, d) => sum + Number(d.total), 0);
    };

    if (loading) return <div>Cargando...</div>;

    if (!orden) return <div className="p-6 text-center text-red-500">Error al cargar la orden o datos no disponibles.</div>;

    return (
        <div className="container mx-auto p-6">
            {!isEmbedded && (
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors mb-2"
                        >
                            <ArrowLeft size={20} />
                            <span>Volver</span>
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Detalles de Trabajo</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Orden: {orden?.cliente} - {orden?.placa} ({orden?.particular_seguro})
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Trabajos a Realizar</h2>
                    <button
                        onClick={handleToggleForm}
                        className={`${showForm ? 'bg-red-500 hover:bg-red-600' : 'bg-[#3498db] hover:bg-[#2980b9]'} text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 font-medium`}
                    >
                        {showForm ? <Trash2 size={20} /> : <Plus size={20} />} {showForm ? 'Cancelar' : 'Agregar Trabajo'}
                    </button>
                </div>

                {/* Formulario en línea (Collapsible) - MOVIDO AQUÍ */}
                {showForm && (
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200 dark:border-gray-600 mb-6 animate-fade-in-down">
                        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                            <Plus size={20} className="text-blue-500" />
                            Agregar Nuevo Trabajo
                        </h2>
                        <form onSubmit={handleSubmit}>
                            {orden?.particular_seguro === 'Seguro' ? (
                                <>
                                    {/* Primera fila: Solo Seleccionar Trabajo */}
                                    <div className="grid grid-cols-1 gap-4 mb-4">
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Seleccionar Trabajo *
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FileText size={18} className="text-gray-400" />
                                                </div>
                                                <select
                                                    value={formData.idprecio_seguro}
                                                    onChange={(e) => setFormData({ ...formData, idprecio_seguro: e.target.value, idprecio_taller: '' })}
                                                    required
                                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                                >
                                                    <option value="">Seleccione...</option>
                                                    {preciosSeguros.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.detalle}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Segunda fila: Resto de campos */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                        {/* Detalle */}
                                        <div className="md:col-span-3">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Detalle</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FileText size={18} className="text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.detalle}
                                                    onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
                                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                                    placeholder="Nombre del trabajo..."
                                                />
                                            </div>
                                        </div>

                                        {/* Observaciones */}
                                        <div className="md:col-span-3">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <FileText size={18} className="text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.observaciones}
                                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                                    placeholder="Detalles..."
                                                />
                                            </div>
                                        </div>

                                        {/* Nivel */}
                                        <div className="md:col-span-2">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Nivel *</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Layers size={18} className="text-gray-400" />
                                                </div>
                                                <select
                                                    value={formData.nivel}
                                                    onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                                                    required
                                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                                >
                                                    <option value="">Nivel...</option>
                                                    <option value="nivel1">Nivel 1</option>
                                                    <option value="nivel2">Nivel 2</option>
                                                    <option value="nivel3">Nivel 3</option>
                                                    <option value="pintado">Pintado</option>
                                                    <option value="instalacion">Instalación</option>
                                                    <option value="otro">Otro</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Cantidad */}
                                        <div className="md:col-span-1">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Cant.</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Hash size={18} className="text-gray-400" />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={formData.cantidad}
                                                    onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                                                    min="1"
                                                    required
                                                    className="w-full pl-8 pr-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Precio Unitario */}
                                        <div className="md:col-span-2">
                                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">P. Unit.</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <DollarSign size={18} className="text-gray-400" />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={formData.precio_unitario}
                                                    onChange={(e) => setFormData({ ...formData, precio_unitario: Number(e.target.value) })}
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                    className="w-full pl-8 pr-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Botón Guardar */}
                                        <div className="md:col-span-1 flex items-end justify-end">
                                            <button
                                                type="submit"
                                                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                                                title="Guardar"
                                            >
                                                <Save size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Layout para Particular (una sola fila) */
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
                                    {/* Seleccionar Trabajo */}
                                    <div className="md:col-span-3">
                                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Seleccionar Trabajo
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FileText size={18} className="text-gray-400" />
                                            </div>
                                            <select
                                                value={formData.idprecio_taller}
                                                onChange={(e) => setFormData({ ...formData, idprecio_taller: e.target.value, idprecio_seguro: '' })}
                                                required
                                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                            >
                                                <option value="">Seleccione...</option>
                                                {preciosTaller.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.detalle}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Detalle */}
                                    <div className="md:col-span-3">
                                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Detalle</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FileText size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.detalle}
                                                onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
                                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="Nombre del trabajo..."
                                            />
                                        </div>
                                    </div>

                                    {/* Observaciones */}
                                    <div className="md:col-span-3">
                                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FileText size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.observaciones}
                                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="Detalles..."
                                            />
                                        </div>
                                    </div>

                                    {/* Cantidad */}
                                    <div className="md:col-span-1">
                                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Cant.</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Hash size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="number"
                                                value={formData.cantidad}
                                                onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                                                min="1"
                                                required
                                                className="w-full pl-8 pr-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Precio Unitario */}
                                    <div className="md:col-span-1" style={{ minWidth: '100px' }}>
                                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">P. Unit.</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <DollarSign size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="number"
                                                value={formData.precio_unitario}
                                                onChange={(e) => setFormData({ ...formData, precio_unitario: Number(e.target.value) })}
                                                min="0"
                                                step="0.01"
                                                required
                                                className="w-full pl-8 pr-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Botón Guardar */}
                                    <div className="md:col-span-1 flex items-end justify-end">
                                        <button
                                            type="submit"
                                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                                            title="Guardar"
                                        >
                                            <Save size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoría</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Observaciones</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cant.</th>
                                {orden?.particular_seguro === 'Seguro' && (
                                    <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nivel</th>
                                )}
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio Unit.</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {detalles.map((detalle, index) => (
                                <tr key={detalle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 text-gray-500 dark:text-gray-400 font-mono text-sm">{index + 1}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">
                                        {detalle.precio_taller?.categoria?.categoria_servicio || detalle.precio_seguro?.categoria?.categoria_servicio || 'N/A'}
                                    </td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">
                                        {detalle.precio_taller?.detalle || detalle.precio_seguro?.detalle || 'N/A'}
                                    </td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200 text-sm">
                                        {detalle.observaciones || '-'}
                                    </td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{detalle.cantidad}</td>
                                    {orden?.particular_seguro === 'Seguro' && (
                                        <td className="p-4 text-gray-700 dark:text-gray-200">{detalle.nivel || '-'}</td>
                                    )}
                                    <td className="p-4 text-gray-700 dark:text-gray-200">
                                        {Number(detalle.precio_unitario).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200 font-bold">
                                        {Number(detalle.total).toFixed(2)}
                                    </td>
                                    <td className="p-4 flex gap-2 justify-end">
                                        {activeId && (
                                            <button
                                                onClick={() => handleEditDetails(detalle)}
                                                className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                title="Ver/Editar Imágenes"
                                            >
                                                {(detalle.imagenes && detalle.imagenes.length > 0) ? (
                                                    <div className="flex items-center gap-1">
                                                        <ImageIcon size={16} />
                                                        <span className="bg-blue-500 text-white text-[10px] px-1.5 rounded-full">{detalle.imagenes.length}</span>
                                                    </div>
                                                ) : (
                                                    <Upload size={16} />
                                                )}
                                            </button>
                                        )}
                                        {activeId && (
                                            <button
                                                onClick={() => handleEditMain(detalle)}
                                                className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(detalle.id, index)}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {detalles.length === 0 && (
                                <tr>
                                    <td colSpan={orden?.particular_seguro === 'Seguro' ? 9 : 8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No hay trabajos agregados. Haga clic en "Agregar Trabajo" para comenzar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {detalles.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                                    <td colSpan={orden?.particular_seguro === 'Seguro' ? 7 : 6} className="p-4 text-right text-gray-800 dark:text-white">
                                        TOTAL:
                                    </td>
                                    <td className="p-4 text-gray-800 dark:text-white text-lg">
                                        {orden?.moneda?.toLowerCase() === 'bolivianos' ? 'Bs' : '$us'} {calcularTotal().toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* Sección de Información Adicional */}
                {!isEmbedded && (
                    <div className="mt-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-md font-bold text-gray-800 dark:text-white">Información Adicional</h3>
                            <button
                                onClick={handleUpdateOrden}
                                disabled={savingOrden}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={18} />
                                {savingOrden ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Plazo de Entrega (días)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={ordenForm.plazo_entrega}
                                        onChange={(e) => setOrdenForm({ ...ordenForm, plazo_entrega: parseInt(e.target.value) || 0 })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Moneda</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        value={ordenForm.moneda}
                                        onChange={(e) => setOrdenForm({ ...ordenForm, moneda: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="bolivianos">Bolivianos</option>
                                        <option value="dolares">Dólares</option>
                                    </select>
                                </div>
                            </div>
                            <div className="md:col-span-3">
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                                        <FileText size={16} className="text-gray-400" />
                                    </div>
                                    <textarea
                                        value={ordenForm.observaciones}
                                        onChange={(e) => setOrdenForm({ ...ordenForm, observaciones: e.target.value })}
                                        rows={3}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="Ingrese observaciones..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Modal de Edición de Detalles */}
            {editingDetalle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <ImageIcon size={24} className="text-blue-500" />
                                Subir imágenes
                            </h3>
                        </div>

                        <div className="mb-4 flex items-center gap-2">
                            <p className="font-semibold text-gray-700 dark:text-gray-300">Trabajo:</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {editingDetalle.precio_taller?.detalle || editingDetalle.precio_seguro?.detalle}
                            </p>
                        </div>



                        <div className="mb-6">
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Imágenes y Archivos</label>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleDetailFileUpload}
                                    className="hidden"
                                    id="modal-file-upload"
                                    disabled={uploading}
                                />
                                <label htmlFor="modal-file-upload" className="cursor-pointer flex items-center justify-center gap-2 py-2">
                                    <Upload size={20} className="text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {uploading ? 'Subiendo...' : 'Haz clic para subir imágenes'}
                                    </span>
                                </label>
                            </div>

                            {detailForm.imagenes.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-4">
                                    {detailForm.imagenes.map((img, idx) => (
                                        <div key={idx} className="relative group aspect-square">
                                            <img
                                                src={`http://localhost:3001/files/${img}`}
                                                alt="Detalle"
                                                onClick={() => setPreviewImage(`http://localhost:3001/files/${img}`)}
                                                className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
                                            />
                                            <button
                                                onClick={() => removeDetailImage(idx)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-sm transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveDetails}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-colors font-medium flex items-center gap-2"
                            >
                                <Check size={18} /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Edición de Detalle Principal */}
            {editingDetalleMain && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                Editar Detalle de Trabajo
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {/* Selector de Precio */}
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {orden?.particular_seguro === 'Particular' ? 'Precio Taller' : 'Precio Seguro'}
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    {orden?.particular_seguro === 'Particular' ? (
                                        <select
                                            value={editForm.idprecio_taller}
                                            onChange={(e) => {
                                                const precio = preciosTaller.find(p => p.id === e.target.value);
                                                setEditForm({
                                                    ...editForm,
                                                    idprecio_taller: e.target.value,
                                                    idprecio_seguro: '',
                                                    precio_unitario: precio ? Number(precio.precio) : editForm.precio_unitario
                                                });
                                            }}
                                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Seleccione...</option>
                                            {preciosTaller.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.detalle}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <select
                                            value={editForm.idprecio_seguro}
                                            onChange={(e) => setEditForm({ ...editForm, idprecio_seguro: e.target.value, idprecio_taller: '' })}
                                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Seleccione...</option>
                                            {preciosSeguros.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.detalle}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            {/* Observaciones */}
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <textarea
                                        value={editForm.observaciones}
                                        onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                        placeholder="Detalles adicionales..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Cantidad */}
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="number"
                                            min="1"
                                            value={editForm.cantidad}
                                            onChange={(e) => setEditForm({ ...editForm, cantidad: parseInt(e.target.value) || 1 })}
                                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Precio Unitario */}
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Precio Unitario</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editForm.precio_unitario}
                                            onChange={(e) => setEditForm({ ...editForm, precio_unitario: parseFloat(e.target.value) || 0 })}
                                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Nivel (solo para Seguros) */}
                            {orden?.particular_seguro === 'Seguro' && (
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Nivel *</label>
                                    <div className="relative">
                                        <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <select
                                            value={editForm.nivel}
                                            onChange={(e) => setEditForm({ ...editForm, nivel: e.target.value })}
                                            required
                                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Seleccione nivel...</option>
                                            <option value="nivel1">Nivel 1</option>
                                            <option value="nivel2">Nivel 2</option>
                                            <option value="nivel3">Nivel 3</option>
                                            <option value="pintado">Pintado</option>
                                            <option value="instalacion">Instalación</option>
                                            <option value="otro">Otro (precio libre)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Total */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Total: <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                        {orden?.moneda === 'bolivianos' ? 'Bs' : '$'} {(editForm.cantidad * editForm.precio_unitario).toFixed(2)}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700 mt-4">
                            <button
                                onClick={handleCloseEditMain}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-sm transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEditMain}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-colors font-medium flex items-center gap-2"
                            >
                                <Check size={18} /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Vista Previa de Imagen */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[60]"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-10 right-0 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={previewImage}
                            alt="Vista previa"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

export default OrdenTrabajoDetalles;
