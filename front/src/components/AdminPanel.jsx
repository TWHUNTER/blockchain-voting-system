import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Power, Users, Settings, AlertCircle, CheckCircle, User } from 'lucide-react';

const AdminPanel = ({ contract, account, isConnected, web3 }) => {
  const [candidates, setCandidates] = useState([]);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newElectionName, setNewElectionName] = useState('');
  const [votingActive, setVotingActive] = useState(false);
  const [electionName, setElectionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('candidates');
  const [newOwner, setNewOwner] = useState('');
  const [mintAddress, setMintAddress] = useState('');
  const [mintAmount, setMintAmount] = useState('');

  useEffect(() => {
    if (contract && account) {
      loadAdminData();
    }
  }, [contract, account]);

  const loadAdminData = async () => {
    try {
      const candidatesList = await contract.methods.obtenerCandidatos().call();
      setCandidates(candidatesList);

      const isActive = await contract.methods.votacionActiva().call();
      setVotingActive(isActive);

      const currentElection = await contract.methods.nombreEleccionActual().call();
      setElectionName(currentElection);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleAddCandidate = async () => {
    if (!newCandidateName.trim()) {
      alert('Por favor ingresa un nombre de candidato');
      return;
    }

    setLoading(true);
    try {
      await contract.methods.agregarCandidato(newCandidateName).send({
        from: account,
        gas: 200000
      });

      alert('Candidato agregado exitosamente');
      setNewCandidateName('');
      await loadAdminData();
    } catch (error) {
      console.error('Error adding candidate:', error);
      alert('Error al agregar candidato: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCandidate = async (candidateName) => {
    if (votingActive) {
      alert('No puedes eliminar candidatos mientras la votación está activa');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar al candidato "${candidateName}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await contract.methods.eliminarCandidato(candidateName).send({
        from: account,
        gas: 200000
      });

      alert('Candidato eliminado exitosamente');
      await loadAdminData();
    } catch (error) {
      console.error('Error removing candidate:', error);
      alert('Error al eliminar candidato: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVoting = async () => {
    if (candidates.length === 0) {
      alert('Debes agregar al menos un candidato antes de activar la votación');
      return;
    }

    setLoading(true);
    try {
      await contract.methods.activarVotacion(!votingActive).send({
        from: account,
        gas: 150000
      });

      alert(`Votación ${!votingActive ? 'activada' : 'desactivada'} exitosamente`);
      await loadAdminData();
    } catch (error) {
      console.error('Error toggling voting:', error);
      alert('Error al cambiar estado de votación: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewElection = async () => {
    if (!newElectionName.trim()) {
      alert('Por favor ingresa un nombre para la nueva elección');
      return;
    }

    if (votingActive) {
      alert('Debes desactivar la votación actual antes de iniciar una nueva elección');
      return;
    }

    setLoading(true);
    try {
      await contract.methods.iniciarNuevaEleccion(newElectionName).send({
        from: account,
        gas: 300000
      });

      alert('Nueva elección iniciada exitosamente');
      setNewElectionName('');
      await loadAdminData();
    } catch (error) {
      console.error('Error starting new election:', error);
      alert('Error al iniciar nueva elección: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMintTokens = async () => {
    if (!mintAddress.trim() || !mintAmount.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (!web3.utils.isAddress(mintAddress)) {
      alert('Dirección inválida');
      return;
    }

    setLoading(true);
    try {
      const amountInWei = web3.utils.toWei(mintAmount, 'ether');
      await contract.methods.mint(mintAddress, amountInWei).send({
        from: account,
        gas: 200000
      });

      alert('Tokens acuñados exitosamente');
      setMintAddress('');
      setMintAmount('');
    } catch (error) {
      console.error('Error minting tokens:', error);
      alert('Error al acuñar tokens: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!newOwner.trim()) {
      alert('Por favor ingresa la dirección del nuevo propietario');
      return;
    }

    if (!web3.utils.isAddress(newOwner)) {
      alert('Dirección inválida');
      return;
    }

    if (!confirm('¿Estás seguro de transferir la propiedad del contrato? Esta acción es irreversible.')) {
      return;
    }

    setLoading(true);
    try {
      await contract.methods.transferirPropiedad(newOwner).send({
        from: account,
        gas: 150000
      });

      alert('Propiedad transferida exitosamente');
      setNewOwner('');
    } catch (error) {
      console.error('Error transferring ownership:', error);
      alert('Error al transferir propiedad: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Panel de Administración
          </h2>
          <p className="text-gray-600">
            Conecta tu wallet para acceder al panel de administración
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'candidates', label: 'Candidatos', icon: Users },
    { id: 'election', label: 'Elección', icon: Settings },
    { id: 'tokens', label: 'Tokens', icon: Plus },
    { id: 'ownership', label: 'Propiedad', icon: User }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Panel de Administración
            </h1>
            <p className="text-gray-600">
              Gestiona candidatos, elecciones y configuraciones del sistema
            </p>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
            votingActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <Power className="h-4 w-4" />
            <span className="font-medium">
              {votingActive ? 'Votación Activa' : 'Votación Inactiva'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab: Candidatos */}
          {activeTab === 'candidates' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Gestionar Candidatos
                </h3>
                
                {/* Agregar Candidato */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Agregar Nuevo Candidato</h4>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newCandidateName}
                      onChange={(e) => setNewCandidateName(e.target.value)}
                      placeholder="Nombre del candidato"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddCandidate}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Candidatos */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Candidatos Actuales ({candidates.length})
                  </h4>
                  {candidates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay candidatos registrados
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {candidates.map((candidate, index) => (
                        <div key={index} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <User className="h-8 w-8 text-gray-400 mr-3" />
                            <span className="font-medium text-gray-900">{candidate}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveCandidate(candidate)}
                            disabled={loading || votingActive}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title={votingActive ? 'No se puede eliminar durante votación activa' : 'Eliminar candidato'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Elección */}
          {activeTab === 'election' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Control de Elección
                </h3>

                {/* Estado Actual */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Estado Actual</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Elección Actual:</p>
                      <p className="font-medium text-gray-900">{electionName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estado:</p>
                      <p className={`font-medium ${votingActive ? 'text-green-600' : 'text-red-600'}`}>
                        {votingActive ? 'Activa' : 'Inactiva'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Controles */}
                <div className="space-y-4">
                  {/* Toggle Votación */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Control de Votación</h4>
                    <button
                      onClick={handleToggleVoting}
                      disabled={loading}
                      className={`px-6 py-2 rounded-md font-medium disabled:opacity-50 flex items-center space-x-2 ${
                        votingActive
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <Power className="h-4 w-4" />
                      <span>{votingActive ? 'Desactivar Votación' : 'Activar Votación'}</span>
                    </button>
                  </div>

                  {/* Nueva Elección */}
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Iniciar Nueva Elección</h4>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newElectionName}
                        onChange={(e) => setNewElectionName(e.target.value)}
                        placeholder="Nombre de la nueva elección"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleStartNewElection}
                        disabled={loading}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                      >
                        Iniciar
                      </button>
                    </div>
                    {votingActive && (
                      <p className="text-sm text-yellow-600 mt-2">
                        ⚠️ Debes desactivar la votación actual antes de iniciar una nueva elección
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Tokens */}
          {activeTab === 'tokens' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Gestión de Tokens
                </h3>

                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Acuñar Tokens</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección del Destinatario
                      </label>
                      <input
                        type="text"
                        value={mintAddress}
                        onChange={(e) => setMintAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad de Tokens
                      </label>
                      <input
                        type="number"
                        value={mintAmount}
                        onChange={(e) => setMintAmount(e.target.value)}
                        placeholder="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleMintTokens}
                      disabled={loading}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Acuñar Tokens</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Propiedad */}
          {activeTab === 'ownership' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Transferir Propiedad
                </h3>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800">Advertencia</h4>
                      <p className="text-sm text-red-700 mt-1">
                        La transferencia de propiedad es irreversible. El nuevo propietario tendrá control total del contrato.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Nuevo Propietario</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección del Nuevo Propietario
                      </label>
                      <input
                        type="text"
                        value={newOwner}
                        onChange={(e) => setNewOwner(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleTransferOwnership}
                      disabled={loading}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Transferir Propiedad</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;