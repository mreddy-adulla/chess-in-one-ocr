import pytest
from backend.reconcile.cluster import Clusterer
from backend.reconcile.inference import infer_side

def test_mixed_pdf_pipeline_logic():
    """
    Simulates the logic that would be used in the full pipeline for a mixed PDF.
    1. Input: Chaotic stream of pages.
    2. Step 1: Group by Game.
    3. Step 2: Cluster by Side (within each game).
    """
    # Mock data representing OCR output for a mixed PDF
    # Tournament Mixed: Game 1 (W, B), Game 2 (W, B) - shuffled
    pages = [
        {"page_id": "G1_W", "round": 1, "moves": [{"ply": 0}, {"ply": 2}]},
        {"page_id": "G2_B", "round": 2, "moves": [{"ply": 1}, {"ply": 3}]},
        {"page_id": "G1_B", "round": 1, "moves": [{"ply": 1}, {"ply": 3}]},
        {"page_id": "G2_W", "round": 2, "moves": [{"ply": 0}, {"ply": 2}]},
    ]
    
    clusterer = Clusterer()
    
    # 1. Group by Game
    games = clusterer.group_by_game(pages)
    assert len(games) == 2
    
    # 2. Process Game 1
    g1_pages = next(g for g in games if g[0]["round"] == 1)
    g1_clusters = clusterer.cluster_pages(g1_pages)
    assert len(g1_clusters["white"]) == 1
    assert g1_clusters["white"][0]["page_id"] == "G1_W"
    assert len(g1_clusters["black"]) == 1
    assert g1_clusters["black"][0]["page_id"] == "G1_B"
    
    # 3. Process Game 2
    g2_pages = next(g for g in games if g[0]["round"] == 2)
    g2_clusters = clusterer.cluster_pages(g2_pages)
    assert len(g2_clusters["white"]) == 1
    assert g2_clusters["white"][0]["page_id"] == "G2_W"
    assert len(g2_clusters["black"]) == 1
    assert g2_clusters["black"][0]["page_id"] == "G2_B"

def test_page_level_atomicity():
    """
    Ensures each page is treated as an independent source candidate.
    """
    pages = [{"page_number": i, "moves": [{"ply": i % 2}]} for i in range(10)]
    clusterer = Clusterer()
    clusters = clusterer.cluster_pages(pages)
    # 5 even plies (white), 5 odd plies (black)
    assert len(clusters["white"]) == 5
    assert len(clusters["black"]) == 5
