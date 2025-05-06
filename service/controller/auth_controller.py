import os
import requests
from flask import Blueprint, jsonify, request, Response

from utils import (
    BASE_API_URL,
    TEMP_FILE_PATH,
    CONTEXT_KEY_FILE_NAME,
)

auth_controller = Blueprint('auth_controller', __name__, url_prefix='/auth')

@auth_controller.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        response = requests.post(
            f'{BASE_API_URL}/auth/register',
            json=data,
            headers=request.headers
        )

        excluded_headers = ['content-encoding', 'transfer-encoding', 'content-length', 'connection']
        headers_to_send = [(name, value) for (name, value) in response.raw.headers.items()
                        if name.lower() not in excluded_headers]
        return Response(response.content, response.status_code, headers_to_send)
    except Exception as e:
        return jsonify({'error': True, 'message': str(e)}), 500

@auth_controller.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        response = requests.post(
            f'{BASE_API_URL}/auth/login',
            json=data,
            headers=request.headers
        )

        excluded_headers = ['content-encoding', 'transfer-encoding', 'content-length', 'connection']
        headers_to_send = [(name, value) for (name, value) in response.raw.headers.items()
                        if name.lower() not in excluded_headers]
        return Response(response.content, response.status_code, headers_to_send)
    except Exception as e:
        return jsonify({'error': True, 'message': str(e)}), 500

@auth_controller.route('/logout', methods=['POST'])
def logout():
    try:
        response = requests.post(
            f'{BASE_API_URL}/auth/logout',
            headers=request.headers
        )

        excluded_headers = ['content-encoding', 'transfer-encoding', 'content-length', 'connection']
        headers_to_send = [(name, value) for (name, value) in response.raw.headers.items()
                        if name.lower() not in excluded_headers]
        
        filepath = f"{TEMP_FILE_PATH}/{CONTEXT_KEY_FILE_NAME}"
        if os.path.exists(filepath):
            os.remove(filepath)
        return Response(response.content, response.status_code, headers_to_send)
    except Exception as e:
        return jsonify({'error': True, 'message': str(e)}), 500
