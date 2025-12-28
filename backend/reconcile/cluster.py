from typing import List, Dict

class Clusterer:
    def cluster_pages(self, pages_data: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Groups pages into sources based on move heuristics.
        Returns a mapping of cluster_label (e.g., 'Source A', 'Source B') to list of page data.
        """
        clusters = {"Source A": [], "Source B": [], "Unassigned": []}
        
        for page in pages_data:
            moves = page.get("moves", [])
            if not moves:
                clusters["Unassigned"].append(page)
                continue
            
            # Simple heuristic: Parity of plies
            white_moves = [m for m in moves if m.get("ply", 0) % 2 != 0]
            black_moves = [m for m in moves if m.get("ply", 0) % 2 == 0]
            
            if len(white_moves) > len(black_moves):
                clusters["Source A"].append(page)
            elif len(black_moves) > len(white_moves):
                clusters["Source B"].append(page)
            else:
                clusters["Unassigned"].append(page)
                
        return clusters
