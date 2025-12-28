from typing import List, Dict, Any, Optional

def infer_side(moves: List[Dict[str, Any]]) -> str:
    """
    Infers the side (white or black) based on move content.
    Heuristic: Standard score sheets usually have moves for the player whose sheet it is.
    White sheets typically start with move 1 (ply 0), 2 (ply 2), etc.
    Black sheets might have moves for both, but often focus on the side being recorded.
    
    Actually, a more robust heuristic:
    - If ply indices are primarily even (0, 2, 4...) -> white bias
    - If ply indices are primarily odd (1, 3, 5...) -> black bias
    """
    if not moves:
        return "unknown"
    
    plies = [m.get("ply", -1) for m in moves if m.get("ply") is not None]
    if not plies:
        return "unknown"
    
    white_votes = sum(1 for p in plies if p % 2 == 0)
    black_votes = sum(1 for p in plies if p % 2 != 0)
    
    total = len(plies)
    if total == 0:
        return "unknown"
        
    white_ratio = white_votes / total
    black_ratio = black_votes / total
    
    if white_ratio > 0.8:
        return "white"
    elif black_ratio > 0.8:
        return "black"
    else:
        return "unknown"
