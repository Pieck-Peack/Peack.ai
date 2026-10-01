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
import sqlite3
from fastapi import HTTPException

# --- DATENBANK & MODELLE ---

def init_db():
    conn = sqlite3.connect("peack.db")
    cursor = conn.cursor()
    # Benutzer-Tabelle
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            is_owner BOOLEAN DEFAULT 0
        )
    """)
    # Bot-Tabelle (mit Ersteller-Zuordnung zum Schutz vor Fremdlöschung)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bots (
            id TEXT PRIMARY KEY,
            name TEXT,
            gender TEXT,
            description TEXT,
            creator TEXT,
            nsfw BOOLEAN
        )
    """)
    conn.commit()
    conn.close()

init_db()

class UserAuth(BaseModel):
    username: str
    password: str

class BotModel(BaseModel):
    id: str
    name: str
    gender: str
    description: str
    creator: str
    nsfw: bool = True

# --- API ENDPUNKTE FÜR ACCOUNTS & BOTS ---

@app.post("/api/register")
def register_user(user: UserAuth):
    conn = sqlite3.connect("peack.db")
    cursor = conn.cursor()
    try:
        # Erster registrierter Account wird automatisch Owner (oder prüfe auf "Pieck")
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        is_owner = 1 if user.username.lower() == "Pieck" else 0

        cursor.execute(
            "INSERT INTO users (username, password, is_owner) VALUES (?, ?, ?)",
            (user.username, user.password, is_owner)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Username already taken.")
    conn.close()
    return {"success": True, "username": user.username, "is_owner": bool(is_owner)}

@app.post("/api/login")
def login_user(user: UserAuth):
    conn = sqlite3.connect("peack.db")
    cursor = conn.cursor()
    cursor.execute("SELECT username, is_owner FROM users WHERE username = ? AND password = ?", (user.username, user.password))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    
    return {"success": True, "username": row[0], "is_owner": bool(row[1])}

@app.post("/api/bots")
def save_bot(bot: BotModel):
    conn = sqlite3.connect("peack.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO bots (id, name, gender, description, creator, nsfw)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (bot.id, bot.name, bot.gender, bot.description, bot.creator, bot.nsfw))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Bot saved successfully."}

@app.get("/api/bots")
def get_bots():
    conn = sqlite3.connect("peack.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, gender, description, creator, nsfw FROM bots")
    rows = cursor.fetchall()
    conn.close()
    
    bots = []
    for r in rows:
        bots.append({
            "id": r[0],
            "name": r[1],
            "gender": r[2],
            "description": r[3],
            "creator": r[4],
            "nsfw": bool(r[5])
        })
    return bots

@app.delete("/api/bots/{bot_id}")
def delete_bot(bot_id: str, username: str):
    conn = sqlite3.connect("peack.db")
    cursor = conn.cursor()
    cursor.execute("SELECT creator FROM bots WHERE id = ?", (bot_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Bot not found.")
    
    bot_creator = row[0]
    # Schutzmechanismus: Nur der Ersteller (oder Owner) darf den Bot global löschen!
    if bot_creator != username and username.lower() != "pieck":
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized: Only the creator can delete this bot.")
    
    cursor.execute("DELETE FROM bots WHERE id = ?", (bot_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Bot deleted globally."}