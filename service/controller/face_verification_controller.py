import os
import base64
import traceback
import requests
from flask import (
    Blueprint,
    jsonify,
    request,
    current_app as app,
    Response,
    stream_with_context,
)
import cv2
import numpy as np
import tenseal as ts

from face_analysis import model

from utils import (
    allowed_file,
    BASE_API_URL,
    TEMP_FILE_PATH,
    CONTEXT_KEY_FILE_NAME,
    preprocess_image,
    normalize_vector,
    TENSEAL_KWARGS,
    TENSEAL_GLOBAL_SCALE,
)

face_verification_controller = Blueprint('face_verification_controller', __name__, url_prefix='/face-verification')

@face_verification_controller.route('/', methods=['GET'])
def index_get():
    return jsonify({'message': 'Hello World'})

@face_verification_controller.route('', methods=['POST'])
def index_post():
    try:
        captured_image = request.files['captured_image']
        context_exists = os.path.isfile(f'{TEMP_FILE_PATH}/{CONTEXT_KEY_FILE_NAME}')

        if not context_exists:
            return jsonify({
                'error': True,
                'message': 'TenSEAL context not found',
                'data': None,
            }), 404
        
        with open(f'{TEMP_FILE_PATH}/{CONTEXT_KEY_FILE_NAME}', 'rb') as f:
            context = ts.context_from(f.read())

        file_content = captured_image.read()
        (filename, extension) = os.path.splitext(captured_image.filename)
        file_bytes = np.frombuffer(file_content, np.uint8)
        preprocess_result = preprocess_image(file_bytes, filename, extension)
        faces = model.get(preprocess_result['rgb_img'])

        if not faces:
            return jsonify({
                'error': True,
                'message': 'Face not found',
                'data': None
            }), 400
        
        main_face = faces[0]
        face_embedding = main_face.embedding.tolist()
        face_embedding_normalized = normalize_vector(face_embedding)
        encrypted_embedding = ts.ckks_vector(context, face_embedding_normalized).serialize()

        context.make_context_public()
        context = context.serialize()

        payload = {
            'encrypted_embedding': base64.b64encode(encrypted_embedding).decode(),
            'ctx': base64.b64encode(context).decode()
        }

        headers = dict(request.headers)
        headers['Content-Type'] = 'application/json'
        response = requests.post(
            f'{BASE_API_URL}/user/face-verification/verify',
            headers=headers,
            json=payload
        )

        resp_json = response.json()

        if resp_json['error']:
            return jsonify(resp_json), response.status_code
        
        data = resp_json['data']
        with open(f'{TEMP_FILE_PATH}/{CONTEXT_KEY_FILE_NAME}', 'rb') as f:
            context = ts.context_from(f.read())

        results = []
        for result in data:
            encrypted_cosine_sim_res = base64.b64decode(result)
            result_vector = ts.ckks_vector_from(context, encrypted_cosine_sim_res)
            decrypted_result = result_vector.decrypt()[0]
            results.append(decrypted_result)

        return jsonify({
            'error': False,
            'message': 'Face found',
            'data': results,
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': True, 'message': str(e)}), 500
