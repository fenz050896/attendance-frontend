from flask import Blueprint, jsonify, request

attendance_controller = Blueprint('attendance_controller', __name__, url_prefix='/attendance')

@attendance_controller.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Hello World'})

@attendance_controller.route('/<string:user_id>', methods=['GET'])
def show(user_id):
    pass

@attendance_controller.route('/', methods=['POST'])
def store():
    pass

@attendance_controller.route('/', methods=['DELETE'])
def delete():
    pass
