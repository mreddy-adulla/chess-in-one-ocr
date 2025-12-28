import os
import pytest
from backend.reconcile.cluster import Clusterer
from backend.reconcile.inference import infer_side
from backend.ocr.trocr_engine import TrOCREngine
# Assuming a pdf to image converter is needed, but for now we'll mock the OCR output 
# to test the clustering logic on REAL round metadata if we could extract it.

@pytest.mark.skip(reason="Needs actual OCR model and PDF processing setup")
def test_real_pdf_clustering_logic():
    """
    This test would ideally run the actual OCR on a real PDF.
    Since we are in a restricted environment, we will simulate the extraction 
    of metadata from one of the provided PDFs.
    """
    pdf_path = "spleens/mixed_chaos/Round 3.pdf"
    assert os.path.exists(pdf_path)
    
    # In a real scenario, we'd use something like pdf2image
    # For this test, we verify the clustering logic can handle the round name
    clusterer = Clusterer()
    
    # Mocked data as if extracted from 'Round 3.pdf'
    pages = [
        {"page_id": "p1", "round": "Round 3", "moves": [{"ply": 0}, {"ply": 2}]},
        {"page_id": "p2", "round": "Round 3", "moves": [{"ply": 1}, {"ply": 3}]},
    ]
    
    games = clusterer.group_by_game(pages)
    assert len(games) == 1
    assert games[0][0]["round"] == "Round 3"

def test_inference_on_mock_moves():
    """
    Testing the inference logic with moves typical of a real game.
    """
    white_page = {"moves": [{"ply": 0, "san": "e4"}, {"ply": 2, "san": "Nf3"}]}
    black_page = {"moves": [{"ply": 1, "san": "e5"}, {"ply": 3, "san": "Nc6"}]}
    
    assert infer_side(white_page["moves"]) == "white"
    assert infer_side(black_page["moves"]) == "black"
