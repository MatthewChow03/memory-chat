from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import json
from datetime import datetime
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from constants import PROMPT
from uuid import uuid4
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
from LLM import generate_insights

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["memory_chat"]
messages_collection = db["messages"]
folders_collection = db["folders"]
users_collection = db["users"]

# Sentence transformer for semantic search
try:
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("Semantic search model loaded successfully")
except Exception as e:
    print(f"Error loading semantic search model: {e}")
    model = None

# Anthropic Claude setup
anthropic_client = Anthropic()


@app.route("/api/messages", methods=["GET"])
def get_messages():
    """Get all messages for a user"""
    try:
        userID = request.args.get("userUUID")
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        messages = list(messages_collection.find({"userID": userID}))
        for message in messages:
            message["_id"] = str(message["_id"])
        return jsonify(messages)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/messages", methods=["POST"])
def create_message():
    """Create a new message for a user with automatic insight generation"""
    try:
        data = request.json
        userID = data.get("userUUID")
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        get_or_create_user(userID)
        message_text = data.get("text", "").strip()
        if not message_text:
            return jsonify({"error": "Message text is required"}), 400
        insights = generate_insights(message_text)
        message = {
            "userID": userID,
            "text": message_text,
            "insights": insights,
            "timestamp": data.get("timestamp", datetime.now().isoformat()),
        }
        result = messages_collection.insert_one(message)
        message_id = str(result.inserted_id)
        message["_id"] = message_id
        return (
            jsonify({"message": "Message created successfully", "id": message_id}),
            201,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/messages/delete", methods=["POST"])
def delete_message():
    """Delete a message by MongoDB _id for a user"""
    try:
        data = request.json
        userID = data.get("userUUID")
        message_id = data.get("id")
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        if not message_id:
            return jsonify({"error": "id is required"}), 400
        # Remove from messages collection (only if it belongs to the user)
        result = messages_collection.delete_one({"_id": ObjectId(message_id), "userID": userID})
        # Remove from all folders for this user
        user = get_or_create_user(userID)
        folders = user.get("folders", [])
        for folder in folders:
            if message_id in folder.get("messages", []):
                folder["messages"].remove(message_id)
        update_user_folders(userID, folders)
        if result.deleted_count > 0:
            return jsonify({"message": "Message deleted successfully"}), 200
        else:
            return jsonify({"error": "Message not found"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/folders", methods=["GET"])
def get_folders():
    """Get all folders for a user with message counts"""
    try:
        userID = request.args.get("userUUID")
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        folders = get_user_folders(userID)
        # Add message counts
        for folder in folders:
            folder["messageCount"] = len(folder.get("messages", []))
        return jsonify(folders)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/folders", methods=["POST"])
def create_folder():
    """Create a new folder for a user"""
    try:
        data = request.json
        userID = data.get("userUUID")
        folder_name = data.get("name", "").strip()
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        if not folder_name:
            return jsonify({"error": "Folder name is required"}), 400
        user = get_or_create_user(userID)
        folders = user.get("folders", [])
        # Check if folder already exists
        if any(f["name"] == folder_name for f in folders):
            return jsonify({"error": "Folder already exists"}), 409
        folder = {
            "folderID": str(uuid4()),
            "name": folder_name,
            "messages": [],
            "created_at": datetime.now().isoformat(),
        }
        folders.append(folder)
        update_user_folders(userID, folders)
        return jsonify({"message": "Folder created successfully", "folderID": folder["folderID"]}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/folders/delete", methods=["POST"])
def delete_folder():
    """Delete a folder by folderID for a user"""
    try:
        data = request.json
        userID = data.get("userUUID")
        folder_id = data.get("id")
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        if not folder_id:
            return jsonify({"error": "Folder ID is required"}), 400
        user = get_or_create_user(userID)
        folders = user.get("folders", [])
        new_folders = [f for f in folders if f["folderID"] != folder_id]
        if len(new_folders) == len(folders):
            return jsonify({"error": "Folder not found"}), 500
        update_user_folders(userID, new_folders)
        return jsonify({"message": "Folder deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/folders/<folder_id>/contents", methods=["GET"])
def get_folder_contents(folder_id):
    """Get messages in a folder by folderID for a user"""
    try:
        userID = request.args.get("userUUID")
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        user = get_or_create_user(userID)
        folders = user.get("folders", [])
        folder = next((f for f in folders if f["folderID"] == folder_id), None)
        if not folder:
            return jsonify({"error": "Folder not found"}), 500
        message_ids = folder.get("messages", [])
        messages = []
        for message_id in message_ids:
            try:
                message = messages_collection.find_one({"_id": ObjectId(message_id), "userID": userID})
                if message:
                    message["_id"] = str(message["_id"])
                    messages.append(message)
            except Exception as e:
                print(f"Error finding message with id {message_id}: {e}")
                continue
        return jsonify(messages)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/folders/<folder_id>/add-message", methods=["POST"])
def add_message_to_folder(folder_id):
    """Add a message to a folder by folderID for a user - either create new message or add existing message"""
    try:
        data = request.json
        userID = data.get("userUUID")
        message_text = data.get("text", "").strip()
        message_id = data.get("messageId")
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        if not message_text and not message_id:
            return (
                jsonify({"error": "Either message text or messageId is required"}),
                400,
            )
        user = get_or_create_user(userID)
        print(user)
        folders = user.get("folders", [])
        print(folders)
        print(folder_id)
        folder = next((f for f in folders if f["folderID"] == folder_id), None)
        print(folder)
        if not folder:
            return jsonify({"error": "Folder not found"}), 500
        if message_text:
            # Create new message with automatic insight generation
            insights = generate_insights(message_text)
            message = {
                "userID": userID,
                "text": message_text,
                "insights": insights,
                "timestamp": data.get("timestamp", datetime.now().isoformat()),
            }
            result = messages_collection.insert_one(message)
            message_id = str(result.inserted_id)
        # Add to folder
        if message_id not in folder["messages"]:
            folder["messages"].append(message_id)
        update_user_folders(userID, folders)
        return (
            jsonify({"message": "Message added to folder successfully", "id": message_id}),
            200,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/folders/remove-message", methods=["POST"])
def remove_message_from_folder():
    """Remove a message from a folder by folderID for a user"""
    try:
        data = request.json
        userID = data.get("userUUID")
        folder_id = data.get("folderId")
        message_id = data.get("messageId")
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        if not folder_id:
            return jsonify({"error": "Folder ID is required"}), 400
        if not message_id:
            return jsonify({"error": "Message ID is required"}), 400
        user = get_or_create_user(userID)
        folders = user.get("folders", [])
        folder = next((f for f in folders if f["folderID"] == folder_id), None)
        if not folder:
            return jsonify({"error": "Folder not found"}), 500
        if message_id in folder["messages"]:
            folder["messages"].remove(message_id)
        update_user_folders(userID, folders)
        return jsonify({"message": "Message removed from folder successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/search", methods=["POST"])
def search_messages():
    """Search messages using semantic search for a user"""
    try:
        data = request.json
        userID = data.get("userUUID")
        query = data.get("query", "").strip()
        if not userID:
            return jsonify([])
        if not query:
            return jsonify([])
        # Get all messages for this user
        messages = list(messages_collection.find({"userID": userID}))
        for message in messages:
            message["_id"] = str(message["_id"])
        if not messages:
            return jsonify([])
        if model:
            # Semantic search
            query_embedding = model.encode([query])
            message_texts = []
            for msg in messages:
                text = msg.get("text", "")
                insights = msg.get("insights", [])
                if insights:
                    text += (
                        " " + " ".join(insights)
                        if isinstance(insights, list)
                        else " " + insights
                    )
                message_texts.append(text)
            message_embeddings = model.encode(message_texts)
            similarities = cosine_similarity(query_embedding, message_embeddings)[0]
            for i, msg in enumerate(messages):
                msg["similarity"] = float(similarities[i])
            messages.sort(key=lambda x: x["similarity"], reverse=True)
            threshold = 0.05  # 5% similarity threshold
            filtered_messages = [
                msg for msg in messages if msg["similarity"] >= threshold
            ]
            return jsonify(filtered_messages)
        else:
            # Fallback to text search
            query_lower = query.lower()
            results = []
            for msg in messages:
                text = msg.get("text", "").lower()
                insights = msg.get("insights", [])
                if insights:
                    if isinstance(insights, list):
                        text += " " + " ".join(insights).lower()
                    else:
                        text += " " + insights.lower()
                if query_lower in text:
                    results.append(msg)
            return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/clear-all", methods=["POST"])
def clear_all_user_data():
    """Delete all messages and folders for a user"""
    try:
        data = request.json
        userID = data.get("userUUID")
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        # Delete all messages for this user
        msg_result = messages_collection.delete_many({"userID": userID})
        # Clear all folders for this user
        user = get_or_create_user(userID)
        folders = user.get("folders", [])
        folder_count = len(folders)
        update_user_folders(userID, [])
        return jsonify({
            "message": "All messages and folders deleted successfully",
            "deletedMessages": msg_result.deleted_count,
            "deletedFolders": folder_count
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Backend is running"})


# --- User Management Utilities ---
def get_or_create_user(userID):
    user = users_collection.find_one({"userID": userID})
    if not user:
        user = {"userID": userID, "folders": []}
        users_collection.insert_one(user)
        user = users_collection.find_one({"userID": userID})
    return user

def get_user_folders(userID):
    user = get_or_create_user(userID)
    return user.get("folders", [])

def update_user_folders(userID, folders):
    users_collection.update_one({"userID": userID}, {"$set": {"folders": folders}})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=True)
