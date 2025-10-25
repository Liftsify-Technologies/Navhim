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

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

zoom_service = ZoomService()
razorpay_service = RazorpayService()

app = FastAPI(title="NAVHIM Hospital Management System API", version="1.0.0")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def generate_navhim_card():
    return f"NAV{random.randint(100000, 999999)}"

def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

@api_router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    try:
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_dict = user_data.model_dump()
        user_dict["password"] = hash_password(user_dict["password"])
        user_dict["created_at"] = datetime.utcnow()
        
        result = await db.users.insert_one(user_dict)
        user_id = str(result.inserted_id)
        
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
                "consultation_fee": 500.0,
                "rating": 0.0,
                "bio": "",
                "availability": [],
                "verified": False,
                "created_at": datetime.utcnow()
            }
            await db.doctors.insert_one(doctor)
        
        token_data = {"sub": user_id, "email": user_data.email, "role": user_data.role}
        access_token = create_access_token(token_data)
        
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

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    try:
        user = await db.users.find_one({"email": credentials.email})
        if not user or not verify_password(credentials.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user_id = str(user["_id"])
        token_data = {"sub": user_id, "email": user["email"], "role": user["role"]}
        access_token = create_access_token(token_data)
        
        user_profile = UserProfile(
            id=user_id,
            email=user["email"],
            role=user["role"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            phone=user["phone"],
            date_of_birth=user["date_of_birth"],
            gender=user["gender"],
            profile_image=user.get("profile_image"),
            created_at=user["created_at"]
        )
        
        return TokenResponse(access_token=access_token, user=user_profile)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    try:
        user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserProfile(
            id=str(user["_id"]),
            email=user["email"],
            role=user["role"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            phone=user["phone"],
            date_of_birth=user["date_of_birth"],
            gender=user["gender"],
            profile_image=user.get("profile_image"),
            created_at=user["created_at"]
        )
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user")

@api_router.get("/patients/profile", response_model=PatientProfile)
async def get_patient_profile(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"] != "patient":
            raise HTTPException(status_code=403, detail="Not authorized")
        
        patient = await db.patients.find_one({"user_id": current_user["user_id"]})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        return PatientProfile(
            id=str(patient["_id"]),
            user_id=patient["user_id"],
            navhim_card_number=patient["navhim_card_number"],
            blood_group=patient.get("blood_group"),
            allergies=patient.get("allergies", []),
            emergency_contact_name=patient.get("emergency_contact_name"),
            emergency_contact_phone=patient.get("emergency_contact_phone"),
            created_at=patient["created_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching patient profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")

@api_router.put("/patients/profile")
async def update_patient_profile(patient_data: PatientCreate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"] != "patient":
            raise HTTPException(status_code=403, detail="Not authorized")
        
        update_data = patient_data.model_dump(exclude_unset=True)
        
        result = await db.patients.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        return {"message": "Profile updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating patient profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@api_router.get("/doctors/profile", response_model=DoctorProfile)
async def get_doctor_profile(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"] != "doctor":
            raise HTTPException(status_code=403, detail="Not authorized")
        
        doctor = await db.doctors.find_one({"user_id": current_user["user_id"]})
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        
        user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
        user_details = {
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "email": user["email"]
        } if user else None
        
        return DoctorProfile(
            id=str(doctor["_id"]),
            user_id=doctor["user_id"],
            user_details=user_details,
            specialization=doctor.get("specialization", ""),
            qualifications=doctor.get("qualifications", []),
            experience=doctor.get("experience", 0),
            consultation_fee=doctor.get("consultation_fee", 0.0),
            rating=doctor.get("rating", 0.0),
            bio=doctor.get("bio", ""),
            availability=doctor.get("availability", []),
            verified=doctor.get("verified", False),
            created_at=doctor["created_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching doctor profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")

@api_router.put("/doctors/profile")
async def update_doctor_profile(doctor_data: DoctorUpdate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"] != "doctor":
            raise HTTPException(status_code=403, detail="Not authorized")
        
        update_data = doctor_data.model_dump(exclude_unset=True)
        
        result = await db.doctors.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        
        return {"message": "Profile updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating doctor profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@api_router.get("/doctors/list")
async def list_doctors(specialization: str = None):
    try:
        query = {}
        if specialization:
            query["specialization"] = {"$regex": specialization, "$options": "i"}
        
        doctors_cursor = db.doctors.find(query).limit(50)
        doctors_list = await doctors_cursor.to_list(length=50)
        
        result = []
        for doctor in doctors_list:
            user = await db.users.find_one({"_id": ObjectId(doctor["user_id"])})
            if user:
                result.append({
                    "id": str(doctor["_id"]),
                    "user_id": doctor["user_id"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "specialization": doctor.get("specialization", ""),
                    "qualifications": doctor.get("qualifications", []),
                    "experience": doctor.get("experience", 0),
                    "consultation_fee": doctor.get("consultation_fee", 0.0),
                    "rating": doctor.get("rating", 0.0),
                    "bio": doctor.get("bio", ""),
                    "verified": doctor.get("verified", False)
                })
        
        return {"doctors": result}
    except Exception as e:
        logger.error(f"Error listing doctors: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list doctors")

@api_router.get("/doctors/{doctor_id}")
async def get_doctor_by_id(doctor_id: str):
    try:
        doctor = await db.doctors.find_one({"_id": ObjectId(doctor_id)})
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        user = await db.users.find_one({"_id": ObjectId(doctor["user_id"])})
        
        return {
            "id": str(doctor["_id"]),
            "user_id": doctor["user_id"],
            "first_name": user["first_name"] if user else "",
            "last_name": user["last_name"] if user else "",
            "email": user["email"] if user else "",
            "specialization": doctor.get("specialization", ""),
            "qualifications": doctor.get("qualifications", []),
            "experience": doctor.get("experience", 0),
            "consultation_fee": doctor.get("consultation_fee", 0.0),
            "rating": doctor.get("rating", 0.0),
            "bio": doctor.get("bio", ""),
            "availability": doctor.get("availability", []),
            "verified": doctor.get("verified", False)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching doctor: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch doctor")
