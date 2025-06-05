# app.py
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import uuid
import hashlib
from functools import wraps
import time
import threading
from datetime import datetime
import secrets
import moralis

# --- TinyDB Setup ---
from tinydb import TinyDB, Query, where # Added 'where'
db = TinyDB('voting_system_db.json', indent=4)
candidates_table = db.table('candidates')
voter_tokens_table = db.table('voter_tokens')
system_status_table = db.table('system_status') # For voting open/closed status

from blockchain_logic import Blockchain # Assuming blockchain_logic.py is in the same directory

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

# --- Blockchain and Data Stores ---
blockchain = Blockchain(difficulty=2)
candidates = set()
voter_tokens = {}
voting_is_open = True # Default, will be loaded from DB

# --- Admin Credentials ---
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = hashlib.sha256("admin1234".encode()).hexdigest()

# --- Global variable for auto-mining control ---
auto_mine_interval = 3 # Mine every 3 seconds if there are pending votes
stop_mining_thread = threading.Event()

# --- Helper Functions ---
def hash_string(input_string):
    return hashlib.sha256(input_string.encode()).hexdigest()

def admin_login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            flash("You need to be logged in as an admin to access this page.", "warning")
            return redirect(url_for('admin_login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

@app.context_processor
def inject_current_year():
    return {'current_year': datetime.utcnow().year}

# --- Data Loading from DB ---
def load_data_from_db():
    global candidates, voter_tokens, voting_is_open
    candidates.clear()
    voter_tokens.clear()

    print("Loading candidates from DB...")
    for item in candidates_table.all():
        candidates.add(item['name'])
    print(f"Loaded {len(candidates)} candidates: {candidates}")

    print("Loading voter tokens from DB...")
    for item in voter_tokens_table.all():
        voter_tokens[item['token']] = item['voted']
    print(f"Loaded {len(voter_tokens)} voter tokens.")

    print("Loading system status from DB...")
    # Use a specific document ID (e.g., 1) for the system status
    # If you use `upsert` later with `Query()._id == 1`, TinyDB might not auto-assign `doc_id` to `_id`.
    # It's often simpler to use `get(doc_id=1)` or `search(Query().some_unique_key == 'status')`.
    # For simplicity, let's try to get a document with a specific field or create it.
    StatusQuery = Query()
    status_doc = system_status_table.get(StatusQuery.setting == 'voting_status')

    if status_doc:
        voting_is_open = status_doc.get('is_open', True)
    else:
        # If no status doc, create one and set voting to open by default
        system_status_table.insert({'setting': 'voting_status', 'is_open': True})
        voting_is_open = True
    print(f"Voting system is currently: {'OPEN' if voting_is_open else 'CLOSED'}")

# --- Background Mining Function ---
def background_miner():
    print("Background miner thread started.")
    while not stop_mining_thread.is_set():
        with app.app_context():
            if blockchain.pending_votes:
                print(f"Auto-mining: Found {len(blockchain.pending_votes)} pending votes.")
                try:
                    mined_hash = blockchain.mine_pending_votes(miner_id="AutoMiner")
                    if mined_hash:
                        print(f"Auto-miner successfully mined block: {mined_hash[:10]}...")
                except Exception as e:
                    print(f"Error during auto-mining: {e}")
        stop_mining_thread.wait(auto_mine_interval)
    print("Background miner thread stopped.")

# --- General Routes ---
@app.route('/')
def index():
    if session.get('admin_logged_in'):
        return redirect(url_for('admin_panel'))
    return redirect(url_for('user_vote_page'))

@app.route('/vote', methods=['GET'])
def user_vote_page():
    # This route now needs to pass `voting_closed` to your user_vote.html
    # Your user_vote.html already has `{% if not candidates %}`
    # You'll need to add `{% if voting_closed %}` logic to your template
    return render_template('user_vote.html',
                           candidates=sorted(list(candidates)),
                           voting_closed=not voting_is_open) # Pass the inverse

@app.route('/vote/submit', methods=['POST'])
def submit_vote():
    if not voting_is_open:
        flash("Voting is currently closed. No new votes can be submitted.", 'warning')
        return redirect(url_for('user_vote_page'))

    # ANTES: token = request.form.get('voter_token', '').strip()
    wallet_address = request.form.get('wallet_address', '').strip() # CAMBIO AQUÍ
    selected_candidate = request.form.get('candidate')

    # ANTES: if not token:
    if not wallet_address: # CAMBIO AQUÍ
        # Esto no debería ocurrir si el frontend funciona bien, pero es una buena validación
        flash("Wallet address is required. Please connect your MetaMask wallet.", 'danger')
        return redirect(url_for('user_vote_page'))
    
    # Validar formato de dirección de Ethereum (opcional pero recomendado)
    if not (wallet_address.startswith('0x') and len(wallet_address) == 42):
        flash(f"Invalid wallet address format: {wallet_address}", 'danger')
        return redirect(url_for('user_vote_page'))

    if not selected_candidate:
        flash("Please select a candidate.", 'danger')
        return redirect(url_for('user_vote_page'))
    if not candidates:
        flash("No candidates available for voting at this time.", "warning")
        return redirect(url_for('user_vote_page'))
    if selected_candidate not in candidates:
        flash(f"Invalid candidate '{selected_candidate}'. Please select from the list.", 'danger')
        return redirect(url_for('user_vote_page'))

    # ANTES: if token not in voter_tokens:
    if wallet_address not in voter_tokens: # CAMBIO AQUÍ
        # En este nuevo modelo, si la dirección no está, es un nuevo votante.
        # Podrías tener una lista de direcciones pre-aprobadas si es necesario,
        # pero para este caso, cualquier billetera conectada puede votar una vez.
        # Considera si quieres que la dirección se registre aquí por primera vez
        # o si el admin debe pre-registrarla.
        # Para este ejemplo, asumimos que una nueva dirección puede votar.
        voter_tokens[wallet_address] = False # Registrar y marcar como no votado inicialmente
        voter_tokens_table.insert({'token': wallet_address, 'voted': False}) # CAMBIO 'token' por 'wallet_address' conceptualmente
                                                                            # pero el campo en la BD puede seguir siendo 'token' si no quieres migrar
                                                                            # o cambiarlo a 'wallet_address'
    
    # ANTES: elif voter_tokens[token] is True:
    if voter_tokens[wallet_address] is True: # CAMBIO AQUÍ
        flash("This wallet address has already been used to cast a vote.", 'warning')
    else:
        # El hash_string ahora aplicaría a la wallet_address si quieres mantener el hashing
        # Las direcciones de wallet ya son identificadores únicos y públicos.
        # Hashear podría ser para consistencia si antes hasheabas los UUIDs.
        hashed_wallet_address = hash_string(wallet_address) # CAMBIO AQUÍ
        
        blockchain.add_vote_to_pending(voter_token_hashed=hashed_wallet_address, candidate_name=selected_candidate) # CAMBIO AQUÍ
        
        voter_tokens[wallet_address] = True # CAMBIO AQUÍ
        TokenQuery = Query()
        # ANTES: voter_tokens_table.update({'voted': True}, TokenQuery.token == token)
        voter_tokens_table.update({'voted': True}, TokenQuery.token == wallet_address) # CAMBIO AQUÍ (asumiendo que el campo en BD sigue siendo 'token')
                                                                                  # Si cambiaste el campo a 'wallet_address' en la BD, usa where('wallet_address') == wallet_address
        
        flash(f"Vote for '{selected_candidate}' from wallet {wallet_address[:6]}...{wallet_address[-4:]} cast successfully! Your vote will be processed soon.", 'success')
        return redirect(url_for('view_results'))

    return redirect(url_for('user_vote_page'))

@app.route('/blockchain')
def view_blockchain():
    return render_template('view_blockchain.html',
                           chain=blockchain.get_chain_for_display(),
                           chain_valid_status="Valid" if blockchain.is_chain_valid() else "INVALID - TAMPERED!")

# --- Results and Chart Data Routes ---
@app.route('/results')
def view_results():
    return render_template('results.html',
                           chain_valid_status="Valid" if blockchain.is_chain_valid() else "INVALID - TAMPERED!")

@app.route('/results_data')
def results_data_api():
    current_results = blockchain.tally_votes()
    labels = list(current_results.keys())
    data = list(current_results.values())
    return jsonify({'labels': labels, 'data': data, 'chain_valid': blockchain.is_chain_valid()})

# --- Admin Authentication Routes ---
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if session.get('admin_logged_in'):
        return redirect(url_for('admin_panel'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        next_url = request.form.get('next')

        if username == ADMIN_USERNAME and hash_string(password) == ADMIN_PASSWORD_HASH:
            session['admin_logged_in'] = True
            session.permanent = True
            flash("Logged in successfully as admin.", "success")
            if next_url and next_url != url_for('admin_login'):
                return redirect(next_url)
            return redirect(url_for('admin_panel'))
        else:
            flash("Invalid admin username or password.", "danger")
    return render_template('admin_login.html')

@app.route('/admin/logout')
@admin_login_required
def admin_logout():
    session.pop('admin_logged_in', None)
    flash("You have been logged out.", "info")
    return redirect(url_for('admin_login'))

# --- Admin Panel Routes (Protected) ---
@app.route('/admin', methods=['GET'])
@admin_login_required
def admin_panel():
    unused_tokens_list = [token for token, voted_status in voter_tokens.items() if not voted_status]
    return render_template('admin.html',
                           candidates=sorted(list(candidates)),
                           new_token=request.args.get('new_token'),
                           unused_tokens=unused_tokens_list,
                           pending_votes_count=len(blockchain.pending_votes),
                           auto_mine_interval=auto_mine_interval,
                           voting_is_open=voting_is_open) # Pass current status

@app.route('/admin/add_candidate', methods=['POST'])
@admin_login_required
def add_candidate():
    candidate_name = request.form.get('candidate_name', '').strip()
    if candidate_name:
        if candidate_name not in candidates:
            candidates.add(candidate_name)
            candidates_table.insert({'name': candidate_name})
            flash(f"Candidate '{candidate_name}' added successfully.", 'success')
        else:
            flash(f"Candidate '{candidate_name}' already exists.", 'warning')
    else:
        flash("Candidate name cannot be empty.", 'danger')
    return redirect(url_for('admin_panel'))

@app.route('/admin/remove_candidate/<candidate_name>', methods=['POST'])
@admin_login_required
def remove_candidate(candidate_name):
    if candidate_name in candidates:
        candidates.remove(candidate_name)
        CandidateQuery = Query()
        candidates_table.remove(CandidateQuery.name == candidate_name)
        flash(f"Candidate '{candidate_name}' removed successfully.", 'success')
        # Consider implications: votes for this candidate on the chain remain.
        # This just prevents new votes for them.
    else:
        flash(f"Candidate '{candidate_name}' not found.", 'warning')
    return redirect(url_for('admin_panel'))

@app.route('/admin/generate_token', methods=['POST'])
@admin_login_required
def generate_token():
    new_token = str(uuid.uuid4())
    voter_tokens[new_token] = False
    voter_tokens_table.insert({'token': new_token, 'voted': False})
    flash(f"New voter token generated.", 'success')
    return redirect(url_for('admin_panel', new_token=new_token))

@app.route('/admin/toggle_voting_status', methods=['POST'])
@admin_login_required
def toggle_voting_status():
    global voting_is_open
    voting_is_open = not voting_is_open

    StatusQuery = Query()
    system_status_table.update({'is_open': voting_is_open}, StatusQuery.setting == 'voting_status')

    status_message = "OPEN" if voting_is_open else "CLOSED"
    flash(f"Voting system is now {status_message}.", 'info')

    # Optional: If closing voting, you might want to mine any remaining pending votes.
    # if not voting_is_open and blockchain.pending_votes:
    #     print("Voting closed. Mining any remaining pending votes...")
    #     mined_hash = blockchain.mine_pending_votes(miner_id="AdminCloseVote")
    #     if mined_hash:
    #         flash(f"Final pending votes mined (Block: {mined_hash[:10]}...).", "info")
    #     blockchain.pending_votes.clear() # Or ensure mine_pending_votes clears them

    return redirect(url_for('admin_panel'))

if __name__ == '__main__':
    load_data_from_db() # Load data from DB at startup

    miner_thread = threading.Thread(target=background_miner, daemon=True)
    miner_thread.start()

    try:
        app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
    except KeyboardInterrupt:
        print("Shutting down...")
    finally:
        print("Signaling miner thread to stop...")
        stop_mining_thread.set()
        if miner_thread.is_alive():
            miner_thread.join(timeout=auto_mine_interval + 2)
        print("Miner thread stopped. Exiting.")
        db.close() # Close the TinyDB database file