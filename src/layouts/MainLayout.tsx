import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Settings, LogOut, Shield, ChevronDown, ChevronRight, FileText, UserCheck, CreditCard, Truck, Package, DollarSign, Users as UsersIcon, UserPlus, TrendingUp, ClipboardList, CalendarX, Boxes, Mail, Wallet, Receipt } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useCorreos } from '../context/CorreosContext';
import ChatWidget from '../components/Chat/ChatWidget';
import './Layout.css';

interface NavItem {
    path: string;
    label: string;
    icon: any;
    subItems?: NavItem[];
}

const MainLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { unreadCount } = useCorreos();
    const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>(() => {
        // Initialize state based on current path
        const initialState: Record<string, boolean> = {};
        if (location.pathname.startsWith('/seguros')) initialState['/seguros'] = true;
        if (location.pathname.startsWith('/proveedores')) initialState['/proveedores'] = true;
        if (location.pathname.startsWith('/personal')) initialState['/personal'] = true;
        if (location.pathname.startsWith('/cobros')) initialState['/cobros'] = true;
        if (location.pathname.startsWith('/pagos-trabajos')) initialState['/pagos-trabajos'] = true;
        return initialState;
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSubMenu = (path: string) => {
        setOpenSubMenus(prev => ({
            ...prev,
            [path]: !prev[path]
        }));
    };

    const navItems: NavItem[] = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/ordenes-trabajo', label: 'Ordenes de Trabajo', icon: ClipboardList },
        { path: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
        {
            path: '/seguros',
            label: 'Seguros',
            icon: Shield,
            subItems: [
                { path: '/seguros/registro', label: 'Registro de Seguros', icon: FileText },
                { path: '/seguros/inspectores', label: 'Inspectores', icon: UserCheck },
                { path: '/seguros/precios', label: 'Lista de Precios', icon: CreditCard },
            ]
        },
        {
            path: '/proveedores',
            label: 'Proveedores',
            icon: Truck,
            subItems: [
                { path: '/proveedores/registro', label: 'Registro de Proveedores', icon: UsersIcon },
                { path: '/proveedores/pedidos', label: 'Pedido de Material', icon: Package },
                { path: '/proveedores/pagos', label: 'Pago a Proveedores', icon: DollarSign },
            ]
        },
        {
            path: '/inventario',
            label: 'Inventario',
            icon: Boxes,
        },
        {
            path: '/personal',
            label: 'Personal',
            icon: Users,
            subItems: [
                { path: '/personal/registro', label: 'Registro de Personal', icon: UserPlus },
                { path: '/personal/produccion', label: 'Producción de Personal', icon: TrendingUp },
                { path: '/personal/planilla', label: 'Planilla de Sueldos', icon: ClipboardList },
                { path: '/personal/faltas', label: 'Faltas y Vacaciones', icon: CalendarX },
                { path: '/personal/anticipos', label: 'Anticipos de Sueldo', icon: DollarSign },
            ]
        },
        {
            path: '/pagos-trabajos',
            label: 'Pagos por Trabajos Asignados',
            icon: ClipboardList,
            subItems: [
                { path: '/pagos-trabajos/historial', label: 'Historial de Pagos', icon: DollarSign },
                { path: '/pagos-trabajos/status', label: 'Cancelados / No Cancelados', icon: FileText },
            ]
        },
        { path: '/precios-taller', label: 'Precios Taller', icon: DollarSign },
        { path: '/egresos', label: 'Egresos Diarios', icon: CreditCard },
        { path: '/gastos-fijos', label: 'Gastos Fijos', icon: FileText },
        { path: '/hoja-diaria', label: 'Hoja Diaria', icon: FileText },
        { path: '/utilidades', label: 'Utilidades', icon: FileText },

        {
            path: '/cobros',
            label: 'Cobros',
            icon: Wallet,
            subItems: [
                { path: '/cobros/registro-pagos', label: 'Registro de Pagos', icon: Receipt },
                { path: '/cobros/deudas-por-cobrar', label: 'Deudas por Cobrar', icon: FileText },
            ]
        },
        { path: '/users', label: 'Usuarios', icon: Users },
        { path: '/configuraciones', label: 'Configuraciones', icon: Settings },
    ];

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2 className="text-xl font-bold text-white">TALLER</h2>
                </div>
                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.subItems
                                ? item.subItems.some(sub => location.pathname === sub.path)
                                : location.pathname === item.path;

                            const hasSubItems = item.subItems && item.subItems.length > 0;
                            const isOpen = openSubMenus[item.path];

                            return (
                                <li key={item.path} className="nav-item-container">
                                    <div
                                        className={`nav-item flex items-center justify-between cursor-pointer ${isActive && !hasSubItems ? 'active' : ''}`}
                                        onClick={() => {
                                            if (hasSubItems) {
                                                toggleSubMenu(item.path);
                                            } else {
                                                navigate(item.path);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center w-full">
                                            {hasSubItems ? (
                                                <button className="flex items-center w-full text-left nav-link bg-transparent border-0 p-0">
                                                    <Icon size={20} />
                                                    <span className="ml-3 flex-1">{item.label}</span>
                                                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </button>
                                            ) : (
                                                <Link to={item.path} className={`nav-link w-full ${isActive ? 'active' : ''}`}>
                                                    <Icon size={20} />
                                                    <span className="ml-3">{item.label}</span>
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {hasSubItems && isOpen && (
                                        <ul className="nav-sub-list bg-gray-900/50">
                                            {item.subItems!.map(subItem => {
                                                const SubIcon = subItem.icon;
                                                const isSubActive = location.pathname === subItem.path;
                                                return (
                                                    <li key={subItem.path} className="nav-sub-item">
                                                        <Link
                                                            to={subItem.path}
                                                            className={`nav-link text-sm pl-10 ${isSubActive ? 'active' : ''}`}
                                                        >
                                                            <SubIcon size={16} />
                                                            <span className="ml-2">{subItem.label}</span>
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>
            <main className="main-content">
                <header className="top-header">
                    <div className="header-left">
                    </div>
                    <div className="header-actions">
                        <div className="user-profile-header flex items-center gap-3 mr-4">
                            {user && (
                                <>
                                    <img
                                        src={user.foto || user.avatar}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                                    />
                                    <div className="hidden md:flex flex-col items-start">
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{user.name}</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="header-buttons flex items-center gap-2">
                            <ThemeToggle />
                            <div className="relative">
                                <button
                                    onClick={() => navigate('/correos')}
                                    className="bg-transparent p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 transition-colors"
                                    title="Correos Internos"
                                >
                                    <Mail size={20} />
                                </button>
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => navigate('/')}
                                className="bg-transparent p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 transition-colors"
                                title="Inicio"
                            >
                                <Home size={20} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="bg-transparent p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                title="Salir"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </header>
                <div className="content-area">
                    <Outlet />
                </div>
            </main>
            <ChatWidget />
        </div>
    );
};

export default MainLayout;
