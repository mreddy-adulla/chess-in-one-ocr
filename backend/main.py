from fastapi import FastAPI, Body, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import shutil
import os
import time
import base64
from io import BytesIO
from PIL import Image, ImageOps

# Conditional import to handle different execution contexts
try:
    from backend.models import Game
    from backend.session_manager import session_manager
    from backend.ocr.trocr_engine import OCREngineFactory
    from backend.ocr.segmentation import find_grid_rows, find_grid_columns
except (ImportError, ModuleNotFoundError):
    from models import Game
    from session_manager import session_manager
    from ocr.trocr_engine import OCREngineFactory
    from ocr.segmentation import find_grid_rows, find_grid_columns

app = FastAPI(title="Chess OCR API", version="8.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory config storage
ocr_config = {
    "type": "local",
    "provider": "google",
    "api_key": "",
    "model_path": "models/trocr.onnx"
}

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "version": "8.0.0"}

@app.get("/api/v1/config/ocr")
def get_ocr_config():
    return ocr_config

@app.post("/api/v1/config/ocr")
def update_ocr_config(config: Dict = Body(...)):
    global ocr_config
    ocr_config.update(config)
    return {"status": "updated", "config": ocr_config}

# --- Session Management Endpoints ---

@app.post("/api/v1/session/start")
async def start_session(file: UploadFile = File(...), move_limit: str = "40"):
    try:
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = f"{upload_dir}/{file.filename}"
        
        try:
            limit = int(move_limit)
        except:
            limit = 40
        actual_limit = min(limit, 60) 
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"File saved to {file_path}. Starting session...")
        session_id = session_manager.create_session(file_path, total_rows=actual_limit)
        session = session_manager.get_session(session_id)
        
        return {
            "session_id": session_id,
            "total_rows": actual_limit,
            "status": "ready",
            "file_type": session.file_type,
            "page_images": session.page_images
        }
    except Exception as e:
        print(f"ERROR in start_session: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/session/{session_id}/select_pages")
def select_pages(session_id: str, data: Dict = Body(...)):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.selected_pages = data.get("page_indices", [0])
    session.current_row_index = 0
    session.current_page_idx = 0
    return {"status": "updated", "selected_count": len(session.selected_pages)}

@app.post("/api/v1/session/{session_id}/process_next")
def process_next_row(session_id: str, context: Dict = Body(...)):
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session_manager.is_complete(session_id):
        return {"is_complete": True}

    row_idx = session.current_row_index
    current_page_idx = session.current_page_idx
    ply_start = (len(session.processed_moves)) + 1
    
    # Get current page image
    current_page_img = None
    if session.selected_pages and current_page_idx < len(session.selected_pages):
        page_idx = session.selected_pages[current_page_idx]
        if page_idx < len(session.page_images):
            current_page_img = session.page_images[page_idx]

    try:
        if not current_page_img:
            raise Exception("No page image available")
            
        img_data = base64.b64decode(current_page_img)
        img = Image.open(BytesIO(img_data)).convert('RGB')
        
        # 3. User Alignment
        rotation = context.get("rotation", 0)
        if rotation:
            img = img.rotate(-rotation, expand=True)
            img = img.convert('RGB')
            
        w, h = img.size
        top_margin = context.get("top_margin", 0.25) * h
        bottom_margin = context.get("bottom_margin", 0.88) * h
        left_margin = context.get("left_margin", 0.05) * w
        right_margin = context.get("right_margin", 0.95) * w
        
        # 4. Multi-Column Logic (Assuming 20 moves per column block)
        moves_per_col = 20
        col_block = row_idx // moves_per_col
        effective_row_idx = row_idx % moves_per_col
        num_cols = max(1, (session.total_rows + moves_per_col - 1) // moves_per_col)
        
        col_block_width = (right_margin - left_margin) / num_cols
        cur_x_start = left_margin + (col_block * col_block_width)
        cur_x_end = cur_x_start + col_block_width
        
        # 5. Automated Row Detection
        moves_area_vertical = img.crop((left_margin, top_margin, right_margin, bottom_margin))
        row_lines = find_grid_rows(moves_area_vertical, num_rows=moves_per_col)
        row_h = (bottom_margin - top_margin) / moves_per_col
        
        if len(row_lines) >= moves_per_col:
            y_start = top_margin + row_lines[effective_row_idx]
            y_end = top_margin + row_lines[effective_row_idx+1] if effective_row_idx + 1 < len(row_lines) else y_start + row_h
        else:
            y_start = top_margin + (effective_row_idx * row_h)
            y_end = y_start + row_h
            
        padding = (y_end - y_start) * 0.2
        y_start, y_end = max(0, y_start - padding), min(h, y_end + padding)
        
        # Crop the specific row (Full width of column block)
        row_crop = img.crop((cur_x_start, y_start, cur_x_end, y_end))
        rw, rh = row_crop.size
        
        # 6. Cell-based Segmentation (Tighter proportions based on feedback)
        # Proportions: [No (0-18%)][White (18-48%)][Black (48-78%)][Overflow (78-100%)]
        white_cell = row_crop.crop((0.18 * rw, 0, 0.48 * rw, rh))
        black_cell = row_crop.crop((0.48 * rw, 0, 0.78 * rw, rh))
        
        engine_type = context.get("ocr_provider", "tesseract")
        engine = OCREngineFactory.get_engine(engine_type)
        
        def run_ocr(cell, name):
            if engine_type == "tesseract":
                cell = ImageOps.autocontrast(cell.convert('L'))
                cell = cell.resize((cell.size[0]*2, cell.size[1]*2), Image.Resampling.LANCZOS)
            else:
                if cell.size[0] < 150: cell = cell.resize((cell.size[0]*2, cell.size[1]*2), Image.Resampling.LANCZOS)
            
            ext = ".png" if engine_type == "tesseract" else ".jpg"
            path = f"uploads/temp_{session_id}_{name}{ext}"
            cell.save(path)
            res = engine.predict(path)
            if os.path.exists(path): os.remove(path)
            return res, cell

        w_raw, w_proc = run_ocr(white_cell, "w")
        b_raw, b_proc = run_ocr(black_cell, "b")
        
        import re
        move_pattern = r'[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8][+#]?|O-O(?:-O)?'
        def clean(t):
            f = re.findall(move_pattern, t, re.IGNORECASE)
            return f[0].capitalize() if f else "???"

        w_move, b_move = clean(w_raw), clean(b_raw)
        row_confidence = 0.9 if (w_move != "???" and b_move != "???") else 0.4
        
        print(f"\n--- CELL OCR DEBUG (Row: {row_idx}) ---")
        print(f"ENGINE: {getattr(engine, 'engine_name', 'Unknown')}")
        print(f"W: '{w_raw}' -> {w_move} | B: '{b_raw}' -> {b_move}")
        
        # Base64 encode images for UI
        def to_b64(pill_img):
            buf = BytesIO()
            pill_img.save(buf, format="JPEG")
            return base64.b64encode(buf.getvalue()).decode()

        w_img_64 = to_b64(w_proc)
        b_img_64 = to_b64(b_proc)
        row_img_base64 = to_b64(row_crop)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        w_move, b_move, row_confidence, row_img_base64, w_raw, b_raw, w_img_64, b_img_64 = "???", "???", 0.1, None, "", "", None, None

    moves_to_return = [
        {"ply": ply_start, "san": w_move, "confidence": row_confidence, "debug_raw_text": w_raw, "cell_image": w_img_64},
        {"ply": ply_start + 1, "san": b_move, "confidence": row_confidence, "debug_raw_text": b_raw, "cell_image": b_img_64}
    ]
    
    session_manager.advance_session(session_id, moves_to_return)
    
    return {
        "is_complete": False,
        "row_index": row_idx,
        "page_index": session.current_page_idx,
        "total_pages": len(session.selected_pages),
        "is_new_page": row_idx == 0,
        "page_image": current_page_img if row_idx == 0 else None,
        "moves": moves_to_return,
        "confidence": row_confidence,
        "needs_review": row_confidence < 0.85 or row_idx == 0,
        "row_image": row_img_base64,
        "debug_raw_text": f"W: {w_raw} | B: {b_raw}",
        "w_cell_image": w_img_64,
        "b_cell_image": b_img_64
    }

@app.get("/api/v1/games", response_model=List[Game])
def get_games(): return []

@app.post("/api/v1/games")
def create_game(game: Game): return {"id": 1, "status": "created"}

@app.get("/api/v1/metrics")
def get_metrics(): return {"queue_depth": 0, "latency_ms": 150, "cpu_usage_percent": 12.5}
