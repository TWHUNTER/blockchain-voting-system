import React, { useState, useEffect } from 'react';
import { Vote, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const Voting = ({ contract, account, isConnected, web3 }) => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [isVotingActive, setIsVotingActive] = useState(false);
  const [currentElection, setCurrentElection] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  // Cargar datos iniciales
  useEffect(() => {
    if (contract && account) {
      loadVotingData();
      checkUserBalance();
    }
  }, [contract, account]);

  const loadVotingData = async () => {
    try {
      setLoading(true);
      
      // Obtener candidatos
      const candidatesList = await contract.methods.obtenerCandidatos().call();
      setCandidates(candidatesList);
      
      // Verificar si la votación está activa
      const votingStatus = await contract.methods.votacionActiva().call();
      setIsVotingActive(votingStatus);
      
      // Obtener nombre de la elección actual
      const electionName = await contract.methods.nombreEleccionActual().call();
      setCurrentElection(electionName);
      
    } catch (error) {
      console.error('Error loading voting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserBalance = async () => {
    try {
      const balance = await contract.methods.balanceOf(account).call();
      setUserBalance(web3.utils.fromWei(balance, 'ether'));
    } catch (error) {
      console.error('Error checking balance:', error);
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate) {
      alert('Por favor selecciona un candidato');
      return;
    }

    try {
      setLoading(true);
      
      await contract.methods.emitirVoto(selectedCandidate).send({
        from: account,
        gas: 300000
      });
      
      alert('¡Voto emitido correctamente!');
      setHasVoted(true);
      setSelectedCandidate('');
      
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error al emitir el voto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Conecta tu Wallet
          </h2>
          <p className="text-gray-600 mb-6">
            Para participar en la votación, necesitas conectar tu wallet de MetaMask
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 text-sm">
              💡 Asegúrate de tener MetaMask instalado y configurado con la red correcta
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && candidates.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de votación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header de la votación */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Vote className="mr-3 h-8 w-8 text-blue-600" />
              Sistema de Votación Blockchain
            </h1>
            {currentElection && (
              <p className="text-lg text-gray-600 mt-2">
                Elección actual: <span className="font-semibold">{currentElection}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isVotingActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isVotingActive ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Votación Activa
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-1" />
                  Votación Cerrada
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Información del usuario */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Tu Dirección</h3>
            <p className="text-blue-700 text-sm font-mono break-all">{account}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Balance de Tokens</h3>
            <p className="text-green-700 text-lg font-bold">{userBalance} STC</p>
          </div>
        </div>
      </div>

      {/* Estado de la votación */}
      {!isVotingActive ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">
                Votación no disponible
              </h3>
              <p className="text-yellow-700">
                La votación está cerrada actualmente. Espera a que el administrador active una nueva votación.
              </p>
            </div>
          </div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-gray-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                No hay candidatos disponibles
              </h3>
              <p className="text-gray-600">
                Aún no se han agregado candidatos para esta elección.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Formulario de votación */
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Users className="mr-3 h-6 w-6 text-blue-600" />
            Candidatos Disponibles
          </h2>

          <div className="space-y-4 mb-6">
            {candidates.map((candidate, index) => (
              <div 
                key={index}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedCandidate === candidate
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedCandidate(candidate)}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="candidate"
                    value={candidate}
                    checked={selectedCandidate === candidate}
                    onChange={() => setSelectedCandidate(candidate)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label className="ml-3 text-lg font-medium text-gray-900 cursor-pointer">
                    {candidate}
                  </label>
                </div>
              </div>
            ))}
          </div>

          {hasVoted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">
                    ¡Voto registrado exitosamente!
                  </h3>
                  <p className="text-green-700">
                    Tu voto ha sido registrado en la blockchain. Gracias por participar.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleVote}
                disabled={!selectedCandidate || loading}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                  !selectedCandidate || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Emitiendo voto...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Vote className="w-5 h-5 mr-2" />
                    Emitir Voto
                  </div>
                )}
              </button>
              
              {selectedCandidate && (
                <button
                  onClick={() => setSelectedCandidate('')}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Limpiar Selección
                </button>
              )}
            </div>
          )}

          {selectedCandidate && !hasVoted && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                <strong>Candidato seleccionado:</strong> {selectedCandidate}
              </p>
              <p className="text-blue-600 text-sm mt-1">
                ⚠️ Una vez emitido, el voto no se puede cambiar. Asegúrate de tu selección.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Información importante
        </h3>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Tu voto se registra de forma segura en la blockchain
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Una vez emitido, el voto no se puede modificar
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Solo puedes votar una vez por elección
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Los resultados están disponibles en tiempo real en la sección de Resultados
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Voting;