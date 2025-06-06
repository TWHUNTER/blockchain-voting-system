import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import VotingAbi from "./VotingAbi.json";
import Navbar from "./components/landing/Navbar";
import AdminLogin from "./components/landing/AdminLogin";
import AdminPanel from "./components/landing/AdminPanel";
import VotePage from "./components/landing/VotePage";
import ResultsPage from "./components/landing/ResultsPage";

const CONTRACT_ADDRESS = "0x14ed3b64dc9db3802f482464051ba614bac4200e";

function App() {
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [electionCount, setElectionCount] = useState(0);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [newElectionTitle, setNewElectionTitle] = useState("");
  const [newCandidateName, setNewCandidateName] = useState("");
  const [status, setStatus] = useState("");
  const [hasVoted, setHasVoted] = useState(false);

  const [page, setPage] = useState("home");
  const [adminLogged, setAdminLogged] = useState(false);

  // Conecta Metamask
  async function connectWallet() {
    if (!window.ethereum) return alert("Necesitas Metamask.");
    const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccount(addr);
  }

  // Instancia del contrato
  function getContract(signer = false) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider.then(p => {
      if (signer) {
        return p.getSigner().then(s => new ethers.Contract(CONTRACT_ADDRESS, VotingAbi, s));
      }
      return new ethers.Contract(CONTRACT_ADDRESS, VotingAbi, p);
    });
  }

  async function loadElections() {
    const contract = await getContract();
    const count = await contract.electionCount();
    setElectionCount(Number(count));
    let temp = [];
    for (let i = 0; i < count; i++) {
      const title = await contract.elections(i).then(e => e.title);
      const isOpen = await contract.isElectionOpen(i);
      temp.push({ id: i, title, isOpen });
    }
    setElections(temp);
  }

  async function checkOwner() {
    const contract = await getContract();
    const owner = await contract.owner();
    setIsOwner(owner.toLowerCase() === account?.toLowerCase());
  }

  async function loadCandidates(electionId) {
    const contract = await getContract();
    try {
      const list = await contract.getCandidates(electionId);
      setCandidates(list);
    } catch {
      setCandidates([]);
    }
  }

  async function checkVoted(electionId) {
    if (!account) return;
    const contract = await getContract();
    const voted = await contract.hasVoted(electionId, account);
    setHasVoted(voted);
  }

  async function createElection() {
    if (!newElectionTitle) return;
    setStatus("Creando elección...");
    const contract = await getContract(true);
    const tx = await contract.createElection(newElectionTitle);
    await tx.wait();
    setStatus("¡Elección creada!");
    setNewElectionTitle("");
    loadElections();
  }

  async function addCandidate() {
    if (selectedElection === null || newCandidateName === "") return;
    setStatus("Agregando candidato...");
    const contract = await getContract(true);
    const tx = await contract.addCandidate(selectedElection, newCandidateName);
    await tx.wait();
    setStatus("¡Candidato agregado!");
    setNewCandidateName("");
    loadCandidates(selectedElection);
  }

  async function setElectionStatus(open) {
    if (selectedElection === null) return;
    setStatus(open ? "Abriendo..." : "Cerrando...");
    const contract = await getContract(true);
    const tx = await contract.setElectionStatus(selectedElection, open);
    await tx.wait();
    setStatus(open ? "¡Elección abierta!" : "¡Elección cerrada!");
    loadElections();
  }

  async function vote(candidateIndex) {
    if (selectedElection === null) return;
    setStatus("Enviando voto...");
    const contract = await getContract(true);
    const tx = await contract.vote(selectedElection, candidateIndex);
    await tx.wait();
    setStatus("¡Voto registrado!");
    setHasVoted(true);
    loadCandidates(selectedElection);
  }

  useEffect(() => {
    if (selectedElection !== null) {
      loadCandidates(selectedElection);
      checkVoted(selectedElection);
    }
  }, [selectedElection, account]);

  useEffect(() => {
    if (account) {
      loadElections();
      checkOwner();
    }
  }, [account]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar
        onNav={setPage}
        isAdmin={isOwner}
        onLogout={() => setAdminLogged(false)}
        onConnect={connectWallet}
        connected={!!account}
        account={account || ""}
      />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">
          {/* Página de inicio */}
          {page === "home" && (
            <div className="bg-white rounded-xl shadow-lg p-10 flex flex-col items-center">
              <h1 className="text-4xl font-bold mb-6 text-center">
                Sistema de Voto Blockchain
              </h1>
              {!account && (
                <button
                  onClick={connectWallet}
                  className="bg-blue-600 text-white px-6 py-3 rounded text-lg font-semibold"
                >
                  Conectar Wallet
                </button>
              )}
            </div>
          )}

          {/* Página de login admin */}
          {page === "admin" && !adminLogged && (
            <AdminLogin onLogin={() => setAdminLogged(true)} />
          )}
          {/* Panel admin solo si el owner ha hecho login */}
          {page === "admin" && adminLogged && isOwner && (
            <AdminPanel
              newElectionTitle={newElectionTitle}
              setNewElectionTitle={setNewElectionTitle}
              createElection={createElection}
              selectedElection={selectedElection}
              elections={elections}
              setSelectedElection={setSelectedElection}
              newCandidateName={newCandidateName}
              setNewCandidateName={setNewCandidateName}
              addCandidate={addCandidate}
              setElectionStatus={setElectionStatus}
              status={status}
            />
          )}

          {/* Página de votar */}
          {page === "vote" && (
            <VotePage
              elections={elections}
              selectedElection={selectedElection}
              setSelectedElection={setSelectedElection}
              candidates={candidates}
              vote={vote}
              hasVoted={hasVoted}
            />
          )}

          {/* Página de resultados */}
          {page === "results" && (
            <ResultsPage
              elections={elections}
              selectedElection={selectedElection}
              setSelectedElection={setSelectedElection}
              candidates={candidates}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;