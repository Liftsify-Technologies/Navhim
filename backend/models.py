from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    IN_PROGRESS = "in_progress"

class AppointmentType(str, Enum):
    VIDEO = "video"
    IN_PERSON = "in_person"

class EMRType(str, Enum):
    PRESCRIPTION = "prescription"
    TEST_REPORT = "test_report"
    VITALS = "vitals"
    DIAGNOSIS = "diagnosis"

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    role: UserRole
    first_name: str
    last_name: str
    phone: str
    date_of_birth: str
    gender: Gender

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    email: EmailStr
    role: UserRole
    first_name: str
    last_name: str
    phone: str
    date_of_birth: str
    gender: Gender
    profile_image: Optional[str] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

# Patient Models
class PatientCreate(BaseModel):
    blood_group: Optional[str] = None
    allergies: Optional[List[str]] = []
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class PatientProfile(BaseModel):
    id: str
    user_id: str
    navhim_card_number: str
    blood_group: Optional[str] = None
    allergies: List[str] = []
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    created_at: datetime

# Doctor Models
class DoctorCreate(BaseModel):
    specialization: str
    qualifications: List[str]
    experience: int
    consultation_fee: float
    bio: Optional[str] = None

class DoctorAvailability(BaseModel):
    day_of_week: int  # 0-6 (Monday-Sunday)
    start_time: str  # HH:MM format
    end_time: str  # HH:MM format

class DoctorProfile(BaseModel):
    id: str
    user_id: str
    user_details: Optional[dict] = None
    specialization: str
    qualifications: List[str]
    experience: int
    consultation_fee: float
    rating: float = 0.0
    bio: Optional[str] = None
    availability: List[DoctorAvailability] = []
    verified: bool = False
    created_at: datetime

class DoctorUpdate(BaseModel):
    specialization: Optional[str] = None
    qualifications: Optional[List[str]] = None
    experience: Optional[int] = None
    consultation_fee: Optional[float] = None
    bio: Optional[str] = None
    availability: Optional[List[DoctorAvailability]] = None

# Appointment Models
class AppointmentCreate(BaseModel):
    doctor_id: str
    appointment_date: str  # YYYY-MM-DD
    appointment_time: str  # HH:MM
    appointment_type: AppointmentType
    symptoms: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    appointment_datetime: datetime
    appointment_type: AppointmentType
    status: AppointmentStatus
    symptoms: Optional[str] = None
    notes: Optional[str] = None
    consultation_fee: float
    payment_id: Optional[str] = None
    payment_status: Optional[str] = None
    zoom_meeting_id: Optional[str] = None
    zoom_join_url: Optional[str] = None
    zoom_password: Optional[str] = None
    doctor_details: Optional[dict] = None
    patient_details: Optional[dict] = None
    created_at: datetime

class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None

# Payment Models
class PaymentOrderCreate(BaseModel):
    appointment_id: str
    amount: float  # in rupees

class PaymentOrderResponse(BaseModel):
    order_id: str
    amount: int  # in paise
    currency: str
    razorpay_key_id: str

class PaymentVerify(BaseModel):
    appointment_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# Zoom Meeting Models
class ZoomMeetingCreate(BaseModel):
    topic: str
    start_time: datetime
    duration: int = 60
    timezone: str = "Asia/Kolkata"

class ZoomMeetingResponse(BaseModel):
    meeting_id: str
    join_url: str
    password: str
    start_url: str

# EMR Models
class VitalsCreate(BaseModel):
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    blood_sugar: Optional[float] = None
    oxygen_saturation: Optional[int] = None
    notes: Optional[str] = None

class VitalsResponse(BaseModel):
    id: str
    patient_id: str
    recorded_by: str
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    blood_sugar: Optional[float] = None
    oxygen_saturation: Optional[int] = None
    notes: Optional[str] = None
    recorded_at: datetime

class PrescriptionCreate(BaseModel):
    patient_id: str
    appointment_id: str
    medications: List[dict]  # [{"name": str, "dosage": str, "frequency": str, "duration": str}]
    diagnosis: str
    notes: Optional[str] = None

class PrescriptionResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    appointment_id: str
    medications: List[dict]
    diagnosis: str
    notes: Optional[str] = None
    doctor_details: Optional[dict] = None
    created_at: datetime

class MedicalDocument(BaseModel):
    document_type: str
    document_name: str
    document_data: str  # base64 encoded
    description: Optional[str] = None

class MedicalDocumentResponse(BaseModel):
    id: str
    patient_id: str
    uploaded_by: str
    document_type: str
    document_name: str
    document_data: str
    description: Optional[str] = None
    uploaded_at: datetime

class EMRRecord(BaseModel):
    id: str
    patient_id: str
    type: EMRType
    data: dict
    created_at: datetime
