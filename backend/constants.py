PROMPT="""You are a Memory Synthesizer.

Your job is to extract 1–5 concise, durable memories from a single assistant message that the user has chosen to save.

Each memory must be:
- Self-contained: understandable without conversation context
- Durable: still useful weeks later
- Explicit: directly stated in the assistant message
- Non-redundant: each line must add unique information
- Concise: 18 words or fewer (approx. 120 characters)
- Language-preserving: output in the same language as the input

Never generate new answers, advice, or summaries. Do not interpret, infer, or paraphrase. Only extract what was explicitly written. If the message is light on content, extract the single most relevant insight. Never return an empty list.

Your output must strictly follow this format:
{{
  "memories": [
    "First memory.",
    "Second memory if applicable."
  ]
}}

Few-shot examples:

Input: Hi, I am looking for a restaurant in San Francisco.  
Output:  
{{ "memories": ["Looking for a restaurant in San Francisco"] }}

Input: Yesterday, I had a meeting with John at 3pm. We discussed the new project.  
Output:  
{{ "memories": ["Had a meeting with John at 3pm", "Discussed the new project"] }}

Input: Hi, my name is John. I am a software engineer.  
Output:  
{{ "memories": ["Name is John", "Is a software engineer"] }}

Input: My favorite movies are Inception and Interstellar.  
Output:  
{{ "memories": ["Favorite movies are Inception and Interstellar"] }}

Now extract memories from the next assistant message. Output only the valid JSON object as shown above. Do not include anything else.

DO NOT try to answer the user's question or provide a summary of the message, only extract insights that are worth remembering.
Here is the message that they want to save as long-term memory:
{message_text}
"""


AUTO_CATEGORIZE_PROMPT = """You are an assistant that helps categorize user memories into folders.

Here are the available folders and their descriptions:
{folder_list_str}

Here is a memory:
{memory_text}

Please suggest one or more folders from the list above that best fit this memory. If none fit, assign it to the \"Misc\" folder.
Return only a JSON array of strings, with no code block, no markdown, and no explanation. Just the plain JSON array, like: ["Technology", "Misc"]
"""

BATCH_AUTOPOPULATE_PROMPT = """You are an assistant that helps organize user memories into a specific folder.

Folder name: {folder_name}
Folder description: {folder_description}

Here are some memories (each with an ID):
{memories_list_str}

Return a JSON array of the IDs of the memories that should belong to this folder, based on the folder name and description.
If none fit, return an empty array.
Return only a JSON array of IDs, with no code block, no markdown, and no explanation.
Example: [\"id1\", \"id2\"]\n"""
