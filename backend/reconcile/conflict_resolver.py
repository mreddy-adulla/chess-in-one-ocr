from typing import List, Dict, Optional

class ConflictResolver:
    def resolve(self, aligned_moves: List[Dict]) -> List[Dict]:
        reconciled = []
        
        for move in aligned_moves:
            source_a = move["source_a"]
            source_b = move["source_b"]
            
            status = "resolved"
            san = source_a
            conflict_reason = None
            
            if source_a == source_b:
                if source_a is None:
                    status = "unresolved"
                    san = None
            elif source_a is None or source_b is None:
                status = "conflict"
                san = source_a or source_b
                conflict_reason = "missing_source"
            else:
                status = "conflict"
                san = source_a # Default to source A, but flag it
                conflict_reason = "mismatch"
                
            reconciled.append({
                "ply": move["ply"],
                "san": san,
                "status": status,
                "conflict_reason": conflict_reason,
                "source_a": source_a,
                "source_b": source_b
            })
            
        return reconciled
