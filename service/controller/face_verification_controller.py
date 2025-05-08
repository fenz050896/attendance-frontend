import os
import base64
import traceback
import requests
from flask import (
    Blueprint,
    jsonify,
    request,
    current_app as app
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
)

face_verification_controller = Blueprint('face_verification_controller', __name__, url_prefix='/face-verification')

@face_verification_controller.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Hello World'})

@face_verification_controller.route('/register-faces', methods=['POST'])
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

        results = []
        
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
                    'filename': file.filename,
                    'error': 'No face detected',
                    'detection_score': 0.0
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
            
            real_img = preprocess_result['real_img'].tobytes()
            rgb_img = preprocess_result['rgb_img'].tobytes()

            embedding = main_face.embedding.tolist()
            encrypted_embedding = ts.ckks_vector(context, embedding).serialize()

            # Ekstraksi fitur-fitur
            response_data = {
                'rgb_img': base64.b64encode(real_img).decode(),
                'real_img': base64.b64encode(rgb_img).decode(),
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
            results.append(response_data)

        headers = dict(request.headers)
        headers['Content-Type'] = 'application/json'
        response = requests.post(
            f'{BASE_API_URL}/user/face-verification/register-faces',
            headers=headers,
            json=results
        )
        resp_json = response.json()
        return jsonify(resp_json), response.status_code
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': True, 'message': str(e)}), 500

@face_verification_controller.route('/<string:user_id>', methods=['GET'])
def show(user_id):
    pass

@face_verification_controller.route('/', methods=['POST'])
def store():
    pass

@face_verification_controller.route('/', methods=['DELETE'])
def delete():
    pass
    
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