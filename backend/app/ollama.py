import requests
from .config import settings
import json

OLLAMA_API_URL = settings.ollama_api_url

def generate_completion(prompt: str) -> str:
    print(f"generate_completion called with prompt: {prompt}")
    url = f"{OLLAMA_API_URL}/api/generate"
    print(f"OLLAMA_API_URL: {OLLAMA_API_URL}")
    payload = {
        "model": "llama3.1",
        "prompt": prompt,
        "stream": False
    }
    print(f"Payload: {json.dumps(payload, indent=2)}")
    try:
        response = requests.post(url, json=payload)
        print(f"HTTP status code: {response.status_code}")
        response.raise_for_status()
        data = response.json()
        print("Ollama API Response:", json.dumps(data, indent=2))
        if 'error' in data:
            print(f"Ollama API Error: {data['error']}")
            return "I'm sorry, but I'm unable to process your request at this time."
        if 'response' not in data:
            print("No 'response' key found in Ollama API response.")
            return "I'm sorry, but I'm unable to process your request at this time."
        return data['response']
    except requests.RequestException as e:
        print(f"RequestException: Error communicating with Ollama API: {e}")
        return "I'm sorry, but I'm unable to process your request at this time."
    except Exception as e:
        print(f"Exception in generate_completion: {e}")
        return "I'm sorry, but I'm unable to process your request at this time."