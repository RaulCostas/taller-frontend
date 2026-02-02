import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import OrdenesTrabajo from './pages/OrdenesTrabajo';
import OrdenesTrabajoList from './pages/OrdenesTrabajoList';
import CotizacionesList from './pages/CotizacionesList';
import CotizacionForm from './pages/CotizacionForm';
import OrdenTrabajoForm from './pages/OrdenTrabajoForm';
import OrdenTrabajoDetalles from './pages/OrdenTrabajoDetalles';
import TrabajoAsignadoForm from './pages/TrabajoAsignadoForm';
import MaterialUtilizadoPage from './pages/MaterialUtilizadoPage';
import Users from './pages/Users';
import Configuraciones from './pages/Configuraciones';
import ConfiguracionesGeneral from './pages/ConfiguracionesGeneral';
import MarcaAutoList from './pages/MarcaAutoList';
import FormaPagoList from './pages/FormaPagoList';
import ComisionTarjetaList from './pages/ComisionTarjetaList';
import CategoriaServicioList from './pages/CategoriaServicioList';
import AreaPersonalList from './pages/AreaPersonalList';
import TipoVehiculoList from './pages/TipoVehiculoList';
import UnidadMedidaList from './pages/UnidadMedidaList';
import GrupoInventarioList from './pages/GrupoInventarioList';
import { InventarioList } from './pages/InventarioList';
import SegurosList from './pages/SegurosList';
import SegurosInspectores from './pages/SegurosInspectores';
import SegurosPrecios from './pages/SegurosPrecios';
import PreciosTaller from './pages/PreciosTaller';
import ProveedoresRegistro from './pages/ProveedoresRegistro';
import ProveedoresPedidos from './pages/ProveedoresPedidos';
import MaterialPedidoForm from './pages/MaterialPedidoForm';
import CompraInsumosList from './pages/compra-insumos/CompraInsumosList';
import ProveedoresPagos from './pages/ProveedoresPagos';
import PersonalRegistro from './pages/PersonalRegistro';
import PersonalProduccion from './pages/PersonalProduccion';
import PersonalPlanilla from './pages/PersonalPlanilla';
import FaltasList from './pages/FaltasList';
import AnticiposList from './pages/AnticiposList';
// import PersonalFaltas from './pages/PersonalFaltas';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CorreosProvider } from './context/CorreosContext';
import { ChatProvider } from './context/ChatContext';
import CorreosList from './components/correos/CorreosList';
import EgresoList from './components/egresos/EgresoList';
import ChatbotConfig from './components/Chatbot/ChatbotConfig';
import RegistroPagos from './pages/RegistroPagos';
import DeudasPorCobrar from './pages/DeudasPorCobrar';
import PagosTrabajosList from './pages/PagosTrabajosList';
import PagosTrabajosStatus from './pages/PagosTrabajosStatus';
import HistorialPagos from './pages/HistorialPagos';
import GastosFijosList from './pages/GastosFijosList';
import HojaDiaria from './pages/HojaDiaria';
import Utilidades from './pages/Utilidades';
import './App.css';

import Login from './pages/Login';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <CorreosProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="ordenes-trabajo" element={<OrdenesTrabajo />} />
                  <Route path="ordenes-trabajo/list" element={<OrdenesTrabajoList />} />
                  <Route path="cotizaciones" element={<CotizacionesList />} />
                  <Route path="cotizaciones/create" element={<CotizacionForm />} />
                  <Route path="cotizaciones/edit/:id" element={<CotizacionForm />} />
                  <Route path="ordenes-trabajo/create" element={<OrdenTrabajoForm />} />
                  <Route path="ordenes-trabajo/edit/:id" element={<OrdenTrabajoForm />} />
                  <Route path="ordenes-trabajo/:id/detalles" element={<OrdenTrabajoDetalles />} />
                  <Route path="ordenes-trabajo/:id/asignar" element={<TrabajoAsignadoForm />} />
                  <Route path="ordenes-trabajo/:id/material-utilizado" element={<MaterialUtilizadoPage />} />

                  {/* Seguros Routes */}
                  <Route path="seguros" element={<Navigate to="/seguros/registro" replace />} />
                  <Route path="seguros/registro" element={<SegurosList />} />
                  <Route path="seguros/inspectores" element={<SegurosInspectores />} />
                  <Route path="seguros/precios" element={<SegurosPrecios />} />

                  {/* Proveedores Routes */}
                  <Route path="proveedores" element={<Navigate to="/proveedores/registro" replace />} />
                  <Route path="proveedores/registro" element={<ProveedoresRegistro />} />
                  <Route path="proveedores/pedidos" element={<ProveedoresPedidos />} />
                  <Route path="proveedores/pedidos/create" element={<MaterialPedidoForm />} />
                  <Route path="proveedores/pedidos/edit/:id" element={<MaterialPedidoForm />} />
                  <Route path="proveedores/pedidos/view/:id" element={<MaterialPedidoForm readOnly={true} />} />
                  <Route path="proveedores/compra-insumos/:id" element={<CompraInsumosList />} />
                  <Route path="proveedores/pagos" element={<ProveedoresPagos />} />

                  {/* Personal Routes */}
                  <Route path="personal" element={<Navigate to="/personal/registro" replace />} />
                  <Route path="personal/registro" element={<PersonalRegistro />} />
                  <Route path="personal/produccion" element={<PersonalProduccion />} />
                  <Route path="personal/planilla" element={<PersonalPlanilla />} />
                  <Route path="personal/faltas" element={<FaltasList />} />
                  <Route path="personal/anticipos" element={<AnticiposList />} />

                  {/* Cobros Routes */}
                  <Route path="cobros" element={<Navigate to="/cobros/registro-pagos" replace />} />
                  <Route path="cobros/registro-pagos" element={<RegistroPagos />} />
                  <Route path="cobros/deudas-por-cobrar" element={<DeudasPorCobrar />} />

                  <Route path="precios-taller" element={<PreciosTaller />} />

                  {/* Pagos por Trabajos Routes */}
                  <Route path="pagos-trabajos" element={<Navigate to="/pagos-trabajos/historial" replace />} />
                  <Route path="pagos-trabajos/lista" element={<PagosTrabajosList />} />
                  <Route path="pagos-trabajos/historial" element={<HistorialPagos />} />
                  <Route path="pagos-trabajos/status" element={<PagosTrabajosStatus />} />

                  <Route path="users" element={<Users />} />
                  <Route path="configuraciones" element={<Configuraciones />} />
                  <Route path="configuraciones/general" element={<ConfiguracionesGeneral />} />
                  <Route path="configuraciones/marca-auto" element={<MarcaAutoList />} />
                  <Route path="configuraciones/forma-pago" element={<FormaPagoList />} />
                  <Route path="configuraciones/comision-tarjeta" element={<ComisionTarjetaList />} />
                  <Route path="configuraciones/categoria-servicio" element={<CategoriaServicioList />} />
                  <Route path="configuraciones/area-personal" element={<AreaPersonalList />} />
                  <Route path="configuraciones/tipos-vehiculos" element={<TipoVehiculoList />} />
                  <Route path="configuraciones/unidad-medida" element={<UnidadMedidaList />} />
                  <Route path="/configuraciones/grupo-inventario" element={<GrupoInventarioList />} />
                  <Route path="/chatbot/config" element={<ChatbotConfig />} />
                  <Route path="/inventario" element={<InventarioList />} />
                  <Route path="/correos" element={<CorreosList />} />
                  <Route path="/egresos" element={<EgresoList />} />
                  <Route path="/gastos-fijos" element={<GastosFijosList />} />
                  <Route path="/hoja-diaria" element={<HojaDiaria />} />
                  <Route path="/utilidades" element={<Utilidades />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CorreosProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
