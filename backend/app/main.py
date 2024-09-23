from fastapi import FastAPI , HTTPException, Depends, status , Body
from .models import User
from .schemas import UserCreate, UserOut , ChatRequest
from datetime import timedelta
from .auth import verify_password, get_password_hash, create_access_token , ACCESS_TOKEN_EXPIRE_MINUTES , SECRET_KEY , ALGORITHM
from .database import db
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from bson.objectid import ObjectId
from .ollama import generate_completion
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

origins = [ "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
oauth2_scheme= OAuth2PasswordBearer(tokenUrl="token")

@app.post("/register", response_model=UserOut)
def register(user: UserCreate):
    users_collection  = db["users"]
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    hashed_password = get_password_hash(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password
    }
    result = users_collection.insert_one(user_data)
    user_out = UserOut(id=str(result.inserted_id), username = user.username, email = user.email)
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
        payload = jwt.decode(token, SECRET_KEY , algorithms=[ALGORITHM])
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
def chat(prompt: ChatRequest, current_user: dict = Depends(get_current_user)):
    print(f"Received prompt: {prompt.prompt}")
    response_text = generate_completion(prompt.prompt)
    return {"response": response_text}

          
