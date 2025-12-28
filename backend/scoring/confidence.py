from typing import List, Dict

class ConfidenceEngine:
    def calculate_move_confidence(self, move_data: Dict) -> float:
        """
        Calculates confidence (0-1) based on:
        - OCR legality (assumed external for now)
        - Opening correction usage
        - Conflict presence
        - Agreement between sources
        """
        score = 1.0
        
        # Conflict penalty
        if move_data.get("status") == "conflict":
            score -= 0.5
            if move_data.get("conflict_reason") == "mismatch":
                score -= 0.2
                
        # Opening awareness signal
        if "opening_fix" in move_data.get("tags", []):
            score -= 0.1 # Small penalty if we had to "fix" it
            
        # Agreement signal
        if move_data.get("source_a") and move_data.get("source_b") and move_data.get("source_a") == move_data.get("source_b"):
            score += 0.1 # Bonus for agreement
            
        return max(0.0, min(1.0, score))

    def process_reconciled_moves(self, reconciled_moves: List[Dict]) -> List[Dict]:
        for move in reconciled_moves:
            move["confidence"] = self.calculate_move_confidence(move)
        return reconciled_moves
