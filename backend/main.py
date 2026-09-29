import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests

app = FastAPI(title="Peack AI Backend")

# CORS für Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API-Key sicher über Umgebungsvariable laden
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "gryphe/mythomax-12-13b"
    system_prompt: Optional[str] = None

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Peack.ai",
        "Content-Type": "application/json"
    }

    formatted_messages = []
    if req.system_prompt:
        formatted_messages.append({"role": "system", "content": req.system_prompt})

    for m in req.messages:
        formatted_messages.append({"role": m.role, "content": m.content})

    payload = {
        "model": req.model,
        "messages": formatted_messages,
        "temperature": 0.7
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=60
        )
        data = response.json()

        if response.status_code != 200:
            error_msg = data.get("error", {}).get("message", f"HTTP {response.status_code}")
            raise HTTPException(status_code=500, detail=f"OpenRouter Fehler: {error_msg}")

        reply_text = data["choices"][0]["message"]["content"]
        return {"reply": reply_text}

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Verbindungsfehler zu OpenRouter: {str(e)}")

@app.get("/")
def health_check():
    return {"status": "online", "service": "Peack AI Backend"}