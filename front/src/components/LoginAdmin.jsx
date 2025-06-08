import React, { useState } from 'react';
import { Shield, Wallet, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const LoginAdmin = ({ connectWallet }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      await connectWallet();
    } catch (err) {
      setError('Error al conectar con MetaMask. Por favor, intenta de nuevo.');
      console.error('Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const checkMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Card principal */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Panel de Administrador
            </h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Conecta tu wallet para acceder a las funciones administrativas del sistema de votación
            </p>
          </div>

          {/* Verificación de MetaMask */}
          <div className="mt-8 space-y-6">
            {!checkMetaMaskInstalled() ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-800">
                      MetaMask no detectado
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      Necesitas instalar MetaMask para continuar
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-sm font-medium text-green-800">
                    MetaMask detectado correctamente
                  </span>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Botón de conexión */}
            <div className="space-y-4">
              <button
                onClick={handleConnect}
                disabled={!checkMetaMaskInstalled() || isConnecting}
                className={`group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-sm font-semibold rounded-xl text-white transition-all duration-200 ${
                  !checkMetaMaskInstalled() || isConnecting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 shadow-lg hover:shadow-xl'
                }`}
              >
                {isConnecting ? (
                  <>
                    <Loader className="w-5 h-5 mr-3 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 mr-3" />
                    Conectar con MetaMask
                  </>
                )}
              </button>

              {/* Link de descarga de MetaMask */}
              {!checkMetaMaskInstalled() && (
                <a
                  href="https://metamask.io/download.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative w-full flex justify-center items-center py-4 px-6 border-2 border-orange-200 text-sm font-semibold rounded-xl text-orange-700 bg-orange-50 hover:bg-orange-100 hover:border-orange-300 transition-all duration-200"
                >
                  <Download className="w-5 h-5 mr-3" />
                  Descargar MetaMask
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            Acceso Administrativo
          </h3>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>Solo el propietario del contrato inteligente puede acceder al panel administrativo</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>Desde aquí podrás gestionar candidatos, activar/desactivar votaciones y crear nuevas elecciones</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <p>Asegúrate de estar conectado con la cuenta correcta</p>
            </div>
          </div>
        </div>

        {/* Instrucciones de uso */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            ¿Cómo funciona?
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                1
              </div>
              <p className="text-sm text-blue-800">Conecta tu wallet MetaMask</p>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                2
              </div>
              <p className="text-sm text-blue-800">El sistema verificará si eres el administrador</p>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                3
              </div>
              <p className="text-sm text-blue-800">Accede al panel de control administrativo</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Sistema de Votación Blockchain - Acceso Seguro
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginAdmin;