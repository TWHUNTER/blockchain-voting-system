import React from "react";
import Navbar from "./Navbar"; 

export default function ResultsPage({
  elections, selectedElection, setSelectedElection, candidates
}) {
  const selectedElectionData = elections.find(e => e.id === selectedElection);
  const totalVotes = candidates.reduce((sum, c) => sum + Number(c.voteCount), 0);

  // Calcular porcentajes y ordenar candidatos por votos
  const candidatesWithPercentage = candidates.map(candidate => ({
    ...candidate,
    percentage: totalVotes > 0 ? (Number(candidate.voteCount) / totalVotes * 100).toFixed(1) : 0
  })).sort((a, b) => Number(b.voteCount) - Number(a.voteCount));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Resultados de Elecciones</h2>
            <p className="text-green-100">Transparencia total en tiempo real</p>
          </div>
        </div>
      </div>

      {/* Selector de Elecciones */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Seleccionar Elección</h3>
        </div>

        {elections.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg">No hay elecciones disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {elections.map(e => (
              <button
                key={e.id}
                className={`p-6 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                  selectedElection === e.id 
                    ? "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200" 
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedElection(e.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800 truncate flex-1">{e.title}</h4>
                  <div className={`w-4 h-4 rounded-full ml-2 ${e.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    e.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {e.isOpen ? 'Activa' : 'Cerrada'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resultados de la Elección Seleccionada */}
      {selectedElection !== null && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedElectionData?.title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Total de votos: {totalVotes}</span>
                </span>
                <span className={`flex items-center space-x-1 ${
                  selectedElectionData?.isOpen ? 'text-green-600' : 'text-red-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    selectedElectionData?.isOpen ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span>{selectedElectionData?.isOpen ? 'Activa' : 'Cerrada'}</span>
                </span>
              </div>
            </div>
          </div>

          {candidates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-lg">No hay candidatos en esta elección</p>
            </div>
          ) : (
            <div className="space-y-4">
              {candidatesWithPercentage.map((candidate, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                    index === 0 && totalVotes > 0
                      ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {index === 0 && totalVotes > 0 && (
                        <div className="flex items-center justify-center w-8 h-8 bg-yellow-400 rounded-full">
                          <svg className="w-5 h-5 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">
                          {candidate.name}
                          {index === 0 && totalVotes > 0 && (
                            <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full">
                              Líder
                            </span>
                          )}
                        </h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        {candidate.voteCount.toString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {candidate.percentage}%
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ease-out ${
                        index === 0 && totalVotes > 0
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                          : 'bg-gradient-to-r from-blue-400 to-purple-400'
                      }`}
                      style={{ width: `${candidate.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estadísticas adicionales */}
          {totalVotes > 0 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas de Participación</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalVotes}</div>
                  <div className="text-sm text-gray-600">Total Votos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{candidates.length}</div>
                  <div className="text-sm text-gray-600">Candidatos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {candidatesWithPercentage[0]?.percentage || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Líder</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedElectionData?.isOpen ? 'Activa' : 'Cerrada'}
                  </div>
                  <div className="text-sm text-gray-600">Estado</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}