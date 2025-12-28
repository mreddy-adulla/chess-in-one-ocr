import unittest
from unittest.mock import MagicMock, patch
from backend.ocr.trocr_engine import OCREngineFactory, OnlineOCREngine, TrOCREngine

class TestOCREngineFactory(unittest.TestCase):
    def test_get_local_engine(self):
        config = {"type": "local", "model_path": "models/trocr.onnx"}
        engine = OCREngineFactory.get_engine(config)
        self.assertIsInstance(engine, TrOCREngine)
        self.assertEqual(engine.model_path, "models/trocr.onnx")

    def test_get_online_engine_google(self):
        config = {"type": "online", "provider": "google", "api_key": "test_key"}
        engine = OCREngineFactory.get_engine(config)
        self.assertIsInstance(engine, OnlineOCREngine)
        self.assertEqual(engine.provider, "google")
        self.assertEqual(engine.api_key, "test_key")

    def test_get_online_engine_azure(self):
        config = {"type": "online", "provider": "azure", "api_key": "test_key"}
        engine = OCREngineFactory.get_engine(config)
        self.assertIsInstance(engine, OnlineOCREngine)
        self.assertEqual(engine.provider, "azure")

class TestOnlineOCREngine(unittest.TestCase):
    @patch('backend.ocr.trocr_engine.OnlineOCREngine._predict_google')
    def test_predict_google(self, mock_predict):
        mock_predict.return_value = "e4"
        engine = OnlineOCREngine(api_key="key", provider="google")
        result = engine.predict("dummy_path")
        self.assertEqual(result, "e4")
        mock_predict.assert_called_once_with("dummy_path")

    @patch('backend.ocr.trocr_engine.OnlineOCREngine._predict_azure')
    def test_predict_azure(self, mock_predict):
        mock_predict.return_value = "d4"
        engine = OnlineOCREngine(api_key="key", provider="azure")
        result = engine.predict("dummy_path")
        self.assertEqual(result, "d4")
        mock_predict.assert_called_once_with("dummy_path")

if __name__ == '__main__':
    unittest.main()
