import os
import json
import tenseal as ts

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
