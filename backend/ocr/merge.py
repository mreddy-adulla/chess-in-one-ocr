from typing import List
from backend.chess.openings.opening_index import OpeningIndex

def merge_with_opening_awareness(ocr_moves: List[str], opening_index: OpeningIndex) -> List[dict]:
    reconciled = []
    current_moves = []
    
    for i, move in enumerate(ocr_moves):
        match = opening_index.match_prefix(current_moves + [move])
        
        move_data = {
            "raw": move,
            "fixed": move,
            "tags": []
        }
        
        if match:
            # If the move matches an opening but the raw OCR might be slightly off,
            # we could implement soft correction logic here.
            # For now, we just tag it.
            move_data["tags"].append("opening_consistent")
        
        reconciled.append(move_data)
        current_moves.append(move_data["fixed"])
        
    return reconciled
