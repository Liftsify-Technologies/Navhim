from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime
import random
from bson import ObjectId

from models import *
from auth import hash_password, verify_password, create_access_token, get_current_user
from zoom_service import ZoomService
from razorpay_service import RazorpayService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Services
zoom_service = ZoomService()
razorpay_service = RazorpayService()

# Create the main app
app = FastAPI(title="NAVHIM Hospital Management System API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Helper functions
def generate_navhim_card():
    """Generate a unique NAVHIM card number."""
    return f"NAV{random.randint(100000, 999999)}"

def serialize_doc(doc):
    """Convert MongoDB ObjectId to string."""
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# ========== AUTH ENDPOINTS ==========

@api_router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user (patient or doctor)."""
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        user_dict = user_data.model_dump()
        user_dict["password"] = hash_password(user_dict["password"])
        user_dict["created_at"] = datetime.utcnow()
        
        result = await db.users.insert_one(user_dict)
        user_id = str(result.inserted_id)
        
        # Create role-specific profile
        if user_data.role == UserRole.PATIENT:
            patient = {
                "user_id": user_id,
                "navhim_card_number": generate_navhim_card(),
                "blood_group": None,
                "allergies": [],
                "emergency_contact_name": None,
                "emergency_contact_phone": None,
                "created_at": datetime.utcnow()
            }
            await db.patients.insert_one(patient)
        elif user_data.role == UserRole.DOCTOR:
            doctor = {
                "user_id": user_id,
                "specialization": "",
                "qualifications": [],
                "experience": 0,
                "consultation_fee": 0.0,
                "rating": 0.0,
                "bio": "",
                "availability": [],
                "verified": False,
                "created_at": datetime.utcnow()
            }
            await db.doctors.insert_one(doctor)
        
        # Create access token
        token_data = {"sub": user_id, "email": user_data.email, "role": user_data.role}
        access_token = create_access_token(token_data)
        
        # Prepare user profile
        user_profile = UserProfile(
            id=user_id,
            email=user_data.email,
            role=user_data.role,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            date_of_birth=user_data.date_of_birth,
            gender=user_data.gender,
            created_at=user_dict["created_at"]
        )
        
        return TokenResponse(access_token=access_token, user=user_profile)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
