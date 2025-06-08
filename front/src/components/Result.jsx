import React, { useState, useEffect } from 'react';
import { BarChart3, Trophy, Users, AlertCircle } from 'lucide-react';

const Result = ({ contract, isConnected }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [electionName, setElectionName] = useState('');

  // Obtener resultados de la votación
  const obtenerResultados = async () => {
    if (!contract || !isConnected) {
      setError('No hay conexión con el contrato');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Obtener resultados del contrato
      const [candidatos, votos] = await contract.methods.obtenerResultados().call();
      
      // Obtener nombre de la elección actual
      const nombreEleccion = await contract.methods.nombreEleccionActual().call();
      setElectionName(nombreEleccion);

      // Crear array de resultados combinando candidatos y votos
      const resultadosFormateados = candidatos.map((candidato, index) => ({
        nombre: candidato,
        votos: parseInt(votos[index]),
        porcentaje: 0 // Se calculará después
      }));

      // Calcular total de votos
      const totalVotos = resultadosFormateados.reduce((total, candidato) => total + candidato.votos, 0);

      // Calcular porcentajes
      const resultadosConPorcentaje = resultadosFormateados.map(candidato => ({
        ...candidato,
        porcentaje: totalVotos > 0 ? ((candidato.votos / totalVotos) * 100).toFixed(1) : 0
      }));

      // Ordenar por número de votos (descendente)
      resultadosConPorcentaje.sort((a, b) => b.votos - a.votos);

      setResults(resultadosConPorcentaje);
    } catch (error) {
      console.error('Error obteniendo resultados:', error);
      setError('Error al obtener los resultados de la votación');
    } finally {
      setLoading(false);
    }
  };

  // Cargar resultados al montar el componente
  useEffect(() => {
    if (contract && isConnected) {
      obtenerResultados();
    }
  }, [contract, isConnected]);

  // Función para obtener el color según la posición
  const obtenerColorPosicion = (index) => {
    switch (index) {
      case 0: return 'from-yellow-400 to-orange-500'; // Oro
      case 1: return 'from-gray-300 to-gray-500'; // Plata
      case 2: return 'from-orange-400 to-orange-600'; // Bronce
      default: return 'from-blue-400 to-blue-600'; // Default
    }
  };

  // Función para obtener el ícono según la posición
  const obtenerIconoPosicion = (index) => {
    if (index < 3) {
      return <Trophy className="w-6 h-6 text-white" />;
    }
    return <Users className="w-6 h-6 text-white" />;
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-yellow-800">Conexión Requerida</h3>
              <p className="text-yellow-700">
                Conecta tu wallet para ver los resultados de la votación.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <BarChart3 className="w-10 h-10 text-indigo-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900">Resultados de Votación</h1>
        </div>
        {electionName && (
          <p className="text-xl text-gray-600">
            Elección: <span className="font-semibold">{electionName}</span>
          </p>
        )}
      </div>

      {/* Botón para actualizar resultados */}
      <div className="text-center mb-6">
        <button
          onClick={obtenerResultados}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Cargando...
            </>
          ) : (
            <>
              <BarChart3 className="w-5 h-5 mr-2" />
              Actualizar Resultados
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Resultados */}
      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map((candidato, index) => (
            <div
              key={candidato.nombre}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Posición y icono */}
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${obtenerColorPosicion(index)} shadow-lg`}>
                    {obtenerIconoPosicion(index)}
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {candidato.nombre}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Posición #{index + 1}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold text-indigo-600">
                    {candidato.votos}
                  </p>
                  <p className="text-sm text-gray-600">
                    {candidato.porcentaje}% del total
                  </p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${obtenerColorPosicion(index)} transition-all duration-1000 ease-out`}
                    style={{ width: `${candidato.porcentaje}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}

          {/* Resumen total */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mt-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Resumen de Votación
              </h3>
              <p className="text-gray-600">
                Total de votos emitidos: <span className="font-bold text-indigo-600">
                  {results.reduce((total, candidato) => total + candidato.votos, 0)}
                </span>
              </p>
              <p className="text-gray-600">
                Candidatos participantes: <span className="font-bold text-indigo-600">
                  {results.length}
                </span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        !loading && !error && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No hay resultados disponibles
            </h3>
            <p className="text-gray-600">
              Aún no se han registrado votos en esta elección.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default Result;