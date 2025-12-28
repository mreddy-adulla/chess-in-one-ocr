from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class Game(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: Optional[str] = None
    pgn_header: Optional[str] = None
    moves: List["Move"] = Relationship(back_populates="game")
    sources: List["Source"] = Relationship(back_populates="game")

class Move(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    game_id: int = Field(foreign_key="game.id")
    ply: int
    san: Optional[str] = None
    fen: Optional[str] = None
    confidence: float = 1.0
    game: Game = Relationship(back_populates="moves")

class Source(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    game_id: int = Field(foreign_key="game.id")
    type: str # ocr, sheet
    raw_data: str
    game: Game = Relationship(back_populates="sources")

class Conflict(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    move_id: int = Field(foreign_key="move.id")
    source_a: Optional[str] = None
    source_b: Optional[str] = None
    reason: str
