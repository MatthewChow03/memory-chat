#!/usr/bin/env python3
"""
Simple HTTP server for ChatGPT History Map
Supports environment variable configuration for OpenAI API key
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json

class CustomHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Serve config endpoint
        if self.path == '/api/config':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            config = {
                'OPENAI_API_KEY': os.environ.get('OPENAI_API_KEY', '')
            }
            self.wfile.write(json.dumps(config).encode())
            return
        
        # Serve static files
        return super().do_GET()

def main():
    port = int(os.environ.get('PORT', 8000))
    
    # Check if API key is set
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("⚠️  Warning: OPENAI_API_KEY environment variable not set")
        print("   Semantic clustering will not work without an API key")
        print("   Set it with: export OPENAI_API_KEY='your-key-here'")
        print()
    
    print(f"🚀 Starting ChatGPT History Map server on port {port}")
    print(f"📁 Serving files from: {os.getcwd()}")
    if api_key:
        print(f"✅ OpenAI API key configured (starts with: {api_key[:8]}...)")
    else:
        print("❌ OpenAI API key not configured")
    print()
    print("🌐 Open your browser to: http://localhost:8000")
    print("📖 To enable semantic clustering, set your API key in config.js")
    print()
    
    try:
        server = HTTPServer(('localhost', port), CustomHTTPRequestHandler)
        print(f"✅ Server running at http://localhost:{port}")
        print("   Press Ctrl+C to stop")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 