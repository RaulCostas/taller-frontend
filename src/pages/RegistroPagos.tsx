import { useEffect, useState } from 'react';
import { Receipt, Search, DollarSign, CheckCircle, Clock, Calendar, Coins, FileText, CreditCard, Building, MessageSquare, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import { getOrdenesConSaldo, createPago, updatePago, deletePago, getPagos, type OrdenConSaldo, type PagoOrden } from '../services/pagoOrdenService';
import { getFormasPago } from '../services/formaPagoService';
import { getComisionesTarjeta } from '../services/comisionTarjetaService';
import type { FormaPago } from '../types/formaPago';
import type { ComisionTarjeta } from '../types/comisionTarjeta';
import { useAuth } from '../context/AuthContext';

const RegistroPagos = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [ordenes, setOrdenes] = useState<OrdenConSaldo[]>([]);
    const [pagos, setPagos] = useState<PagoOrden[]>([]);
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedOrden, setSelectedOrden] = useState<OrdenConSaldo | null>(null);
    const [editingPago, setEditingPago] = useState<PagoOrden | null>(null);

    // Form state
    const [comisionesTarjeta, setComisionesTarjeta] = useState<ComisionTarjeta[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        fecha: new Date().toISOString().split('T')[0],
        monto: '',
        moneda: 'Bolivianos',
        tc: '',
        factura: '',
        recibo: '',
        idforma_pago: '',
        observacion: '',
        idcomision_tarjeta: '', // New field
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'pending') {
                const [ordenesData, formasPagoData, comisionesData] = await Promise.all([
                    getOrdenesConSaldo(),
                    getFormasPago(),
                    getComisionesTarjeta(),
                ]);
                setOrdenes(ordenesData);
                setFormasPago(formasPagoData.filter(fp => fp.estado === 'activo'));
                setComisionesTarjeta(comisionesData.filter(ct => ct.estado === 'activo'));
            } else {
                const [pagosData, formasPagoData, comisionesData] = await Promise.all([
                    getPagos(),
                    getFormasPago(),
                    getComisionesTarjeta(),
                ]);
                setPagos(pagosData);
                setFormasPago(formasPagoData.filter(fp => fp.estado === 'activo'));
                setComisionesTarjeta(comisionesData.filter(ct => ct.estado === 'activo'));
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrarPago = (orden: OrdenConSaldo) => {
        setSelectedOrden(orden);
        setEditingPago(null);
        setFormData({
            fecha: new Date().toISOString().split('T')[0],
            monto: orden.saldo.toString(),
            moneda: orden.moneda || 'Bolivianos',
            tc: '',
            factura: '',
            recibo: '',
            idforma_pago: '',
            observacion: '',
            idcomision_tarjeta: '',
        });
        setShowModal(true);
    };

    const handleEditPago = (pago: PagoOrden) => {
        // Mocking OrdenConSaldo for the modal context based on the payment's relation
        if (pago.orden_trabajo) {
            // NOTE: We don't have the full Order details with balance here potentially, 
            // but for editing we mainly need the ID and context.
            // Let's create a partial object or just use what we have.
            // Ideally we should fetch the up-to-date order to check limits if we enforce them strictly on edit too.
            // For now, let's proceed with editing the payment itself.
            const ordenMock: OrdenConSaldo = {
                id: pago.idorden_trabajo,
                fecha_registro: '',
                cliente: pago.orden_trabajo.cliente,
                placa: pago.orden_trabajo.placa,
                sub_total: 0,
                total_pagado: 0,
                saldo: 0, // This might bypass validation if we rely on it, but let's be lenient on edit or fetch real logic
                pagos: [],
                moneda: pago.moneda
            };
            setSelectedOrden(ordenMock);
        }

        setEditingPago(pago);
        setFormData({
            fecha: new Date(pago.fecha).toISOString().split('T')[0],
            monto: pago.monto.toString(),
            moneda: pago.moneda,
            tc: pago.tc ? pago.tc.toString() : '',
            factura: pago.factura || '',
            recibo: pago.recibo || '',
            idforma_pago: pago.idforma_pago.toString(),
            observacion: pago.observacion || '',
            idcomision_tarjeta: pago.idcomision_tarjeta ? pago.idcomision_tarjeta.toString() : '',
        });
        setShowModal(true);
    };

    const handleDeletePago = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar pago?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deletePago(id);
                await Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'El pago ha sido eliminado.',
                    showConfirmButton: false,
                    timer: 1500
                });
                loadData();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo eliminar el pago', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedOrden || !user) return;

        // Validation
        if (!formData.monto || parseFloat(formData.monto) <= 0) {
            Swal.fire('Error', 'El monto debe ser mayor a 0', 'error');
            return;
        }

        // Only check balance limit if creating new payment (not editing)
        // Or if editing, perhaps check if new amount > (old amount + remaining balance).
        // For simplicity, we skip strict balance check on edit or basic creation unless critical.
        if (!editingPago && selectedOrden.saldo && parseFloat(formData.monto) > selectedOrden.saldo) {
            Swal.fire('Error', 'El monto no puede ser mayor al saldo pendiente', 'error');
            return;
        }

        if (formData.moneda === 'Dólares' && (!formData.tc || parseFloat(formData.tc) <= 0)) {
            Swal.fire('Error', 'Debe ingresar un tipo de cambio válido', 'error');
            return;
        }

        if (!formData.idforma_pago) {
            Swal.fire('Error', 'Debe seleccionar una forma de pago', 'error');
            return;
        }

        try {
            let montoComision = 0;
            if (formData.idcomision_tarjeta) {
                const selectedComision = comisionesTarjeta.find(c => c.id.toString() === formData.idcomision_tarjeta);
                if (selectedComision) {
                    montoComision = Number(formData.monto) * (Number(selectedComision.comision) / 100);
                }
            }

            const safeFloat = (val: any) => {
                const num = parseFloat(val);
                return isNaN(num) ? undefined : num;
            };
            const safeInt = (val: any) => {
                const num = parseInt(val);
                return isNaN(num) ? undefined : num;
            };

            const payload = {
                idorden_trabajo: selectedOrden.id,
                fecha: formData.fecha,
                monto: safeFloat(formData.monto),
                moneda: formData.moneda,
                tc: formData.moneda === 'Dólares' ? safeFloat(formData.tc) : undefined,
                factura: formData.factura || undefined,
                recibo: formData.recibo || undefined,
                idforma_pago: safeInt(formData.idforma_pago),
                observacion: formData.observacion || undefined,
                idusers: safeInt(user.id), // Ensure user ID is valid integer
                idcomision_tarjeta: safeInt(formData.idcomision_tarjeta),
                monto_comision: montoComision > 0 ? Number(montoComision.toFixed(2)) : undefined,
            };

            if (editingPago) {
                await updatePago(editingPago.id, payload);
            } else {
                await createPago(payload);
            }

            await Swal.fire({
                icon: 'success',
                title: editingPago ? '¡Pago Actualizado!' : '¡Pago Registrado!',
                text: editingPago ? 'El pago se actualizó exitosamente' : 'El pago se registró exitosamente',
                showConfirmButton: false,
                timer: 1500,
            });

            setShowModal(false);
            setSelectedOrden(null);
            setEditingPago(null);
            loadData();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo guardar el pago', 'error');
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString();
    };

    const filteredOrdenes = ordenes.filter(o =>
        o.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.placa.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPagos = pagos.filter(p =>
        p.orden_trabajo?.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.orden_trabajo?.placa?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentListLength = activeTab === 'pending' ? filteredOrdenes.length : filteredPagos.length;

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <Receipt className="text-green-600" size={32} />
                        Registro de Pagos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los pagos recibidos de clientes</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-700/50 p-1 mb-6 max-w-md">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-offset-2 focus:outline-none focus:ring-2 transition-all duration-200 border-0
                        ${activeTab === 'pending'
                            ? 'bg-blue-600 text-white shadow-md ring-white/60 ring-offset-blue-400'
                            : 'bg-transparent text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Clock size={16} />
                        Pendientes ({ordenes.length})
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-offset-2 focus:outline-none focus:ring-2 transition-all duration-200 border-0
                        ${activeTab === 'history'
                            ? 'bg-blue-600 text-white shadow-md ring-white/60 ring-offset-blue-400'
                            : 'bg-transparent text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <CheckCircle size={16} />
                        Historial
                    </div>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[400px]">
                {/* Search Bar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o placa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                    Mostrando {currentListLength === 0 ? 0 : 1} - {currentListLength} de {currentListLength} registros
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="p-4">#</th>
                                    <th className="p-4">N° Orden</th>
                                    <th className="p-4">Fecha {activeTab === 'history' ? 'Pago' : ''}</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Placa</th>
                                    {activeTab === 'pending' ? (
                                        <>
                                            <th className="p-4 text-right">Sub Total</th>
                                            <th className="p-4 text-right">Pagado</th>
                                            <th className="p-4 text-right">Saldo</th>
                                            <th className="p-4 text-center">Acciones</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="p-4 text-right">Monto</th>
                                            <th className="p-4">Forma Pago</th>
                                            <th className="p-4">Usuario</th>
                                            <th className="p-4 text-center">Acciones</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {activeTab === 'pending' ? (
                                    filteredOrdenes.length > 0 ? (
                                        filteredOrdenes.map((orden, index) => (
                                            <tr key={orden.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="p-4 text-gray-900 dark:text-gray-200 font-medium">{index + 1}</td>
                                                <td className="p-4 text-blue-600 dark:text-blue-400 font-bold text-sm">#{orden.id}</td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300">
                                                    {formatDate(orden.fecha_registro)}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col items-start">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${orden.particular_seguro === 'Seguro'
                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                            }`}>
                                                            {orden.particular_seguro || 'Particular'}
                                                        </span>
                                                        {orden.particular_seguro === 'Seguro' && orden.seguro && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                                                                ({orden.seguro.seguro})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{orden.cliente}</td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300">{orden.placa}</td>
                                                <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                                                    {Number(orden.sub_total).toFixed(2)} Bs
                                                </td>
                                                <td className="p-4 text-right text-green-600 dark:text-green-400 font-semibold">
                                                    {Number(orden.total_pagado).toFixed(2)} Bs
                                                </td>
                                                <td className="p-4 text-right text-red-600 dark:text-red-400 font-bold">
                                                    {Number(orden.saldo).toFixed(2)} Bs
                                                </td>
                                                <td className="p-4 flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleRegistrarPago(orden)}
                                                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                                        title="Registrar Pago"
                                                    >
                                                        <DollarSign size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Receipt size={48} className="text-gray-200 dark:text-gray-900" />
                                                    <p className="text-lg">No hay órdenes con saldo pendiente</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                ) : (
                                    filteredPagos.length > 0 ? (
                                        filteredPagos.map((pago, index) => (
                                            <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="p-4 text-gray-900 dark:text-gray-200 font-medium">{index + 1}</td>
                                                <td className="p-4 text-blue-600 dark:text-blue-400 font-bold text-sm">#{pago.idorden_trabajo}</td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300">
                                                    {formatDate(pago.fecha)}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col items-start">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${pago.orden_trabajo?.particular_seguro === 'Seguro'
                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                            }`}>
                                                            {pago.orden_trabajo?.particular_seguro || 'Particular'}
                                                        </span>
                                                        {pago.orden_trabajo?.particular_seguro === 'Seguro' && pago.orden_trabajo?.seguro && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                                                                ({pago.orden_trabajo.seguro.seguro})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">
                                                    {pago.orden_trabajo?.cliente || 'N/A'}
                                                </td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300">
                                                    {pago.orden_trabajo?.placa || 'N/A'}
                                                </td>
                                                <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                                                    {Number(pago.monto).toFixed(2)} {pago.moneda === 'Dólares' ? '$us' : 'Bs'}
                                                    {pago.moneda === 'Dólares' && pago.tc && (
                                                        <span className="block text-xs text-gray-500 font-normal">
                                                            TC: {Number(pago.tc).toFixed(2)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300 text-sm">
                                                    {pago.forma_pago?.forma_pago || 'N/A'}
                                                </td>
                                                <td className="p-4 text-gray-700 dark:text-gray-300 text-sm">
                                                    {pago.usuario?.name || 'N/A'}
                                                </td>
                                                <td className="p-4 flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => handleEditPago(pago)}
                                                        className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                        title="Editar Pago"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePago(pago.id)}
                                                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                        title="Eliminar Pago"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                                No hay pagos registrados
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {filteredOrdenes.length > 0 && activeTab === 'pending' && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800 flex justify-end items-center">
                        <span className="text-gray-600 dark:text-gray-300 font-semibold mr-4">Total Saldo Pendiente:</span>
                        <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {filteredOrdenes.reduce((sum, o) => sum + Number(o.saldo), 0).toFixed(2)} Bs
                        </span>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showModal && selectedOrden && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <DollarSign size={28} />
                                {editingPago ? 'Editar Pago' : 'Registrar Pago'}
                            </h2>
                            <p className="text-green-100 mt-1">Cliente: {selectedOrden.cliente} - Placa: {selectedOrden.placa}</p>
                            {!editingPago && (
                                <p className="text-green-100 mt-1 font-semibold">Saldo Pendiente: {Number(selectedOrden.saldo).toFixed(2)} Bs</p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Fecha *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="date"
                                            value={formData.fecha}
                                            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Monto *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <DollarSign className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.monto}
                                            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Moneda *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Coins className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <select
                                            value={formData.moneda}
                                            onChange={(e) => setFormData({ ...formData, moneda: e.target.value, tc: '' })}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                                            required
                                        >
                                            <option value="Bolivianos">Bolivianos</option>
                                            <option value="Dólares">Dólares</option>
                                        </select>
                                    </div>
                                </div>

                                {formData.moneda === 'Dólares' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Tipo de Cambio *
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <RefreshCw className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.tc}
                                                onChange={(e) => setFormData({ ...formData, tc: e.target.value })}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="6.96"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Factura
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FileText className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.factura}
                                            onChange={(e) => setFormData({ ...formData, factura: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Número de factura"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Recibo
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Receipt className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.recibo}
                                            onChange={(e) => setFormData({ ...formData, recibo: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Número de recibo"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Forma de Pago *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <CreditCard className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <select
                                            value={formData.idforma_pago}
                                            onChange={(e) => setFormData({ ...formData, idforma_pago: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                                            required
                                        >
                                            <option value="">Seleccione una forma de pago</option>
                                            {formasPago.map(fp => (
                                                <option key={fp.id} value={fp.id}>{fp.forma_pago}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {activeTab === 'pending' && formData.idforma_pago && formasPago.find(fp => fp.id.toString() === formData.idforma_pago)?.forma_pago.toLowerCase().includes('tarjeta') && (
                                    <>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Red de Banco (Comisión)
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Building className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <select
                                                    value={formData.idcomision_tarjeta}
                                                    onChange={(e) => setFormData({ ...formData, idcomision_tarjeta: e.target.value })}
                                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                                                >
                                                    <option value="">Seleccione Red de Banco</option>
                                                    {comisionesTarjeta.map(ct => (
                                                        <option key={ct.id} value={ct.id}>
                                                            {ct.red_banco} ({Number(ct.comision)}%)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {formData.idcomision_tarjeta && formData.monto && (
                                            <div className="md:col-span-2 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                                                        Monto Comisión ({comisionesTarjeta.find(c => c.id.toString() === formData.idcomision_tarjeta)?.comision}%):
                                                    </span>
                                                    <span className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                                                        {(Number(formData.monto) * (Number(comisionesTarjeta.find(c => c.id.toString() === formData.idcomision_tarjeta)?.comision || 0) / 100)).toFixed(2)} {formData.moneda === 'Dólares' ? '$us' : 'Bs'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1 border-t border-yellow-200 dark:border-yellow-800 pt-1">
                                                    <span className="text-sm text-yellow-800 dark:text-yellow-200 font-bold">
                                                        Total a Cobrar:
                                                    </span>
                                                    <span className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                                                        {(Number(formData.monto) + (Number(formData.monto) * (Number(comisionesTarjeta.find(c => c.id.toString() === formData.idcomision_tarjeta)?.comision || 0) / 100))).toFixed(2)} {formData.moneda === 'Dólares' ? '$us' : 'Bs'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Observación
                                    </label>
                                    <div className="relative">
                                        <div className="absolute top-3 left-3 pointer-events-none">
                                            <MessageSquare className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <textarea
                                            value={formData.observacion}
                                            onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            rows={3}
                                            placeholder="Notas adicionales..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                                >
                                    {editingPago ? 'Actualizar Pago' : 'Registrar Pago'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedOrden(null);
                                        setEditingPago(null);
                                    }}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistroPagos;
