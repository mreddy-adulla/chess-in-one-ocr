# Plan for Advanced OCR and UI Launch

## 1. Web UI Launch
To launch the Web UI for verification, we need to ensure the frontend is running and accessible.
- **Action:** Start the frontend development server.
- **Verification:** Access the UI via browser to verify the review interface is functional.

## 2. Advanced OCR Models for Handwriting
The user requires better handling of diverse handwriting styles.
- **Current:** TrOCR Base (good for printed/standard, weaker on messy handwriting).
- **Recommendation 1: TrOCR Large (Handwritten Fine-tuned)**
  - Use the `microsoft/trocr-large-handwritten` model.
  - Pros: Specifically trained for handwriting, open-source.
  - Cons: Heavier inference.
- **Recommendation 2: Commercial APIs (Google Vision / Azure Read)**
  - Pros: State-of-the-art for unconstrained handwriting.
  - Cons: Cost, latency, privacy (data leaves local machine).
- **Recommendation 3: Custom Fine-tuning**
  - Fine-tune TrOCR on a specific chess score sheet dataset (e.g., IAM handwriting database mixed with chess moves).

## 3. Metadata Filtering Strategy
Score sheets often contain header info (Names, Ratings, Events) that confuses the move parser.
- **Geometric Filtering:**
  - Define "Move Box" regions of interest (ROI) based on standard layouts.
  - Ignore text detected outside these grid regions.
- **Regex/Parser Filtering:**
  - Strict move validation (e.g., must match `[KQNBR]?[a-h]?[1-8]?x?[a-h][1-8](=[QRNB])?[\+#]?`).
  - Discard tokens that don't look like moves or move numbers.
- **Semantic Segmentation:**
  - Train a layout analysis model (e.g., LayoutLM) to classify page regions as "Header", "Move Table", "Footer".

## 4. Integration Plan
1.  **Immediate:** Update `TrOCREngine` to allow switching to `trocr-large-handwritten`.
2.  **Short-term:** Implement ROI cropping in `backend/ocr/preprocess.py` to isolate the move table before OCR.
3.  **Long-term:** Build a hybrid pipeline that uses LayoutLM for segmentation -> TrOCR for recognition.
