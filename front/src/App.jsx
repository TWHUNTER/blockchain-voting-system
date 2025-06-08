import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Voting from './components/Voting';
import AdminPanel from './components/AdminPanel';
import LoginAdmin from './components/LoginAdmin';
import Result from './components/Result';

function App() {
  const [account, setAccount] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);

  // Configuración del contrato
  const CONTRACT_ADDRESS = "0xa11e83081ff37357ecf7c686f98e0505d1edf2bf";
  const CONTRACT_ABI = [
    {
      "inputs": [
        {"internalType": "string", "name": "_nombreToken", "type": "string"},
        {"internalType": "string", "name": "_simboloToken", "type": "string"},
        {"internalType": "uint256", "name": "_suministroInicial", "type": "uint256"}
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
        {"indexed": true, "internalType": "address", "name": "spender", "type": "address"},
        {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": false, "internalType": "string", "name": "candidato", "type": "string"}
      ],
      "name": "CandidatoAgregado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": false, "internalType": "string", "name": "candidato", "type": "string"}
      ],
      "name": "CandidatoEliminado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "uint256", "name": "idEleccion", "type": "uint256"},
        {"indexed": false, "internalType": "string", "name": "nombre", "type": "string"}
      ],
      "name": "EleccionIniciada",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
        {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
        {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "address", "name": "votante", "type": "address"},
        {"indexed": false, "internalType": "string", "name": "candidato", "type": "string"},
        {"indexed": true, "internalType": "uint256", "name": "idEleccion", "type": "uint256"}
      ],
      "name": "VotoEmitido",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": false, "internalType": "bool", "name": "activa", "type": "bool"}
      ],
      "name": "VotacionActivada",
      "type": "event"
    },
    {
      "inputs": [
        {"internalType": "string", "name": "_candidato", "type": "string"}
      ],
      "name": "agregarCandidato",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "bool", "name": "_activa", "type": "bool"}
      ],
      "name": "activarVotacion",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "address", "name": "to", "type": "address"},
        {"internalType": "uint256", "name": "amount", "type": "uint256"}
      ],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "string", "name": "_candidato", "type": "string"}
      ],
      "name": "emitirVoto",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "string", "name": "_nombreEleccion", "type": "string"}
      ],
      "name": "iniciarNuevaEleccion",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "obtenerCandidatos",
      "outputs": [
        {"internalType": "string[]", "name": "", "type": "string[]"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "obtenerResultados",
      "outputs": [
        {"internalType": "string[]", "name": "", "type": "string[]"},
        {"internalType": "uint256[]", "name": "", "type": "uint256[]"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "address", "name": "account", "type": "address"}
      ],
      "name": "balanceOf",
      "outputs": [
        {"internalType": "uint256", "name": "", "type": "uint256"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "propietario",
      "outputs": [
        {"internalType": "address", "name": "", "type": "address"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "votacionActiva",
      "outputs": [
        {"internalType": "bool", "name": "", "type": "bool"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nombreEleccionActual",
      "outputs": [
        {"internalType": "string", "name": "", "type": "string"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "string", "name": "", "type": "string"}
      ],
      "name": "conteoVotos",
      "outputs": [
        {"internalType": "uint256", "name": "", "type": "uint256"}
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  // Conectar MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const Web3 = (await import('web3')).default;
        const web3Instance = new Web3(window.ethereum);
        
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        const contractInstance = new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        
        setWeb3(web3Instance);
        setContract(contractInstance);
        setAccount(accounts[0]);
        setIsConnected(true);

        // Verificar si es admin
        const owner = await contractInstance.methods.propietario().call();
        setIsAdmin(accounts[0].toLowerCase() === owner.toLowerCase());

      } catch (error) {
        console.error('Error connecting to wallet:', error);
        alert('Error conectando con MetaMask');
      }
    } else {
      alert('MetaMask no está instalado');
    }
  };

  // Desconectar wallet
  const disconnectWallet = () => {
    setAccount('');
    setIsAdmin(false);
    setIsConnected(false);
    setWeb3(null);
    setContract(null);
  };

  // Verificar conexión al cargar
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          connectWallet();
        }
      }
    };
    checkConnection();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar 
          account={account}
          isAdmin={isAdmin}
          isConnected={isConnected}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
        />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Ruta principal - Votación */}
            <Route 
              path="/" 
              element={
                <Voting 
                  contract={contract}
                  account={account}
                  isConnected={isConnected}
                  web3={web3}
                />
              } 
            />
            
            {/* Login de Admin */}
            <Route 
              path="/admin-login" 
              element={
                isAdmin ? 
                  <Navigate to="/admin" replace /> : 
                  <LoginAdmin connectWallet={connectWallet} />
              } 
            />
            
            {/* Panel de Admin */}
            <Route 
              path="/admin" 
              element={
                isAdmin ? 
                  <AdminPanel 
                    contract={contract}
                    account={account}
                    web3={web3}
                  /> : 
                  <Navigate to="/admin-login" replace />
              } 
            />
            
            {/* Resultados */}
            <Route 
              path="/results" 
              element={
                <Result 
                  contract={contract}
                  isConnected={isConnected}
                />
              } 
            />
            
            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;