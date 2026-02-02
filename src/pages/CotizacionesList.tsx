import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, FileText, MessageCircle } from 'lucide-react';
import type { Cotizacion } from '../types/cotizacion';
import { getCotizaciones, deleteCotizacion } from '../services/cotizacionesService';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from '../components/Pagination';
import ManualModal, { type ManualSection } from '../components/ManualModal';

const CotizacionesList = () => {
    const navigate = useNavigate();
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
    const [filteredCotizaciones, setFilteredCotizaciones] = useState<Cotizacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [showManual, setShowManual] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchCotizaciones();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = cotizaciones.filter(c =>
            c.cliente?.toLowerCase().includes(lowerSearch) ||
            c.placa?.toLowerCase().includes(lowerSearch) ||
            c.marca_auto?.marca?.toLowerCase().includes(lowerSearch)
        );
        setFilteredCotizaciones(filtered);
        setCurrentPage(1);
    }, [searchTerm, cotizaciones]);

    const fetchCotizaciones = async () => {
        try {
            setLoading(true);
            const data = await getCotizaciones();
            setCotizaciones(data);
            setFilteredCotizaciones(data);
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las cotizaciones'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar cotización?',
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
                await deleteCotizacion(id);
                setCotizaciones(cotizaciones.filter(c => c.id !== id));
                await Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'Cotización eliminada exitosamente.',
                    showConfirmButton: false,
                    timer: 1500
                });
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar la cotización'
                });
            }
        }
    };

    const handlePrint = (cotizacion: Cotizacion) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const margin = 14;

            // Colors
            const colorPrimary = [44, 62, 80] as [number, number, number];


            let currentY = 20;

            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            doc.text(`COTIZACIÓN N° ${cotizacion.id}`, pageWidth / 2, currentY, { align: 'center' });

            currentY += 10;

            // Info Grid
            doc.setFontSize(10);
            doc.setTextColor(0);

            const leftX = margin;
            const rightX = pageWidth / 2 + 10;

            // Cliente Info
            doc.setFont('helvetica', 'bold');
            doc.text('Cliente:', leftX, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(cotizacion.cliente, leftX + 20, currentY);

            currentY += 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Fecha:', leftX, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(new Date(cotizacion.fecha_registro).toLocaleDateString(), leftX + 20, currentY);

            // Vehiculo Info (Right column)
            currentY -= 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Vehículo:', rightX, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(`${cotizacion.marca_auto?.marca || ''} ${cotizacion.modelo}`, rightX + 20, currentY);

            currentY += 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Placa:', rightX, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(cotizacion.placa || 'S/P', rightX + 20, currentY);

            currentY += 15;

            // Detalles Table
            const validDetalles = cotizacion.detalles || [];
            if (validDetalles.length > 0) {
                const tableRows = validDetalles.map(d => [
                    d.detalle,
                    d.cantidad,
                    Number(d.precio_unitario).toFixed(2),
                    Number(d.total).toFixed(2)
                ]);

                autoTable(doc, {
                    startY: currentY,
                    head: [['Descripción', 'Cant.', 'P. Unit.', 'Total']],
                    body: tableRows,
                    theme: 'grid',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: colorPrimary },
                    columnStyles: {
                        0: { cellWidth: 'auto' },
                        1: { cellWidth: 20, halign: 'center' },
                        2: { cellWidth: 30, halign: 'right' },
                        3: { cellWidth: 30, halign: 'right' }
                    }
                });

                currentY = (doc as any).lastAutoTable.finalY + 10;
            }

            // Totals
            const totalsX = pageWidth - margin - 50;
            doc.setFont('helvetica', 'bold');
            doc.text(`Total ${cotizacion.moneda === 'Dolares' ? '$us' : 'Bs.'}:`, totalsX, currentY);
            doc.text(Number(cotizacion.total).toFixed(2), pageWidth - margin, currentY, { align: 'right' });

            doc.save(`Cotizacion_${cotizacion.id}.pdf`);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo generar el PDF', 'error');
        }
    };

    const handleSendWhatsApp = async (cotizacion: Cotizacion) => {
        try {
            if (!cotizacion.celular) {
                Swal.fire('Error', 'Esta cotización no tiene número de celular registrado', 'error');
                return;
            }

            // Confirm phone number with user
            const result = await Swal.fire({
                title: 'Enviar por WhatsApp',
                html: `
                    <div class="text-left">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Número de teléfono del cliente:
                        </label>
                        <input 
                            type="text" 
                            id="swal-phone" 
                            class="swal2-input" 
                            value="${cotizacion.celular}" 
                            placeholder="Ej: 59170000000"
                        />
                        <p class="text-xs text-gray-500 mt-2">
                            El PDF de la cotización será enviado a este número.
                        </p>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#25D366',
                cancelButtonColor: '#6c757d',
                confirmButtonText: '<i class="fab fa-whatsapp"></i> Enviar',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    const phone = (document.getElementById('swal-phone') as HTMLInputElement).value;
                    if (!phone) {
                        Swal.showValidationMessage('Ingrese un número de teléfono');
                        return false;
                    }
                    return phone;
                }
            });

            if (!result.isConfirmed || !result.value) return;

            const confirmedPhone = result.value;

            // Show loading
            Swal.fire({
                title: 'Generando PDF...',
                text: 'Por favor espere',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Generate PDF (same logic as handlePrint but return blob)
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const margin = 14;

            const colorPrimary = [44, 62, 80] as [number, number, number];

            let currentY = 20;

            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            doc.text(`COTIZACIÓN N° ${cotizacion.id}`, pageWidth / 2, currentY, { align: 'center' });

            currentY += 10;

            doc.setFontSize(10);
            doc.setTextColor(0);

            const leftX = margin;
            const rightX = pageWidth / 2 + 10;

            doc.setFont('helvetica', 'bold');
            doc.text('Cliente:', leftX, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(cotizacion.cliente, leftX + 20, currentY);

            currentY += 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Fecha:', leftX, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(new Date(cotizacion.fecha_registro).toLocaleDateString(), leftX + 20, currentY);

            currentY -= 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Vehículo:', rightX, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(`${cotizacion.marca_auto?.marca || ''} ${cotizacion.modelo}`, rightX + 20, currentY);

            currentY += 6;
            doc.setFont('helvetica', 'bold');
            doc.text('Placa:', rightX, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(cotizacion.placa || 'S/P', rightX + 20, currentY);

            currentY += 15;

            const validDetalles = cotizacion.detalles || [];
            if (validDetalles.length > 0) {
                const tableRows = validDetalles.map(d => [
                    d.detalle,
                    d.cantidad,
                    Number(d.precio_unitario).toFixed(2),
                    Number(d.total).toFixed(2)
                ]);

                autoTable(doc, {
                    startY: currentY,
                    head: [['Descripción', 'Cant.', 'P. Unit.', 'Total']],
                    body: tableRows,
                    theme: 'grid',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: colorPrimary },
                    columnStyles: {
                        0: { cellWidth: 'auto' },
                        1: { cellWidth: 20, halign: 'center' },
                        2: { cellWidth: 30, halign: 'right' },
                        3: { cellWidth: 30, halign: 'right' }
                    }
                });

                currentY = (doc as any).lastAutoTable.finalY + 10;
            }

            const totalsX = pageWidth - margin - 50;
            doc.setFont('helvetica', 'bold');
            doc.text(`Total ${cotizacion.moneda === 'Dolares' ? '$us' : 'Bs.'}:`, totalsX, currentY);
            doc.text(Number(cotizacion.total).toFixed(2), pageWidth - margin, currentY, { align: 'right' });

            // Convert PDF to blob
            const pdfBlob = doc.output('blob');

            // Send to backend
            Swal.update({
                title: 'Enviando por WhatsApp...',
                text: 'Por favor espere'
            });

            const formData = new FormData();
            formData.append('file', pdfBlob, `Cotizacion_${cotizacion.id}.pdf`);
            formData.append('phoneNumber', confirmedPhone);
            formData.append('caption', `Cotización N° ${cotizacion.id} - ${cotizacion.cliente}`);

            const response = await fetch('http://localhost:3001/chatbot/send-document', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to send document');
            }

            await Swal.fire({
                icon: 'success',
                title: '¡Enviado!',
                text: 'El PDF ha sido enviado por WhatsApp exitosamente',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (error) {
            console.error('Error sending WhatsApp:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo enviar el PDF por WhatsApp. Verifique que el bot esté conectado.'
            });
        }
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredCotizaciones.map(c => ({
            'ID': c.id,
            'Fecha': new Date(c.fecha_registro).toLocaleDateString(),
            'Cliente': c.cliente,
            'Vehículo': `${c.marca_auto?.marca || ''} ${c.modelo}`,
            'Placa': c.placa || '',
            'Total': c.total,
            'Estado': c.estado
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Cotizaciones");
        XLSX.writeFile(workbook, `Cotizaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const manualSections: ManualSection[] = [
        { title: 'Gestión de Cotizaciones', content: 'Administre las cotizaciones del taller.' },
        { title: 'Crear Cotización', content: 'Haga clic en "Nueva Cotización" para registrar una nueva estimación de trabajo.' },
    ];

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCotizaciones.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCotizaciones.length / itemsPerPage);

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="container mx-auto relative min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <FileText className="text-blue-600" size={32} />
                        Cotizaciones
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de presupuestos y estimaciones</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowManual(true)}
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>
                    <div className="flex flex-wrap gap-2 items-center">
                        <button
                            onClick={exportToExcel}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-center gap-1 min-w-[60px]"
                            title="Exportar a Excel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="8" y1="13" x2="16" y2="13"></line>
                                <line x1="8" y1="17" x2="16" y2="17"></line>
                            </svg>
                            <span className="text-[10px] font-semibold">Excel</span>
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-center gap-1 min-w-[60px]"
                            title="Imprimir Lista"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <rect x="6" y="14" width="12" height="8"></rect>
                            </svg>
                            <span className="text-[10px] font-semibold">Imprimir</span>
                        </button>

                        <div className="w-px h-10 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                        <button
                            onClick={() => navigate('/cotizaciones/create')}
                            className="bg-[#3498db] hover:bg-[#2980b9] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 font-medium"
                        >
                            <span>+</span> Nueva Cotización
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-6 flex items-center gap-2 no-print">
                <input
                    type="text"
                    placeholder="Buscar por cliente, placa o marca..."
                    className="w-full md:w-96 pl-4 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehículo</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Placa</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider no-print">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {currentItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 text-blue-600 dark:text-blue-400 font-bold text-sm">#{item.id}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{new Date(item.fecha_registro).toLocaleDateString()}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200 font-medium">{item.cliente}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">
                                        {item.marca_auto?.marca} {item.modelo}
                                    </td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200 font-mono">{item.placa || '-'}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200 font-bold">
                                        {item.moneda === 'Bolivianos' ? 'Bs' : '$us'} {Number(item.total).toFixed(2)}
                                    </td>
                                    <td className="p-4 no-print">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePrint(item)}
                                                className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Imprimir PDF"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            {item.celular && (
                                                <button
                                                    onClick={() => handleSendWhatsApp(item)}
                                                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                    title="Enviar por WhatsApp"
                                                >
                                                    <MessageCircle size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/cotizaciones/edit/${item.id}`)}
                                                className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Eliminar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {currentItems.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No se encontraron cotizaciones
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Cotizaciones"
                sections={manualSections}
            />
        </div>
    );
};

export default CotizacionesList;
