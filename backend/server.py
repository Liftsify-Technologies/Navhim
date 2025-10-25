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

@api_router.post("/appointments/book", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def book_appointment(appointment_data: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"] != "patient":
            raise HTTPException(status_code=403, detail="Only patients can book appointments")
        
        doctor = await db.doctors.find_one({"_id": ObjectId(appointment_data.doctor_id)})
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        appointment_datetime = datetime.strptime(f"{appointment_data.appointment_date} {appointment_data.appointment_time}", "%Y-%m-%d %H:%M")
        
        appointment = {
            "patient_id": current_user["user_id"],
            "doctor_id": appointment_data.doctor_id,
            "appointment_datetime": appointment_datetime,
            "appointment_type": appointment_data.appointment_type,
            "status": AppointmentStatus.SCHEDULED,
            "symptoms": appointment_data.symptoms,
            "notes": appointment_data.notes,
            "consultation_fee": doctor.get("consultation_fee", 0.0),
            "payment_id": None,
            "payment_status": "pending",
            "zoom_meeting_id": None,
            "zoom_join_url": None,
            "zoom_password": None,
            "created_at": datetime.utcnow()
        }
        
        result = await db.appointments.insert_one(appointment)
        appointment_id = str(result.inserted_id)
        
        patient_user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
        doctor_user = await db.users.find_one({"_id": ObjectId(doctor["user_id"])})
        
        return AppointmentResponse(
            id=appointment_id,
            patient_id=current_user["user_id"],
            doctor_id=appointment_data.doctor_id,
            appointment_datetime=appointment_datetime,
            appointment_type=appointment_data.appointment_type,
            status=AppointmentStatus.SCHEDULED,
            symptoms=appointment_data.symptoms,
            notes=appointment_data.notes,
            consultation_fee=doctor.get("consultation_fee", 0.0),
            payment_status="pending",
            patient_details={"first_name": patient_user["first_name"] if patient_user else "", "last_name": patient_user["last_name"] if patient_user else ""},
            doctor_details={"first_name": doctor_user["first_name"] if doctor_user else "", "last_name": doctor_user["last_name"] if doctor_user else "", "specialization": doctor.get("specialization", "")},
            created_at=appointment["created_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error booking appointment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to book appointment: {str(e)}")

@api_router.get("/appointments/my")
async def get_my_appointments(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"] == "patient":
            query = {"patient_id": current_user["user_id"]}
        elif current_user["role"] == "doctor":
            doctor = await db.doctors.find_one({"user_id": current_user["user_id"]})
            if not doctor:
                return {"appointments": []}
            query = {"doctor_id": str(doctor["_id"])}
        else:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        appointments_cursor = db.appointments.find(query).sort("appointment_datetime", -1)
        appointments_list = await appointments_cursor.to_list(length=100)
        
        result = []
        for appt in appointments_list:
            patient_user = await db.users.find_one({"_id": ObjectId(appt["patient_id"])})
            doctor = await db.doctors.find_one({"_id": ObjectId(appt["doctor_id"])})
            doctor_user = await db.users.find_one({"_id": ObjectId(doctor["user_id"])}) if doctor else None
            
            result.append({
                "id": str(appt["_id"]),
                "patient_id": appt["patient_id"],
                "doctor_id": appt["doctor_id"],
                "appointment_datetime": appt["appointment_datetime"].isoformat(),
                "appointment_type": appt["appointment_type"],
                "status": appt["status"],
                "symptoms": appt.get("symptoms"),
                "notes": appt.get("notes"),
                "consultation_fee": appt.get("consultation_fee", 0.0),
                "payment_status": appt.get("payment_status"),
                "zoom_meeting_id": appt.get("zoom_meeting_id"),
                "zoom_join_url": appt.get("zoom_join_url"),
                "zoom_password": appt.get("zoom_password"),
                "patient_details": {"first_name": patient_user["first_name"] if patient_user else "", "last_name": patient_user["last_name"] if patient_user else ""},
                "doctor_details": {"first_name": doctor_user["first_name"] if doctor_user else "", "last_name": doctor_user["last_name"] if doctor_user else "", "specialization": doctor.get("specialization", "") if doctor else ""}
            })
        
        return {"appointments": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appointments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch appointments")

@api_router.get("/appointments/{appointment_id}")
async def get_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    try:
        appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        patient_user = await db.users.find_one({"_id": ObjectId(appointment["patient_id"])})
        doctor = await db.doctors.find_one({"_id": ObjectId(appointment["doctor_id"])})
        doctor_user = await db.users.find_one({"_id": ObjectId(doctor["user_id"])}) if doctor else None
        
        return {
            "id": str(appointment["_id"]),
            "patient_id": appointment["patient_id"],
            "doctor_id": appointment["doctor_id"],
            "appointment_datetime": appointment["appointment_datetime"].isoformat(),
            "appointment_type": appointment["appointment_type"],
            "status": appointment["status"],
            "symptoms": appointment.get("symptoms"),
            "notes": appointment.get("notes"),
            "consultation_fee": appointment.get("consultation_fee", 0.0),
            "payment_status": appointment.get("payment_status"),
            "payment_id": appointment.get("payment_id"),
            "zoom_meeting_id": appointment.get("zoom_meeting_id"),
            "zoom_join_url": appointment.get("zoom_join_url"),
            "zoom_password": appointment.get("zoom_password"),
            "patient_details": {"first_name": patient_user["first_name"] if patient_user else "", "last_name": patient_user["last_name"] if patient_user else ""},
            "doctor_details": {"first_name": doctor_user["first_name"] if doctor_user else "", "last_name": doctor_user["last_name"] if doctor_user else "", "specialization": doctor.get("specialization", "") if doctor else ""}
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching appointment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch appointment")

@api_router.put("/appointments/{appointment_id}/complete-payment")
async def complete_payment_mock(appointment_id: str, payment_data: dict, current_user: dict = Depends(get_current_user)):
    """Complete payment without actual Razorpay - for demo purposes"""
    try:
        appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        if appointment["patient_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        update_data = {
            "payment_id": payment_data.get("payment_id", f"mock_pay_{int(datetime.utcnow().timestamp())}"),
            "payment_status": "completed"
        }
        
        # Create mock Zoom meeting for video appointments
        if appointment["appointment_type"] == "video":
            mock_meeting_id = f"mock_{int(datetime.utcnow().timestamp())}"
            update_data["zoom_meeting_id"] = mock_meeting_id
            update_data["zoom_join_url"] = f"https://zoom.us/j/{mock_meeting_id}"
            update_data["zoom_password"] = "demo123"
        
        await db.appointments.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": update_data}
        )
        
        return {"success": True, "message": "Payment completed successfully", "zoom_join_url": update_data.get("zoom_join_url")}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing payment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to complete payment")


@api_router.post("/payments/create-order", response_model=PaymentOrderResponse)
async def create_payment_order(payment_data: PaymentOrderCreate, current_user: dict = Depends(get_current_user)):
    try:
        appointment = await db.appointments.find_one({"_id": ObjectId(payment_data.appointment_id)})
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        if appointment["patient_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        order = razorpay_service.create_order(amount=payment_data.amount, receipt=payment_data.appointment_id)
        
        return PaymentOrderResponse(
            order_id=order["id"],
            amount=order["amount"],
            currency=order["currency"],
            razorpay_key_id=razorpay_service.key_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment order: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")

@api_router.post("/payments/verify")
async def verify_payment(payment_data: PaymentVerify, current_user: dict = Depends(get_current_user)):
    try:
        is_valid = razorpay_service.verify_payment_signature(payment_data.razorpay_order_id, payment_data.razorpay_payment_id, payment_data.razorpay_signature)
        
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        appointment = await db.appointments.find_one({"_id": ObjectId(payment_data.appointment_id)})
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        update_data = {"payment_id": payment_data.razorpay_payment_id, "payment_status": "completed"}
        
        if appointment["appointment_type"] == "video":
            try:
                patient_user = await db.users.find_one({"_id": ObjectId(appointment["patient_id"])})
                doctor = await db.doctors.find_one({"_id": ObjectId(appointment["doctor_id"])})
                doctor_user = await db.users.find_one({"_id": ObjectId(doctor["user_id"])}) if doctor else None
                
                topic = f"Consultation: Dr. {doctor_user['first_name'] if doctor_user else 'Doctor'} & {patient_user['first_name'] if patient_user else 'Patient'}"
                
                meeting = zoom_service.create_meeting(topic=topic, start_time=appointment["appointment_datetime"], duration=60)
                
                update_data["zoom_meeting_id"] = meeting["meeting_id"]
                update_data["zoom_join_url"] = meeting["join_url"]
                update_data["zoom_password"] = meeting["password"]
            except Exception as e:
                logger.error(f"Failed to create Zoom meeting: {str(e)}")
        
        await db.appointments.update_one({"_id": ObjectId(payment_data.appointment_id)}, {"$set": update_data})
        
        return {"success": True, "message": "Payment verified and appointment confirmed", "zoom_join_url": update_data.get("zoom_join_url")}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify payment")

@api_router.post("/emr/vitals", response_model=VitalsResponse, status_code=status.HTTP_201_CREATED)
async def add_vitals(vitals_data: VitalsCreate, current_user: dict = Depends(get_current_user)):
    try:
        vitals = vitals_data.model_dump()
        vitals["patient_id"] = current_user["user_id"]
        vitals["recorded_by"] = current_user["user_id"]
        vitals["recorded_at"] = datetime.utcnow()
        
        result = await db.vitals.insert_one(vitals)
        vitals["id"] = str(result.inserted_id)
        
        return VitalsResponse(**vitals)
    except Exception as e:
        logger.error(f"Error adding vitals: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add vitals")

@api_router.get("/emr/vitals")
async def get_vitals(current_user: dict = Depends(get_current_user)):
    try:
        patient_id = current_user["user_id"] if current_user["role"] == "patient" else None
        
        if not patient_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        vitals_cursor = db.vitals.find({"patient_id": patient_id}).sort("recorded_at", -1).limit(50)
        vitals_list = await vitals_cursor.to_list(length=50)
        
        result = [serialize_doc(v) for v in vitals_list]
        return {"vitals": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching vitals: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch vitals")

@api_router.post("/emr/prescription", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(prescription_data: PrescriptionCreate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"] != "doctor":
            raise HTTPException(status_code=403, detail="Only doctors can create prescriptions")
        
        prescription = prescription_data.model_dump()
        prescription["doctor_id"] = current_user["user_id"]
        prescription["created_at"] = datetime.utcnow()
        
        result = await db.prescriptions.insert_one(prescription)
        prescription["id"] = str(result.inserted_id)
        
        doctor_user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
        prescription["doctor_details"] = {"first_name": doctor_user["first_name"] if doctor_user else "", "last_name": doctor_user["last_name"] if doctor_user else ""}
        
        return PrescriptionResponse(**prescription)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating prescription: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create prescription")

@api_router.get("/emr/prescriptions")
async def get_prescriptions(current_user: dict = Depends(get_current_user)):
    try:
        patient_id = current_user["user_id"] if current_user["role"] == "patient" else None
        
        if not patient_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        prescriptions_cursor = db.prescriptions.find({"patient_id": patient_id}).sort("created_at", -1)
        prescriptions_list = await prescriptions_cursor.to_list(length=100)
        
        result = []
        for presc in prescriptions_list:
            doctor_user = await db.users.find_one({"_id": ObjectId(presc["doctor_id"])})
            result.append({
                "id": str(presc["_id"]),
                "patient_id": presc["patient_id"],
                "doctor_id": presc["doctor_id"],
                "appointment_id": presc["appointment_id"],
                "medications": presc["medications"],
                "diagnosis": presc["diagnosis"],
                "notes": presc.get("notes"),
                "doctor_details": {"first_name": doctor_user["first_name"] if doctor_user else "", "last_name": doctor_user["last_name"] if doctor_user else ""},
                "created_at": presc["created_at"].isoformat()
            })
        
        return {"prescriptions": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prescriptions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch prescriptions")

@api_router.post("/emr/document", status_code=status.HTTP_201_CREATED)
async def upload_medical_document(document: MedicalDocument, current_user: dict = Depends(get_current_user)):
    try:
        doc_data = document.model_dump()
        doc_data["patient_id"] = current_user["user_id"]
        doc_data["uploaded_by"] = current_user["user_id"]
        doc_data["uploaded_at"] = datetime.utcnow()
        
        result = await db.medical_documents.insert_one(doc_data)
        
        return {"id": str(result.inserted_id), "message": "Document uploaded successfully"}
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload document")

@api_router.get("/emr/documents")
async def get_medical_documents(current_user: dict = Depends(get_current_user)):
    try:
        patient_id = current_user["user_id"] if current_user["role"] == "patient" else None
        
        if not patient_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        documents_cursor = db.medical_documents.find({"patient_id": patient_id}).sort("uploaded_at", -1)
        documents_list = await documents_cursor.to_list(length=100)
        
        result = [serialize_doc(doc) for doc in documents_list]
        return {"documents": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching documents: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch documents")

@api_router.get("/")
async def root():
    return {"message": "NAVHIM Hospital Management System API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "NAVHIM HMS API"}

@api_router.get("/specializations")
async def get_specializations():
    specializations = [
        "General Physician", "Cardiologist", "Dermatologist", "Pediatrician",
        "Gynecologist", "Orthopedist", "Psychiatrist", "ENT Specialist",
        "Neurologist", "Ophthalmologist", "Dentist", "Endocrinologist"
    ]
    return {"specializations": specializations}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
