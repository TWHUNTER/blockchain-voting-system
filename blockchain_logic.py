# blockchain_logic.py
import hashlib
import time
import json
from datetime import datetime

class Block:
    def __init__(self, index, timestamp, data, previous_hash, nonce=0):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

    def mine_block(self, difficulty):
        target = '0' * difficulty
        # Recalculate hash initially without assuming it's already computed
        self.hash = self.calculate_hash()
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
        # print(f"Block mined: {self.hash} (Nonce: {self.nonce})") # Keep console clean for web app

class Blockchain:
    def __init__(self, difficulty=2):
        self.chain = [self.create_genesis_block()]
        self.difficulty = difficulty
        self.pending_votes = []

    def create_genesis_block(self):
        return Block(0, time.time(), "Keven Block", "0")

    def get_latest_block(self):
        return self.chain[-1]

    def add_vote_to_pending(self, voter_token_hashed, candidate_name):
        """
        Adds a new vote to the list of pending votes.
        The voter_token_hashed is assumed to be unique and pre-validated.
        """
        vote = {
            "voter_token_hashed": voter_token_hashed, # Store the hashed token
            "candidate": candidate_name,
            "timestamp": time.time()
        }
        self.pending_votes.append(vote)
        return True

    def mine_pending_votes(self, miner_id="System"): # miner_id is just for show here
        if not self.pending_votes:
            return False # No votes to mine

        latest_block = self.get_latest_block()
        new_block = Block(
            index=latest_block.index + 1,
            timestamp=time.time(),
            data=list(self.pending_votes), # Make a copy
            previous_hash=latest_block.hash
        )
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)
        self.pending_votes = [] # Reset pending votes
        return new_block.hash # Return hash of mined block

    def is_chain_valid(self):
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i-1]
            if current_block.hash != current_block.calculate_hash(): return False
            if current_block.previous_hash != previous_block.hash: return False
            if current_block.hash[:self.difficulty] != '0' * self.difficulty: return False
        return True

    def tally_votes(self):
        vote_counts = {}
        voted_tokens_in_chain = set() # To ensure one vote per token across the entire chain

        for block_index in range(1, len(self.chain)): # Skip genesis block
            block = self.chain[block_index]
            for vote in block.data:
                token_hashed = vote.get("voter_token_hashed")
                candidate = vote.get("candidate")
                if token_hashed and candidate:
                    # This check is more for auditing, primary unique vote check should be before adding to pending
                    if token_hashed not in voted_tokens_in_chain:
                        vote_counts[candidate] = vote_counts.get(candidate, 0) + 1
                        voted_tokens_in_chain.add(token_hashed)
                    # else:
                        # print(f"Warning: Token {token_hashed} found multiple times in chain during tally.")
        return vote_counts

    def get_chain_for_display(self):
        display_chain = []
        for block in self.chain:
            display_block = {
                "index": block.index,
                "timestamp": datetime.fromtimestamp(block.timestamp).strftime('%Y-%m-%d %H:%M:%S'),
                "data": block.data,
                "previous_hash": block.previous_hash,
                "hash": block.hash,
                "nonce": block.nonce
            }
            display_chain.append(display_block)
        return display_chain