import os
from dotenv import load_dotenv
import kagglehub

load_dotenv()

token = os.getenv("KAGGLE_API_TOKEN")

if not token:
    raise ValueError("KAGGLE_API_TOKEN is missing from .env")

print("Kaggle authentication configured.")

path = kagglehub.competition_download("ieee-fraud-detection")

print("Path to competition files:", path)