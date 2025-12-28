import pytest
from backend.reconcile.cluster import Clusterer

def test_group_by_game_header():
    clusterer = Clusterer()
    pages = [
        {"page_number": 1, "round": 1, "moves": [{"ply": 0}]},
        {"page_number": 2, "round": 1, "moves": [{"ply": 1}]},
        {"page_number": 3, "round": 2, "moves": [{"ply": 0}]},
        {"page_number": 4, "round": 2, "moves": [{"ply": 1}]},
    ]
    games = clusterer.group_by_game(pages)
    assert len(games) == 2
    assert len(games[0]) == 2
    assert len(games[1]) == 2
    assert games[0][0]["round"] == 1
    assert games[1][0]["round"] == 2

def test_cluster_pages_white_and_black():
    clusterer = Clusterer()
    pages = [
        {"page_id": "p1", "moves": [{"ply": 0}, {"ply": 2}]}, # White
        {"page_id": "p2", "moves": [{"ply": 1}, {"ply": 3}]}, # Black
    ]
    clusters = clusterer.cluster_pages(pages)
    assert len(clusters["white"]) == 1
    assert len(clusters["black"]) == 1
    assert clusters["white"][0]["page_id"] == "p1"
    assert clusters["black"][0]["page_id"] == "p2"
