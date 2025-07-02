from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import json
from datetime import datetime
from openai import OpenAI
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
db = client['memory_chat']
messages_collection = db['messages']
folders_collection = db['folders']

# OpenAI setup
client = OpenAI()

# Sentence transformer for semantic search
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("Semantic search model loaded successfully")
except Exception as e:
    print(f"Error loading semantic search model: {e}")
    model = None

@app.route('/api/messages', methods=['GET'])
def get_messages():
    """Get all messages"""
    try:
        messages = list(messages_collection.find({}, {'_id': 0}))
        return jsonify(messages)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages', methods=['POST'])
def create_message():
    """Create a new message with automatic insight generation"""
    try:
        data = request.json
        message_text = data.get('text', '').strip()
        
        if not message_text:
            return jsonify({'error': 'Message text is required'}), 400
        
        # Generate insights using OpenAI
        insights = generate_insights_with_openai(message_text)
        
        message = {
            'text': message_text,
            'insights': insights,
            'timestamp': data.get('timestamp', datetime.now().isoformat()),
            'insightsKey': generate_insights_key(insights)
        }
        
        # Check if message already exists
        existing = messages_collection.find_one({'insightsKey': message['insightsKey']})
        if existing:
            return jsonify({'error': 'Message already exists'}), 409
        
        messages_collection.insert_one(message)
        return jsonify({'message': 'Message created successfully', 'id': str(message.get('_id'))}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/<message_id>', methods=['DELETE'])
def delete_message(message_id):
    """Delete a message by insightsKey"""
    try:
        # Remove from messages collection
        result = messages_collection.delete_one({'insightsKey': message_id})
        
        # Remove from all folders
        folders_collection.update_many(
            {},
            {'$pull': {'messages': message_id}}
        )
        
        if result.deleted_count > 0:
            return jsonify({'message': 'Message deleted successfully'}), 200
        else:
            return jsonify({'error': 'Message not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/folders', methods=['GET'])
def get_folders():
    """Get all folders with message counts"""
    try:
        folders = list(folders_collection.find({}, {'_id': 0}))
        
        # Add message counts
        for folder in folders:
            folder['messageCount'] = len(folder.get('messages', []))
        
        return jsonify(folders)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/folders', methods=['POST'])
def create_folder():
    """Create a new folder"""
    try:
        data = request.json
        folder_name = data.get('name', '').strip()
        
        if not folder_name:
            return jsonify({'error': 'Folder name is required'}), 400
        
        # Check if folder already exists
        existing = folders_collection.find_one({'name': folder_name})
        if existing:
            return jsonify({'error': 'Folder already exists'}), 409
        
        folder = {
            'name': folder_name,
            'messages': [],
            'created_at': datetime.now().isoformat()
        }
        
        folders_collection.insert_one(folder)
        return jsonify({'message': 'Folder created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/folders/<folder_name>', methods=['DELETE'])
def delete_folder(folder_name):
    """Delete a folder"""
    try:
        result = folders_collection.delete_one({'name': folder_name})
        
        if result.deleted_count > 0:
            return jsonify({'message': 'Folder deleted successfully'}), 200
        else:
            return jsonify({'error': 'Folder not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/folders/<folder_name>', methods=['GET'])
def get_folder_contents(folder_name):
    """Get messages in a folder"""
    try:
        folder = folders_collection.find_one({'name': folder_name})
        if not folder:
            return jsonify({'error': 'Folder not found'}), 404
        
        # Get messages by insightsKey
        message_keys = folder.get('messages', [])
        messages = list(messages_collection.find(
            {'insightsKey': {'$in': message_keys}},
            {'_id': 0}
        ))
        
        return jsonify(messages)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/folders/<folder_name>', methods=['POST'])
def add_message_to_folder(folder_name):
    """Add a message to a folder with automatic insight generation"""
    try:
        data = request.json
        message_text = data.get('text', '').strip()
        
        if not message_text:
            return jsonify({'error': 'Message text is required'}), 400
        
        # Generate insights using OpenAI
        insights = generate_insights_with_openai(message_text)
        
        # First, create the message if it doesn't exist
        message = {
            'text': message_text,
            'insights': insights,
            'timestamp': data.get('timestamp', datetime.now().isoformat()),
            'insightsKey': generate_insights_key(insights)
        }
        
        # Check if message already exists
        existing_message = messages_collection.find_one({'insightsKey': message['insightsKey']})
        if not existing_message:
            messages_collection.insert_one(message)
        
        # Add to folder
        result = folders_collection.update_one(
            {'name': folder_name},
            {'$addToSet': {'messages': message['insightsKey']}}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Folder not found'}), 404
        
        return jsonify({'message': 'Message added to folder successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/folders/<folder_name>/<message_id>', methods=['DELETE'])
def remove_message_from_folder(folder_name, message_id):
    """Remove a message from a folder"""
    try:
        result = folders_collection.update_one(
            {'name': folder_name},
            {'$pull': {'messages': message_id}}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Folder not found'}), 404
        
        return jsonify({'message': 'Message removed from folder successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['POST'])
def search_messages():
    """Search messages using semantic search"""
    try:
        data = request.json
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify([])
        
        # Get all messages
        messages = list(messages_collection.find({}, {'_id': 0}))
        
        if not messages:
            return jsonify([])
        
        if model:
            # Semantic search
            query_embedding = model.encode([query])
            message_texts = []
            
            for msg in messages:
                text = msg.get('text', '')
                insights = msg.get('insights', [])
                if insights:
                    text += ' ' + ' '.join(insights) if isinstance(insights, list) else ' ' + insights
                message_texts.append(text)
            
            message_embeddings = model.encode(message_texts)
            similarities = cosine_similarity(query_embedding, message_embeddings)[0]
            
            # Add similarity scores to messages
            for i, msg in enumerate(messages):
                msg['similarity'] = float(similarities[i])
            
            # Sort by similarity and filter by threshold
            messages.sort(key=lambda x: x['similarity'], reverse=True)
            threshold = 0.05  # 5% similarity threshold
            filtered_messages = [msg for msg in messages if msg['similarity'] >= threshold]
            
            return jsonify(filtered_messages)
        else:
            # Fallback to text search
            query_lower = query.lower()
            results = []
            
            for msg in messages:
                text = msg.get('text', '').lower()
                insights = msg.get('insights', [])
                if insights:
                    if isinstance(insights, list):
                        text += ' ' + ' '.join(insights).lower()
                    else:
                        text += ' ' + insights.lower()
                
                if query_lower in text:
                    results.append(msg)
            
            return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_insights_key(insights):
    """Generate a unique key for insights"""
    if isinstance(insights, list):
        insights_text = '|'.join(insights)
    else:
        insights_text = str(insights)
    
    # Simple hash function
    hash_val = 0
    for char in insights_text:
        hash_val = ((hash_val << 5) - hash_val) + ord(char)
        hash_val = hash_val & hash_val  # Convert to 32-bit integer
    
    return f"{insights_text}_{abs(hash_val)}"

def generate_insights_with_openai(message_text):
    """Generate insights from message text using OpenAI"""
    try:
        if not os.getenv('OPENAI_API_KEY'):
            raise Exception("OpenAI API key not configured")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """You are a *Memory Synthesizer*.

INPUT  
One assistant message that the user explicitly chose to save.

GOAL  
Return a JSON object containing *1 – 5* concise insights that are worth storing as long-term memory.  
Never return an empty list—the user has signalled this message matters, so capture at least one takeaway.

WHAT COUNTS AS A "MEMORY"  
1. *Durable:* Still relevant weeks from now (principle, fact, plan, differentiator).  
2. *Self-contained:* Understandable without the full conversation.  
3. *High-signal:* Concrete idea, strategy, or decision-critical fact—not filler.  
4. *Non-redundant:* Each line adds new information.  
5. *Concise:* ≤ 18 words (≈120 chars) and written as a standalone sentence.  
6. *Language-preserving:* Output in the same language as the input.

EDGE CASES  
* If the message is light on substance, distill the single most useful idea—do *not* leave the list empty.  
* For very dense texts, include only the 1–5 most distinct insights.

OUTPUT FORMAT (strict)  
json
{
  "memories": [
    "First distilled insight.",
    "Second distinct insight if any."
  ]
}"""
                },
                {
                    "role": "user",
                    "content": message_text
                }
            ],
            max_tokens=500,
            temperature=0.3
        )
        
        content = response.choices[0].message.content
        if not content:
            raise Exception("No response content received")
        
        # Parse the JSON response
        try:
            parsed_response = json.loads(content)
            
            # Handle the response format with "memories" key
            if parsed_response and parsed_response.get('memories') and isinstance(parsed_response['memories'], list):
                insights = parsed_response['memories']
            elif isinstance(parsed_response, list):
                # Fallback for old format where response was directly an array
                insights = parsed_response
            else:
                raise Exception("Invalid response format - expected memories array")
        except json.JSONDecodeError:
            # If JSON parsing fails, try to extract insights from plain text
            insights = parse_insights_from_text(content)
        
        # Validate insights
        if not isinstance(insights, list):
            raise Exception("Invalid insights format")
        
        # Ensure we have 3 or fewer insights
        insights = insights[:3]
        
        # Filter out empty or invalid insights
        insights = [insight for insight in insights if insight and isinstance(insight, str) and insight.strip()]
        
        if not insights:
            raise Exception("No valid insights extracted")
        
        return insights
        
    except Exception as e:
        print(f"Error generating insights: {e}")
        # Return a default insight if OpenAI fails
        return [f"Important message: {message_text[:100]}..."]

def parse_insights_from_text(text):
    """Parse insights from plain text if JSON parsing fails"""
    lines = text.split('\n')
    insights = []
    
    for line in lines:
        line = line.strip()
        # Look for bullet points, numbered items, or lines that start with common insight indicators
        if (line.startswith('-') or line.startswith('•') or line.startswith('*') or
            line[0].isdigit() and '. ' in line or
            line.lower().startswith('insight') or line.lower().startswith('key') or line.lower().startswith('point')):
            
            # Clean up the line
            insight = line
            if insight.startswith(('-', '•', '*')):
                insight = insight[1:].strip()
            elif insight[0].isdigit() and '. ' in insight:
                insight = insight.split('. ', 1)[1]
            elif insight.lower().startswith('insight'):
                insight = insight[8:].strip()
            elif insight.lower().startswith('key'):
                insight = insight[3:].strip()
            elif insight.lower().startswith('point'):
                insight = insight[5:].strip()
            
            if insight and len(insight) > 0:
                insights.append(insight)
    
    # If no structured insights found, take the first few meaningful lines
    if not insights:
        meaningful_lines = [line.strip() for line in lines if len(line.strip()) > 10 and len(line.strip()) < 200]
        insights = meaningful_lines[:3]
    
    return insights

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Backend is running'})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=True) 