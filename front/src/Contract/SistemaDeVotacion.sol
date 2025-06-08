// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SistemaDeVotacion
 * @dev Este contrato combina un token ERC20 con un sistema de votación.
 * Los poseedores del token pueden votar en elecciones gestionadas por el propietario del contrato.
 * Cada voto consume una cantidad fija de tokens.
 */
contract SistemaDeVotacion {

    //================================================================================
    // Propiedades del Token (ERC20)
    //================================================================================
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) public allowance;

    //================================================================================
    // Propiedades del Sistema de Votación
    //================================================================================
    address public propietario;
    bool public votacionActiva;
    uint256 public constant COSTO_VOTO = 1 ether; // 1 token con 18 decimales

    // Detalles de la elección actual
    string public nombreEleccionActual;
    uint256 public idEleccionActual;

    // Conteo de votos por candidato
    mapping(string => uint256) public conteoVotos;

    // Rastreo de votantes por elección
    // idEleccion => votante => haVotado
    mapping(uint256 => mapping(address => bool)) public haVotadoEnEleccion;

    // Candidatos
    string[] public candidatos;
    mapping(string => bool) private _existeCandidato;

    // Historial de elecciones
    struct InfoEleccion {
        string nombre;
        uint256 id;
        uint256 votosTotales;
        bool completada;
        uint256 fechaFinalizacion;
    }
    InfoEleccion[] public historialElecciones;

    //================================================================================
    // Eventos
    //================================================================================

    // Eventos de Token
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // Eventos de Votación
    event VotoEmitido(address indexed votante, string candidato, uint256 indexed idEleccion);
    event CandidatoAgregado(string candidato);
    event CandidatoEliminado(string candidato);
    event VotacionActivada(bool activa);
    event EleccionIniciada(uint256 indexed idEleccion, string nombre);
    event EleccionReiniciada(uint256 indexed idEleccion);
    event TransferenciaDePropiedad(address indexed propietarioAnterior, address indexed nuevoPropietario);

    //================================================================================
    // Modificadores
    //================================================================================

    modifier soloPropietario() {
        require(msg.sender == propietario, "Error: Accion solo para el propietario");
        _;
    }

    modifier siVotacionActiva() {
        require(votacionActiva, "Error: La votacion no esta activa");
        _;
    }

    //================================================================================
    // Constructor
    //================================================================================

    constructor(
        string memory _nombreToken,
        string memory _simboloToken,
        uint256 _suministroInicial
    ) {
        propietario = msg.sender;
        emit TransferenciaDePropiedad(address(0), propietario);

        // Configuración del token
        name = _nombreToken;
        symbol = _simboloToken;
        decimals = 18;
        
        // Acuñar suministro inicial para el desplegador del contrato
        uint256 suministroTotalConDecimales = _suministroInicial * (10**decimals);
        totalSupply = suministroTotalConDecimales;
        _balances[msg.sender] = suministroTotalConDecimales;
        emit Transfer(address(0), msg.sender, suministroTotalConDecimales);

        // Configuración inicial de la votación
        idEleccionActual = 1;
        nombreEleccionActual = "Eleccion Inicial";
        votacionActiva = false;
    }

    //================================================================================
    // Funciones de Votación (Lógica Principal)
    //================================================================================

    /**
     * @dev Emite un voto por un candidato, quemando tokens del votante.
     * @param _candidato El nombre del candidato por el cual votar.
     */
    function emitirVoto(string calldata _candidato) external siVotacionActiva {
        require(_existeCandidato[_candidato], "Error: El candidato no existe");
        require(!haVotadoEnEleccion[idEleccionActual][msg.sender], "Error: Ya has votado en esta eleccion");
        require(balanceOf(msg.sender) >= COSTO_VOTO, "Error: No tienes suficientes tokens para votar");

        // Marcar como votado antes de la operación para prevenir reentrada
        haVotadoEnEleccion[idEleccionActual][msg.sender] = true;
        
        // Incrementar el conteo de votos
        conteoVotos[_candidato]++;

        // Quemar los tokens del votante
        _burn(msg.sender, COSTO_VOTO);

        emit VotoEmitido(msg.sender, _candidato, idEleccionActual);
    }

    //================================================================================
    // Funciones de Administración (soloPropietario)
    //================================================================================

    function iniciarNuevaEleccion(string calldata _nombreEleccion) external soloPropietario {
        require(!votacionActiva, "Error: Deten la votacion actual antes de iniciar una nueva");
        require(bytes(_nombreEleccion).length > 0, "Error: El nombre de la eleccion no puede estar vacio");

        // Guardar la elección actual en el historial si tuvo votos
        uint256 votosTotales = obtenerVotosTotales();
        if (votosTotales > 0) {
            historialElecciones.push(InfoEleccion({
                nombre: nombreEleccionActual,
                id: idEleccionActual,
                votosTotales: votosTotales,
                completada: true,
                fechaFinalizacion: block.timestamp
            }));
        }

        // Iniciar nueva elección
        idEleccionActual++;
        nombreEleccionActual = _nombreEleccion;

        // Reiniciar conteo de votos para los candidatos existentes
        for (uint i = 0; i < candidatos.length; i++) {
            conteoVotos[candidatos[i]] = 0;
        }

        emit EleccionIniciada(idEleccionActual, _nombreEleccion);
    }

    function agregarCandidato(string calldata _candidato) external soloPropietario {
        require(bytes(_candidato).length > 0, "Error: El nombre del candidato no puede estar vacio");
        require(!_existeCandidato[_candidato], "Error: El candidato ya existe");

        candidatos.push(_candidato);
        _existeCandidato[_candidato] = true;
        conteoVotos[_candidato] = 0; // Inicializar conteo de votos

        emit CandidatoAgregado(_candidato);
    }

    function eliminarCandidato(string calldata _candidato) external soloPropietario {
        require(_existeCandidato[_candidato], "Error: El candidato no existe");
        require(!votacionActiva, "Error: No se puede eliminar candidatos mientras la votacion este activa");

        // Encontrar y eliminar el candidato del array (swap-and-pop)
        for (uint i = 0; i < candidatos.length; i++) {
            if (keccak256(bytes(candidatos[i])) == keccak256(bytes(_candidato))) {
                candidatos[i] = candidatos[candidatos.length - 1];
                candidatos.pop();
                break;
            }
        }

        delete _existeCandidato[_candidato];
        delete conteoVotos[_candidato];

        emit CandidatoEliminado(_candidato);
    }
    
    function activarVotacion(bool _activa) external soloPropietario {
        votacionActiva = _activa;
        emit VotacionActivada(_activa);
    }
    
    function transferirPropiedad(address _nuevoPropietario) external soloPropietario {
        require(_nuevoPropietario != address(0), "Error: El nuevo propietario no puede ser la direccion cero");
        address propietarioAnterior = propietario;
        propietario = _nuevoPropietario;
        emit TransferenciaDePropiedad(propietarioAnterior, _nuevoPropietario);
    }

    //================================================================================
    // Funciones de Consulta (Vista Pública)
    //================================================================================

    function obtenerCandidatos() external view returns (string[] memory) {
        return candidatos;
    }

    function obtenerVotosTotales() public view returns (uint256) {
        uint256 total = 0;
        for (uint i = 0; i < candidatos.length; i++) {
            total += conteoVotos[candidatos[i]];
        }
        return total;
    }
    
    function obtenerResultados() external view returns (string[] memory, uint256[] memory) {
        string[] memory nombres = new string[](candidatos.length);
        uint256[] memory votos = new uint256[](candidatos.length);
        
        for (uint i = 0; i < candidatos.length; i++) {
            nombres[i] = candidatos[i];
            votos[i] = conteoVotos[candidatos[i]];
        }
        
        return (nombres, votos);
    }

    //================================================================================
    // Funciones del Token (ERC20)
    //================================================================================
    
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        _transfer(from, to, amount);
        _approve(from, msg.sender, currentAllowance - amount);
        return true;
    }

    function mint(address to, uint256 amount) public soloPropietario {
        require(to != address(0), "ERC20: mint to the zero address");
        totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");

        _balances[from] = fromBalance - amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        allowance[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: burn from the zero address");
        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        
        _balances[account] = accountBalance - amount;
        totalSupply -= amount;
        emit Transfer(account, address(0), amount);
    }
}