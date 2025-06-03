# app.py
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify # Add jsonify
import uuid
import hashlib
from functools import wraps
import time # For sleeping in the background thread
import threading # For the background mining task
from datetime import datetime # For context processor
import secrets

from blockchain_logic import Blockchain

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

# --- Blockchain and Data Stores ---
blockchain = Blockchain(difficulty=2) # Reduced difficulty for faster auto-mining demo
candidates = set()
voter_tokens = {}

# --- Admin Credentials ---
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = hashlib.sha256("admin1234".encode()).hexdigest()

# --- Global variable for auto-mining control ---
auto_mine_interval = 3 # Mine every 30 seconds if there are pending votes
stop_mining_thread = threading.Event() # Event to signal the thread to stop

# --- Helper Functions --- (hash_string, admin_login_required - keep as before)
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

# --- Background Mining Function ---
def background_miner():
    """
    Periodically checks for pending votes and mines a block if any are found.
    Runs in a separate thread.
    """
    print("Background miner thread started.")
    while not stop_mining_thread.is_set():
        with app.app_context(): # Need app context to interact with Flask app components like 'blockchain'
            if blockchain.pending_votes:
                print(f"Auto-mining: Found {len(blockchain.pending_votes)} pending votes.")
                try:
                    mined_hash = blockchain.mine_pending_votes(miner_id="AutoMiner")
                    if mined_hash:
                        print(f"Auto-miner successfully mined block: {mined_hash[:10]}...")
                    # else: # This case should ideally not be reached if pending_votes is not empty
                        # print("Auto-miner: No block mined despite pending votes (should not happen).")
                except Exception as e:
                    print(f"Error during auto-mining: {e}")
            # else:
                # print("Auto-miner: No pending votes.")
        # Wait for the defined interval or until the stop event is set
        stop_mining_thread.wait(auto_mine_interval)
    print("Background miner thread stopped.")


# --- General Routes --- (index, user_vote_page, submit_vote, view_blockchain - keep mostly as before)
@app.route('/')
def index():
    if session.get('admin_logged_in'):
        return redirect(url_for('admin_panel'))
    return redirect(url_for('user_vote_page'))

@app.route('/vote', methods=['GET'])
def user_vote_page():
    return render_template('user_vote.html', candidates=sorted(list(candidates)))

@app.route('/vote/submit', methods=['POST'])
def submit_vote():
    token = request.form.get('voter_token', '').strip()
    selected_candidate = request.form.get('candidate')

    if not token:
        flash("Voter token is required.", 'danger')
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

    if token not in voter_tokens:
        flash("Invalid voter token. Please check your token.", 'danger')
    elif voter_tokens[token] is True:
        flash("This voter token has already been used to cast a vote.", 'warning')
    else:
        hashed_token = hash_string(token)
        blockchain.add_vote_to_pending(voter_token_hashed=hashed_token, candidate_name=selected_candidate)
        voter_tokens[token] = True
        flash(f"Vote for '{selected_candidate}' cast successfully! Your vote will be automatically processed soon.", 'success')
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
    """Displays the election results page which will include the chart."""
    # The actual data for the chart will be fetched via /results_data
    return render_template('results.html',
                           chain_valid_status="Valid" if blockchain.is_chain_valid() else "INVALID - TAMPERED!")

@app.route('/results_data')
def results_data_api():
    """API endpoint to provide vote data for the chart."""
    current_results = blockchain.tally_votes()
    # Prepare data for Chart.js
    labels = list(current_results.keys())
    data = list(current_results.values())
    return jsonify({'labels': labels, 'data': data, 'chain_valid': blockchain.is_chain_valid()})


# --- Admin Authentication Routes --- (admin_login, admin_logout - keep as before)
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
    # The "Mine Pending Votes" button can be removed or kept for manual override if desired
    return render_template('admin.html',
                           candidates=sorted(list(candidates)),
                           new_token=request.args.get('new_token'),
                           unused_tokens=unused_tokens_list,
                           pending_votes_count=len(blockchain.pending_votes),
                           auto_mine_interval=auto_mine_interval) # Pass interval to template

@app.route('/admin/add_candidate', methods=['POST'])
@admin_login_required
def add_candidate():
    candidate_name = request.form.get('candidate_name', '').strip()
    if candidate_name:
        if candidate_name not in candidates:
            candidates.add(candidate_name)
            flash(f"Candidate '{candidate_name}' added successfully.", 'success')
        else:
            flash(f"Candidate '{candidate_name}' already exists.", 'warning')
    else:
        flash("Candidate name cannot be empty.", 'danger')
    return redirect(url_for('admin_panel'))

@app.route('/admin/generate_token', methods=['POST'])
@admin_login_required
def generate_token():
    new_token = str(uuid.uuid4())
    voter_tokens[new_token] = False
    flash(f"New voter token generated.", 'success')
    return redirect(url_for('admin_panel', new_token=new_token))

# REMOVE or COMMENT OUT the manual mine route if fully relying on auto-miner
# Or keep it for manual override/testing.
# @app.route('/admin/mine', methods=['POST'])
# @admin_login_required
# def mine_block_route():
#     # ... (previous code for manual mining) ...
#     if not blockchain.pending_votes:
#         flash("No pending votes to mine manually.", 'info')
#     else:
#         mined_block_hash = blockchain.mine_pending_votes(miner_id=session.get('admin_username', 'AdminManual'))
#         if mined_block_hash:
#             flash(f"Manual: New block mined! Hash: {mined_block_hash[:10]}...", 'success')
#         else:
#             flash("Manual: Failed to mine block.", 'danger')
#     return redirect(url_for('admin_panel'))


if __name__ == '__main__':
    # Start the background mining thread
    miner_thread = threading.Thread(target=background_miner, daemon=True) # daemon=True allows main program to exit even if thread is running
    miner_thread.start()

    try:
        # For development, debug=True is fine. For production, use a WSGI server.
        # use_reloader=False is important when using threads like this with Flask's dev server
        # to prevent the thread from being started multiple times.
        app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
    except KeyboardInterrupt:
        print("Shutting down...")
    finally:
        print("Signaling miner thread to stop...")
        stop_mining_thread.set() # Signal the thread to stop
        if miner_thread.is_alive():
            miner_thread.join(timeout=5) # Wait for the thread to finish
        print("Miner thread stopped. Exiting.")