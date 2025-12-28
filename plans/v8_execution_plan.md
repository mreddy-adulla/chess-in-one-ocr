# V8 UI Restoration and OCR Upgrade Plan

## 1. Frontend Restoration (Critical Priority)
The `frontend` directory is missing configuration files and the Tauri Rust backend.
**Goal:** Restore a working React+Vite+Tauri environment.

### 1.1 Restore Configuration Files
- Create `frontend/package.json` with dependencies:
  - `react`, `react-dom`
  - `@tauri-apps/api`, `@tauri-apps/cli`
  - `vite`, `@vitejs/plugin-react`
- Create `frontend/vite.config.js` configured for Tauri (strict port, env prefix).
- Create `frontend/index.html` pointing to `src/main.jsx`.

### 1.2 Restore Tauri Backend (`src-tauri`)
- Create `frontend/src-tauri/tauri.conf.json`: Define window config, permissions, and bundle settings.
- Create `frontend/src-tauri/Cargo.toml`: Rust dependencies (`tauri`, `serde`, `serde_json`).
- Create `frontend/src-tauri/src/main.rs`: Basic Tauri entry point.
- Create `frontend/src-tauri/build.rs`: Standard Tauri build script.

## 2. OCR Engine Upgrade
**Goal:** Support Online APIs (prioritized) and Local Models (fallback/downloadable).

### 2.1 Architecture
- **Interface:** `OCREngine` (predict method).
- **Implementations:**
  - `OnlineEngine`: Wraps Google Cloud Vision / Azure Computer Vision.
  - `LocalTrOCREngine`: Wraps Hugging Face Transformers / ONNX.
- **Factory:** `OCREngineFactory` to instantiate based on config.

### 2.2 Online API Implementation
- **Provider:** Google Cloud Vision (1000 free units/month) or Azure.
- **Config:** User provides API Key via UI.
- **Logic:**
  - Check for API Key.
  - If present, send image to API.
  - Parse response to text.

### 2.3 Local Model Implementation
- **Model:** `microsoft/trocr-base-handwritten` or `large`.
- **Download Logic:**
  - Check if model files exist in `backend/models/`.
  - If not, auto-download using `transformers` or script.
- **Inference:** Run on CPU (or GPU if available).

### 2.4 Backend Integration
- Update `backend/pipeline.py` to use `OCREngineFactory`.
- Add API endpoints:
  - `POST /api/v1/config/ocr`: Set provider (Online/Local) and API Key.
  - `GET /api/v1/config/ocr`: Get current status.

## 3. Execution Steps
1.  **Code Mode:** Restore `frontend` files.
2.  **Code Mode:** Verify UI launch (install deps).
3.  **Code Mode:** Implement `OCREngine` hierarchy.
4.  **Code Mode:** Add Configuration Endpoints in Backend.
5.  **Code Mode:** Update Frontend `ApiConfig.jsx` to allow entering API keys.
