// src/components/VotePage.jsx
import React from "react";
import Navbar from "./Navbar";

export default function VotePage({
  elections, selectedElection, setSelectedElection,
  candidates, vote, hasVoted
}) {
  const selectedElectionData = elections[selectedElection];
  const totalVotes = candidates.reduce((sum, c) => sum + Number(c.voteCount), 0);
  
  // Calcular porcentajes para las barras de progreso
  const candidatesWithPercentage = candidates.map(candidate => ({
    ...candidate,
    percentage: totalVotes > 0 ? ((Number(candidate.voteCount) / totalVotes) * 100).toFixed(1) : 0
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header con título principal */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Sistema de Votación
        </h1>
        <p className="text-gray-600">Selecciona una elección y participa en el proceso democrático</p>
      </div>

      {/* Selector de Elecciones */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Elecciones Disponibles</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {elections.map(election => (
            <button
              key={election.id}
              className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                selectedElection === election.id
                  ? "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:shadow-md"
              }`}
              onClick={() => setSelectedElection(election.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800 text-left">{election.title}</h3>
                <div className={`w-3 h-3 rounded-full ${election.isOpen ? 'bg-green-500' : 'bg-red-500'}`}>
                </div>
              </div>
              <p className={`text-sm ${election.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                {election.isOpen ? '🟢 Abierta' : '🔴 Cerrada'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Panel de Votación */}
      {selectedElection !== null && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header de la elección seleccionada */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-1">{selectedElectionData?.title}</h3>
                <p className="text-blue-100">
                  {selectedElectionData?.isOpen ? 'Votación en curso' : 'Votación cerrada'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{totalVotes}</div>
                <div className="text-sm text-blue-100">votos totales</div>
              </div>
            </div>
          </div>

          {/* Lista de Candidatos */}
          <div className="p-6">
            {hasVoted && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">¡Voto registrado exitosamente!</p>
                    <p className="text-sm text-green-600">Ya has participado en esta elección</p>
                  </div>
                </div>
              </div>
            )}

            {!selectedElectionData?.isOpen && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">Elección cerrada</p>
                    <p className="text-sm text-red-600">Esta votación ya no está disponible</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {candidatesWithPercentage.map((candidate, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {candidate.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{candidate.name}</h4>
                        <p className="text-gray-600">{candidate.voteCount.toString()} votos ({candidate.percentage}%)</p>
                      </div>
                    </div>
                    
                    {!hasVoted && selectedElectionData?.isOpen && (
                      <button
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        onClick={() => vote(index)}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Votar
                        </div>
                      </button>
                    )}
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${candidate.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Estadísticas finales */}
            <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-center gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-800">{totalVotes}</div>
                  <div className="text-sm text-gray-600">Total de votos</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{candidates.length}</div>
                  <div className="text-sm text-gray-600">Candidatos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}