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
from constants import PROMPT, PROMPT_MULTI
from uuid import uuid4
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
from LLM import generate_insights, categorize_memory_to_folders, batch_autopopulate_memories_to_folder

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
        # Accept provided insights if present, else extract
        insights = data.get("insights")
        if insights is None:
            insights = generate_insights(message_text)
        message = {
            "userID": userID,
            "text": message_text,
            "insights": insights,
            "timestamp": datetime.now().isoformat(),
        }
        result = messages_collection.insert_one(message)
        message_id = str(result.inserted_id)
        message["_id"] = message_id
        # Auto-categorize the new message
        auto_categorize_single_memory(userID, message_id)
        return (
            jsonify({"message": "Message created successfully", "id": message_id}),
            201,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/memories/bulk", methods=["POST"])
def add_memories_bulk():
    """Add multiple pre-processed memories directly to the database"""
    try:
        data = request.json
        userID = data.get("userUUID")
        memories = data.get("memories", [])
        
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        if not memories or not isinstance(memories, list):
            return jsonify({"error": "memories array is required"}), 400
        
        get_or_create_user(userID)
        added_memories = []
        
        for memory_text in memories:
            if not memory_text or not memory_text.strip():
                continue
                
            # Since these are pre-processed memories, we'll use the text as both text and insights
            # The insights field will contain the processed memory content
            message = {
                "userID": userID,
                "text": memory_text.strip(),
                "insights": memory_text.strip(),
                "timestamp": datetime.now().isoformat(),
            }
            
            result = messages_collection.insert_one(message)
            message_id = str(result.inserted_id)
            message["_id"] = message_id
            
            # Auto-categorize the new memory
            auto_categorize_single_memory(userID, message_id)
            
            added_memories.append({
                "id": message_id,
                "text": memory_text.strip()
            })
        
        return jsonify({
            "message": f"Successfully added {len(added_memories)} memories",
            "added_count": len(added_memories),
            "memories": added_memories
        }), 201
        
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
        # Add message counts and ensure description is present
        for folder in folders:
            folder["messageCount"] = len(folder.get("messages", []))
            if "description" not in folder:
                folder["description"] = ""
        return jsonify(folders)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/folders", methods=["POST"])
def create_folder():
    """Create a new folder for a user, with optional auto-population using the LLM"""
    try:
        data = request.json
        userID = data.get("userUUID")
        folder_name = data.get("name", "").strip()
        folder_description = data.get("description", "").strip()
        auto_populate = data.get("autoPopulate", False)
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
            "description": folder_description,
            "messages": [],
            "created_at": datetime.now().isoformat(),
        }
        folders.append(folder)
        update_user_folders(userID, folders)
        # --- Auto-populate logic ---
        if auto_populate:
            # Fetch all user memories
            all_memories = list(messages_collection.find({"userID": userID}))
            # Prepare batches of 10
            batch_size = 10
            folder_id = folder["folderID"]
            memory_id_to_obj = {str(m["_id"]): m for m in all_memories}
            memory_ids = list(memory_id_to_obj.keys())
            selected_ids = set()
            for i in range(0, len(memory_ids), batch_size):
                batch_ids = memory_ids[i:i+batch_size]
                batch_memories = [
                    {"id": mid, "text": memory_id_to_obj[mid].get("text", "")}
                    for mid in batch_ids
                ]
                if not batch_memories:
                    continue
                ids_for_folder = batch_autopopulate_memories_to_folder(
                    folder_name, folder_description, batch_memories
                )
                selected_ids.update(ids_for_folder)
            # Add selected memory IDs to the folder
            if selected_ids:
                for f in folders:
                    if f["folderID"] == folder_id:
                        for mid in selected_ids:
                            if mid in memory_id_to_obj and mid not in f["messages"]:
                                f["messages"].append(mid)
                        break
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
        # Accept provided insights if present, else extract
        insights = data.get("insights")
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        if not message_text and not message_id:
            return (
                jsonify({"error": "Either message text or messageId is required"}),
                400,
            )
        user = get_or_create_user(userID)
        folders = user.get("folders", [])
        folder = next((f for f in folders if f["folderID"] == folder_id), None)
        if not folder:
            return jsonify({"error": "Folder not found"}), 500
        if message_text:
            # Create new message, use provided insights if present
            if insights is None:
                insights = generate_insights(message_text)
            message = {
                "userID": userID,
                "text": message_text,
                "insights": insights,
                "timestamp": datetime.now().isoformat(),
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

def generate_insights_with_claude(message_text):
    """Generate insights from message text using Claude 3.5 Haiku (Anthropic Messages API)"""
    try:
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise Exception("Anthropic API key not configured")

        prompt = PROMPT.format(message_text=message_text)
        response = anthropic_client.messages.create(
            model="claude-3-5-haiku-latest",
            max_tokens=800,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )
        # Extract text from content blocks
        content = ""
        for block in response.content:
            if block.type == "text":
                content += block.text
        content = content.strip()
        if not content:
            raise Exception("No response content received")

        # Parse the JSON response
        try:
            parsed_response = json.loads(content)
            # Handle the response format with "memories" key
            if (
                parsed_response
                and parsed_response.get("memories")
                and isinstance(parsed_response["memories"], list)
            ):
                insights = parsed_response["memories"]
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
        insights = [
            insight
            for insight in insights
            if insight and isinstance(insight, str) and insight.strip()
        ]

        if not insights:
            raise Exception("No valid insights extracted")

        return insights

    except Exception as e:
        print(f"Error generating insights: {e}")
        # Return a default insight if Claude fails
        return [f"Important message: {message_text[:100]}..."]


def parse_insights_from_text(text):
    """Parse insights from plain text if JSON parsing fails"""
    lines = text.split("\n")
    insights = []

    for line in lines:
        line = line.strip()
        # Look for bullet points, numbered items, or lines that start with common insight indicators
        if (
            line.startswith("-")
            or line.startswith("•")
            or line.startswith("*")
            or line[0].isdigit()
            and ". " in line
            or line.lower().startswith("insight")
            or line.lower().startswith("key")
            or line.lower().startswith("point")
        ):

            # Clean up the line
            insight = line
            if insight.startswith(("-", "•", "*")):
                insight = insight[1:].strip()
            elif insight[0].isdigit() and ". " in insight:
                insight = insight.split(". ", 1)[1]
            elif insight.lower().startswith("insight"):
                insight = insight[8:].strip()
            elif insight.lower().startswith("key"):
                insight = insight[3:].strip()
            elif insight.lower().startswith("point"):
                insight = insight[5:].strip()

            if insight and len(insight) > 0:
                insights.append(insight)

    # If no structured insights found, take the first few meaningful lines
    if not insights:
        meaningful_lines = [
            line.strip()
            for line in lines
            if len(line.strip()) > 10 and len(line.strip()) < 200
        ]
        insights = meaningful_lines[:3]

    return insights


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Backend is running"})


@app.route("/api/auto-categorize-memories", methods=["POST"])
def auto_categorize_memories():
    """Auto-categorize uncategorized memories for a user using the LLM"""
    try:
        data = request.json
        userID = data.get("userUUID")
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        user = get_or_create_user(userID)
        folders = user.get("folders", [])
        # Build a set of all message IDs already in folders
        categorized_ids = set()
        for folder in folders:
            categorized_ids.update(folder.get("messages", []))
        # Get all messages for the user
        messages = list(messages_collection.find({"userID": userID}))
        # Find uncategorized messages
        uncategorized = [m for m in messages if str(m["_id"]) not in categorized_ids]
        if not uncategorized:
            return jsonify({"message": "No uncategorized memories found."}), 200
        updated = set()
        for mem in uncategorized:
            mem_id = str(mem["_id"])
            success, msg = auto_categorize_single_memory(userID, mem_id)
            if success:
                updated.add(mem_id)
        return jsonify({
            "message": f"Categorized {len(updated)} memories.",
            "categorized": list(updated)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- User Management Utilities ---
def get_or_create_user(userID):
    user = users_collection.find_one({"userID": userID})
    if not user:
        # Default folders and descriptions
        default_folders = [
            {"name": "Personal Details", "description": "This folder is for personal details."},
            {"name": "Family", "description": "This folder is for family-related information."},
            {"name": "Professional Details", "description": "This folder is for professional details."},
            {"name": "Sports", "description": "This folder is for sports interests and activities."},
            {"name": "Travel", "description": "This folder is for travel experiences and plans."},
            {"name": "Food", "description": "This folder is for food preferences and experiences."},
            {"name": "Music", "description": "This folder is for music interests and favorites."},
            {"name": "Health", "description": "This folder is for health and wellness information."},
            {"name": "Technology", "description": "This folder is for technology interests and updates."},
            {"name": "Hobbies", "description": "This folder is for hobbies and leisure activities."},
            {"name": "Fashion", "description": "This folder is for fashion interests and trends."},
            {"name": "Entertainment", "description": "This folder is for entertainment and media."},
            {"name": "Milestones", "description": "This folder is for important milestones and achievements."},
            {"name": "User_preferences", "description": "This folder is for user preferences and settings."},
            {"name": "Misc", "description": "This folder is for miscellaneous items. (everything else)"},
        ]
        from uuid import uuid4
        from datetime import datetime
        folders = [
            {
                "folderID": str(uuid4()),
                "name": f["name"],
                "description": f["description"],
                "messages": [],
                "created_at": datetime.now().isoformat(),
            }
            for f in default_folders
        ]
        user = {"userID": userID, "folders": folders}
        users_collection.insert_one(user)
        user = users_collection.find_one({"userID": userID})
    return user

def get_user_folders(userID):
    user = get_or_create_user(userID)
    return user.get("folders", [])

def update_user_folders(userID, folders):
    users_collection.update_one({"userID": userID}, {"$set": {"folders": folders}})

def auto_categorize_single_memory(userID, message_id):
    """Auto-categorize a single memory for a user using the LLM"""
    user = get_or_create_user(userID)
    folders = user.get("folders", [])
    folder_name_to_id = {f["name"]: f["folderID"] for f in folders}
    folder_name_to_obj = {f["name"]: f for f in folders}
    misc_folder = next((f for f in folders if f["name"].lower() == "misc"), None)
    if not misc_folder:
        return False, "Misc folder not found for user."
    # Get the message
    mem = messages_collection.find_one({"_id": ObjectId(message_id), "userID": userID})
    if not mem:
        return False, "Message not found."
    mem_id = str(mem["_id"])
    mem_text = mem.get("text", "")
    suggested_folders = categorize_memory_to_folders(mem_text, folders)
    updated = False
    for fname in suggested_folders:
        folder = folder_name_to_obj.get(fname)
        if not folder:
            folder = misc_folder
        if mem_id not in folder["messages"]:
            folder["messages"].append(mem_id)
            updated = True
    if updated:
        update_user_folders(userID, folders)
    return True, "Categorized." if updated else "No folder updated."

@app.route("/api/extract-insight", methods=["POST"])
def extract_insight():
    """Extract insight from multiple messages with optional custom prompt"""
    try:
        data = request.json
        userID = data.get("userUUID")
        messages = data.get("messages", [])
        prompt = data.get("prompt", "").strip()
        if not userID:
            return jsonify({"error": "userUUID is required"}), 400
        if not messages or not isinstance(messages, list) or not all(isinstance(m, str) and m.strip() for m in messages):
            return jsonify({"error": "A non-empty list of messages is required"}), 400
        # Concatenate messages for insight extraction
        combined_text = "\n".join(messages)
        if prompt:
            combined_text += f"\n\n[User instructions: {prompt}]"
        # Use the new multi-message insight function
        insight = generate_multi_message_insight_with_claude(combined_text)
        return jsonify({"insights": [insight]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def generate_multi_message_insight_with_claude(messages_text):
    """Generate a single synthesized insight from multiple messages using Claude and PROMPT_MULTI."""
    try:
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise Exception("Anthropic API key not configured")

        prompt = PROMPT_MULTI.format(message_text=messages_text)
        response = anthropic_client.messages.create(
            model="claude-3-5-haiku-latest",
            max_tokens=800,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )
        # Extract text from content blocks
        content = ""
        for block in response.content:
            if block.type == "text":
                content += block.text
        content = content.strip()
        if not content:
            raise Exception("No response content received")
        # Parse the JSON response
        try:
            parsed_response = json.loads(content)
            if parsed_response and isinstance(parsed_response, dict) and "memories" in parsed_response:
                memories = parsed_response["memories"]
                if isinstance(memories, list):
                    # Join the list into a single string for the return value
                    insight = "\n".join(memories)
                else:
                    raise Exception("Invalid response format - 'memories' is not a list")
            else:
                raise Exception("Invalid response format - expected 'memories' key")
        except json.JSONDecodeError:
            # If JSON parsing fails, just use the raw text
            insight = content
        # Validate
        if not insight or not isinstance(insight, str) or not insight.strip():
            raise Exception("No valid insight extracted")
        return insight.strip()
    except Exception as e:
        print(e)
        print(f"Error generating multi-message insight: {e}")
        return f"Important insight: {messages_text[:100]}..."


if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=True)
