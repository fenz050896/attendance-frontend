import os
import traceback
from flask import (
    Blueprint,
    jsonify,
    request,
    current_app as app
)
import cv2
import numpy as np

from face_analysis import model

from utils import (
    allowed_file
)

face_verification_controller = Blueprint('face_verification_controller', __name__, url_prefix='/face-verification')

@face_verification_controller.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Hello World'})

@face_verification_controller.route('/<string:user_id>', methods=['GET'])
def show(user_id):
    pass

@face_verification_controller.route('/', methods=['POST'])
def store():
    pass

@face_verification_controller.route('/', methods=['DELETE'])
def delete():
    pass

# Handler untuk API endpoints
@face_verification_controller.route('/register-faces', methods=['POST'])
def upload_images():
    try:
        files = request.files.getlist('images')
        
        results = []
        
        for file in files:
            if not allowed_file(file.filename):
                return jsonify({'error': 'Invalid file format'}), 400
            
            # Cek ukuran file
            if file.content_length > app.config['MAX_CONTENT_LENGTH']:
                return jsonify({'error': 'File too large'}), 400

            # dapatkan base filename
            (filename, extension) = os.path.splitext(file.filename)
            file_bytes = np.frombuffer(file.read(), np.uint8)
            img = validate_and_save_image(file_bytes, filename, extension)
            faces = model.get(img)

            if not faces:
                return jsonify({
                    'filename': file.filename,
                    'error': 'No face detected',
                    'detection_score': 0.0
                }), 400
            
            main_face = faces[0]

            if main_face.det_score < 0.3:
                return {
                    'filename': file.filename,
                    'error': 'Low detection confidence',
                    'detection_score': float(faces[0].det_score)
                }
            
            # Ekstraksi fitur-fitur
            response_data = {
                'embedding': main_face.embedding.tolist(),
                'detection_score': float(main_face.det_score),
                'gender': 'Male' if main_face.gender == 1 else 'Female',
                'age': int(main_face.age),
                'bbox': {
                    'x1': float(main_face.bbox[0]),
                    'y1': float(main_face.bbox[1]),
                    'x2': float(main_face.bbox[2]),
                    'y2': float(main_face.bbox[3])
                }
            }
            results.append(response_data)


        return jsonify({'success': True, 'message': 'Sukses', 'results': results})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500
    
def validate_and_save_image(file_bytes, filename, extension):
    # Baca gambar
    real_img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    
    # Convert ke RGB
    img = cv2.cvtColor(real_img, cv2.COLOR_BGR2RGB)

    # Denoise
    img = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)

    # Sharpen
    kernel = np.array([[0, -1, 0],
                    [-1, 5,-1],
                    [0, -1, 0]])
    img = cv2.filter2D(img, -1, kernel)

    # Resize (maksimal sisi 640px)
    h, w = img.shape[:2]
    scale = 640 / max(h, w)
    if scale < 1.0:
        img = cv2.resize(img, (int(w * scale), int(h * scale)))

    # save real image to images folder
    cv2.imwrite(os.path.join(app.config['UPLOAD_FOLDER'], f"{filename}_real{extension}"), real_img)

    # save img to images folder
    cv2.imwrite(os.path.join(app.config['UPLOAD_FOLDER'], f"{filename}{extension}"), img)

    return img