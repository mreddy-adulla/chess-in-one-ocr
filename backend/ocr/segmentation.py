import cv2
import numpy as np
from PIL import Image
import logging

def find_grid_rows(pil_image, num_rows=20):
    """
    Detects the exact horizontal coordinates of rows in a scoresheet.
    """
    # Convert PIL to OpenCV format
    img_np = np.array(pil_image.convert('RGB'))
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    
    # Pre-processing to highlight lines
    # Binary inverse threshold
    binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                 cv2.THRESH_BINARY_INV, 11, 2)
    
    # Use morphology to isolate horizontal lines
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (w // 20 if (w := gray.shape[1]) > 0 else 40, 1))
    detected_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    
    # Calculate horizontal projection profile
    projection = np.sum(detected_lines, axis=1)
    
    # Find indices where the line intensity is high
    # We look for peaks separated by at least row_height/2
    height = gray.shape[0]
    expected_row_h = height / num_rows
    
    # Simple peak detection
    line_indices = []
    threshold = np.max(projection) * 0.3
    
    for i in range(len(projection)):
        if projection[i] > threshold:
            # If this is a new line (not too close to previous)
            if not line_indices or (i - line_indices[-1] > expected_row_h * 0.7):
                line_indices.append(i)
                
    logging.info(f"Detected {len(line_indices)} horizontal grid lines.")
    return line_indices

def find_grid_columns(pil_image):
    """
    Detects vertical grid lines to find move columns.
    """
    img_np = np.array(pil_image.convert('RGB'))
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                 cv2.THRESH_BINARY_INV, 11, 2)
    
    # Vertical morphology
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, gray.shape[0] // 20))
    detected_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, vertical_kernel, iterations=2)
    
    projection = np.sum(detected_lines, axis=0)
    
    col_indices = []
    threshold = np.max(projection) * 0.3
    expected_col_w = gray.shape[1] / 10 # heuristic
    
    for i in range(len(projection)):
        if projection[i] > threshold:
            if not col_indices or (i - col_indices[-1] > expected_col_w * 0.5):
                col_indices.append(i)
                
    return col_indices
