from fastapi import FastAPI, HTTPException, Depends, status, Body, Response
from .models import User, PyObjectId, Message, Conversation
from .schemas import UserCreate, UserOut, ChatRequest
from datetime import timedelta
from .auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from .database import db
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from bson.objectid import ObjectId
from .ollama import generate_completion
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from time import time
from typing import Optional

load_dotenv()

app = FastAPI()

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def validate_password(password: str):
    import re
    min_length = 8
    if len(password) < min_length:
        return f"Password must be at least {min_length} characters long."
    if not re.search("[A-Z]", password):
        return "Password must contain at least one uppercase letter."
    if not re.search("[a-z]", password):
        return "Password must contain at least one lowercase letter."
    if not re.search("[0-9]", password):
        return "Password must contain at least one digit."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return "Password must contain at least one symbol."
    return None
@app.post("/register", response_model=UserOut)
def register(user: UserCreate):
    users_collection = db["users"]
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    hashed_password = get_password_hash(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password
    }
    result = users_collection.insert_one(user_data)
    user_out = UserOut(id=str(result.inserted_id), username=user.username, email=user.email)
    return user_out

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    users_collection = db["users"]
    user = users_collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    users_collection = db["users"]
    user = users_collection.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return user

@app.post("/chat")
def chat(
    chat_request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    prompt = chat_request.prompt
    conversation_id = chat_request.conversation_id
    user_id = str(current_user['_id'])
    messages_collection = db["messages"]

    # Create a new conversation if no conversation_id is provided
    if not conversation_id:
        conversation = {
            "user_id": user_id,
            "messages": []
        }
        result = messages_collection.insert_one(conversation)
        conversation_id = str(result.inserted_id)
    else:
        # Fetch existing conversation
        conversation = messages_collection.find_one({
            "_id": ObjectId(conversation_id),
            "user_id": user_id
        })
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

    # Add user's message
    user_message = {
        "sender": "user",
        "text": prompt,
        "timestamp": time()
    }
    conversation['messages'].append(user_message)

    # Generate assistant's response
    response_text = generate_completion(prompt)

    # Add assistant's message
    assistant_message = {
        "sender": "assistant",
        "text": response_text,
        "timestamp": time()
    }
    conversation['messages'].append(assistant_message)

    # Update the conversation in the database
    messages_collection.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {"messages": conversation['messages']}}
    )

    return {
        "response": response_text,
        "conversation_id": conversation_id
    }

@app.get("/conversations")
def get_conversations(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user['_id'])
    messages_collection = db["messages"]
    conversations = messages_collection.find({"user_id": user_id})
    conversation_list = []
    for convo in conversations:
        conversation_list.append({
            "conversation_id": str(convo['_id']),
            "last_message": convo['messages'][-1]['text'] if convo['messages'] else '',
            "timestamp": convo['messages'][-1]['timestamp'] if convo['messages'] else 0
        })
    return {"conversations": conversation_list}

@app.get("/conversations/{conversation_id}")
def get_conversation_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user['_id'])
    messages_collection = db["messages"]
    conversation = messages_collection.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": user_id
    })
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"messages": conversation['messages']}


@app.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user['_id'])
    messages_collection = db["messages"]
    result = messages_collection.delete_one({
        "_id": ObjectId(conversation_id),
        "user_id": user_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found or not authorized to delete")
    return Response(status_code=204)
