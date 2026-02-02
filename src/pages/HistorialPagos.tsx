import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, Search, FileText, X, Eye, Printer } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import type { Personal } from '../types/personal';
import Pagination from '../components/Pagination';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Pago {
    id: number;
    fecha_pago: string;
    total: number;
    detalle: string;
    idpersonal: number;
    personal: Personal;
    trabajos: any[];
}

const HistorialPagos = () => {
    const navigate = useNavigate();
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [filteredPagos, setFilteredPagos] = useState<Pago[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchPagos();
    }, []);

    useEffect(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const filtered = pagos.filter(p =>
            p.personal?.nombre?.toLowerCase().includes(lowerSearchTerm) ||
            p.personal?.paterno?.toLowerCase().includes(lowerSearchTerm) ||
            p.id.toString().includes(lowerSearchTerm)
        );
        setFilteredPagos(filtered);
        setCurrentPage(1);
    }, [searchTerm, pagos]);

    const fetchPagos = async () => {
        setLoading(true);
        try {
            const response = await api.get('/pagos-trabajos-asignados');
            setPagos(response.data);
            setFilteredPagos(response.data);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo cargar el historial de pagos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Eliminar Pago?',
            text: "Esta acción reverterá los trabajos asociados a 'Pendientes'. ¡No se puede deshacer!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/pagos-trabajos-asignados/${id}`);
                await Swal.fire('Eliminado', 'El pago ha sido eliminado y los trabajos revertidos.', 'success');
                fetchPagos();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo eliminar el pago', 'error');
            }
        }
    };

    const fetchPagoDetails = async (id: number) => {
        try {
            const response = await api.get(`/pagos-trabajos-asignados/${id}`);
            return response.data;
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar los detalles del pago', 'error');
            return null;
        }
    };

    const handleView = async (id: number) => {
        const pago = await fetchPagoDetails(id);
        if (!pago) return;

        // Group works by vehicle
        const groups: Record<string, { vehicle: any, works: any[] }> = {};
        const others: any[] = [];

        pago.trabajos.forEach((t: any) => {
            const orden = t.detalle_orden_trabajo?.orden_trabajo;
            if (orden) {
                const key = orden.id || 'unknown';
                if (!groups[key]) {
                    groups[key] = {
                        vehicle: {
                            marca: orden.marca_auto?.marca || 'Marca Desconocida',
                            modelo: orden.modelo,
                            placa: orden.placa,
                            anio: orden.anio,
                            color: orden.color,
                            tipo: orden.tipo_vehiculo?.nombre,
                            ordenId: orden.id,
                            fecha_registro: orden.fecha_registro,
                            fecha_fin: orden.fecha_fin
                        },
                        works: []
                    };
                }
                groups[key].works.push(t);
            } else {
                others.push(t);
            }
        });

        let contentHtml = '';

        // Render Vehicle Groups
        Object.values(groups).forEach((group) => {
            const { vehicle, works } = group;
            const subtotal = works.reduce((sum, t) => sum + Number(t.monto), 0);

            contentHtml += `
                <div style="background-color: #f0f4f8; padding: 10px; border-radius: 8px; margin-bottom: 10px; text-align: left; border-left: 4px solid #3b82f6;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h3 style="margin: 0; color: #1e40af; font-size: 16px;">${vehicle.marca} ${vehicle.modelo} <span style="font-weight:normal; color:#6b7280; font-size: 14px;">(${vehicle.anio || '-'})</span></h3>
                        <span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">OT #${vehicle.ordenId}</span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 15px; font-size: 13px; color: #4b5563; margin-top: 8px;">
                        <span><strong>Placa:</strong> ${vehicle.placa}</span>
                        <span><strong>Color:</strong> ${vehicle.color || '-'}</span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 15px; font-size: 12px; color: #6b7280; margin-top: 5px; border-top: 1px solid #e5e7eb; padding-top: 5px;">
                        <span><strong>Registro:</strong> ${new Date(vehicle.fecha_registro).toLocaleDateString()}</span>
                        <span><strong>Terminado:</strong> ${vehicle.fecha_fin ? new Date(vehicle.fecha_fin).toLocaleDateString() : 'Pendiente'}</span>
                    </div>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Descripción</th>
                            <th style="text-align: right; padding: 8px; border-bottom: 2px solid #ddd;">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${works.map((t: any) => `
                            <tr>
                                <td style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">
                                    ${t.detalle_orden_trabajo?.observaciones || t.detalle_orden_trabajo?.descripcion || t.detalle_orden_trabajo?.detalle || 'Trabajo Taller'}
                                </td>
                                <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">
                                    Bs ${Number(t.monto).toFixed(2)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style="text-align: right; padding: 8px; border-top: 2px solid #ddd; color: #4b5563;"><strong>Subtotal Vehículo:</strong></td>
                            <td style="text-align: right; padding: 8px; border-top: 2px solid #ddd; font-weight: bold; color: #4b5563;">Bs ${subtotal.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            `;
        });

        // Render Others
        if (others.length > 0) {
            const subtotal = others.reduce((sum, t) => sum + Number(t.monto), 0);
            contentHtml += `
                <div style="background-color: #f3f4f6; padding: 10px; border-radius: 8px; margin-bottom: 10px; text-align: left;">
                    <h3 style="margin: 0; color: #374151; font-size: 16px;">Otros Trabajos</h3>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ddd;">Descripción</th>
                            <th style="text-align: right; padding: 8px; border-bottom: 2px solid #ddd;">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${others.map((t: any) => `
                            <tr>
                                <td style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">
                                    ${t.detalle_orden_trabajo?.observaciones || t.detalle_orden_trabajo?.descripcion || t.detalle_orden_trabajo?.detalle || 'Trabajo Taller'}
                                </td>
                                <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">
                                    Bs ${Number(t.monto).toFixed(2)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                     <tfoot>
                        <tr>
                            <td style="text-align: right; padding: 8px; font-weight: bold; color: #4b5563;">Subtotal Otros:</td>
                            <td style="text-align: right; padding: 8px; font-weight: bold; color: #4b5563;">Bs ${subtotal.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            `;
        }

        Swal.fire({
            title: `<strong>Detalle de Pago #${pago.id}</strong>`,
            html: `
                <div style="text-align: left; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <p><strong>Fecha:</strong> ${new Date(pago.fecha_pago).toLocaleDateString()}</p>
                    <p><strong>Personal:</strong> ${pago.personal.nombre} ${pago.personal.paterno}</p>
                </div>
                
                <div style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
                    ${contentHtml}
                </div>

                <div style="text-align: right; margin-top: 15px; border-top: 2px solid #eee; padding-top: 10px;">
                    <span style="font-size: 18px; font-weight: bold;">Total Pagado: Bs ${Number(pago.total).toFixed(2)}</span>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            width: '700px'
        });
    };

    const handlePrint = async (id: number) => {
        const pago = await fetchPagoDetails(id);
        if (!pago) return;

        const doc = new jsPDF();
        let yPos = 20;

        // Header
        doc.setFontSize(18);
        doc.text('Recibo de Pago', 105, yPos, { align: 'center' });
        yPos += 15;

        doc.setFontSize(10);
        doc.text(`Nº Recibo: ${pago.id}`, 14, yPos);
        doc.text(`Fecha: ${new Date(pago.fecha_pago).toLocaleDateString()}`, 14, yPos + 7);
        doc.text(`Personal: ${pago.personal.nombre} ${pago.personal.paterno}`, 14, yPos + 14);
        doc.text(`CI: ${pago.personal.ci || ''}`, 14, yPos + 21);
        yPos += 30;

        // Group works by vehicle
        const groups: Record<string, { vehicle: any, works: any[] }> = {};
        const others: any[] = [];

        pago.trabajos.forEach((t: any) => {
            const orden = t.detalle_orden_trabajo?.orden_trabajo;
            if (orden) {
                const key = orden.id || 'unknown';
                if (!groups[key]) {
                    groups[key] = {
                        vehicle: {
                            marca: orden.marca_auto?.marca || 'Marca Desconocida',
                            modelo: orden.modelo,
                            placa: orden.placa,
                            anio: orden.anio,
                            color: orden.color,
                            tipo: orden.tipo_vehiculo?.nombre,
                            ordenId: orden.id,
                            fecha_registro: orden.fecha_registro,
                            fecha_fin: orden.fecha_fin
                        },
                        works: []
                    };
                }
                groups[key].works.push(t);
            } else {
                others.push(t);
            }
        });

        // Function to check page break
        const checkPageBreak = (neededSpace: number) => {
            if (yPos + neededSpace > 280) {
                doc.addPage();
                yPos = 20;
            }
        };

        // Render Vehicle Groups
        Object.values(groups).forEach((group) => {
            const { vehicle, works } = group;
            checkPageBreak(50); // Header + some table rows

            // Vehicle Header Box
            doc.setFillColor(240, 244, 248); // Light gray/blue
            doc.setDrawColor(200, 200, 200);
            doc.rect(14, yPos, 182, 25, 'FD');

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 64, 175); // Blue
            doc.text(`${vehicle.marca} ${vehicle.modelo} (${vehicle.anio || '-'})`, 20, yPos + 8);

            doc.setTextColor(55, 48, 163); // Indigo
            doc.text(`OT #${vehicle.ordenId}`, 190, yPos + 8, { align: 'right' });

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(75, 85, 99); // Gray
            doc.text(`Placa: ${vehicle.placa} | Color: ${vehicle.color || '-'}`, 20, yPos + 16);

            const fechaFin = vehicle.fecha_fin ? new Date(vehicle.fecha_fin).toLocaleDateString() : 'Pendiente';
            doc.text(`Registro: ${new Date(vehicle.fecha_registro).toLocaleDateString()} | Terminado: ${fechaFin}`, 20, yPos + 22);

            yPos += 30;

            const tableBody = works.map((t: any) => [
                t.detalle_orden_trabajo?.observaciones || t.detalle_orden_trabajo?.descripcion || t.detalle_orden_trabajo?.detalle || 'Trabajo Taller',
                `Bs ${Number(t.monto).toFixed(2)}`
            ]);

            const subtotal = works.reduce((sum, t) => sum + Number(t.monto), 0);

            autoTable(doc, {
                startY: yPos,
                head: [['Descripción', 'Monto']],
                body: tableBody,
                foot: [['Subtotal Vehículo', `Bs ${subtotal.toFixed(2)}`]],
                theme: 'grid', // 'grid' theme often looks cleaner for formal docs than 'striped'
                headStyles: { fillColor: [59, 130, 246], textColor: 255 }, // Blue header
                footStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55], fontStyle: 'bold', halign: 'right' },
                columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 40, halign: 'right' } },
                margin: { left: 14, right: 14 }
            });

            yPos = (doc as any).lastAutoTable.finalY + 10;
        });

        // Render Others
        if (others.length > 0) {
            checkPageBreak(40);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text('Otros Trabajos', 14, yPos + 5);
            yPos += 10;

            const tableBody = others.map((t: any) => [
                t.detalle_orden_trabajo?.observaciones || t.detalle_orden_trabajo?.descripcion || t.detalle_orden_trabajo?.detalle || 'Trabajo Taller',
                `Bs ${Number(t.monto).toFixed(2)}`
            ]);
            const subtotal = others.reduce((sum, t) => sum + Number(t.monto), 0);

            autoTable(doc, {
                startY: yPos,
                head: [['Descripción', 'Monto']],
                body: tableBody,
                foot: [['Subtotal Otros', `Bs ${subtotal.toFixed(2)}`]],
                theme: 'grid',
                headStyles: { fillColor: [107, 114, 128] },
                footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'right' },
                columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 40, halign: 'right' } },
                margin: { left: 14, right: 14 }
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
        }

        // Final Total
        checkPageBreak(30);
        doc.setFillColor(240, 255, 240);
        doc.setDrawColor(22, 163, 74); // Green border
        doc.rect(120, yPos, 76, 12, 'FD');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Pagado: Bs ${Number(pago.total).toFixed(2)}`, 158, yPos + 8, { align: 'center' });

        yPos += 40;

        // Footer signatures
        checkPageBreak(40);

        doc.setDrawColor(0);
        doc.line(30, yPos, 90, yPos);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Entregué Conforme', 60, yPos + 5, { align: 'center' });

        doc.line(120, yPos, 180, yPos);
        doc.text('Recibí Conforme', 150, yPos + 5, { align: 'center' });

        // Open PDF
        window.open(doc.output('bloburl'), '_blank');
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPagos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPagos.length / itemsPerPage);

    return (
        <div className="container mx-auto relative min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 no-print">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <FileText className="text-teal-600" size={32} />
                            Historial de Pagos
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona el historial de pagos y trabajos realizados</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Ayuda / Manual"
                    >
                        ?
                    </button>

                    <div className="w-px h-10 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                    <button
                        onClick={() => navigate('/pagos-trabajos/lista')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 font-medium"
                    >
                        <Plus size={20} />
                        <span>Nuevo Pago</span>
                    </button>
                </div>
            </div>

            <div className="mb-6 flex items-center gap-2 no-print">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por personal o ID..."
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
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Mostrando {filteredPagos.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredPagos.length)} de {filteredPagos.length} registros
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Personal</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trabajos</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Total</th>
                                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Cargando pagos...</td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                                            <p className="font-medium">
                                                {searchTerm ? 'No se encontraron resultados' : 'No hay pagos registrados'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((pago, index) => (
                                    <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 text-gray-500 dark:text-gray-400 font-mono text-sm">
                                            {indexOfFirstItem + index + 1}
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-200 font-medium">
                                            {new Date(pago.fecha_pago).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">
                                            {pago.personal ? `${pago.personal.nombre} ${pago.personal.paterno}` : 'N/A'}
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300">
                                            {pago.trabajos?.length || 0} items
                                        </td>
                                        <td className="p-4 text-right font-bold text-green-600 dark:text-green-400">
                                            Bs {Number(pago.total).toFixed(2)}
                                        </td>
                                        <td className="p-4 flex gap-2 justify-center">
                                            <button
                                                onClick={() => handleView(pago.id)}
                                                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Ver Detalle"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handlePrint(pago.id)}
                                                className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Imprimir Recibo"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/pagos-trabajos/lista?edit=${pago.id}`)}
                                                className="p-2 bg-amber-400 hover:bg-amber-500 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(pago.id)}
                                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
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
        </div>
    );
};

export default HistorialPagos;
