import logging
from backend.ocr.trocr_engine import TrOCREngine
from backend.chess.openings.opening_index import OpeningIndex
from backend.ocr.merge import merge_with_opening_awareness
from backend.reconcile.aligner import Aligner
from backend.reconcile.conflict_resolver import ConflictResolver
from backend.scoring.confidence import ConfidenceEngine

def run_e2e_pipeline(image_path_a: str, image_path_b: str, eco_openings: list):
    logging.info("Starting E2E Chess OCR Pipeline")
    
    # 1. OCR
    engine = TrOCREngine("models/trocr.onnx")
    raw_move_a = engine.predict(image_path_a)
    raw_move_b = engine.predict(image_path_b)
    
    # 2. Opening Awareness
    index = OpeningIndex(eco_openings)
    processed_a = merge_with_opening_awareness([raw_move_a], index)
    processed_b = merge_with_opening_awareness([raw_move_b], index)
    
    # 3. Reconciliation
    aligner = Aligner()
    aligned = aligner.align_by_ply([p["fixed"] for p in processed_a], [p["fixed"] for p in processed_b])
    
    resolver = ConflictResolver()
    reconciled = resolver.resolve(aligned)
    
    # 4. Confidence
    scorer = ConfidenceEngine()
    final_moves = scorer.process_reconciled_moves(reconciled)
    
    logging.info(f"Pipeline complete. Reconciled move: {final_moves[0]['san']} with confidence {final_moves[0]['confidence']}")
    return final_moves
