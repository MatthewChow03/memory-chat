import os
import json
from constants import PROMPT, AUTO_CATEGORIZE_PROMPT
from datetime import datetime

provider = os.getenv("LLM_PROVIDER", "claude").lower()
if provider == "openai":
    from openai import OpenAI
    client = OpenAI()
else:
    from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
    client = Anthropic()
        

def parse_insights_from_text(text):
    """Parse insights from plain text if JSON parsing fails"""
    lines = text.split("\n")
    insights = []
    for line in lines:
        line = line.strip()
        if (
            line.startswith("-")
            or line.startswith("•")
            or line.startswith("*")
            or (line and line[0].isdigit() and ". " in line)
            or line.lower().startswith("insight")
            or line.lower().startswith("key")
            or line.lower().startswith("point")
        ):
            insight = line
            if insight.startswith(("-", "•", "*")):
                insight = insight[1:].strip()
            elif insight and insight[0].isdigit() and ". " in insight:
                insight = insight.split(". ", 1)[1]
            elif insight.lower().startswith("insight"):
                insight = insight[8:].strip()
            elif insight.lower().startswith("key"):
                insight = insight[3:].strip()
            elif insight.lower().startswith("point"):
                insight = insight[5:].strip()
            if insight and len(insight) > 0:
                insights.append(insight)
    if not insights:
        meaningful_lines = [
            line.strip()
            for line in lines
            if len(line.strip()) > 10 and len(line.strip()) < 200
        ]
        insights = meaningful_lines[:3]
    return insights


def generate_insights(message_text):
    provider = os.getenv("LLM_PROVIDER", "claude").lower()
    try:
        if provider == "openai":
            if not os.getenv("OPENAI_API_KEY"):
                raise Exception("OpenAI API key not configured")
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "user", "content": PROMPT.format(message_text=message_text)},
                ],
                max_tokens=500,
            )
            content = response.choices[0].message.content

        elif provider == "claude":
            if not os.getenv("ANTHROPIC_API_KEY"):
                raise Exception("Anthropic API key not configured")
            from anthropic import Anthropic
            anthropic_client = Anthropic()
            prompt = PROMPT.format(message_text=message_text)
            response = anthropic_client.messages.create(
                model="claude-3-5-haiku-latest",
                max_tokens=800,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}]
            )
            content = ""
            for block in response.content:
                if block.type == "text":
                    content += block.text
            content = content.strip()

        if not content:
            raise Exception("No response content received")
        try:
            parsed_response = json.loads(content)
            if (
                parsed_response
                and parsed_response.get("memories")
                and isinstance(parsed_response["memories"], list)
            ):
                insights = parsed_response["memories"]
            elif isinstance(parsed_response, list):
                insights = parsed_response
            else:
                raise Exception("Invalid response format - expected memories array")
        except json.JSONDecodeError:
            insights = parse_insights_from_text(content)
        if not isinstance(insights, list):
            raise Exception("Invalid insights format")
        insights = insights[:3]
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
        return [f"Important message: {message_text[:100]}..."]


def categorize_memory_to_folders(memory_text, folders):
    """
    Given a memory text and a list of folders (dicts with 'name' and 'description'),
    call the LLM to categorize the memory into one or more folders.
    Returns a list of folder names.
    """
    provider = os.getenv("LLM_PROVIDER", "claude").lower()
    folder_list_str = "\n".join([
        f"- {f['name']}: {f.get('description', '')}" for f in folders
    ])
    prompt = AUTO_CATEGORIZE_PROMPT.format(
        memory_text=memory_text,
        folder_list_str=folder_list_str
    )
    try:
        if provider == "openai":
            if not os.getenv("OPENAI_API_KEY"):
                raise Exception("OpenAI API key not configured")
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
            )
            content = response.choices[0].message.content
        elif provider == "claude":
            if not os.getenv("ANTHROPIC_API_KEY"):
                raise Exception("Anthropic API key not configured")
            from anthropic import Anthropic
            anthropic_client = Anthropic()
            response = anthropic_client.messages.create(
                model="claude-3-5-haiku-latest",
                max_tokens=300,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}]
            )
            content = ""
            for block in response.content:
                if block.type == "text":
                    content += block.text
            content = content.strip()
        if not content:
            raise Exception("No response content received")
        try:
            folder_names = json.loads(content)
            if not isinstance(folder_names, list):
                raise Exception("Expected a list of folder names")
            folder_names = [str(f).strip() for f in folder_names if f and isinstance(f, str)]
            # fix the problem where it picks misc with other folders, misc should be alone
            if len(folder_names) > 1 and "Misc" in folder_names:
                folder_names = [f for f in folder_names if f != "Misc"]
        except Exception as e:
            print(f"Error parsing LLM folder response: {e}")
            folder_names = []
        if not folder_names:
            folder_names = []
        return folder_names
    except Exception as e:
        print(f"Error categorizing memory: {e}")
        return []
