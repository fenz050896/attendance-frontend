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
)

face_registration_controller = Blueprint('face_registration_controller', __name__, url_prefix='/face-registration')

@face_registration_controller.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Hello World'})

@face_registration_controller.route('/register-faces', methods=['POST'])
def register_faces():
    try:
        files = request.files.getlist('images')
        context_exists = os.path.isfile(f'{TEMP_FILE_PATH}/{CONTEXT_KEY_FILE_NAME}')

        if not context_exists:
            return jsonify({
                'error': True,
                'message': 'TenSEAL context not found',
                'data': None,
            }), 404
        
        with open(f'{TEMP_FILE_PATH}/{CONTEXT_KEY_FILE_NAME}', 'rb') as f:
            context = ts.context_from(f.read())

        payload = []
        
        for file in files:
            if not allowed_file(file.filename):
                return jsonify({'error': 'Invalid file format'}), 400
            
            file_content = file.read()
            file_content_size = len(file_content)
            # Cek ukuran file
            if file_content_size > app.config['MAX_CONTENT_LENGTH'] or file.content_length > app.config['MAX_CONTENT_LENGTH']:
                return jsonify({'error': 'File too large'}), 400

            # dapatkan base filename
            (filename, extension) = os.path.splitext(file.filename)
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
            detection_score = float(main_face.det_score)

            if main_face.det_score < 0.3:
                return jsonify({
                    'error': True,
                    'message': 'Low detection score',
                    'data': {
                        'detection_score': detection_score,
                        'filename': file.filename
                    },
                }), 400
            
            if extension.lower() == '.jpeg':
                extension = '.jpg'
            
            _, real_encoded = cv2.imencode(extension.lower(), preprocess_result['real_img'])
            __, rgb_encoded = cv2.imencode(extension.lower(), preprocess_result['rgb_img'])
            
            real_img = real_encoded.tobytes()
            rgb_img = rgb_encoded.tobytes()

            # Normalize to unit vector (optimize cosine sim to dot product)
            face_embedding = main_face.embedding.tolist()
            face_embedding_normalized = normalize_vector(face_embedding)

            encrypted_embedding = ts.ckks_vector(context, face_embedding_normalized).serialize()

            # Ekstraksi fitur-fitur
            response_data = {
                'real_img': base64.b64encode(real_img).decode(),
                'rgb_img': base64.b64encode(rgb_img).decode(),
                'filename': file.filename,
                'size': file_content_size,
                'mime_type': file.mimetype,
                'encrypted_embedding': base64.b64encode(encrypted_embedding).decode(),
                'detection_score': detection_score,
                # 'gender': 'Male' if main_face.gender == 1 else 'Female',
                # 'age': int(main_face.age),
                # 'bbox': {
                #     'x1': float(main_face.bbox[0]),
                #     'y1': float(main_face.bbox[1]),
                #     'x2': float(main_face.bbox[2]),
                #     'y2': float(main_face.bbox[3])
                # }
            }
            payload.append(response_data)

        headers = dict(request.headers)
        headers['Content-Type'] = 'application/json'
        response = requests.post(
            f'{BASE_API_URL}/user/face-registration/register-faces',
            headers=headers,
            json=payload
        )
        resp_json = response.json()
        return jsonify(resp_json), response.status_code
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': True, 'message': str(e)}), 500
    
@face_registration_controller.route('/get-registered-faces', methods=['GET'])
def get_registered_faces():
    try:
        response = requests.get(
            f'{BASE_API_URL}/user/face-registration/get-registered-faces',
            headers=request.headers
        )

        excluded_headers = ['content-encoding', 'transfer-encoding', 'content-length', 'connection']
        headers_to_send = [(name, value) for (name, value) in response.raw.headers.items()
                        if name.lower() not in excluded_headers]
        return Response(response.content, response.status_code, headers_to_send)
    except Exception as e:
        return jsonify({'error': True, 'message': str(e)}), 500
    
@face_registration_controller.route('/get-registered-face-content/<string:registered_face_id>', methods=['GET'])
def get_registered_face_content(registered_face_id):
    forwarded_headers = {}
    if 'Authorization' in request.headers:
        forwarded_headers['Authorization'] = request.headers['Authorization']

    response = requests.get(
        f'{BASE_API_URL}/user/face-registration/registered-face/{registered_face_id}',
        headers=forwarded_headers,
        stream=True
    )

    if response.status_code != 200:
        return jsonify({'error': True, 'message': 'Picture not found'}), 404
    
    return Response(
        stream_with_context(response.iter_content(chunk_size=4096)),
        content_type=response.headers.get('Content-Type', 'application/octet-stream'),
        status=response.status_code
    )

@face_registration_controller.route('/<string:user_id>', methods=['GET'])
def show(user_id):
    pass

@face_registration_controller.route('/', methods=['POST'])
def store():
    pass

@face_registration_controller.route('/', methods=['DELETE'])
def delete():
    pass
