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

PROMPT_MULTI = """You are a Memory Synthesizer.

TASK  
You are given a full, potentially long conversation between a user and an AI assistant.  
Your job is to extract all meaningful insights that would allow another assistant to understand the user’s goals, preferences, projects, and constraints — without reading the full original chat.

This is not summarization. You are distilling the conversation into atomic, self-contained facts, problems, plans, and beliefs that remain useful over time.

OUTPUT FORMAT  
Return a valid JSON object in this format:
{{
  "memories": [
    "First memory-worthy insight.",
    "Second distinct insight.",
    "..."
  ]
}}

RULES  
* There is no fixed limit. Extract as many insights as are necessary to preserve the user's full context.  
* Skip greetings, filler, examples, and vague comments.  
* Focus on what the user is doing, building, planning, needing, deciding, or believing.  
* Each memory must be:
  - Self-contained (no need to read original message)  
  - Durable (still useful weeks later)  
  - Clear and concise (≤ 120 characters if possible)  
* Do not repeat the same idea in multiple forms.  
* Do not output any reasoning, commentary, or markdown — only the JSON object.

Here is the full conversation that they want to save as long-term memory:
{message_text}
"""
