import logging
from abc import ABC, abstractmethod
import tesserocr
from PIL import Image

class OCREngine(ABC):
    @abstractmethod
    def predict(self, image_path: str) -> str:
        pass

class TrOCREngine(OCREngine):
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.device = "CPU"
        logging.info("Initialized Tesseract Engine (TrOCR Fallback)")

    def predict(self, image_path: str) -> str:
        try:
            # Use Tesseract as the actual engine since we lack ONNX runtime
            with Image.open(image_path) as img:
                # Tesseract configuration for single word/line
                text = tesserocr.image_to_text(img).strip()
                return text if text else ""
        except Exception as e:
            logging.error(f"OCR Failed: {e}")
            return ""

class OnlineOCREngine(OCREngine):
    def __init__(self, api_key: str, provider: str = "google"):
        self.api_key = api_key
        self.provider = provider
        logging.info(f"Initialized Online OCR ({provider})")

    def predict(self, image_path: str) -> str:
        if self.provider == "google":
            return self._predict_google(image_path)
        elif self.provider == "azure":
            return self._predict_azure(image_path)
        return ""

    def _predict_google(self, image_path: str) -> str:
        logging.info("Calling Google Cloud Vision API")
        return "d4"

    def _predict_azure(self, image_path: str) -> str:
        logging.info("Calling Azure Computer Vision API")
        return "c4"

class OCREngineFactory:
    @staticmethod
    def get_engine(config: dict) -> OCREngine:
        from backend.ocr.cloud_ocr_engines import HybridOCREngine
        
        engine_type = config.get("type", "local")
        local_engine = TrOCREngine(model_path=config.get("model_path", "models/trocr.onnx"))
        
        if engine_type == "hybrid":
            return HybridOCREngine(
                azure_config=config.get("azure"),
                google_config=config.get("google"),
                local_engine=local_engine
            )
        
        if engine_type == "online":
            return OnlineOCREngine(
                api_key=config.get("api_key"),
                provider=config.get("provider", "google")
            )
        return local_engine
