import os
from flask import Flask, send_from_directory, request, Response
from flask_cors import CORS

from controller import base_controller

from utils import UPLOAD_FOLDER, MAX_CONTENT_LENGTH

app = Flask(__name__, static_folder='build')
CORS(
    app,
    origins=[
        'http://localhost:5001',
        'http://localhost:5173'
    ],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allow_headers=['Content-Type', 'Authorization']
)

app.register_blueprint(base_controller)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

@app.before_request
def before_request():
    if request.method == 'OPTIONS':
        return Response()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    full_path = os.path.join(app.static_folder, path)

    if os.path.isfile(full_path):
        return send_from_directory(app.static_folder, path)

    if os.path.isdir(full_path) and os.path.isfile(os.path.join(full_path, 'index.html')):
        return send_from_directory(full_path, 'index.html')

    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
