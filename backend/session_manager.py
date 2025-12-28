import uuid
from typing import Dict, List, Optional
from pydantic import BaseModel

class SessionState(BaseModel):
    session_id: str
    total_rows: int
    current_row_index: int
    image_path: str
    processed_moves: List[Dict] = []

class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}

    def create_session(self, image_path: str, total_rows: int = 60) -> str:
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = SessionState(
            session_id=session_id,
            total_rows=total_rows,
            current_row_index=0,
            image_path=image_path
        )
        return session_id

    def get_session(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def advance_session(self, session_id: str, new_moves: List[Dict]):
        session = self.get_session(session_id)
        if session:
            session.processed_moves.extend(new_moves)
            session.current_row_index += 1

    def is_complete(self, session_id: str) -> bool:
        session = self.get_session(session_id)
        if not session:
            return True
        return session.current_row_index >= session.total_rows

# Global singleton for demonstration
session_manager = SessionManager()
