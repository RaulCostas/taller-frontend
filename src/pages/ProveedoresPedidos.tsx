import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Eye, CheckCircle, Printer, ShoppingCart } from 'lucide-react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MaterialPedido } from '../types/materialPedido';
import { getMaterialPedidos, deleteMaterialPedido, getMaterialPedido } from '../services/materialPedidoService';
import { getDetallesByPedido } from '../services/detalleMaterialPedidoService';
import { getPagoByPedido } from '../services/pagoPedidoService';
import MaterialPedidoModal from './MaterialPedidoModal';

const ProveedoresPedidos = () => {
    const [pedidos, setPedidos] = useState<MaterialPedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Order Modal State
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedOrderData, setSelectedOrderData] = useState<{ id: number | null, readOnly: boolean }>({ id: null, readOnly: false });

    const handleNewOrder = () => {
        setSelectedOrderData({ id: null, readOnly: false });
        setIsOrderModalOpen(true);
    };

    const handleEditOrder = (id: number) => {
        setSelectedOrderData({ id, readOnly: false });
        setIsOrderModalOpen(true);
    };

    const handleViewOrder = (id: number) => {
        setSelectedOrderData({ id, readOnly: true });
        setIsOrderModalOpen(true);
    };

    const handlePrint = async (id: number) => {
        try {
            // 1. Fetch complete order data, details, and payment info
            const pedido = await getMaterialPedido(id);
            const detalles = await getDetallesByPedido(id);
            let pagoInfo = null;
            if (pedido.pagado) {
                pagoInfo = await getPagoByPedido(id);
            }

            // 2. Setup PDF
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(44, 62, 80);
            doc.text('PEDIDO A PROVEEDOR', 105, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`N° Pedido: ${pedido.id}`, 14, 30);
            doc.text(`Fecha: ${new Date(pedido.fecha).toLocaleDateString()}`, 14, 35);
            doc.text(`Estado: ${pedido.pagado ? 'PAGADO' : 'PENDIENTE'}`, 14, 40);

            // Provider Info
            doc.setFontSize(12);
            doc.setTextColor(44, 62, 80);
            doc.setFont('helvetica', 'bold');
            doc.text('Datos del Proveedor', 14, 50);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60);
            doc.text(`Proveedor: ${pedido.proveedor.proveedor}`, 14, 57);
            if (pedido.proveedor.celular) {
                doc.text(`Celular: ${pedido.proveedor.celular}`, 14, 62);
            }

            // Separator
            doc.setDrawColor(200);
            doc.line(14, 67, 196, 67);

            // Details Table
            const tableRows = detalles.map((d: any) => [
                d.inventario.descripcion,
                d.cantidad,
                `${Number(d.precio_unitario).toFixed(2)}`,
                `${Number(d.total).toFixed(2)}`
            ]);

            autoTable(doc, {
                startY: 72,
                head: [['Material', 'Cant.', 'P. Unit.', 'Total']],
                body: tableRows,
                headStyles: { fillColor: [52, 152, 219], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 247, 250] },
                foot: [[
                    '', '', 'Subtotal:',
                    `${Number(pedido.sub_total).toFixed(2)}`
                ], [
                    '', '', 'Descuento:',
                    `${Number(pedido.descuento).toFixed(2)}`
                ], [
                    '', '', 'Total Final:',
                    `${Number(pedido.total).toFixed(2)}`
                ]],
                footStyles: { fillColor: [255, 255, 255], textColor: [44, 62, 80], fontStyle: 'bold', halign: 'right' }, // Align text right for totals
                theme: 'grid' // Use grid theme to make logic simpler or stick to striped
            });

            // Payment Details
            let finalY = (doc as any).lastAutoTable.finalY + 10;

            if (pagoInfo) {
                doc.setFontSize(12);
                doc.setTextColor(44, 62, 80);
                doc.setFont('helvetica', 'bold');
                doc.text('Detalle del Pago', 14, finalY);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60);
                finalY += 7;

                doc.text(`Fecha Pago: ${new Date(pagoInfo.fecha).toLocaleDateString()}`, 14, finalY);
                doc.text(`Forma Pago: ${pagoInfo.forma_pago?.forma_pago || 'N/A'}`, 100, finalY);
                finalY += 5;

                doc.text(`Factura: ${pagoInfo.factura || '-'}`, 14, finalY);
                doc.text(`Recibo: ${pagoInfo.recibo || '-'}`, 100, finalY);
                finalY += 5;

                const pagadoPor = pagoInfo.usuario?.name || pagoInfo.usuario?.nombre || 'Usuario';
                doc.text(`Pagado Por: ${pagadoPor}`, 14, finalY);

                if (pagoInfo.moneda === 'Dólares') {
                    finalY += 5;
                    doc.setTextColor(0, 150, 0); // Green
                    doc.text(`(Pagado en Dólares)`, 14, finalY);
                }
            }

            // Observations
            if (pedido.observaciones) {
                finalY += 10;
                doc.setFontSize(11);
                doc.setTextColor(44, 62, 80);
                doc.setFont('helvetica', 'bold');
                doc.text('Observaciones:', 14, finalY);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60);
                doc.text(pedido.observaciones, 14, finalY + 6, { maxWidth: 180 });
            }

            // Save PDF
            doc.save(`Pedido_${pedido.id}_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error('Error printing order:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo generar el reporte'
            });
        }
    };

    const handleOrderSuccess = () => {
        loadPedidos();
        setIsOrderModalOpen(false);
    };

    useEffect(() => {
        loadPedidos();
    }, []);

    const loadPedidos = async () => {
        try {
            const data = await getMaterialPedidos();
            // Assuming backend returns all for now, we filter active for display if needed.
            const activePedidos = data.filter((p: any) => p.estado === 'activo');
            setPedidos(activePedidos.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar los pedidos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteMaterialPedido(id);
                Swal.fire('Eliminado', 'El pedido ha sido eliminado.', 'success');
                loadPedidos();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo eliminar el pedido', 'error');
            }
        }
    };



    const filteredPedidos = pedidos.filter(pedido =>
        pedido.proveedor.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pedido.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPedidos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPedidos.length / itemsPerPage);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString();
    };

    if (loading) return <div className="p-8 text-center">Cargando pedidos...</div>;

    return (
        <div className="container mx-auto p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <ShoppingCart className="text-purple-600" size={32} />
                        Pedidos a Proveedores
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los pedidos de material e insumos a proveedores</p>
                </div>
                <button
                    onClick={handleNewOrder}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all transform hover:-translate-y-0.5 shadow-md"
                >
                    <Plus size={20} />
                    Nuevo Pedido
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por proveedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="ml-2 p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors border border-red-200 shadow-sm"
                            title="Limpiar búsqueda"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                    Mostrando {filteredPedidos.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredPedidos.length)} de {filteredPedidos.length} registros
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold">
                            <tr>
                                <th className="p-4">#</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Proveedor</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 text-center">Estado Pago</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {currentItems.map((pedido, index) => (
                                <tr key={pedido.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 text-gray-900 dark:text-gray-200 font-medium">{indexOfFirstItem + index + 1}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-300">
                                        {formatDate(pedido.fecha)}
                                    </td>
                                    <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{pedido.proveedor.proveedor}</td>
                                    <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                                        {Number(pedido.total).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-center">
                                        {pedido.pagado ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                <CheckCircle size={12} /> Pagado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                Pendiente
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 flex flex-wrap justify-center gap-2">
                                        <button
                                            onClick={() => handleViewOrder(pedido.id)}
                                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                            title="Ver Detalle"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => handlePrint(pedido.id)}
                                            className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                            title="Imprimir"
                                        >
                                            <Printer size={18} />
                                        </button>
                                        <button
                                            onClick={() => !pedido.pagado && handleEditOrder(pedido.id)}
                                            disabled={pedido.pagado}
                                            className={`p-2 rounded-lg shadow-sm transition-all transform ${pedido.pagado
                                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                                : 'bg-amber-400 hover:bg-amber-500 text-white hover:-translate-y-0.5'}`}
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => !pedido.pagado && handleDelete(pedido.id)}
                                            disabled={pedido.pagado}
                                            className={`p-2 rounded-lg shadow-sm transition-all transform ${pedido.pagado
                                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                                : 'bg-red-500 hover:bg-red-600 text-white hover:-translate-y-0.5'}`}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {currentItems.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No se encontraron pedidos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center p-4 border-t border-gray-100 dark:border-gray-700 gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                        >
                            Anterior
                        </button>
                        <span className="px-3 py-1 dark:text-white">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            <MaterialPedidoModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                onSuccess={handleOrderSuccess}
                orderId={selectedOrderData.id}
                readOnly={selectedOrderData.readOnly}
            />
        </div>
    );
};

export default ProveedoresPedidos;
