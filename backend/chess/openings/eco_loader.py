import pgn
import logging

class ECOLoader:
    def __init__(self, pgn_path: str):
        self.pgn_path = pgn_path
        self.openings = []

    def load(self):
        try:
            with open(self.pgn_path, 'r') as f:
                while True:
                    game = pgn.read_game(f)
                    if game is None:
                        break
                    self.openings.append({
                        'eco': game.headers.get('ECO'),
                        'name': game.headers.get('Opening'),
                        'moves': game.moves
                    })
            logging.info(f"Loaded {len(self.openings)} openings from {self.pgn_path}")
        except Exception as e:
            logging.error(f"Failed to load ECO PGN: {e}")
