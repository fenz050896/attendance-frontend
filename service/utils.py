import os
import json
import tenseal as ts
import cv2
import numpy as np

UPLOAD_FOLDER = 'images'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 1 * 1024 * 1024  # 1MB
TEMP_FILE_PATH = os.path.join(os.path.dirname(__file__), 'temp')
BASE_API_URL = 'http://localhost:5000/api/v1'
CONTEXT_KEY_FILE_NAME = 'context_key.bin'

ARGON2ID_KWARGS = {
    'length': 32,
    'iterations': 1,
    'lanes': 4,
    'memory_cost': 64 * 1024,
}

ARGON_SALT_LEN = 16

AESGCM_NONCE_LEN = 12

TENSEAL_KWARGS = {
    'scheme': ts.SCHEME_TYPE.CKKS,
    'poly_modulus_degree': 8192,
    'coeff_mod_bit_sizes': [60, 40, 40, 60],
}

TENSEAL_GLOBAL_SCALE = 2**40

def allowed_file(filename: str) -> bool:
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_to_file(value):
    os.makedirs(os.path.dirname(TEMP_FILE_PATH), exist_ok=True)
    with open(TEMP_FILE_PATH, 'w') as f:
        json.dump(value, f)

def load_from_file():
    if os.path.exists(TEMP_FILE_PATH):
        with open(TEMP_FILE_PATH, 'r') as f:
            return json.load(f)
    return None

def delete_file():
    if os.path.exists(TEMP_FILE_PATH):
        os.remove(TEMP_FILE_PATH)

def preprocess_image(file_bytes, filename, extension):
    # Baca gambar
    real_img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    
    # Convert ke RGB
    rgb_img = cv2.cvtColor(real_img, cv2.COLOR_BGR2RGB)

    # Denoise
    rgb_img = cv2.fastNlMeansDenoisingColored(rgb_img, None, 10, 10, 7, 21)

    # Sharpen
    kernel = np.array([[0, -1, 0],
                    [-1, 5,-1],
                    [0, -1, 0]])
    rgb_img = cv2.filter2D(rgb_img, -1, kernel)

    # Resize (maksimal sisi 640px)
    h, w = rgb_img.shape[:2]
    scale = 640 / max(h, w)
    if scale < 1.0:
        rgb_img = cv2.resize(rgb_img, (int(w * scale), int(h * scale)))

    # # save real image to images folder
    # cv2.imwrite(os.path.join(app.config['UPLOAD_FOLDER'], f"{filename}_real{extension}"), real_img)

    # # save img to images folder
    # cv2.imwrite(os.path.join(app.config['UPLOAD_FOLDER'], f"{filename}{extension}"), rgb_img)

    return {
        'rgb_img': rgb_img,
        'real_img': real_img,
    }

def normalize_vector(vector: list):
    vector_norm = np.linalg.norm(vector)
    if vector_norm == 0:
        raise ValueError("Can't normalize zero vector")
    return (np.array(vector) / vector_norm).tolist()
