import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, ClipboardList, Hammer, PackagePlus, FileText, Timer, AlertTriangle, Eye, CheckCircle, Car, MessageCircle } from 'lucide-react';
import type { OrdenTrabajo } from '../types/ordenTrabajo';
import { getOrdenesTrabajo, deleteOrdenTrabajo, reactivateOrdenTrabajo, getOrdenTrabajo, updateOrdenTrabajo } from '../services/ordenTrabajoService';
import { getDetallesByOrden } from '../services/detalleOrdenTrabajoService';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from '../components/Pagination';
import ManualModal, { type ManualSection } from '../components/ManualModal';
import ViewOrdenModal from '../components/ViewOrdenModal';
import RegistrarRepuestosModal from '../components/RegistrarRepuestosModal';
import InventarioVehiculoModal from '../components/InventarioVehiculoModal';
import type { DetalleOrdenTrabajo } from '../types/detalleOrdenTrabajo';

const OrdenesTrabajoList = () => {
    const navigate = useNavigate();
    const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
    const [filteredOrdenes, setFilteredOrdenes] = useState<OrdenTrabajo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [showManual, setShowManual] = useState(false);
    const [selectedOrden, setSelectedOrden] = useState<OrdenTrabajo | null>(null);
    const [ordenDetalles, setOrdenDetalles] = useState<DetalleOrdenTrabajo[]>([]);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showRepuestosModal, setShowRepuestosModal] = useState(false);
    const [showInventarioModal, setShowInventarioModal] = useState(false);
    const [selectedOrdenId, setSelectedOrdenId] = useState<number | null>(null);
    const [selectedPlaca, setSelectedPlaca] = useState<string>('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchOrdenes();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = ordenes.filter(o =>
            o.cliente?.toLowerCase().includes(lowerSearch) ||
            o.placa?.toLowerCase().includes(lowerSearch) ||
            o.marca_auto?.marca?.toLowerCase().includes(lowerSearch)
        );
        setFilteredOrdenes(filtered);
        setCurrentPage(1);
    }, [searchTerm, ordenes]);

    const fetchOrdenes = async () => {
        try {
            setLoading(true);
            const data = await getOrdenesTrabajo();
            setOrdenes(data);
            setFilteredOrdenes(data);
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las órdenes de trabajo'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: number, type: 'start' | 'end') => {
        const title = type === 'start' ? 'Iniciar Trabajo' : 'Finalizar Trabajo';
        const label = type === 'start' ? 'Fecha de Inicio' : 'Fecha de Finalización';

        // Define colors and icons
        const btnColor = type === 'start' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700';
        const btnText = type === 'start' ? 'Iniciar' : 'Finalizar';
        const btnIcon = type === 'start'
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

        const now = new Date();
        const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

        await Swal.fire({
            title: title,
            html: `
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2 text-left">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">${label}</label>
                        <div class="relative flex items-center">
                            <span class="absolute left-3 text-gray-400">
                               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </span>
                            <input type="datetime-local" id="swal-date" class="swal2-input pl-10 h-10" style="padding-left: 2.5rem; width: 100%; box-sizing: border-box; margin: 0;" value="${localIso}" />
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-2">
                        <button id="swal-cancel-btn" class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 font-medium flex items-center gap-2">
                            Cancelar
                        </button>
                        <button id="swal-confirm-btn" class="px-4 py-2 ${btnColor} text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 font-medium flex items-center gap-2">
                            ${btnIcon}
                            ${btnText}
                        </button>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCancelButton: false,
            focusConfirm: false,
            didOpen: () => {
                const confirmBtn = document.getElementById('swal-confirm-btn');
                const cancelBtn = document.getElementById('swal-cancel-btn');
                const dateInput = document.getElementById('swal-date') as HTMLInputElement;

                if (confirmBtn && dateInput) {
                    confirmBtn.addEventListener('click', async () => {
                        const date = dateInput.value;
                        if (date) {
                            Swal.close();
                            const newStatus = type === 'start' ? 'en_proceso' : 'terminado';
                            try {
                                const updateData: any = { estado: newStatus, idusuario: "1" };

                                if (type === 'start') {
                                    updateData.fecha_inicio = new Date(date).toISOString();
                                } else {
                                    updateData.fecha_fin = new Date(date).toISOString();
                                }

                                await updateOrdenTrabajo(id, updateData);

                                // Update local state
                                setOrdenes(current => current.map(o => o.id === id ? { ...o, estado: newStatus } : o));

                                await Swal.fire({
                                    icon: 'success',
                                    title: '¡Actualizado!',
                                    text: `La orden ha pasado a estado: ${newStatus.replace('_', ' ')}`,
                                    timer: 1500,
                                    showConfirmButton: false
                                });
                            } catch (error) {
                                console.error(error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'No se pudo actualizar el estado de la orden'
                                });
                            }
                        }
                    });
                }

                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        Swal.close();
                    });
                }
            }
        });
    };



    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Desactivar orden?',
            text: 'Pasará a estado inactivo',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await deleteOrdenTrabajo(id);
                setOrdenes(ordenes.map(o => o.id === id ? { ...o, estado: 'inactivo' } : o));
                await Swal.fire({
                    icon: 'success',
                    title: '¡Desactivado!',
                    text: 'Orden desactivada exitosamente.',
                    showConfirmButton: false,
                    timer: 1500
                });
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo desactivar'
                });
            }
        }
    };

    const handleReactivate = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Reactivar orden?',
            text: 'Volverá a estar activa',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, reactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await reactivateOrdenTrabajo(id);
                setOrdenes(ordenes.map(o => o.id === id ? { ...o, estado: 'activo' } : o));
                await Swal.fire({
                    icon: 'success',
                    title: '¡Reactivado!',
                    text: 'Orden reactivada exitosamente.',
                    showConfirmButton: false,
                    timer: 1500
                });
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo reactivar'
                });
            }
        }
    };

    const handleRegistrarRepuestos = (id: number) => {
        setSelectedOrdenId(id);
        setShowRepuestosModal(true);
    };

    const handleInventario = (id: number, placa: string) => {
        setSelectedOrdenId(id);
        setSelectedPlaca(placa);
        setShowInventarioModal(true);
    };

    const handleViewOrder = async (id: number) => {
        try {
            const [ordenData, detallesData] = await Promise.all([
                getOrdenTrabajo(id),
                getDetallesByOrden(id)
            ]);
            setSelectedOrden(ordenData);
            setOrdenDetalles(detallesData);
            setShowViewModal(true);
        } catch (error) {
            console.error('Error loading order:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar la orden'
            });
        }
    };

    const handleSendWhatsApp = async (id: number, phoneNumber: string) => {
        try {
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
                            value="${phoneNumber}" 
                            placeholder="Ej: 59170000000"
                        />
                        <p class="text-xs text-gray-500 mt-2">
                            El PDF de la orden de trabajo será enviado a este número.
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

            // Fetch order data
            const ordenData = await getOrdenTrabajo(id);
            const detallesData = await getDetallesByOrden(id);

            // Generate PDF (same logic as handlePrintOrder but return blob)
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const margin = 14;
            const contentWidth = pageWidth - (margin * 2);

            const colorPrimary = [44, 62, 80] as [number, number, number];
            const colorBorder = [189, 195, 199] as [number, number, number];

            const drawBox = (x: number, y: number, w: number, h: number, title: string) => {
                doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
                doc.setLineWidth(0.1);
                doc.rect(x, y, w, h);
                doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
                doc.rect(x, y, w, 7, 'F');
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(title, x + (w / 2), y + 5, { align: 'center' });
            };

            const drawField = (label: string, value: string, x: number, y: number, labelWidth: number) => {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
                doc.text(label, x, y);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                doc.text(value || '', x + labelWidth, y);
            };

            let currentY = 20;
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            doc.text(`ORDEN DE TRABAJO N° ${ordenData.id}`, pageWidth / 2, currentY, { align: 'center' });

            if (ordenData.particular_seguro === 'Seguro') {
                doc.setFontSize(14);
                doc.setTextColor(231, 76, 60);
                doc.text("SEGURO", pageWidth - margin, currentY, { align: 'right' });
            }

            currentY += 8;
            doc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            doc.setLineWidth(0.5);
            doc.line(margin, currentY, pageWidth - margin, currentY);

            currentY += 5;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(`FECHA: ${new Date(ordenData.fecha_registro).toLocaleDateString()}`, margin, currentY);

            currentY += 8;

            const boxHeight = 35;
            const boxWidth = (contentWidth / 2) - 4;
            const col2X = margin + boxWidth + 8;

            drawBox(margin, currentY, boxWidth, boxHeight, "DATOS DEL CLIENTE");
            drawBox(col2X, currentY, boxWidth, boxHeight, "DATOS DEL VEHICULO");

            let rowY = currentY + 12;
            drawField("Nombre:", ordenData.cliente || '', margin + 2, rowY, 15);
            rowY += 5;
            drawField("Dirección:", "", margin + 2, rowY, 16);
            rowY += 5;
            drawField("Teléfono:", "", margin + 2, rowY, 15);
            drawField("Celular:", ordenData.celular || '', margin + 45, rowY, 12);
            rowY += 5;
            drawField("E-mail:", "", margin + 2, rowY, 12);

            rowY = currentY + 12;
            drawField("Marca:", ordenData.marca_auto?.marca || '', col2X + 2, rowY, 12);
            drawField("Modelo:", ordenData.modelo || '', col2X + 45, rowY, 14);
            rowY += 5;
            drawField("Color:", ordenData.color || '', col2X + 2, rowY, 12);
            drawField("Año:", ordenData.anio?.toString() || '', col2X + 45, rowY, 10);
            rowY += 5;
            drawField("Chasis:", "", col2X + 2, rowY, 12);
            drawField("Motor:", "", col2X + 45, rowY, 10);
            rowY += 5;
            drawField("Km. Ing.:", ordenData.km_ingreso?.toString() || '', col2X + 2, rowY, 14);

            doc.setDrawColor(0);
            doc.setFillColor(255, 255, 255);
            doc.rect(col2X + 35, rowY - 1, 55, 11);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            doc.text("PLACA", col2X + 37, rowY + 6);
            doc.setFontSize(16);
            doc.setTextColor(0, 0, 0);
            doc.text(ordenData.placa || '', col2X + 55, rowY + 7);

            currentY += boxHeight + 4;

            drawBox(margin, currentY, boxWidth, 20, "SEGURO");
            drawBox(col2X, currentY, boxWidth, 20, "CONDICIONES GENERALES");

            rowY = currentY + 12;
            if (ordenData.particular_seguro === 'Seguro') {
                drawField("Nombre:", ordenData.seguro?.seguro || '', margin + 2, rowY, 15);
                rowY += 5;
                drawField("Inspector:", ordenData.inspector?.inspector || '', margin + 2, rowY, 15);
            } else {
                drawField("Tipo:", "Particular", margin + 2, rowY, 10);
            }

            rowY = currentY + 12;
            drawField("Plazo Ent.:", "", col2X + 2, rowY, 16);
            rowY += 5;
            drawField("Moneda:", ordenData.moneda || 'Bolivianos', col2X + 2, rowY, 14);

            currentY += 25;

            const tableRows = detallesData.map(d => {
                const categoria = d.precio_taller?.categoria?.categoria_servicio || d.precio_seguro?.categoria?.categoria_servicio || 'General';
                const descripcion = d.precio_taller?.detalle || d.precio_seguro?.detalle || 'Sin descripción';
                const fullDesc = d.observaciones ? `${descripcion}\n(${d.observaciones})` : descripcion;

                return [
                    categoria.toUpperCase(),
                    fullDesc,
                    d.cantidad,
                    d.nivel || '',
                    Number(d.precio_unitario).toFixed(2),
                    Number(d.total).toFixed(2)
                ];
            });

            autoTable(doc, {
                startY: currentY,
                head: [['Categoría', 'D E S C R I P C I Ó N  /  O B S E R V A C I Ó N', 'Cant.', 'Nivel', 'P.U.', 'Total']],
                body: tableRows,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 3,
                    textColor: 0,
                    lineColor: colorBorder,
                    lineWidth: 0.1,
                },
                headStyles: {
                    fillColor: colorPrimary,
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 12, halign: 'center' },
                    3: { cellWidth: 15, halign: 'center' },
                    4: { cellWidth: 20, halign: 'right' },
                    5: { cellWidth: 25, halign: 'right' }
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251]
                }
            });

            const finalY = (doc as any).lastAutoTable.finalY + 5;
            const subTotal = ordenData.sub_total || detallesData.reduce((sum, d) => sum + Number(d.total), 0);
            const totalsBoxWidth = 70;
            const totalsX = pageWidth - margin - totalsBoxWidth;

            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
            doc.rect(totalsX, finalY, totalsBoxWidth, 24);

            let totalY = finalY + 6;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0);
            doc.text(`Subtotal:`, totalsX + 2, totalY);
            doc.text(Number(subTotal).toFixed(2), pageWidth - margin - 2, totalY, { align: 'right' });

            totalY += 6;
            doc.text(`Descuento:`, totalsX + 2, totalY);
            doc.setTextColor(192, 57, 43);
            doc.text(Number(ordenData.descuento || 0).toFixed(2), pageWidth - margin - 2, totalY, { align: 'right' });

            totalY += 2;
            doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
            doc.line(totalsX + 5, totalY, pageWidth - margin - 5, totalY);

            totalY += 6;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            doc.text(`Total General ${ordenData.moneda === 'Dolares' ? '$us' : 'Bs.'}`, totalsX + 2, totalY);
            doc.text(Number(ordenData.total).toFixed(2), pageWidth - margin - 2, totalY, { align: 'right' });

            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
            doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
            doc.text(
                "Es posible que en el proceso del trabajo se detecte(n) en algún(os) sistema(s) mecánico(s) y/o eléctricos del vehículo que no estaría(n) en la presente Proforma. Los repuestos corren por cuenta del Cliente.",
                margin,
                pageHeight - 15,
                { maxWidth: contentWidth - 20 }
            );
            doc.text(`Pág.: 1 / 1`, pageWidth - margin, pageHeight - 15, { align: 'right' });

            // Convert PDF to blob
            const pdfBlob = doc.output('blob');

            // Send to backend
            Swal.update({
                title: 'Enviando por WhatsApp...',
                text: 'Por favor espere'
            });

            const formData = new FormData();
            formData.append('file', pdfBlob, `Orden_Trabajo_${ordenData.placa}_${id}.pdf`);
            formData.append('phoneNumber', confirmedPhone);
            formData.append('caption', `Orden de Trabajo N° ${id} - ${ordenData.cliente}`);

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


    const handlePrintOrder = async (id: number) => {
        try {
            // 1. Fetch complete order data and details
            const ordenData = await getOrdenTrabajo(id);
            const detallesData = await getDetallesByOrden(id);

            // 2. Setup PDF
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const margin = 14;
            const contentWidth = pageWidth - (margin * 2);

            // Colors
            const colorPrimary = [44, 62, 80] as [number, number, number]; // Slate Blue
            const colorBorder = [189, 195, 199] as [number, number, number]; // Gray Border

            // Helpers
            const drawBox = (x: number, y: number, w: number, h: number, title: string) => {
                // Border
                doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
                doc.setLineWidth(0.1);
                doc.rect(x, y, w, h);

                // Title Header
                doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
                doc.rect(x, y, w, 7, 'F');

                // Title Text
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(title, x + (w / 2), y + 5, { align: 'center' });
            };

            const drawField = (label: string, value: string, x: number, y: number, labelWidth: number) => {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
                doc.text(label, x, y);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                doc.text(value || '', x + labelWidth, y);
            };

            // --- HEADER ---
            let currentY = 20;

            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            doc.text(`ORDEN DE TRABAJO N° ${ordenData.id}`, pageWidth / 2, currentY, { align: 'center' });

            // SEGURO Label (Right side)
            if (ordenData.particular_seguro === 'Seguro') {
                doc.setFontSize(14);
                doc.setTextColor(231, 76, 60); // Red accent for emphasis
                doc.text("SEGURO", pageWidth - margin, currentY, { align: 'right' });
            }

            currentY += 8;

            // Date Line
            doc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            doc.setLineWidth(0.5);
            doc.line(margin, currentY, pageWidth - margin, currentY);

            currentY += 5;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(`FECHA: ${new Date(ordenData.fecha_registro).toLocaleDateString()}`, margin, currentY);

            currentY += 8;

            // --- INFO GRIDS ---
            const boxHeight = 35;
            const boxWidth = (contentWidth / 2) - 4;
            const col2X = margin + boxWidth + 8; // Gap of 8

            // Row 1: Cliente & Vehículo
            drawBox(margin, currentY, boxWidth, boxHeight, "DATOS DEL CLIENTE");
            drawBox(col2X, currentY, boxWidth, boxHeight, "DATOS DEL VEHICULO");

            // Cliente Data
            let rowY = currentY + 12;
            drawField("Nombre:", ordenData.cliente || '', margin + 2, rowY, 15);

            rowY += 5;
            drawField("Dirección:", "", margin + 2, rowY, 16);

            rowY += 5;
            drawField("Teléfono:", "", margin + 2, rowY, 15);
            drawField("Celular:", ordenData.celular || '', margin + 45, rowY, 12);

            rowY += 5;
            drawField("E-mail:", "", margin + 2, rowY, 12);

            // Vehículo Data
            rowY = currentY + 12;
            drawField("Marca:", ordenData.marca_auto?.marca || '', col2X + 2, rowY, 12);
            drawField("Modelo:", ordenData.modelo || '', col2X + 45, rowY, 14);

            rowY += 5;
            drawField("Color:", ordenData.color || '', col2X + 2, rowY, 12);
            drawField("Año:", ordenData.anio?.toString() || '', col2X + 45, rowY, 10);

            rowY += 5;
            drawField("Chasis:", "", col2X + 2, rowY, 12);
            drawField("Motor:", "", col2X + 45, rowY, 10);

            rowY += 5;
            drawField("Km. Ing.:", ordenData.km_ingreso?.toString() || '', col2X + 2, rowY, 14);

            // PLACA (Boxed inside Vehicle box)
            doc.setDrawColor(0);
            doc.setFillColor(255, 255, 255);
            doc.rect(col2X + 35, rowY - 1, 55, 11);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            doc.text("PLACA", col2X + 37, rowY + 6);
            doc.setFontSize(16);
            doc.setTextColor(0, 0, 0);
            doc.text(ordenData.placa || '', col2X + 55, rowY + 7);


            currentY += boxHeight + 4;

            // Row 2: Seguro & Condiciones
            drawBox(margin, currentY, boxWidth, 20, "SEGURO");
            drawBox(col2X, currentY, boxWidth, 20, "CONDICIONES GENERALES");

            // Seguro Data
            rowY = currentY + 12;
            if (ordenData.particular_seguro === 'Seguro') {
                drawField("Nombre:", ordenData.seguro?.seguro || '', margin + 2, rowY, 15);
                rowY += 5;
                drawField("Inspector:", ordenData.inspector?.inspector || '', margin + 2, rowY, 15);
            } else {
                drawField("Tipo:", "Particular", margin + 2, rowY, 10);
            }

            // Condiciones Data
            rowY = currentY + 12;
            drawField("Plazo Ent.:", "", col2X + 2, rowY, 16);
            rowY += 5;
            drawField("Moneda:", ordenData.moneda || 'Bolivianos', col2X + 2, rowY, 14);

            currentY += 25;

            // --- DETAILS TABLE ---
            const tableRows = detallesData.map(d => {
                const categoria = d.precio_taller?.categoria?.categoria_servicio || d.precio_seguro?.categoria?.categoria_servicio || 'General';
                const descripcion = d.precio_taller?.detalle || d.precio_seguro?.detalle || 'Sin descripción';
                const fullDesc = d.observaciones ? `${descripcion}\n(${d.observaciones})` : descripcion;

                return [
                    categoria.toUpperCase(),
                    fullDesc,
                    d.cantidad,
                    d.nivel || '',
                    Number(d.precio_unitario).toFixed(2),
                    Number(d.total).toFixed(2)
                ];
            });

            autoTable(doc, {
                startY: currentY,
                head: [['Categoría', 'D E S C R I P C I Ó N  /  O B S E R V A C I Ó N', 'Cant.', 'Nivel', 'P.U.', 'Total']],
                body: tableRows,
                theme: 'grid',
                styles: {
                    fontSize: 8,
                    cellPadding: 3,
                    textColor: 0,
                    lineColor: colorBorder,
                    lineWidth: 0.1,
                },
                headStyles: {
                    fillColor: colorPrimary,
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 12, halign: 'center' },
                    3: { cellWidth: 15, halign: 'center' },
                    4: { cellWidth: 20, halign: 'right' },
                    5: { cellWidth: 25, halign: 'right' }
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251]
                }
            });

            // --- FOOTER & TOTALS ---
            const finalY = (doc as any).lastAutoTable.finalY + 5;

            // Calculate Totals
            const subTotal = ordenData.sub_total || detallesData.reduce((sum, d) => sum + Number(d.total), 0);

            // Totals Box
            const totalsBoxWidth = 70;
            const totalsX = pageWidth - margin - totalsBoxWidth;

            // Draw Totals Box Background
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
            doc.rect(totalsX, finalY, totalsBoxWidth, 24);

            let totalY = finalY + 6;

            // Subtotal
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0);
            doc.text(`Subtotal:`, totalsX + 2, totalY);
            doc.text(Number(subTotal).toFixed(2), pageWidth - margin - 2, totalY, { align: 'right' });

            totalY += 6;

            // Descuento
            doc.text(`Descuento:`, totalsX + 2, totalY);
            doc.setTextColor(192, 57, 43); // Red for discount
            doc.text(Number(ordenData.descuento || 0).toFixed(2), pageWidth - margin - 2, totalY, { align: 'right' });

            totalY += 2;
            doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
            doc.line(totalsX + 5, totalY, pageWidth - margin - 5, totalY);

            totalY += 6;

            // Total Final
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            doc.text(`Total General ${ordenData.moneda === 'Dolares' ? '$us' : 'Bs.'}`, totalsX + 2, totalY);
            doc.text(Number(ordenData.total).toFixed(2), pageWidth - margin - 2, totalY, { align: 'right' });


            // Disclaimer
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);

            doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
            doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

            doc.text(
                "Es posible que en el proceso del trabajo se detecte(n) en algún(os) sistema(s) mecánico(s) y/o eléctricos del vehículo que no estaría(n) en la presente Proforma. Los repuestos corren por cuenta del Cliente.",
                margin,
                pageHeight - 15,
                { maxWidth: contentWidth - 20 }
            );

            // Page Number
            doc.text(`Pág.: 1 / 1`, pageWidth - margin, pageHeight - 15, { align: 'right' });


            // Save PDF
            doc.save(`Orden_Trabajo_${ordenData.placa}_${id}.pdf`);

        } catch (error) {
            console.error('Error printing order:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo generar el reporte'
            });
        }
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredOrdenes.map(o => ({
            'Fecha': new Date(o.fecha_registro).toLocaleDateString(),
            'Placa': o.placa,
            'Marca': o.marca_auto?.marca || '',
            'Modelo': o.modelo,
            'Tipo Vehículo': o.tipo_vehiculo?.tipo || '',
            'Seguro/Inspector': o.particular_seguro === 'Seguro' ? `${o.seguro?.seguro || ''} (${o.inspector?.inspector || ''})` : o.particular_seguro,
            'Cliente': o.cliente,
            'Total': o.total,
            'Estado': o.estado
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "OrdenesTrabajo");
        XLSX.writeFile(workbook, `OrdenesTrabajo_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.setTextColor(52, 152, 219);
        doc.text('Órdenes de Trabajo', 14, 22);
        doc.setLineWidth(0.5);
        doc.setDrawColor(52, 152, 219);
        doc.line(14, 25, 196, 25);

        autoTable(doc, {
            startY: 30,
            head: [['Fecha', 'Placa', 'Marca', 'Modelo', 'Tipo', 'Seguro/Insp.', 'Cliente', 'Total']],
            body: filteredOrdenes.map(o => [
                new Date(o.fecha_registro).toLocaleDateString(),
                o.placa,
                o.marca_auto?.marca || '',
                o.modelo,
                o.tipo_vehiculo?.tipo || '',
                o.particular_seguro === 'Seguro' ? `${o.seguro?.seguro || ''} (${o.inspector?.inspector || ''})` : o.particular_seguro,
                o.cliente,
                `${o.moneda?.toLowerCase() === 'bolivianos' ? 'Bs' : '$us'} ${Number(o.total).toFixed(2)}`
            ]),
            headStyles: { fillColor: [52, 152, 219] },
            alternateRowStyles: { fillColor: [240, 248, 255] },
        });
        doc.save(`OrdenesTrabajo_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const printList = () => {
        window.print();
    };

    const manualSections: ManualSection[] = [
        { title: 'Gestión de Órdenes', content: 'Administre las órdenes de trabajo del taller.' },
        { title: 'Crear Orden', content: 'Haga clic en "Nueva Orden" para crear una nueva orden de trabajo.' },
        { title: 'Editar/Eliminar', content: 'Use los botones de acción para editar o desactivar órdenes.' }
    ];

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrdenes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrdenes.length / itemsPerPage);

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="container mx-auto relative min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <ClipboardList className="text-blue-600" size={32} />
                        Órdenes de Trabajo
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los trabajos y servicios del taller</p>
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
                            onClick={exportToPDF}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-center gap-1 min-w-[60px]"
                            title="Exportar a PDF"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span className="text-[10px] font-semibold">PDF</span>
                        </button>

                        <button
                            onClick={printList}
                            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex flex-col items-center gap-1 min-w-[60px]"
                            title="Imprimir"
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
                            onClick={() => navigate('/ordenes-trabajo/create')}
                            className="bg-[#3498db] hover:bg-[#2980b9] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 font-medium"
                        >
                            <span>+</span> Nueva Orden
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-6 flex items-center gap-2 no-print">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por cliente, placa o marca..."
                        className="w-full md:w-96 pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors border border-red-200 shadow-sm"
                        title="Limpiar búsqueda"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Mostrando {filteredOrdenes.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrdenes.length)} de {filteredOrdenes.length} registros
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">#</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">N° Orden</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Placa</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marca</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Modelo</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seguro (Inspector)</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Procesos</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider no-print">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {currentItems.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 text-gray-500 dark:text-gray-400 font-mono text-sm">
                                        {indexOfFirstItem + index + 1}
                                    </td>
                                    <td className="p-4 text-blue-600 dark:text-blue-400 font-bold text-sm">#{item.id}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{new Date(item.fecha_registro).toLocaleDateString()}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200 font-mono font-bold">{item.placa}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{item.marca_auto?.marca || 'N/A'}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{item.modelo}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">
                                        {item.particular_seguro === 'Seguro'
                                            ? `${item.seguro?.seguro || 'N/A'} (${item.inspector?.inspector || 'N/A'})`
                                            : item.particular_seguro
                                        }
                                    </td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200 font-medium">{item.cliente}</td>
                                    <td className="p-4 text-gray-700 dark:text-gray-200">{item.moneda?.toLowerCase() === 'bolivianos' ? 'Bs' : '$us'} {Number(item.total).toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${item.estado === 'activo'
                                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                            : item.estado === 'en_proceso'
                                                ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                                : item.estado === 'terminado'
                                                    ? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
                                                    : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                                            }`}>
                                            {item.estado.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1 min-w-[120px]">
                                            <button
                                                onClick={() => navigate(`/ordenes-trabajo/${item.id}/asignar`)}
                                                className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                                                title="Asignar Trabajos"
                                            >
                                                <ClipboardList size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleInventario(item.id, item.placa)}
                                                className="p-1.5 bg-cyan-100 hover:bg-cyan-200 text-cyan-700 rounded transition-colors"
                                                title="Inventario del Vehículo"
                                            >
                                                <Car size={16} />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/ordenes-trabajo/${item.id}/material-utilizado`)}
                                                className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded transition-colors"
                                                title="Asignar Material Utilizado"
                                            >
                                                <Hammer size={16} />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/proveedores/compra-insumos/${item.id}`)}
                                                className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                                                title="Agregar Insumos o Repuestos"
                                            >
                                                <PackagePlus size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleRegistrarRepuestos(item.id)}
                                                className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded transition-colors"
                                                title="Registrar Repuesto(s)"
                                            >
                                                <FileText size={16} />
                                            </button>

                                            {item.estado === 'activo' && (
                                                <button
                                                    onClick={() => handleStatusChange(item.id, 'start')}
                                                    className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                                                    title="Iniciar Trabajo"
                                                >
                                                    <Timer size={16} />
                                                </button>
                                            )}
                                            {item.estado === 'en_proceso' && (
                                                <button
                                                    onClick={() => handleStatusChange(item.id, 'end')}
                                                    className="p-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors"
                                                    title="Finalizar Trabajo"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}

                                            <button
                                                className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                                                title="Registrar un Reclamo"
                                            >
                                                <AlertTriangle size={16} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4 flex gap-2 justify-end no-print">
                                        <button
                                            onClick={() => handleViewOrder(item.id)}
                                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                            title="Ver Orden de Trabajo"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handlePrintOrder(item.id)}
                                            className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                            title="Imprimir Detalle"
                                        >
                                            <Printer size={16} />
                                        </button>
                                        {item.celular && (
                                            <button
                                                onClick={() => handleSendWhatsApp(item.id, item.celular || '')}
                                                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Enviar por WhatsApp"
                                            >
                                                <MessageCircle size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => navigate(`/ordenes-trabajo/edit/${item.id}`)}
                                            className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        {item.estado !== 'inactivo' ? (
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Desactivar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                                </svg>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleReactivate(item.id)}
                                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Reactivar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredOrdenes.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="font-medium">
                                                {searchTerm ? 'No se encontraron resultados' : 'No hay órdenes de trabajo registradas'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {showViewModal && (
                <ViewOrdenModal
                    orden={selectedOrden}
                    detalles={ordenDetalles}
                    onClose={() => setShowViewModal(false)}
                />
            )}

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual de Órdenes de Trabajo"
                sections={manualSections}
            />
            {showRepuestosModal && selectedOrdenId && (
                <RegistrarRepuestosModal
                    ordenId={selectedOrdenId}
                    onClose={() => setShowRepuestosModal(false)}
                />
            )}

            <InventarioVehiculoModal
                isOpen={showInventarioModal}
                onClose={() => setShowInventarioModal(false)}
                ordenId={selectedOrdenId || 0}
                placa={selectedPlaca}
            />
        </div>
    );
};

export default OrdenesTrabajoList;
