#!/bin/bash
# update_backend.sh

echo "Updating Chess OCR Backend..."
git pull origin v8
pip install -r backend/requirements.txt
# brew services restart chess-backend (Mac Mini specific)
echo "Backend updated and restarting..."
