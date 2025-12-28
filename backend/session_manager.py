import uuid
import os
import base64
import fitz  # PyMuPDF
from typing import Dict, List, Optional
from pydantic import BaseModel
from io import BytesIO

class SessionState(BaseModel):
    session_id: str
    total_rows: int
    current_row_index: int
    image_path: str
    processed_moves: List[Dict] = []
    
    # PDF specific fields
    file_type: str = "image"
    page_images: List[str] = [] # Base64 encoded strings for thumbnails
    selected_pages: List[int] = [0]
    current_page_idx: int = 0

class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}

    def create_session(self, file_path: str, total_rows: int = 20) -> str:
        session_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file_path)[1].lower()
        
        page_images = []
        file_type = "image"
        
        if file_ext == '.pdf':
            file_type = "pdf"
            try:
                doc = fitz.open(file_path)
                for page in doc:
                    # Increased resolution for better OCR accuracy (Matrix 2,2 = 144 DPI)
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    img_data = pix.tobytes("jpg")
                    img_str = base64.b64encode(img_data).decode()
                    page_images.append(img_str)
                doc.close()
            except Exception as e:
                # Raise the exception so the API endpoint returns a proper error
                raise Exception(f"PDF Conversion failed: {str(e)}")
        else:
            # For regular images, load and add to page_images so process_next_row can find it
            try:
                with open(file_path, "rb") as f:
                    img_data = f.read()
                    img_str = base64.b64encode(img_data).decode()
                    page_images.append(img_str)
            except Exception as e:
                raise Exception(f"Image loading failed: {str(e)}")
        
        self._sessions[session_id] = SessionState(
            session_id=session_id,
            total_rows=total_rows,
            current_row_index=0,
            image_path=file_path,
            file_type=file_type,
            page_images=page_images,
            selected_pages=[0] if file_type == "image" else []
        )
        return session_id

    def get_session(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def advance_session(self, session_id: str, new_moves: List[Dict]):
        session = self.get_session(session_id)
        if session:
            session.processed_moves.extend(new_moves)
            session.current_row_index += 1
            
            # Check if we need to advance to the next page
            # Assuming total_rows is per page or total for the session
            # If total_rows is 40 and we hit it, we check if there are more selected pages
            if session.current_row_index >= session.total_rows:
                if session.current_page_idx < len(session.selected_pages) - 1:
                    session.current_page_idx += 1
                    session.current_row_index = 0
                    print(f"DEBUG: Advancing to next page index {session.current_page_idx}")

    def is_complete(self, session_id: str) -> bool:
        session = self.get_session(session_id)
        if not session:
            return True
        # Complete only if we are on the last selected page AND hit the row limit
        is_last_page = session.current_page_idx >= len(session.selected_pages) - 1
        return is_last_page and session.current_row_index >= session.total_rows

# Global singleton
session_manager = SessionManager()
