from typing import List, Dict

class Aligner:
    def align_by_ply(self, source_a: List[str], source_b: List[str]) -> List[Dict]:
        max_len = max(len(source_a), len(source_b))
        aligned = []
        
        for i in range(max_len):
            move_a = source_a[i] if i < len(source_a) else None
            move_b = source_b[i] if i < len(source_b) else None
            
            aligned.append({
                "ply": i + 1,
                "source_a": move_a,
                "source_b": move_b
            })
            
        return aligned
