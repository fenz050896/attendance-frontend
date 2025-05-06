import os
import sys
import signal
import json
from http.server import SimpleHTTPRequestHandler, HTTPServer
from time import sleep

class SPAHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="build", **kwargs)
    
    def do_GET(self):
        # Handle API requests
        if self.path.startswith('/api/v1/'):
            return self.handle_api_request()
            
        # Fallback to SPA handling
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            self.path = "/index.html"
        return super().do_GET()
    
    def handle_api_request(self):
        # Contoh implementasi API endpoint
        if self.path == '/api/v1/data':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = json.dumps({
                'status': 'success',
                'data': {'message': 'Hello from API!'}
            })
            self.wfile.write(response.encode())
        else:
            self.send_response(404)
            self.end_headers()

class GracefulServer(HTTPServer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.stop = False
    
    def serve_forever(self):
        while not self.stop:
            self.handle_request()

def run_server(port=8000):
    server = GracefulServer(('', port), SPAHandler)
    
    # Handle graceful shutdown
    def signal_handler(sig, frame):
        print("\nMenerima sinyal shutdown, menutup server...")
        server.stop = True
        server.server_close()
        sleep(1)  # Beri waktu untuk menyelesaikan request yang sedang diproses
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print(f"Server berjalan di port {port} (http://localhost:{port})")
    print("Tekan Ctrl+C untuk berhenti")
    server.serve_forever()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)