from typing import List, Dict, Any
from .inference import infer_side

class Clusterer:
    def group_by_game(self, pages_data: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """
        Groups pages into games based on header info (e.g., Round 1, Round 2) 
        and chronological proximity.
        """
        if not pages_data:
            return []
        
        # Group by round attribute
        games_dict = {}
        for page in pages_data:
            r = page.get("round", "unknown")
            if r not in games_dict:
                games_dict[r] = []
            games_dict[r].append(page)
        
        # Sort each game's pages by page number if available
        for r in games_dict:
            games_dict[r].sort(key=lambda x: x.get("page_number", 0))
            
        return list(games_dict.values())

    def cluster_pages(self, pages_data: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Groups pages within a SINGLE GAME into sources (White side vs Black side).
        Returns a mapping of cluster_label (e.g., 'Source White', 'Source Black') to list of page data.
        """
        clusters = {"white": [], "black": [], "unknown": []}
        
        for page in pages_data:
            moves = page.get("moves", [])
            side = infer_side(moves)
            clusters[side].append(page)
                
        return clusters
