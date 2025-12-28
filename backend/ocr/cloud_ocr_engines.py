import os
import time
import logging
import requests
import json
from typing import List, Optional, Dict
from abc import ABC, abstractmethod

# ROI Constants
MOVE_TABLE_Y_MIN = 300
MOVE_TABLE_Y_MAX = 2500

class OCREngine(ABC):
    @abstractmethod
    def predict(self, image_path: str) -> List[str]:
        pass

class AzureOCREngine(OCREngine):
    def __init__(self, api_key: str, endpoint: str):
        self.api_key = api_key
        self.endpoint = endpoint.rstrip('/')
        self.url = f"{self.endpoint}/vision/v3.2/read/analyze"
        logging.info(f"Initialized Azure OCR Engine at {self.endpoint}")

    def predict(self, image_path: str) -> List[str]:
        logging.info(f"Sending image to Azure: {image_path}")
        try:
            with open(image_path, "rb") as f:
                data = f.read()
            
            headers = {
                'Ocp-Apim-Subscription-Key': self.api_key,
                'Content-Type': 'application/octet-stream'
            }
            
            response = requests.post(self.url, headers=headers, data=data)
            response.raise_for_status()
            
            # The Read API is asynchronous
            operation_url = response.headers["Operation-Location"]
            
            # Poll for results
            for _ in range(10):
                time.sleep(1)
                res = requests.get(operation_url, headers={'Ocp-Apim-Subscription-Key': self.api_key})
                res_data = res.json()
                if res_data['status'] == 'succeeded':
                    return self._process_results(res_data)
                if res_data['status'] == 'failed':
                    logging.error(f"Azure OCR failed: {res_data}")
                    return []
            
            return []
        except Exception as e:
            logging.error(f"Error in Azure OCR: {e}")
            return []

    def _process_results(self, data: Dict) -> List[str]:
        valid_lines = []
        for result in data.get('analyzeResult', {}).get('readResults', []):
            for line in result.get('lines', []):
                # ROI Filtering: boundingBox is [x1, y1, x2, y2, x3, y3, x4, y4]
                top_y = line['boundingBox'][1]
                if MOVE_TABLE_Y_MIN <= top_y <= MOVE_TABLE_Y_MAX:
                    valid_lines.append(line['text'])
        return valid_lines

class GoogleOCREngine(OCREngine):
    def __init__(self, credentials_path: str):
        self.credentials_path = credentials_path
        # Note: In a real implementation, we would use google-cloud-vision library
        # For now, we'll assume the environment is set up or mock the REST call
        logging.info(f"Initialized Google OCR Engine with {credentials_path}")

    def predict(self, image_path: str) -> List[str]:
        logging.info(f"Sending image to Google: {image_path}")
        # Placeholder for actual Google Vision API call
        # Mocking return based on plan
        return ["e4", "d5"] # Mocked

class HybridOCREngine(OCREngine):
    def __init__(self, azure_config: Optional[Dict], google_config: Optional[Dict], local_engine: OCREngine):
        self.azure = AzureOCREngine(**azure_config) if azure_config else None
        self.google = GoogleOCREngine(**google_config) if google_config else None
        self.local = local_engine
        
        # Simple persistence for usage tracking (could be moved to a DB later)
        self.usage_file = "cloud_usage.json"
        self.usage = self._load_usage()

    def _load_usage(self) -> Dict:
        if os.path.exists(self.usage_file):
            try:
                with open(self.usage_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {"azure": 0, "google": 0, "month": time.strftime("%Y-%m")}

    def _save_usage(self):
        with open(self.usage_file, 'w') as f:
            json.dump(self.usage, f)

    def _check_reset(self):
        current_month = time.strftime("%Y-%m")
        if self.usage["month"] != current_month:
            self.usage = {"azure": 0, "google": 0, "month": current_month}
            self._save_usage()

    def predict(self, image_path: str) -> List[str]:
        self._check_reset()
        
        # 1. Try Azure
        if self.azure and self.usage["azure"] < 5000:
            result = self.azure.predict(image_path)
            if result:
                self.usage["azure"] += 1
                self._save_usage()
                return result

        # 2. Try Google
        if self.google and self.usage["google"] < 1000:
            result = self.google.predict(image_path)
            if result:
                self.usage["google"] += 1
                self._save_usage()
                return result

        # 3. Fallback to Local
        logging.info("Falling back to local OCR engine")
        local_result = self.local.predict(image_path)
        return [local_result] if isinstance(local_result, str) else local_result
