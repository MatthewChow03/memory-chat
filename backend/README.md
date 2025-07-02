# Memory Chat Backend

A Flask-based backend API for the Memory Chat Chrome extension, providing message storage, folder management, and semantic search capabilities.

## Features

- **Message Management**: Store and retrieve chat messages with AI-extracted insights
- **Folder Organization**: Create, manage, and organize messages into folders
- **Semantic Search**: AI-powered search using sentence transformers
- **MongoDB Integration**: Persistent storage with MongoDB
- **CORS Support**: Cross-origin requests enabled for Chrome extension

## Setup

### Prerequisites

- Python 3.8+
- MongoDB (local or cloud instance)
- OpenAI API key

### Installation

1. **Clone and navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   MONGO_URI=mongodb://localhost:27017/
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   ```

4. **Start MongoDB** (if using local instance):
   ```bash
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On macOS with Homebrew
   brew services start mongodb-community
   ```

5. **Run the backend:**
   ```bash
   python app.py
   ```

The server will start on `http://localhost:3000`

## API Endpoints

### Messages

#### GET /api/messages
Get all stored messages.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "text": "Original message text",
    "insights": ["Insight 1", "Insight 2"],
    "timestamp": "2023-12-01T10:30:00"
  }
]
```

#### POST /api/messages
Create a new message.

**Request Body:**
```json
{
  "text": "Message text",
  "insights": ["Insight 1", "Insight 2"],
  "timestamp": "2023-12-01T10:30:00"
}
```

#### POST /api/messages/delete
Delete a message by its MongoDB _id.

**Request Body:**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

### Folders

#### GET /api/folders
Get all folders with message counts.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Folder Name",
    "messages": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
    "messageCount": 2,
    "created_at": "2023-12-01T10:30:00"
  }
]
```

#### POST /api/folders
Create a new folder.

**Request Body:**
```json
{
  "name": "Folder Name"
}
```

#### POST /api/folders/delete
Delete a folder by MongoDB _id.

**Request Body:**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

#### GET /api/folders/{folderId}/contents
Get messages in a specific folder by MongoDB _id.

#### POST /api/folders/{folderId}/add-message
Add a message to a folder by MongoDB _id. Can either create a new message or add an existing message.

**Request Body (create new message):**
```json
{
  "text": "Message text",
  "timestamp": "2023-12-01T10:30:00"
}
```

**Request Body (add existing message):**
```json
{
  "messageId": "507f1f77bcf86cd799439011"
}
```

#### POST /api/folders/remove-message
Remove a message from a folder by MongoDB _id.

**Request Body:**
```json
{
  "folderId": "507f1f77bcf86cd799439011",
  "messageId": "507f1f77bcf86cd799439012"
}
```

### Search

#### POST /api/search
Search messages using semantic search.

**Request Body:**
```json
{
  "query": "search term"
}
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "text": "Message text",
    "insights": ["Insight 1"],
    "timestamp": "2023-12-01T10:30:00",
    "similarity": 0.85
  }
]
```

### Health Check

#### GET /health
Check if the backend is running.

**Response:**
```json
{
  "status": "healthy",
  "message": "Backend is running"
}
```

## Data Models

### Message
```json
{
  "_id": "string (MongoDB ObjectId)",
  "text": "string",
  "insights": ["string"],
  "timestamp": "ISO datetime string"
}
```

### Folder
```json
{
  "_id": "string (MongoDB ObjectId)",
  "name": "string",
  "messages": ["messageId"],
  "created_at": "ISO datetime string"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `409`: Conflict (already exists)
- `500`: Internal Server Error

Error responses include a message:
```json
{
  "error": "Error description"
}
```

## Development

### Running in Development Mode
```bash
python app.py
```

The server runs with debug mode enabled by default.

### Testing Endpoints

You can test the API using curl or any HTTP client:

```bash
# Health check
curl http://localhost:3000/health

# Get messages
curl http://localhost:3000/api/messages

# Create a message
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message", "insights": ["Test insight"]}'
```

## Dependencies

- **Flask**: Web framework
- **Flask-CORS**: Cross-origin resource sharing
- **pymongo**: MongoDB driver
- **python-dotenv**: Environment variable management
- **openai**: OpenAI API client
- **sentence-transformers**: Semantic search models
- **scikit-learn**: Machine learning utilities
- **numpy**: Numerical computing

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the `MONGO_URI` in your `.env` file
- Verify network connectivity if using cloud MongoDB

### Semantic Search Model Loading
- The first run will download the sentence transformer model (~90MB)
- Ensure you have sufficient disk space and internet connectivity
- If model loading fails, the backend falls back to text-based search

### OpenAI API Issues
- Verify your OpenAI API key is correct
- Check your OpenAI account has sufficient credits
- Ensure the API key has the necessary permissions

## License

This project is part of the Memory Chat Chrome extension. 