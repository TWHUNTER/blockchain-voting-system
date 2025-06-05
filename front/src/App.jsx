import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import VotingAbi from "./VotingAbi.json"; // Ajusta el path si lo pusiste en otra carpeta

// Pon aquí la dirección de tu contrato en Sepolia:
const CONTRACT_ADDRESS = "AQUI_PON_LA_DIRECCION_DE_TU_CONTRATO";

export default function App() {
  const [account, setAccount] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Conecta Metamask
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Instala Metamask para votar");
      return;
    }
    const [address] = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccount(address);
  }

  // Carga candidatos desde blockchain
  async function loadCandidates() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum); // Vite + ethers v6
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingAbi, provider);
      const candidatesList = await contract.getCandidates();
      setCandidates(candidatesList);
    } catch (err) {
      console.error("Error loading candidates:", err);
    }
  }

  // Verifica si la wallet ya votó
  async function checkIfVoted() {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingAbi, provider);
      const voted = await contract.hasVoted(account);
      setHasVoted(voted);
    } catch (err) {
      console.error("Error checking vote:", err);
    }
  }

  // Votar
  async function vote(idx) {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingAbi, signer);
      const tx = await contract.vote(idx);
      await tx.wait();
      setHasVoted(true);
      loadCandidates();
      alert("¡Voto registrado!");
    } catch (err) {
      alert("Error al votar: " + (err.info?.error?.message || err.message));
      console.error(err);
    }
    setLoading(false);
  }

  // Al conectar wallet, carga info
  useEffect(() => {
    if (account) {
      loadCandidates();
      checkIfVoted();
    }
    // eslint-disable-next-line
  }, [account]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 pt-12">
      <h1 className="text-3xl font-bold mb-6">Sistema de Voto Blockchain</h1>
      {!account ? (
        <button onClick={connectWallet} className="px-4 py-2 bg-blue-500 text-white rounded">
          Conectar Wallet
        </button>
      ) : (
        <>
          <div className="mb-4">Wallet: <span className="font-mono">{account}</span></div>
          <ul className="bg-white rounded-lg shadow-lg w-96 p-4">
            {candidates.map((c, i) => (
              <li key={i} className="flex justify-between items-center border-b py-2">
                <span>{c.name} <span className="text-gray-500">({c.voteCount.toString()} votos)</span></span>
                {!hasVoted && (
                  <button
                    className="bg-green-500 px-3 py-1 text-white rounded"
                    onClick={() => vote(i)}
                    disabled={loading}
                  >Votar</button>
                )}
              </li>
            ))}
          </ul>
          {hasVoted && <div className="mt-5 text-green-600 font-bold">¡Ya has votado!</div>}
        </>
      )}
    </div>
  );
}
