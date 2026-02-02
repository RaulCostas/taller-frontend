import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import ManualModal, { type ManualSection } from './ManualModal';
import { ClipboardList, Wallet, Users, ShoppingBag, Package, Banknote, Landmark, Search, RefreshCw, Printer } from 'lucide-react';

// Interfaces for TALLER
interface PagoOrden {
    id: number;
    fecha: string;
    monto: number;
    moneda: string;
    observacion: string;
    orden_trabajo: {
        id: number;
        cliente: string;
        marca_auto: { marca: string };
        modelo: string;
        placa: string;
    };
    forma_pago: { forma_pago: string };
    tc?: number;
    comision_tarjeta?: {
        monto: number;
        red_banco: string; // Adjusted based on TALLER entity if exists, or check standard
    };
}

interface Egreso {
    id: number;
    fecha: string;
    destino: string; // 'Consultorio' | 'Casa'
    detalle: string;
    monto: number;
    moneda: string;
    formaPago?: { forma_pago: string };
}

interface PagoPersonal {
    id: number;
    fecha_pago: string;
    total: number;
    personal: { nombre: string; apellido_paterno: string };
    detalle?: string;
}

interface PagoProveedor {
    id: number;
    fecha: string;
    material_pedido: {
        total: number;
        proveedor: { proveedor: string };
        observaciones: string;
    };
    moneda: string;
    factura?: string;
    recibo?: string;
    forma_pago: { forma_pago: string };
}

interface PagoGastoFijo {
    id: number;
    fecha: string;
    monto: number;
    moneda: string;
    gastoFijo: { destino: string; gasto_fijo: string };
    formaPago: { forma_pago: string };
    observaciones?: string;
}

interface CompraInsumo {
    id: number;
    fecha: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
    moneda: string;
    proveedor: { proveedor: string };
    forma_pago: { forma_pago: string };
    nro_factura?: string;
    nro_recibo?: string;
}
interface Anticipo {
    id: number;
    fecha: string;
    monto: number;
    motivo: string;
    personal: { nombre: string; apellido_paterno: string };
    estado: string;
    moneda?: string; // Assuming entity might have it or default to Bs
}

interface PagoPlanillaItem {
    id: number;
    fecha_pago: string;
    monto: number;
    observaciones: string;
    planilla: { mes: number; anio: number };
    moneda?: string;
}

interface Summary {
    [key: string]: { Bs: number; Sus: number };
}

const HojaDiaria: React.FC = () => {
    // State
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [calendarValue, setCalendarValue] = useState<any>(new Date());
    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Hoja Diaria',
            content: 'Resumen de movimientos financieros del día o rango de fechas seleccionado.'
        },
        {
            title: 'Pestañas',
            content: 'Navegue entre Ingresos (Pagos de Órdenes), Egresos Diarios, Pagos a Personal, Pagos a Proveedores y Gastos Fijos.'
        },
        {
            title: 'Búsqueda',
            content: 'Puede ver los datos de una fecha específica seleccionándola en el calendario, o buscar un rango de fechas usando el formulario de la derecha.'
        },
        {
            title: 'Impresión',
            content: 'Utilice el botón "Imprimir" para generar un reporte físico de la vista actual.'
        }
    ];

    // Range Search State
    const [rangeStart, setRangeStart] = useState<string>('');
    const [rangeEnd, setRangeEnd] = useState<string>('');
    const [searchMode, setSearchMode] = useState<'single' | 'range'>('single');

    const [activeTab, setActiveTab] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    // Data States
    const [ingresos, setIngresos] = useState<PagoOrden[]>([]);
    const [egresos, setEgresos] = useState<Egreso[]>([]);
    const [pagosPersonal, setPagosPersonal] = useState<PagoPersonal[]>([]);
    const [anticiposList, setAnticiposList] = useState<Anticipo[]>([]);
    const [pagosPlanillasList, setPagosPlanillasList] = useState<PagoPlanillaItem[]>([]);
    const [pagosProveedores, setPagosProveedores] = useState<PagoProveedor[]>([]);
    const [gastosFijosConsultorio, setGastosFijosConsultorio] = useState<PagoGastoFijo[]>([]);
    const [gastosFijosCasa, setGastosFijosCasa] = useState<PagoGastoFijo[]>([]);
    const [insumos, setInsumos] = useState<CompraInsumo[]>([]);

    // Derived states for filtering
    const sueldos = pagosPersonal.filter(p => p.detalle?.toLowerCase().includes('sueldo'));
    const adelantos = pagosPersonal.filter(p => p.detalle?.toLowerCase().includes('adelanto'));

    const [activeEgresosTab, setActiveEgresosTab] = useState<'Taller' | 'Casa'>('Taller');
    const [activeGastosTab, setActiveGastosTab] = useState<'Taller' | 'Casa'>('Taller');

    const tabs = [
        { label: "Ingresos (Órdenes)", icon: <Wallet size={16} /> },
        { label: "Egresos Diarios", icon: <Banknote size={16} /> },
        { label: "Pagos a Personal", icon: <Users size={16} /> },
        { label: "Pagos a Proveedores", icon: <ShoppingBag size={16} /> },
        { label: "Gastos Fijos", icon: <Landmark size={16} /> },
        { label: "Insumos", icon: <Package size={16} /> },
        { label: "Sueldos", icon: <Users size={16} /> },
        { label: "Adelantos", icon: <Banknote size={16} /> }
    ];

    const fetchAllData = async (modeOverride?: 'single' | 'range') => {
        setLoading(true);
        try {
            const currentMode = modeOverride || searchMode;
            let startDateStr = '';
            let endDateStr = '';

            if (currentMode === 'single') {
                startDateStr = selectedDate;
                endDateStr = selectedDate;
            } else {
                if (!rangeStart || !rangeEnd) {
                    Swal.fire('Atención', 'Seleccione ambas fechas para el rango', 'warning');
                    setLoading(false);
                    return;
                }
                startDateStr = rangeStart;
                endDateStr = rangeEnd;
            }

            // Client-side filtering check
            const isInRange = (dateStr: string) => {
                const d = new Date(dateStr).toISOString().split('T')[0];
                return d >= startDateStr && d <= endDateStr;
            };

            const [
                resIngresos,
                resEgresos,
                resPersonal,
                resProveedores,
                resGastosFijos,
                resInsumos,
                resAnticipos,
                resPlanillas
            ] = await Promise.all([
                api.get('/pago-orden'),
                api.get('/egresos'),
                api.get('/pagos-trabajos-asignados'),
                api.get('/pago-pedidos'),
                api.get('/pagos-gastos-fijos'),
                api.get('/compra-insumos'),
                api.get('/anticipos'),
                api.get('/pagos-planillas')
            ]);

            // Filter Ingresos
            setIngresos(resIngresos.data.filter((i: PagoOrden) => isInRange(i.fecha)));

            // Filter Egresos
            const egresosData = Array.isArray(resEgresos.data.data) ? resEgresos.data.data : (Array.isArray(resEgresos.data) ? resEgresos.data : []);
            setEgresos(egresosData.filter((e: Egreso) => isInRange(e.fecha)));

            // Filter Personal
            setPagosPersonal(resPersonal.data.filter((p: PagoPersonal) => isInRange(p.fecha_pago)));

            // Filter Proveedores
            setPagosProveedores(resProveedores.data.filter((p: PagoProveedor) => isInRange(p.fecha)));

            // Filter Gastos Fijos
            const allGastosFijos: PagoGastoFijo[] = resGastosFijos.data.filter((gf: PagoGastoFijo) => isInRange(gf.fecha));
            setGastosFijosConsultorio(allGastosFijos.filter(gf => gf.gastoFijo?.destino === 'Taller'));
            setGastosFijosCasa(allGastosFijos.filter(gf => gf.gastoFijo?.destino === 'Casa'));

            // Filter Insumos
            // Filter Insumos
            setInsumos(resInsumos.data.filter((i: CompraInsumo) => isInRange(i.fecha)));

            // Filter Anticipos
            setAnticiposList(resAnticipos.data.filter((a: Anticipo) => isInRange(a.fecha)));

            // Filter Planillas
            setPagosPlanillasList(resPlanillas.data.filter((p: PagoPlanillaItem) => isInRange(p.fecha_pago)));

        } catch (error) {
            console.error("Error fetching Hoja Diaria:", error);
            Swal.fire('Error', 'No se pudieron cargar los datos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Effect for single date change
    useEffect(() => {
        if (searchMode === 'single') {
            fetchAllData();
        }
    }, [selectedDate, searchMode]);

    const handleCalendarChange = (value: any) => {
        setCalendarValue(value);
        if (value instanceof Date) {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            setSelectedDate(`${year}-${month}-${day}`);
            setSearchMode('single'); // Switch to single mode
        }
    };

    const handleRangeSearch = () => {
        if (!rangeStart || !rangeEnd) {
            Swal.fire('Campos requeridos', 'Por favor seleccione fecha inicio y fecha fin', 'warning');
            return;
        }
        setSearchMode('range');
        fetchAllData('range');
    };

    // Helper function to generate filter info text
    const getFilterInfoText = (): string => {
        const formatDateDisplay = (dateStr: string) => {
            if (!dateStr) return '';
            const [y, m, d] = dateStr.split('-');
            return `${d}/${m}/${y}`;
        };

        if (searchMode === 'single') {
            return `Fecha: ${formatDateDisplay(selectedDate)}`;
        } else {
            return `Rango: ${formatDateDisplay(rangeStart)} al ${formatDateDisplay(rangeEnd)}`;
        }
    };

    const formatMoney = (amount: number, currency: string) => {
        const symbol = currency === 'Dólares' ? '$us' : 'Bs';
        return `${symbol} ${Number(amount).toFixed(2)}`;
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // adjust for timezone issue if needed, but assuming direct string split is safer for YYYY-MM-DD
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return date.toLocaleDateString();
    };


    const calculateSummary = (items: any[], type: 'ingreso' | 'egreso' | 'personal' | 'proveedor' | 'gasto' | 'anticipo' | 'planilla'): Summary => {
        return items.reduce((acc, item) => {
            let currency = item.moneda || 'Bolivianos';
            let amount = 0;
            let method = '';

            if (type === 'ingreso') {
                amount = Number(item.monto);
                method = item.forma_pago?.forma_pago || 'Desconocido';
            } else if (type === 'egreso') {
                amount = Number(item.monto);
                method = item.formaPago?.forma_pago || 'Desconocido';
            } else if (type === 'personal') {
                amount = Number(item.total);
                method = 'Desconocido'; // Personal doesn't seem to have forma_pago in entity yet
                currency = 'Bolivianos'; // Default
            } else if (type === 'proveedor') {
                amount = Number(item.material_pedido?.total || 0);
                method = item.forma_pago?.forma_pago || 'Desconocido';
            } else if (type === 'gasto') {
                amount = Number(item.monto);
                method = item.formaPago?.forma_pago || 'Desconocido';
            }

            if (!acc[method]) {
                acc[method] = { Bs: 0, Sus: 0 };
            }

            if (currency === 'Bolivianos') {
                acc[method].Bs += amount;
            } else {
                acc[method].Sus += amount;
            }

            return acc;
        }, {} as Summary);
    };

    const generateSummaryHTML = (summary: Summary): string => {
        const entries = Object.entries(summary);
        if (entries.length === 0) return '<p style="color: #666; font-style: italic;">No hay datos para el resumen.</p>';

        const totalBs = entries.reduce((acc, [, totals]) => acc + totals.Bs, 0);
        const totalSus = entries.reduce((acc, [, totals]) => acc + totals.Sus, 0);

        return `
            <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-top: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; color: #2c3e50; margin: 0 0 15px 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Resumen por Forma de Pago</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                ${entries.map(([method, totals]) => `
                    <div style="background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #e0e0e0;">
                        <div style="font-weight: bold; color: #333; margin-bottom: 5px; font-size: 11px;">${method}</div>
                        <div style="display: flex; justify-content: space-between; font-size: 11px;">
                            <span>Bs: <strong style="color: #2563eb;">${totals.Bs.toFixed(2)}</strong></span>
                            <span>$us: <strong style="color: #16a34a;">${totals.Sus.toFixed(2)}</strong></span>
                        </div>
                    </div>
                `).join('')}
                </div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #333; font-weight: bold;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px;">
                        <span>Total Bs: ${totalBs.toFixed(2)}</span>
                        <span>Total $us: ${totalSus.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    };

    // --- PRINT HANDLERS ---
    // (Simulating print by opening new window with styled content)
    const printWindow = (title: string, content: string) => {
        const win = window.open('', '', 'width=900,height=600');
        if (win) {
            win.document.write(`
                <html>
                    <head>
                        <title>${title}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            h1 { color: #333; font-size: 18px; }
                            .header { margin-bottom: 20px; border-bottom: 2px solid #3366cc; padding-bottom: 10px; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>${title} - TALLER</h1>
                            <p>${getFilterInfoText()}</p>
                        </div>
                        ${content}
                    </body>
                </html>
            `);
            win.document.close();
            win.print();
        }
    };

    const handlePrintIngresos = () => {
        const summary = calculateSummary(ingresos, 'ingreso');
        const rows = ingresos.map(i => `
            <tr>
                <td>${formatDateDisplay(i.fecha)}</td>
                <td>${i.orden_trabajo?.cliente || '-'}</td>
                <td>OT-${i.orden_trabajo?.id}</td>
                <td>${formatMoney(Number(i.monto), i.moneda)}</td>
                <td>${i.forma_pago?.forma_pago || 'N/A'}</td>
                <td>${i.observacion || '-'}</td>
            </tr>
        `).join('');

        const table = `
            <table>
                <thead>
                    <tr><th>Fecha</th><th>Cliente</th><th>Orden #</th><th>Monto</th><th>Forma Pago</th><th>Obs</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            ${generateSummaryHTML(summary)}
        `;
        printWindow('Reporte de Ingresos', table);
    };

    const handlePrintEgresos = () => {
        const filtered = egresos.filter(e => activeEgresosTab === 'Taller' ? (e.destino === 'Taller' || e.destino === 'Consultorio') : e.destino === activeEgresosTab);
        const summary = calculateSummary(filtered, 'egreso');
        const rows = filtered.map(e => `
            <tr>
                <td>${formatDateDisplay(e.fecha)}</td>
                <td>${e.detalle}</td>
                <td>${formatMoney(Number(e.monto), e.moneda)}</td>
                <td>${e.formaPago?.forma_pago || 'N/A'}</td>
            </tr>
        `).join('');
        const table = `
            <table>
                <thead><tr><th>Fecha</th><th>Detalle</th><th>Monto</th><th>Forma Pago</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            ${generateSummaryHTML(summary)}
        `;
        printWindow(`Egresos - ${activeEgresosTab}`, table);
    };

    const handlePrintPersonal = () => {
        // Combined report for Personal
        const summaryPersonal = calculateSummary(pagosPersonal, 'personal');
        const summaryAnticipos = calculateSummary(anticiposList, 'anticipo');
        const summaryPlanillas = calculateSummary(pagosPlanillasList, 'planilla');

        let htmlContent = '';

        if (pagosPersonal.length > 0) {
            const rows = pagosPersonal.map(p => `
                <tr>
                    <td>${formatDateDisplay(p.fecha_pago)}</td>
                    <td>${p.personal?.nombre} ${p.personal?.apellido_paterno}</td>
                    <td>${formatMoney(Number(p.total), 'Bolivianos')}</td>
                    <td>${p.detalle || 'Pago Trabajo'}</td>
                </tr>
            `).join('');
            htmlContent += `
                <h3>Pagos por Trabajos</h3>
                <table>
                    <thead><tr><th>Fecha</th><th>Personal</th><th>Monto</th><th>Detalle</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        }

        if (anticiposList.length > 0) {
            const rows = anticiposList.map(a => `
                <tr>
                    <td>${formatDateDisplay(a.fecha)}</td>
                    <td>${a.personal?.nombre} ${a.personal?.apellido_paterno}</td>
                    <td>${formatMoney(Number(a.monto), 'Bolivianos')}</td>
                    <td>${a.motivo}</td>
                </tr>
            `).join('');
            htmlContent += `
                <h3>Adelantos</h3>
                <table>
                    <thead><tr><th>Fecha</th><th>Personal</th><th>Monto</th><th>Motivo</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        }

        if (pagosPlanillasList.length > 0) {
            const rows = pagosPlanillasList.map(p => `
                <tr>
                    <td>${formatDateDisplay(p.fecha_pago)}</td>
                    <td>Planilla ${p.planilla?.mes}/${p.planilla?.anio}</td>
                    <td>${formatMoney(Number(p.monto), 'Bolivianos')}</td>
                    <td>${p.observaciones || '-'}</td>
                </tr>
            `).join('');
            htmlContent += `
                <h3>Pago de Sueldos (Planillas)</h3>
                <table>
                    <thead><tr><th>Fecha</th><th>Periodo</th><th>Monto</th><th>Obs</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        }

        // Combined Summary
        const totalBs = (Object.values(summaryPersonal).reduce((a, b) => a + b.Bs, 0) +
            Object.values(summaryAnticipos).reduce((a, b) => a + b.Bs, 0) +
            Object.values(summaryPlanillas).reduce((a, b) => a + b.Bs, 0));

        htmlContent += `
            <div style="margin-top:20px; font-weight:bold; font-size:14px; text-align:right;">
                Total Pagado a Personal: ${formatMoney(totalBs, 'Bolivianos')}
            </div>
        `;

        printWindow('Pagos a Personal (Completo)', htmlContent);
    };

    const handlePrintProveedores = () => {
        const summary = calculateSummary(pagosProveedores, 'proveedor');
        const rows = pagosProveedores.map(p => `
            <tr>
                <td>${formatDateDisplay(p.fecha)}</td>
                <td>${p.material_pedido?.proveedor?.proveedor || '-'}</td>
                <td>${formatMoney(p.material_pedido?.total || 0, p.moneda)}</td>
                <td>${p.forma_pago?.forma_pago || 'N/A'}</td>
                <td>${p.factura ? 'F:' + p.factura : ''} ${p.recibo ? 'R:' + p.recibo : ''}</td>
            </tr>
        `).join('');
        const table = `
            <table>
                <thead><tr><th>Fecha</th><th>Proveedor</th><th>Monto</th><th>Forma Pago</th><th>Doc</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            ${generateSummaryHTML(summary)}
        `;
        printWindow('Pagos a Proveedores', table);
    };

    const handlePrintGastos = () => {
        const filtered = [...gastosFijosConsultorio, ...gastosFijosCasa]; // Print both or filter? usually current view.
        // Let's print current view based on simple logic or just all.
        // Original code separated tabs. Let's just print both for simplicty or create a tab for Gastos.
        // For now, let's print all Gastos.
        const summary = calculateSummary(filtered, 'gasto');
        const rows = filtered.map(g => `
            <tr>
                <td>${formatDateDisplay(g.fecha)}</td>
                <td>${g.gastoFijo?.gasto_fijo} (${g.gastoFijo?.destino})</td>
                <td>${formatMoney(Number(g.monto), g.moneda)}</td>
                <td>${g.formaPago?.forma_pago || 'N/A'}</td>
            </tr>
        `).join('');
        const table = `
            <table>
                 <thead><tr><th>Fecha</th><th>Gasto</th><th>Monto</th><th>Forma Pago</th></tr></thead>
                 <tbody>${rows}</tbody>
             </table>
            ${generateSummaryHTML(summary)}
        `;
        printWindow('Gastos Fijos', table);
    };


    // Calculate Grand Totals for Summary
    const totalIngresosBs = ingresos.filter(i => i.moneda === 'Bolivianos').reduce((acc, curr) => acc + Number(curr.monto), 0);
    const totalIngresosSus = ingresos.filter(i => i.moneda === 'Dólares').reduce((acc, curr) => acc + Number(curr.monto), 0);

    const calcTotalEgresos = (items: any[], montoKey: string = 'monto') => {
        return {
            Bs: items.filter(i => !i.moneda || i.moneda === 'Bolivianos' || i.moneda === 'Bs').reduce((acc, curr) => acc + Number(curr[montoKey]), 0),
            Sus: items.filter(i => i.moneda === 'Dólares' || i.moneda === '$us').reduce((acc, curr) => acc + Number(curr[montoKey]), 0)
        };
    };

    const tEgresos = calcTotalEgresos(egresos);
    const tPersonal = calcTotalEgresos(pagosPersonal, 'total');
    const tProveedores = calcTotalEgresos(pagosProveedores.map(p => ({ ...p, monto: p.material_pedido?.total })), 'monto');
    const tGastos = calcTotalEgresos([...gastosFijosConsultorio, ...gastosFijosCasa]);
    const tInsumos = calcTotalEgresos(insumos, 'total');

    // New totals
    const tAnticipos = calcTotalEgresos(anticiposList);
    const tPlanillas = calcTotalEgresos(pagosPlanillasList);

    const totalEgresosGlobalBs = tEgresos.Bs + tPersonal.Bs + tProveedores.Bs + tGastos.Bs + tInsumos.Bs + tAnticipos.Bs + tPlanillas.Bs;
    const totalEgresosGlobalSus = tEgresos.Sus + tPersonal.Sus + tProveedores.Sus + tGastos.Sus + tInsumos.Sus + tAnticipos.Sus + tPlanillas.Sus;

    const saldoNetoBs = totalIngresosBs - totalEgresosGlobalBs;
    const saldoNetoSus = totalIngresosSus - totalEgresosGlobalSus;

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                            <ClipboardList className="text-blue-600" size={32} />
                            Hoja Diaria
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Resumen de movimientos financieros del día o rango de fechas seleccionado</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowManual(true)}
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-1.5 rounded-full flex items-center justify-center w-[30px] h-[30px] text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Ayuda / Manual"
                >
                    ?
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Calendar */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-center items-start">
                    <Calendar onChange={handleCalendarChange} value={calendarValue} className="border-none shadow-none dark:bg-gray-800 dark:text-white" />
                </div>

                {/* Range Search */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                    <h3 className="font-bold mb-4 text-gray-800 dark:text-white">Búsqueda por Rango</h3>
                    <div className="flex gap-2 mb-4">
                        <div className="flex-1">
                            <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300">Desde</label>
                            <input
                                type="date"
                                value={rangeStart}
                                onChange={(e) => setRangeStart(e.target.value)}
                                className="w-full p-2 text-sm border rounded bg-white text-gray-900 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs mb-1 text-gray-700 dark:text-gray-300">Hasta</label>
                            <input
                                type="date"
                                value={rangeEnd}
                                onChange={(e) => setRangeEnd(e.target.value)}
                                className="w-full p-2 text-sm border rounded bg-white text-gray-900 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button onClick={handleRangeSearch} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold shadow-md transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                            <Search size={16} /> Buscar Rango
                        </button>
                        <button onClick={() => fetchAllData()} className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2">
                            <RefreshCw size={16} /> Refrescar
                        </button>
                    </div>
                </div>

                {/* Summary / Info */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-2 border-b pb-2">Resumen Actual</h3>
                    <p className="text-sm mb-3 text-gray-500 dark:text-gray-400">{getFilterInfoText()}</p>

                    <div className="space-y-3">
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-100 dark:border-green-800">
                            <span className="text-xs font-bold text-green-700 dark:text-green-300 block mb-1">Ingresos Totales</span>
                            <div className="flex justify-between text-sm">
                                <span>Bs: {totalIngresosBs.toFixed(2)}</span>
                                <span>$us: {totalIngresosSus.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800">
                            <span className="text-xs font-bold text-red-700 dark:text-red-300 block mb-1">Egresos Globales</span>
                            <div className="flex justify-between text-sm">
                                <span>Bs: {totalEgresosGlobalBs.toFixed(2)}</span>
                                <span>$us: {totalEgresosGlobalSus.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block mb-1">Saldo Neto</span>
                            <div className="flex justify-between text-sm font-bold">
                                <span>Bs: {saldoNetoBs.toFixed(2)}</span>
                                <span>$us: {saldoNetoSus.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB BUTTONS */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
                {tabs.map((tab, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveTab(idx)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${activeTab === idx ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400'}`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* CONTENT AREA */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                {loading && <div className="p-8 text-center text-gray-500">Cargando datos...</div>}

                {!loading && activeTab === 0 && (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Ingresos (Pagos de Órdenes)</h2>
                            <button onClick={handlePrintIngresos} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-2 text-sm hover:bg-blue-700"><Printer size={16} /> Imprimir</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3">Cliente</th>
                                        <th className="px-4 py-3">Auto</th>
                                        <th className="px-4 py-3">Orden #</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3">F. Pago</th>
                                        <th className="px-4 py-3">Obs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {ingresos.length === 0 ? <tr><td colSpan={7} className="px-4 py-3 text-center italic">No hay ingresos</td></tr> :
                                        ingresos.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 py-3">{formatDateDisplay(item.fecha)}</td>
                                                <td className="px-4 py-3 font-medium">{item.orden_trabajo?.cliente}</td>
                                                <td className="px-4 py-3 text-xs text-gray-500">{item.orden_trabajo?.modelo} ({item.orden_trabajo?.placa})</td>
                                                <td className="px-4 py-3">{item.orden_trabajo?.id}</td>
                                                <td className="px-4 py-3 text-right font-bold text-green-600">{formatMoney(Number(item.monto), item.moneda)}</td>
                                                <td className="px-4 py-3">{item.forma_pago?.forma_pago}</td>
                                                <td className="px-4 py-3 text-xs truncate max-w-[150px]">{item.observacion}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!loading && activeTab === 1 && (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-bold">Egresos Diarios</h2>
                                <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-1 gap-1">
                                    <button onClick={() => setActiveEgresosTab('Taller')} className={`px-4 py-1 rounded text-sm font-medium transition-all ${activeEgresosTab === 'Taller' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}>Taller</button>
                                    <button onClick={() => setActiveEgresosTab('Casa')} className={`px-4 py-1 rounded text-sm font-medium transition-all ${activeEgresosTab === 'Casa' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}>Casa</button>
                                </div>
                            </div>
                            <button onClick={handlePrintEgresos} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-2 text-sm hover:bg-blue-700"><Printer size={16} /> Imprimir</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3">Detalle</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3">F. Pago</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {egresos.filter(e => activeEgresosTab === 'Taller' ? (e.destino === 'Taller' || e.destino === 'Consultorio') : e.destino === activeEgresosTab).length === 0 ? <tr><td colSpan={4} className="px-4 py-3 text-center italic">No hay egresos</td></tr> :
                                        egresos.filter(e => activeEgresosTab === 'Taller' ? (e.destino === 'Taller' || e.destino === 'Consultorio') : e.destino === activeEgresosTab).map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 py-3">{formatDateDisplay(item.fecha)}</td>
                                                <td className="px-4 py-3">{item.detalle}</td>
                                                <td className="px-4 py-3 text-right font-bold text-red-500">{formatMoney(Number(item.monto), item.moneda)}</td>
                                                <td className="px-4 py-3">{item.formaPago?.forma_pago}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!loading && activeTab === 2 && (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Pagos a Personal</h2>
                            <button onClick={handlePrintPersonal} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-2 text-sm hover:bg-blue-700"><Printer size={16} /> Imprimir</button>
                        </div>
                        <div className="overflow-x-auto">
                            {/* Table 1: Pagos Trabajos */}
                            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 mt-2 px-1">Pagos por Trabajos</h3>
                            <table className="w-full text-sm text-left mb-6">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3">Personal</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {pagosPersonal.length === 0 ? <tr><td colSpan={4} className="px-4 py-3 text-center italic">No hay pagos de trabajos</td></tr> :
                                        pagosPersonal.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 py-3">{formatDateDisplay(item.fecha_pago)}</td>
                                                <td className="px-4 py-3 font-medium">{item.personal?.nombre} {item.personal?.apellido_paterno}</td>
                                                <td className="px-4 py-3 text-right font-bold text-red-500">{formatMoney(Number(item.total), 'Bolivianos')}</td>
                                                <td className="px-4 py-3">{item.detalle || '-'}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>

                        </div>
                    </div>
                )}

                {!loading && activeTab === 3 && (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Pagos a Proveedores</h2>
                            <button onClick={handlePrintProveedores} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-2 text-sm hover:bg-blue-700"><Printer size={16} /> Imprimir</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3">Proveedor</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3">F. Pago</th>
                                        <th className="px-4 py-3">Doc</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {pagosProveedores.length === 0 ? <tr><td colSpan={5} className="px-4 py-3 text-center italic">No hay pagos a proveedores</td></tr> :
                                        pagosProveedores.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 py-3">{formatDateDisplay(item.fecha)}</td>
                                                <td className="px-4 py-3 font-medium">{item.material_pedido?.proveedor?.proveedor}</td>
                                                <td className="px-4 py-3 text-right font-bold text-red-500">{formatMoney(Number(item.material_pedido?.total || 0), item.moneda)}</td>
                                                <td className="px-4 py-3">{item.forma_pago?.forma_pago}</td>
                                                <td className="px-4 py-3 text-xs">{item.factura ? 'F:' + item.factura : ''} {item.recibo ? 'R:' + item.recibo : ''}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!loading && activeTab === 4 && (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-bold">Pagos Gastos Fijos</h2>
                                <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-1 gap-1">
                                    <button onClick={() => setActiveGastosTab('Taller')} className={`px-4 py-1 rounded text-sm font-medium transition-all ${activeGastosTab === 'Taller' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}>Taller</button>
                                    <button onClick={() => setActiveGastosTab('Casa')} className={`px-4 py-1 rounded text-sm font-medium transition-all ${activeGastosTab === 'Casa' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}>Casa</button>
                                </div>
                            </div>
                            <button onClick={handlePrintGastos} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-2 text-sm hover:bg-blue-700"><Printer size={16} /> Imprimir</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3">Gasto</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3">F. Pago</th>
                                        <th className="px-4 py-3">Obs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {(activeGastosTab === 'Taller' ? gastosFijosConsultorio : gastosFijosCasa).length === 0 ? <tr><td colSpan={5} className="px-4 py-3 text-center italic">No hay gastos fijos</td></tr> :
                                        (activeGastosTab === 'Taller' ? gastosFijosConsultorio : gastosFijosCasa).map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 py-3">{formatDateDisplay(item.fecha)}</td>
                                                <td className="px-4 py-3">{item.gastoFijo?.gasto_fijo} <span className="text-xs text-gray-400">({item.gastoFijo?.destino})</span></td>
                                                <td className="px-4 py-3 text-right font-bold text-red-500">{formatMoney(Number(item.monto), item.moneda)}</td>
                                                <td className="px-4 py-3">{item.formaPago?.forma_pago}</td>
                                                <td className="px-4 py-3 text-xs">{item.observaciones}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {/* INSUMOS TAB */}
                {!loading && activeTab === 5 && (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Insumos (Compra de Material)</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3">Descripción</th>
                                        <th className="px-4 py-3">Cant.</th>
                                        <th className="px-4 py-3 text-right">Precio U.</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                        <th className="px-4 py-3">Prov.</th>
                                        <th className="px-4 py-3">F. Pago</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {insumos.length === 0 ? <tr><td colSpan={7} className="px-4 py-3 text-center italic">No hay insumos</td></tr> :
                                        insumos.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 py-3">{formatDateDisplay(item.fecha)}</td>
                                                <td className="px-4 py-3 font-medium">{item.descripcion}</td>
                                                <td className="px-4 py-3">{item.cantidad}</td>
                                                <td className="px-4 py-3 text-right">{formatMoney(Number(item.precio_unitario), item.moneda)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-red-500">{formatMoney(Number(item.total), item.moneda)}</td>
                                                <td className="px-4 py-3 text-xs">{item.proveedor?.proveedor}</td>
                                                <td className="px-4 py-3">{item.forma_pago?.forma_pago}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SUELDOS TAB */}
                {!loading && activeTab === 6 && (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Sueldos</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3">Personal</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {pagosPlanillasList.length === 0 ? <tr><td colSpan={4} className="px-4 py-3 text-center italic">No hay pagos de planillas</td></tr> :
                                        pagosPlanillasList.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 py-3">{formatDateDisplay(item.fecha_pago)}</td>
                                                <td className="px-4 py-3 font-medium">Planilla {item.planilla?.mes}/{item.planilla?.anio}</td>
                                                <td className="px-4 py-3 text-right font-bold text-red-500">{formatMoney(Number(item.monto), 'Bolivianos')}</td>
                                                <td className="px-4 py-3">{item.observaciones || '-'}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ADELANTOS TAB */}
                {!loading && activeTab === 7 && (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Adelantos</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3">Personal</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {anticiposList.length === 0 ? <tr><td colSpan={4} className="px-4 py-3 text-center italic">No hay adelantos</td></tr> :
                                        anticiposList.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 py-3">{formatDateDisplay(item.fecha)}</td>
                                                <td className="px-4 py-3 font-medium">{item.personal?.nombre} {item.personal?.apellido_paterno}</td>
                                                <td className="px-4 py-3 text-right font-bold text-red-500">{formatMoney(Number(item.monto), 'Bolivianos')}</td>
                                                <td className="px-4 py-3">{item.motivo}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {showManual && (
                <ManualModal
                    isOpen={showManual}
                    onClose={() => setShowManual(false)}
                    title="Manual Hoja Diaria"
                    sections={manualSections}
                />
            )}
        </div>
    );
};

export default HojaDiaria;
