import os
import pytest
import json
from backend.ocr.trocr_engine import OCREngineFactory, TrOCREngine
from backend.ocr.cloud_ocr_engines import HybridOCREngine, AzureOCREngine, GoogleOCREngine

def test_hybrid_engine_initialization():
    config = {
        "type": "hybrid",
        "azure": {"api_key": "test_key", "endpoint": "https://test.cognitiveservices.azure.com/"},
        "google": {"credentials_path": "test_google.json"},
        "model_path": "backend/tests/mock_model.onnx"
    }
    engine = OCREngineFactory.get_engine(config)
    assert isinstance(engine, HybridOCREngine)
    assert engine.azure is not None
    assert engine.google is not None
    assert isinstance(engine.local, TrOCREngine)

def test_hybrid_fallback_to_local(tmp_path):
    # Setup mock usage file to exceed limits
    usage_file = tmp_path / "cloud_usage.json"
    usage_file.write_text(json.dumps({
        "azure": 5000, 
        "google": 1000, 
        "month": "2025-12"
    }))
    
    config = {
        "type": "hybrid",
        "azure": {"api_key": "test_key", "endpoint": "https://test.azure.com"},
        "google": {"credentials_path": "test.json"}
    }
    
    # We need to manually inject the usage file path for testing if we wanted to be strict,
    # but let's check if the logic handles the overflow.
    local_engine = TrOCREngine("mock")
    hybrid = HybridOCREngine(
        azure_config=config["azure"],
        google_config=config["google"],
        local_engine=local_engine
    )
    hybrid.usage_file = str(usage_file)
    hybrid.usage = hybrid._load_usage()
    
    # Mocking a prediction
    # Since we can't easily mock the local engine's predict in this setup without more boilerplate,
    # we just verify it hits the local path logic.
    result = hybrid.predict("any_image.png")
    assert result == ["e4"] # Default mock return of TrOCREngine

if __name__ == "__main__":
    pytest.main([__file__])
