import React, { useState } from 'react';
import Swal from 'sweetalert2';
import ManualModal, { type ManualSection } from './ManualModal';
import api from '../services/api';
import { Search, Eye, Landmark } from 'lucide-react';

// Interfaces
interface DetailItem {
    id: number;
    fecha: string;
    descripcion: string;
    monto: number;
    moneda: string;
    paciente?: string;
    cliente?: string;
    factura?: string;
    recibo?: string;
    formaPago?: string;
    destino?: string;
    proveedor?: string;
    personal?: string;
    gasto?: string;
    detalle?: string;
}

interface StatCategory {
    label: string;
    bs: number;
    sus: number;
    itemsBs: DetailItem[];
    itemsSus: DetailItem[];
}

const Utilidades: React.FC = () => {
    const [filterType, setFilterType] = useState<'date' | 'month' | 'year' | ''>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [loading, setLoading] = useState(false);

    // DETAIL MODAL STATE
    const [selectedDetail, setSelectedDetail] = useState<{
        title: string;
        currency: 'Bolivianos' | 'Dólares';
        items: DetailItem[];
    } | null>(null);

    const [stats, setStats] = useState<{
        ingresos: StatCategory;
        egresosDiarios: StatCategory;
        insumos: StatCategory; // NEW
        sueldos: StatCategory; // NEW
        adelantos: StatCategory; // NEW
        pagosProveedores: StatCategory;
        pagosPersonal: StatCategory;
        gastosFijos: StatCategory;
        totalIngresos: { bs: number; sus: number };
        totalEgresos: { bs: number; sus: number };
        totalUtilidades: { bs: number; sus: number };
    } | null>(null);

    const [showManual, setShowManual] = useState(false);

    const manualSections: ManualSection[] = [
        {
            title: 'Utilidades',
            content: 'Vista general de las finanzas. Permite ver Ingresos VS Egresos y calcular la utilidad neta.'
        },
        {
            title: 'Filtros',
            content: 'Utilice los filtros por Fecha, Mes o Año para acotar los resultados mostrados en el reporte.'
        },
        {
            title: 'Detalles',
            content: 'Haga clic en los botones de "lupa" en cada fila para ver el desglose detallado de cada categoría.'
        }
    ];

    const handleSearch = async () => {
        let finalStartDate = '';
        let finalEndDate = '';

        if (filterType === 'date') {
            if (!startDate || !endDate) return Swal.fire('Error', 'Seleccione fecha inicio y fin', 'warning');
            finalStartDate = startDate;
            finalEndDate = endDate;
        } else if (filterType === 'month') {
            if (!selectedMonth) return Swal.fire('Error', 'Seleccione un mes', 'warning');
            const [year, month] = selectedMonth.split('-');
            const lastDay = new Date(Number(year), Number(month), 0).getDate();
            finalStartDate = `${selectedMonth}-01`;
            finalEndDate = `${selectedMonth}-${lastDay}`;
        } else if (filterType === 'year') {
            if (!selectedYear) return Swal.fire('Error', 'Seleccione un año', 'warning');
            finalStartDate = `${selectedYear}-01-01`;
            finalEndDate = `${selectedYear}-12-31`;
        } else {
            return Swal.fire('Error', 'Seleccione un tipo de filtro', 'warning');
        }

        setLoading(true);
        try {
            // Fetch all data and filter client-side (TALLER backend doesn't support params yet on these endpoints)
            const [
                resIngresos,
                resEgresos,
                resPersonal,
                resProveedores,
                resGastosFijos,
                resInsumos,
                resAnticipos,
                resPagosPlanillas
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

            // Client-side filtering check
            const isInRange = (dateStr: string) => {
                if (!dateStr) return false;
                const d = new Date(dateStr).toISOString().split('T')[0];
                return d >= finalStartDate && d <= finalEndDate;
            };

            const dataIngresos = resIngresos.data.filter((i: any) => isInRange(i.fecha));
            const dataEgresos = (Array.isArray(resEgresos.data.data) ? resEgresos.data.data : resEgresos.data).filter((e: any) => isInRange(e.fecha));
            const dataPersonal = resPersonal.data.filter((p: any) => isInRange(p.fecha_pago));
            const dataProveedores = resProveedores.data.filter((p: any) => isInRange(p.fecha));
            const dataGastos = resGastosFijos.data.filter((g: any) => isInRange(g.fecha));
            const dataInsumos = resInsumos.data.filter((i: any) => isInRange(i.fecha));
            const dataAnticipos = resAnticipos.data.filter((a: any) => isInRange(a.fecha));
            const dataPagosPlanillas = resPagosPlanillas.data.filter((p: any) => isInRange(p.fecha_pago));

            // Helper to sum amounts and collect items
            const sum = (items: any[], type: 'ingreso' | 'egreso' | 'personal' | 'proveedor' | 'gasto' | 'insumo' | 'anticipo' | 'planilla') => {
                let bs = 0;
                let sus = 0;
                const itemsBs: DetailItem[] = [];
                const itemsSus: DetailItem[] = [];

                items.forEach(item => {
                    let amount = 0;
                    let currency = item.moneda || 'Bolivianos';
                    let desc = '';
                    let date = item.fecha ? item.fecha.split('T')[0] : (item.fecha_pago ? item.fecha_pago.split('T')[0] : '');
                    let id = item.id || Math.random();

                    // Specific fields
                    let cliente = '';
                    let factura = '';
                    let recibo = '';
                    let formaPago = '';
                    let destino = '';
                    let proveedor = '';
                    let personal = '';
                    let gasto = '';
                    let detalle = '';

                    switch (type) {
                        case 'ingreso': // PagoOrden
                            amount = Number(item.monto) || 0;
                            formaPago = item.forma_pago?.forma_pago || 'N/A';
                            cliente = item.orden_trabajo?.cliente || '-';
                            desc = `Orden #${item.orden_trabajo?.id} - ${cliente}`;
                            if (item.observacion) desc += ` (${item.observacion})`;
                            break;
                        case 'egreso': // Egresos
                            amount = Number(item.monto) || 0;
                            desc = item.detalle || 'Egreso Diario';
                            destino = item.destino || '-';
                            formaPago = item.formaPago?.forma_pago || '-';
                            break;
                        case 'personal': // PagosTrabajosAsignados
                            amount = Number(item.total) || 0;
                            personal = `${item.personal?.nombre || ''} ${item.personal?.apellido_paterno || ''}`.trim();
                            desc = `Pago a Personal: ${personal}`;
                            detalle = item.detalle || '-';
                            currency = 'Bolivianos'; // Assume BS for personal
                            break;
                        case 'proveedor': // PagoPedidos
                            amount = Number(item.material_pedido?.total) || 0;
                            proveedor = item.material_pedido?.proveedor?.proveedor || '-';
                            factura = item.factura || '-';
                            recibo = item.recibo || '-';
                            formaPago = item.forma_pago?.forma_pago || '-';
                            desc = `Prov: ${proveedor}`;
                            if (item.material_pedido?.observaciones) desc += ` - ${item.material_pedido.observaciones}`;
                            break;
                        case 'gasto': // GastosFijos
                            amount = Number(item.monto) || 0;
                            gasto = item.gastoFijo?.gasto_fijo || 'Gasto Fijo';
                            destino = item.gastoFijo?.destino || '-';
                            formaPago = item.formaPago?.forma_pago || '-';
                            desc = `${gasto} (${destino})`;
                            break;
                        case 'insumo': // CompraInsumos
                            amount = Number(item.total) || 0;
                            proveedor = item.proveedor?.proveedor || '-';
                            desc = `Insumo: ${item.descripcion || '-'} (${proveedor})`;
                            formaPago = item.forma_pago?.forma_pago || '-';
                            factura = item.nro_factura || '-';
                            recibo = item.nro_recibo || '-';
                            break;
                        case 'anticipo':
                            amount = Number(item.monto) || 0;
                            personal = `${item.personal?.nombre || ''} ${item.personal?.apellido_paterno || ''}`.trim();
                            desc = `Adelanto: ${personal} - ${item.motivo}`;
                            currency = 'Bolivianos';
                            break;
                        case 'planilla':
                            amount = Number(item.monto) || 0;
                            personal = `Planilla ${item.planilla?.mes}/${item.planilla?.anio}`;
                            desc = `Planilla ${item.planilla?.mes}/${item.planilla?.anio} ${(item.observaciones || '')}`;
                            currency = 'Bolivianos';
                            break;
                    }

                    const currUpper = currency.toUpperCase();
                    const detailItem: DetailItem = {
                        id,
                        fecha: date,
                        descripcion: desc,
                        monto: amount,
                        moneda: currency,
                        cliente,
                        factura,
                        recibo,
                        formaPago,
                        destino,
                        proveedor,
                        personal,
                        gasto,
                        detalle
                    };

                    if (currUpper.includes('BOLIVIANO') || currUpper === 'BS') {
                        bs += amount;
                        itemsBs.push(detailItem);
                    } else {
                        sus += amount;
                        itemsSus.push(detailItem);
                    }
                });
                return { bs, sus, itemsBs, itemsSus };
            };

            const ingresos = sum(dataIngresos, 'ingreso');
            const egresosDiarios = sum(dataEgresos, 'egreso');

            // Calculations
            const sueldosStats = sum(dataPagosPlanillas, 'planilla');
            const adelantosStats = sum(dataAnticipos, 'anticipo');
            const personalStats = sum(dataPersonal, 'personal');

            const proveedores = sum(dataProveedores, 'proveedor');
            // Calculate unified Gastos Fijos stats
            const gastosStats = sum(dataGastos, 'gasto');
            const insumosStats = sum(dataInsumos, 'insumo');

            const totalIngresos = { bs: ingresos.bs, sus: ingresos.sus };
            const totalEgresos = {
                bs: egresosDiarios.bs + personalStats.bs + sueldosStats.bs + adelantosStats.bs + proveedores.bs + gastosStats.bs + insumosStats.bs,
                sus: egresosDiarios.sus + personalStats.sus + sueldosStats.sus + adelantosStats.sus + proveedores.sus + gastosStats.sus + insumosStats.sus
            };

            setStats({
                ingresos: { label: 'Ingresos por Órdenes', ...ingresos },
                egresosDiarios: { label: 'Egresos Diarios', ...egresosDiarios },
                insumos: { label: 'Compra de Insumos', ...insumosStats },
                sueldos: { label: 'Sueldos', ...sueldosStats },
                adelantos: { label: 'Adelantos', ...adelantosStats },
                pagosPersonal: { label: 'Otros Pagos Personal', ...personalStats },
                pagosProveedores: { label: 'Pagos a Proveedores', ...proveedores },
                gastosFijos: { label: 'Gastos Fijos', ...gastosStats },
                totalIngresos,
                totalEgresos,
                totalUtilidades: {
                    bs: totalIngresos.bs - totalEgresos.bs,
                    sus: totalIngresos.sus - totalEgresos.sus
                }
            });

        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Error al calcular utilidades', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount: number, currency: 'Bs' | 'Sus') => {
        return amount.toLocaleString('es-BO', {
            style: 'currency',
            currency: currency === 'Bs' ? 'BOB' : 'USD'
        });
    };

    const handleOpenDetail = (category: StatCategory | undefined, currency: 'Bolivianos' | 'Dólares') => {
        if (!category) return;
        const items = currency === 'Bolivianos' ? category.itemsBs : category.itemsSus;
        setSelectedDetail({
            title: category.label,
            currency,
            items
        });
    };

    const closeModal = () => setSelectedDetail(null);

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen relative text-gray-800 dark:text-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                            <Landmark className="text-green-600" size={32} />
                            Utilidades
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Vista general de las finanzas. Ingresos VS Egresos y utilidad neta</p>
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

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 transition-colors duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seleccione una Opción</label>
                        <select className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white text-gray-900 dark:bg-gray-700 dark:text-white" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
                            <option value="">-- Seleccionar --</option>
                            <option value="date">Por fecha</option>
                            <option value="month">Mensual</option>
                            <option value="year">Anual</option>
                        </select>
                    </div>

                    {filterType === 'date' && (
                        <>
                            <div className="w-full">
                                <label className="block text-sm mb-1">Fecha Inicio</label>
                                <input type="date" className="w-full border p-2 rounded bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div className="w-full">
                                <label className="block text-sm mb-1">Fecha Final</label>
                                <input type="date" className="w-full border p-2 rounded bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        </>
                    )}

                    {filterType === 'month' && (
                        <div className="w-full">
                            <label className="block text-sm mb-1">Seleccionar Mes</label>
                            <input type="month" className="w-full border p-2 rounded bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                        </div>
                    )}

                    {filterType === 'year' && (
                        <div className="w-full">
                            <label className="block text-sm mb-1">Seleccionar Año</label>
                            <select className="w-full border p-2 rounded bg-white text-gray-900 dark:bg-gray-700 dark:text-white dark:border-gray-600" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <button onClick={handleSearch} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md text-sm">
                            <Search size={16} color="white" /> {loading ? '...' : 'Buscar'}
                        </button>
                    </div>
                </div>
            </div>

            {stats ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                    <div className="grid grid-cols-12 bg-gray-800 dark:bg-gray-950 text-white font-semibold text-sm uppercase py-3 px-4">
                        <div className="col-span-4">Concepto</div>
                        <div className="col-span-3 text-right">Bolivianos</div>
                        <div className="col-span-1 text-center">Detalle</div>
                        <div className="col-span-3 text-right">Dólares</div>
                        <div className="col-span-1 text-center">Detalle</div>
                    </div>

                    <div className="text-gray-700 dark:text-gray-300">
                        {/* INGRESOS */}
                        <div className="grid grid-cols-12 py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 items-center transition-colors">
                            <div className="col-span-4 font-medium">{stats.ingresos.label}</div>
                            <div className="col-span-3 text-right">{formatMoney(stats.ingresos.bs, 'Bs')}</div>
                            <div className="col-span-1 text-center">
                                <button onClick={() => handleOpenDetail(stats?.ingresos, 'Bolivianos')} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5" title="Ver Detalle"><Eye size={16} /></button>
                            </div>
                            <div className="col-span-3 text-right">{formatMoney(stats.ingresos.sus, 'Sus')}</div>
                            <div className="col-span-1 text-center">
                                <button onClick={() => handleOpenDetail(stats?.ingresos, 'Dólares')} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5" title="Ver Detalle"><Eye size={16} /></button>
                            </div>
                        </div>

                        {/* TOTAL INGRESOS */}
                        <div className="grid grid-cols-12 py-3 px-4 bg-green-50 dark:bg-green-900/20 border-y border-green-100 dark:border-green-900/30 font-bold text-green-900 dark:text-green-300 items-center">
                            <div className="col-span-4">TOTAL INGRESOS</div>
                            <div className="col-span-3 text-right">{formatMoney(stats.totalIngresos.bs, 'Bs')}</div>
                            <div className="col-span-1"></div>
                            <div className="col-span-3 text-right">$us {stats.totalIngresos.sus.toFixed(2)}</div>
                            <div className="col-span-1"></div>
                        </div>

                        <div className="h-4"></div>

                        {/* EGRESOS ITEMS */}
                        {[
                            stats.egresosDiarios,
                            stats.pagosPersonal,
                            stats.pagosProveedores,
                            stats.gastosFijos,
                            stats.insumos,
                            stats.sueldos,
                            stats.adelantos
                        ].map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 items-center transition-colors">
                                <div className="col-span-4 font-medium">{item.label}</div>
                                <div className="col-span-3 text-right">{formatMoney(item.bs, 'Bs')}</div>
                                <div className="col-span-1 text-center">
                                    <button onClick={() => handleOpenDetail(item, 'Bolivianos')} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5" title="Ver Detalle"><Eye size={16} /></button>
                                </div>
                                <div className="col-span-3 text-right">{formatMoney(item.sus, 'Sus')}</div>
                                <div className="col-span-1 text-center">
                                    <button onClick={() => handleOpenDetail(item, 'Dólares')} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5" title="Ver Detalle"><Eye size={16} /></button>
                                </div>
                            </div>
                        ))}

                        {/* TOTAL EGRESOS */}
                        <div className="grid grid-cols-12 py-3 px-4 bg-red-50 dark:bg-red-900/20 border-y border-red-100 dark:border-red-900/30 font-bold text-red-900 dark:text-red-300 items-center">
                            <div className="col-span-4">TOTAL EGRESOS</div>
                            <div className="col-span-3 text-right">{formatMoney(stats.totalEgresos.bs, 'Bs')}</div>
                            <div className="col-span-1"></div>
                            <div className="col-span-3 text-right">$us {stats.totalEgresos.sus.toFixed(2)}</div>
                            <div className="col-span-1"></div>
                        </div>

                        {/* TOTAL UTILIDADES */}
                        <div className="grid grid-cols-12 py-6 px-4 bg-blue-50 dark:bg-blue-900/10 border-t-2 border-blue-200 dark:border-blue-700/50 items-center">
                            <div className="col-span-4 text-xl font-bold text-gray-800 dark:text-gray-200">TOTAL UTILIDADES</div>
                            <div className={`col-span-3 text-right text-xl font-bold ${stats.totalUtilidades.bs >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatMoney(stats.totalUtilidades.bs, 'Bs')}
                            </div>
                            <div className="col-span-1"></div>
                            <div className={`col-span-3 text-right text-xl font-bold ${stats.totalUtilidades.sus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                $us {stats.totalUtilidades.sus.toFixed(2)}
                            </div>
                            <div className="col-span-1"></div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 min-h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500 italic transition-colors">
                    Seleccione los filtros para ver las utilidades.
                </div>
            )}



            {/* DETAIL MODAL */}
            {selectedDetail && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 transition-opacity" onClick={closeModal} aria-hidden="true"></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className={`inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-[90%] sm:max-w-6xl`}>
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 transition-colors">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                                    Detalle: {selectedDetail.title} ({selectedDetail.currency})
                                </h3>

                                <div className="max-h-[600px] overflow-y-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Descripción</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Forma Pago</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {selectedDetail.items.length === 0 ? (
                                                <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No hay registros</td></tr>
                                            ) : selectedDetail.items.map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.fecha}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{item.descripcion}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.formaPago}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200 text-right font-medium">
                                                        {item.monto.toLocaleString('es-BO', { style: 'currency', currency: selectedDetail.currency === 'Bolivianos' ? 'BOB' : 'USD' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        {/* Total Footer */}
                                        <tfoot className="bg-gray-50 dark:bg-gray-700 font-bold">
                                            <tr>
                                                <td colSpan={3} className="px-6 py-3 text-sm text-gray-900 dark:text-gray-200 text-right">TOTAL:</td>
                                                <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-200 text-right">
                                                    {selectedDetail.items.reduce((sum, i) => sum + i.monto, 0).toLocaleString('es-BO', { style: 'currency', currency: selectedDetail.currency === 'Bolivianos' ? 'BOB' : 'USD' })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button type="button" className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={closeModal}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showManual && (
                <ManualModal
                    isOpen={showManual}
                    onClose={() => setShowManual(false)}
                    title="Manual Utilidades"
                    sections={manualSections}
                />
            )}
        </div>
    );
};

export default Utilidades;
