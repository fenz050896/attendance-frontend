import os
import sys
import math
import traceback
import base64
import mnemonic
from flask import (
    Blueprint,
    jsonify,
    request,
    current_app as app,
    Response,
)
import cv2
import numpy as np
from cryptography.hazmat.primitives.kdf.argon2 import Argon2id
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.backends import default_backend
import tenseal as ts
import requests

from utils import (
    BASE_API_URL,
    ARGON2ID_KWARGS,
    TENSEAL_KWARGS,
    TEMP_FILE_PATH,
    CONTEXT_KEY_FILE_NAME,
    ARGON_SALT_LEN,
    AESGCM_NONCE_LEN,
)

user_profile_controller = Blueprint('user_profile_controller', __name__, url_prefix='/user-profile')
@user_profile_controller.before_request
def before_request():
    if 'Authorization' not in request.headers:
        return jsonify({'error': True, 'message': 'Authorization header is missing'}), 401

@user_profile_controller.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Hello World'})

@user_profile_controller.route('/<string:user_id>', methods=['GET'])
def show(user_id):
    pass

@user_profile_controller.route('/', methods=['POST'])
def store():
    pass

@user_profile_controller.route('/', methods=['DELETE'])
def delete():
    pass

@user_profile_controller.route('/', methods=['PUT'])
def update():
    try:
        data = request.get_json()
        if 'fullName' in data:
            data['full_name'] = data['fullName']
            del data['fullName']
        if 'phoneNumber' in data:
            data['phone_number'] = data['phoneNumber']
            del data['phoneNumber']

        response = requests.put(
            f'{BASE_API_URL}/user/profile/update/{data['user_id']}',
            json=data,
            headers=request.headers
        )

        excluded_headers = ['content-encoding', 'transfer-encoding', 'content-length', 'connection']
        headers_to_send = [(name, value) for (name, value) in response.raw.headers.items()
                        if name.lower() not in excluded_headers]
        return Response(response.content, response.status_code, headers_to_send)
    except Exception as e:
        return jsonify({'error': True, 'message': str(e)}), 500

@user_profile_controller.route('/generate-context-key', methods=['POST'])
def generate_context_key():
    try:
        context = ts.context(**TENSEAL_KWARGS)
        context.global_scale = 2**40
        context.generate_galois_keys()
        context.generate_relin_keys()

        serialized_context = context.serialize(save_public_key=True, save_secret_key=True, save_galois_keys=True, save_relin_keys=True)

        mnemo = mnemonic.Mnemonic('english')
        mnemonic_phrase = mnemo.generate(strength=256)
        mnemonic_phrase_seed = mnemo.to_seed(mnemonic_phrase)

        argon_salt = os.urandom(ARGON_SALT_LEN)

        kdf = Argon2id(
            **ARGON2ID_KWARGS,
            salt=argon_salt,
            ad=None,
            secret=None,
        )

        key = kdf.derive(mnemonic_phrase_seed)

        aesgcm_nonce = os.urandom(AESGCM_NONCE_LEN)

        aesgcm = AESGCM(key)
        encrypted_context = aesgcm.encrypt(aesgcm_nonce, serialized_context, None)

        encrypted_context = argon_salt + aesgcm_nonce + encrypted_context
        response = requests.post(
            url=f'{BASE_API_URL}/user/profile/save-context-key',
            headers=request.headers,
            json={
                'context': base64.b64encode(encrypted_context).decode(),
            }
        )

        resp_data = response.json()
        resp_data['data'] = mnemonic_phrase
        return jsonify(resp_data), response.status_code
    except Exception as e:
        return jsonify({'error': True, 'message': str(e)}), 500

@user_profile_controller.route('check-saved-context-key', methods=['GET'])
def check_saved_context_key():
    try:
        response = requests.get(
            f'{BASE_API_URL}/user/profile/check-saved-context-key',
            headers=request.headers
        )

        excluded_headers = ['content-encoding', 'transfer-encoding', 'content-length', 'connection']
        headers_to_send = [(name, value) for (name, value) in response.raw.headers.items()
                        if name.lower() not in excluded_headers]
        return Response(response.content, response.status_code, headers_to_send)
    except Exception as e:
        return jsonify({'error': True, 'message': str(e)}), 500
    
@user_profile_controller.route('open-saved-context-key', methods=['POST'])
def open_saved_context_key():
    try:
        response = requests.get(
            f'{BASE_API_URL}/user/profile/get-saved-context-key',
            headers=request.headers
        )

        resp_data = response.json()['data']
        
        if resp_data['error']:
            return jsonify(resp_data), response.status_code

        input = request.get_json()
        mnemonic_phrase = input['mnemonic_phrase']
        mnemo = mnemonic.Mnemonic('english')
        mnemonic_phrase_seed = mnemo.to_seed(mnemonic_phrase)
        context = base64.b64decode(resp_data['context'])
        argon_salt = context[:ARGON_SALT_LEN]
        nonce_offset = ARGON_SALT_LEN + AESGCM_NONCE_LEN
        aesgcm_nonce = context[ARGON_SALT_LEN:nonce_offset]
        encrypted_context = context[nonce_offset:]
        kdf = Argon2id(
            salt=argon_salt,
            length=32,
            iterations=1,
            lanes=4,
            memory_cost=64 * 1024,
            ad=None,
            secret=None,
        )
        key = kdf.derive(mnemonic_phrase_seed)
        aesgcm = AESGCM(key)
        decrypted_context = aesgcm.decrypt(aesgcm_nonce, encrypted_context, None)
        os.makedirs(os.path.dirname(TEMP_FILE_PATH), exist_ok=True)
        with open(f'{TEMP_FILE_PATH}/{CONTEXT_KEY_FILE_NAME}', 'wb') as f:
            f.write(decrypted_context)

        return jsonify({
            'error': False,
            'message' : 'Successfully opened context',
            'data': None,
        })
        
    except Exception as e:
        return jsonify({'error': True, 'message': str(e)}), 500
    
@user_profile_controller.route('check-opened-saved-context-key', methods=['GET'])
def check_opened_saved_context_key():
    try:
        exists = os.path.isfile(f'{TEMP_FILE_PATH}/{CONTEXT_KEY_FILE_NAME}')
        return jsonify({
            'error': False,
            'message' : '',
            'data': {
                'exists': exists
            },
        })

    except Exception as e:
        return jsonify({'error': True, 'message': str(e)}), 500

def convert_size(size_bytes):
    if size_bytes == 0:
        return "0B"
    size_name = ("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB")
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return "%s %s" % (s, size_name[i])
