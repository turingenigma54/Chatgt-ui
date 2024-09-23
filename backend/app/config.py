from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongo_uri: str
    mongo_db_name: str
    ollama_api_url: str = "http://localhost:11434"

    class Config:
        env_file = ".env"

settings = Settings()