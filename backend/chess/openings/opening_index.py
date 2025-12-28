from typing import List, Optional

class OpeningIndex:
    def __init__(self, openings: List[dict]):
        self.openings = openings

    def match_prefix(self, moves: List[str]) -> Optional[dict]:
        best_match = None
        max_depth = -1
        
        for opening in self.openings:
            opening_moves = opening['moves']
            match_depth = 0
            for i in range(min(len(moves), len(opening_moves))):
                if moves[i] == opening_moves[i]:
                    match_depth += 1
                else:
                    break
            
            if match_depth > max_depth and match_depth > 0:
                max_depth = match_depth
                best_match = opening
                
        return best_match
