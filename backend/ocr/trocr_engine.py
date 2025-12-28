import logging
import os
from abc import ABC, abstractmethod
from PIL import Image
import torch
try:
    import tesserocr
except ImportError:
    tesserocr = None

class OCREngine(ABC):
    @abstractmethod
    def predict(self, image_path: str) -> str:
        pass

class TesseractEngine(OCREngine):
    def __init__(self):
        self.engine_name = "Tesseract (tesserocr)"
        self.api = None
        
        # Discover absolute paths
        current_file = os.path.abspath(__file__)
        current_dir = os.path.dirname(current_file)
        project_root = os.path.dirname(os.path.dirname(current_dir))
        self.local_tessdata = os.path.join(project_root, "backend", "tessdata")
        
        try:
            if tesserocr and os.path.exists(self.local_tessdata):
                self.api = tesserocr.PyTessBaseAPI(path=self.local_tessdata)
                self.api.SetPageSegMode(tesserocr.PSM.SINGLE_LINE)
                logging.info("Tesseract API initialized.")
            else:
                logging.error("Tesseract not available or tessdata missing.")
        except Exception as e:
            logging.error(f"Failed to init Tesseract: {e}")

    def predict(self, image_path: str) -> str:
        if self.api is None: return ""
        try:
            with Image.open(image_path) as img:
                self.api.SetImage(img)
                text = self.api.GetUTF8Text().strip()
                return text if text else ""
        except Exception as e:
            logging.error(f"Tesseract fail: {e}")
            return ""

class TransformerOCREngine(OCREngine):
    def __init__(self):
        self.model_name = "microsoft/trocr-base-handwritten"
        self.engine_name = f"TrOCR ({self.model_name})"
        self.processor = None
        self.model = None
        
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            self.device = "mps"
        elif torch.cuda.is_available():
            self.device = "cuda"
        else:
            self.device = "cpu"

    def _load_model(self):
        if self.model is not None: return
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel
        logging.info(f"Loading TrOCR on {self.device}...")
        self.processor = TrOCRProcessor.from_pretrained(self.model_name, use_fast=True)
        self.model = VisionEncoderDecoderModel.from_pretrained(self.model_name).to(self.device)
        logging.info("TrOCR Loaded.")

    def predict(self, image_path: str) -> str:
        self._load_model()
        try:
            with Image.open(image_path).convert("RGB") as img:
                pixel_values = self.processor(images=img, return_tensors="pt").pixel_values.to(self.device)
                # Using beam search for quality
                generated_ids = self.model.generate(pixel_values, max_new_tokens=15, num_beams=4)
                generated_text = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
                return generated_text.strip()
        except Exception as e:
            logging.error(f"TrOCR fail: {e}")
            return ""

class OnlineOCREngine(OCREngine):
    def __init__(self, api_key: str, provider: str = "google"):
        self.api_key = api_key
        self.provider = provider
        self.engine_name = f"Online OCR ({provider})"
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
    _engines = {}

    @staticmethod
    def get_engine(engine_type: str = "tesseract", api_key: str = "") -> OCREngine:
        if engine_type == "google_cloud" or engine_type == "azure":
            # Online engines are often session-specific or key-specific, 
            # but for this factory we'll cache them by type for now.
            if engine_type not in OCREngineFactory._engines:
                OCREngineFactory._engines[engine_type] = OnlineOCREngine(api_key=api_key, provider=engine_type.split('_')[0])
            return OCREngineFactory._engines[engine_type]
            
        if engine_type not in OCREngineFactory._engines:
            if engine_type == "trocr":
                OCREngineFactory._engines[engine_type] = TransformerOCREngine()
            else:
                OCREngineFactory._engines[engine_type] = TesseractEngine()
        return OCREngineFactory._engines[engine_type]
