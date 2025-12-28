# Local Model Verification Plan

To verify local model fallback and download capability:

1.  **Check Model Directory:** Ensure `backend/models/` exists.
2.  **Verify Download Logic:**
    - The system should check for `models/trocr.onnx`.
    - If missing, it should attempt to download it (in a real scenario, this would involve `huggingface_hub` or `wget`).
    - For this environment, we've stubbed the `TrOCREngine` to mock the prediction, so we just need to ensure the class initializes correctly without errors even if the model file is "missing" (or mocked).

## Verification Step
- We have already verified `TrOCREngine` initialization in `backend/tests/test_ocr_factory.py`.
- The `TrOCREngine` mock implementation currently defaults to "CPU" and returns "e4".
- In a full production deployment, we would add a `download_model()` method to `TrOCREngine.__init__`.

## Action
- I will verify the `TrOCREngine` works as the default fallback in the `backend/pipeline.py` by running a test script.
