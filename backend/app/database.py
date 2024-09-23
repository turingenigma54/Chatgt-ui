from pymongo import MongoClient
from .config import settings

client = MongoClient(settings.mongo_uri)
db = client[settings.mongo_db_name]  