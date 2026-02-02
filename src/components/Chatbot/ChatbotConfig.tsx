import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Swal from 'sweetalert2';
import ChatbotIntentosConfig from './ChatbotIntentosConfig';
import ManualModal from '../ManualModal';
import { Settings, RefreshCw, Power, Smartphone, ArrowLeft, Trash2 } from 'lucide-react';

const ChatbotConfig: React.FC = () => {
    const [status, setStatus] = useState<string>('disconnected');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'status' | 'intents'>('status');
    const [showManual, setShowManual] = useState(false);
    const navigate = useNavigate();

    const manualSections = [
        {
            title: 'Vinculación',
            content: 'Para conectar el bot, haga click en "Iniciar Bot". Aparecerá un código QR que debe escanear con su aplicación de WhatsApp (Menú > Dispositivos vinculados > Vincular dispositivo).'
        },
        {
            title: 'Respuestas Automáticas',
            content: 'En la pestaña "Respuestas" puede configurar palabras clave (ej: "horario, hora") y la respuesta que el bot enviará automáticamente.'
        }
    ];

    const fetchStatus = async () => {
        try {
            const response = await api.get(`/chatbot/status?t=${Date.now()}`);
            setStatus(response.data.status);
            setQrCode(response.data.qr);
            if (response.data.pairingCode) {
                setPairingCode(response.data.pairingCode);
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleInitialize = async () => {
        setLoading(true);
        try {
            await api.post('/chatbot/initialize');
            fetchStatus();
        } catch (error) {
            Swal.fire('Error', 'No se pudo iniciar el bot', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePairingCode = async () => {
        const result = await Swal.fire({
            title: 'Ingrese número de teléfono',
            text: 'Ej: 59170000000 (sin " + " ni espacios)',
            input: 'text',
            showCancelButton: true,
            confirmButtonText: 'Pedir Código',
            cancelButtonText: 'Cancelar',
            showLoaderOnConfirm: true,
            preConfirm: async (phone) => {
                if (!phone) {
                    Swal.showValidationMessage('Ingrese un número válido');
                    return false;
                }
                try {
                    await api.post('/chatbot/initialize', { phoneNumber: phone });
                    return true;
                } catch (error) {
                    Swal.showValidationMessage('Error al solicitar código');
                    return false;
                }
            }
        });

        if (result.isConfirmed) {
            fetchStatus();
        }
    };

    const handleDisconnect = async () => {
        const result = await Swal.fire({
            title: '¿Desconectar?',
            text: 'Se cerrará la sesión de WhatsApp.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, desconectar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await api.post('/chatbot/disconnect');
                fetchStatus();
                Swal.fire('Desconectado', 'Bot desconectado correctamente', 'success');
            } catch (error) {
                Swal.fire('Error', 'Hubo un problema al desconectar', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleReset = async () => {
        const result = await Swal.fire({
            title: '¿Reiniciar Sesión?',
            text: 'Esto borrará todos los datos de conexión actuales y forzará un reinicio limpio. Use esto si tiene problemas para generar el QR.',
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, reiniciar todo',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await api.post('/chatbot/reset');
                // Wait a bit for backend to clear files
                await new Promise(r => setTimeout(r, 2000));
                fetchStatus();
                Swal.fire('Reiniciado', 'Sesión reiniciada. Intente vincular nuevamente.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo reiniciar la sesión', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/configuraciones')}
                        className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border-none shadow-none"
                        title="Volver"
                    >
                        <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                            <Smartphone className="text-green-600" size={32} />
                            Chatbot WhatsApp
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Configuración y vinculación del bot de WhatsApp</p>
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

            <div className="flex space-x-4 mb-6 border-b dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('status')}
                    className={`pb-2 px-4 font-medium transition-colors bg-transparent border-none rounded-none shadow-none ${activeTab === 'status'
                        ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                >
                    Estado y Conexión
                </button>
                <button
                    onClick={() => setActiveTab('intents')}
                    className={`pb-2 px-4 font-medium transition-colors bg-transparent border-none rounded-none shadow-none ${activeTab === 'intents'
                        ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                >
                    Respuestas Automáticas
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg min-h-[400px]">
                {activeTab === 'status' ? (
                    <div className="text-center py-10">
                        {status === 'connected' ? (
                            <div className="animate-fade-in">
                                <div className="inline-block p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                                    <Settings className="w-16 h-16 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">Bot Conectado y Activo</h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-8">El sistema está escuchando mensajes y respondiendo automáticamente.</p>
                                <button
                                    onClick={handleDisconnect}
                                    disabled={loading}
                                    className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold border-none shadow-none"
                                >
                                    {loading ? 'Procesando...' : 'Desconectar Sesión'}
                                </button>
                            </div>
                        ) : status === 'qr' && qrCode ? (
                            <div className="animate-fade-in">
                                <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-300 mb-6">Escanee el código QR</h3>
                                <div className="inline-block p-4 bg-white rounded-lg shadow-md border-2 border-gray-100">
                                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                                </div>
                                <p className="mt-6 text-gray-500 dark:text-gray-400">Abra WhatsApp &gt; Dispositivos vinculados &gt; Vincular dispositivo</p>
                            </div>
                        ) : (status === 'pairing' || pairingCode) ? (
                            <div className="animate-fade-in">
                                <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-300 mb-4">Código de Vinculación</h3>
                                <p className="text-gray-500 mb-6">Ingrese este código en WhatsApp &gt; Dispositivos vinculados &gt; Vincular con número de teléfono</p>

                                {pairingCode ? (
                                    <div className="text-5xl font-mono font-bold tracking-widest text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 p-6 rounded-xl inline-block border-2 border-dashed border-gray-300">
                                        {pairingCode.split('').map((char, i) => (
                                            <span key={i} className="mx-1">{char}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                        <p>Generando código...</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleReset}
                                    className="mt-8 text-sm text-red-500 hover:underline block mx-auto"
                                >
                                    Cancelar / Reiniciar
                                </button>
                            </div>
                        ) : status === 'connecting' ? (
                            <div className="flex flex-col items-center">
                                <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                                <h3 className="text-xl font-bold text-indigo-700 dark:text-white">Iniciando servicio...</h3>
                                <p className="text-gray-500 mt-2">Por favor espere mientras se genera el código QR.</p>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
                                    <Power className="w-16 h-16 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">Bot Desconectado</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-8">Inicie el servicio para vincular su cuenta de WhatsApp.</p>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={handleInitialize}
                                        disabled={loading}
                                        className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-none hover:shadow-xl transition-all font-bold border-none"
                                    >
                                        {loading ? 'Iniciando...' : 'Iniciar Bot (QR)'}
                                    </button>
                                    <button
                                        onClick={handlePairingCode}
                                        disabled={loading}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-none hover:shadow-xl transition-all font-bold border-none"
                                    >
                                        Vincular con Código
                                    </button>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={handleReset}
                                        disabled={loading}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md flex items-center gap-2 mx-auto font-medium"
                                    >
                                        <Trash2 size={18} /> Solucionar problemas: Resetear Sesión
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <ChatbotIntentosConfig />
                )}
            </div>

            <ManualModal
                isOpen={showManual}
                onClose={() => setShowManual(false)}
                title="Manual Chatbot"
                sections={manualSections}
            />
        </div>
    );
};

export default ChatbotConfig;
