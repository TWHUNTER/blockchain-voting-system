// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingSystem {
    address public owner; // Dueño/Administrador del contrato

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    // Mapping de ID de candidato a la estructura Candidate
    mapping(uint => Candidate) public candidates;
    uint public candidatesCount; // Contador para IDs de candidatos

    // Mapping para rastrear si una dirección ya votó
    mapping(address => bool) public hasVoted;

    // Estado de la votación 
    bool public votingOpen;

    // Eventos para notificar cambios importantes
    event CandidateAdded(uint indexed candidateId, string name, address indexed addedBy);
    event Voted(address indexed voter, uint indexed candidateId);
    event VotingStatusChanged(bool newStatus, address indexed changedBy);

    modifier onlyOwner() {
        require(msg.sender == owner, "VotingSystem: Caller is not the owner");
        _;
    }

    modifier whenVotingIsOpen() {
        require(votingOpen, "VotingSystem: Voting is not currently open");
        _;
    }

    constructor() {
        owner = msg.sender; // Quien despliega el contrato es el dueño
        votingOpen = false; // La votación comienza cerrada por defecto
    }

    /**
     * @dev Permite al dueño agregar un nuevo candidato.
     * @param _name Nombre del candidato.
     */
    function addCandidate(string memory _name) public onlyOwner {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name, msg.sender);
    }

    /**
     * @dev Permite a una dirección emitir un voto.
     * @param _candidateId El ID del candidato por el cual votar.
     */
    function vote(uint _candidateId) public whenVotingIsOpen {
        require(!hasVoted[msg.sender], "VotingSystem: You have already voted");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "VotingSystem: Invalid candidate ID");

        candidates[_candidateId].voteCount++;
        hasVoted[msg.sender] = true;

        emit Voted(msg.sender, _candidateId);
    }

    /**
     * @dev Permite al dueño cambiar el estado de la votación (abrir/cerrar).
     */
    function toggleVotingStatus() public onlyOwner {
        votingOpen = !votingOpen;
        emit VotingStatusChanged(votingOpen, msg.sender);
    }

    /**
     * @dev Obtiene la información de un candidato específico.
     * @param _candidateId ID del candidato.
     * @return id, nombre y conteo de votos del candidato.
     */
    function getCandidate(uint _candidateId) public view returns (uint, string memory, uint) {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "VotingSystem: Candidate ID out of bounds");
        Candidate storage c = candidates[_candidateId];
        return (c.id, c.name, c.voteCount);
    }

    /**
     * @dev Obtiene el número total de candidatos registrados.
     */
    function getCandidatesCount() public view returns (uint) {
        return candidatesCount;
    }
}