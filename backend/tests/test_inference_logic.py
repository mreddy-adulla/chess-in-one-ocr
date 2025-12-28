import pytest
from backend.reconcile.inference import infer_side

def test_infer_side_white_standard():
    # White moves: 1, 2, 3... (ply 0, 2, 4...)
    moves = [
        {"ply": 0, "san": "e4"},
        {"ply": 2, "san": "Nf3"},
        {"ply": 4, "san": "d4"}
    ]
    assert infer_side(moves) == "white"

def test_infer_side_black_standard():
    # Black moves: 1... e5, 2... Nc6 (ply 1, 3, 5...)
    moves = [
        {"ply": 1, "san": "e5"},
        {"ply": 3, "san": "Nc6"},
        {"ply": 5, "san": "d6"}
    ]
    assert infer_side(moves) == "black"

def test_infer_side_ambiguous():
    # Mixed moves
    moves = [
        {"ply": 0, "san": "e4"},
        {"ply": 1, "san": "e5"}
    ]
    assert infer_side(moves) == "unknown"

def test_infer_side_empty():
    assert infer_side([]) == "unknown"
