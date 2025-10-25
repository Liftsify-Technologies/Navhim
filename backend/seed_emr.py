"""
Seed EMR data for testing
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

# Add backend directory to path
ROOT_DIR = Path(__file__).parent
sys.path.append(str(ROOT_DIR))

load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_emr_data():
    print("Starting EMR data seeding...")
    
    # Get test patient user
    test_user = await db.users.find_one({"email": "test@test.com"})
    if not test_user:
        print("Test user (test@test.com) not found. Please create a user first.")
        return
    
    patient_id = str(test_user["_id"])
    print(f"Found patient: {patient_id}")
    
    # Get a doctor for prescriptions
    doctor = await db.doctors.find_one()
    if not doctor:
        print("No doctors found. Please run seed.py first to create doctors.")
        return
    
    doctor_id = str(doctor["_id"])
    doctor_user_id = doctor.get("user_id")
    if doctor_user_id:
        from bson import ObjectId
        doctor_user = await db.users.find_one({"_id": ObjectId(doctor_user_id) if isinstance(doctor_user_id, str) else doctor_user_id})
    else:
        doctor_user = None
    
    if not doctor_user:
        print("Doctor user not found. Using default values.")
        doctor_user = {"_id": "unknown", "first_name": "Default", "last_name": "Doctor"}
    
    print(f"Found doctor: Dr. {doctor_user['first_name']} {doctor_user['last_name']}")
    
    # Clear existing EMR data for test user
    await db.vitals.delete_many({"patient_id": patient_id})
    await db.prescriptions.delete_many({"patient_id": patient_id})
    print("Cleared existing EMR data")
    
    # Add sample vitals
    vitals_data = [
        {
            "patient_id": patient_id,
            "recorded_by": doctor_user["_id"],
            "blood_pressure_systolic": 120,
            "blood_pressure_diastolic": 80,
            "heart_rate": 72,
            "temperature": 98.6,
            "weight": 70.5,
            "height": 175,
            "recorded_at": datetime.utcnow() - timedelta(days=30)
        },
        {
            "patient_id": patient_id,
            "recorded_by": doctor_user["_id"],
            "blood_pressure_systolic": 118,
            "blood_pressure_diastolic": 78,
            "heart_rate": 68,
            "temperature": 98.4,
            "weight": 69.8,
            "height": 175,
            "recorded_at": datetime.utcnow() - timedelta(days=15)
        },
        {
            "patient_id": patient_id,
            "recorded_by": doctor_user["_id"],
            "blood_pressure_systolic": 122,
            "blood_pressure_diastolic": 82,
            "heart_rate": 75,
            "temperature": 98.7,
            "weight": 70.2,
            "height": 175,
            "recorded_at": datetime.utcnow() - timedelta(days=5)
        },
    ]
    
    await db.vitals.insert_many(vitals_data)
    print(f"Added {len(vitals_data)} vital records")
    
    # Add sample prescriptions
    prescriptions_data = [
        {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "appointment_id": None,
            "diagnosis": "Seasonal Allergies",
            "medications": [
                {
                    "name": "Cetirizine",
                    "dosage": "10mg",
                    "frequency": "Once daily",
                    "duration": "30 days"
                },
                {
                    "name": "Fluticasone Nasal Spray",
                    "dosage": "50mcg",
                    "frequency": "Twice daily",
                    "duration": "30 days"
                }
            ],
            "notes": "Avoid known allergens. Use medications as prescribed. Follow up if symptoms persist after 2 weeks.",
            "created_at": datetime.utcnow() - timedelta(days=20)
        },
        {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "appointment_id": None,
            "diagnosis": "Mild Hypertension",
            "medications": [
                {
                    "name": "Amlodipine",
                    "dosage": "5mg",
                    "frequency": "Once daily in morning",
                    "duration": "90 days"
                }
            ],
            "notes": "Monitor blood pressure daily. Reduce salt intake. Regular exercise recommended. Follow up in 3 months.",
            "created_at": datetime.utcnow() - timedelta(days=45)
        },
        {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "appointment_id": None,
            "diagnosis": "Vitamin D Deficiency",
            "medications": [
                {
                    "name": "Vitamin D3",
                    "dosage": "60,000 IU",
                    "frequency": "Once weekly",
                    "duration": "8 weeks"
                },
                {
                    "name": "Calcium Carbonate",
                    "dosage": "500mg",
                    "frequency": "Twice daily with meals",
                    "duration": "60 days"
                }
            ],
            "notes": "Take supplements with meals for better absorption. Increase sun exposure (15-20 minutes daily). Recheck vitamin D levels after 2 months.",
            "created_at": datetime.utcnow() - timedelta(days=10)
        },
    ]
    
    await db.prescriptions.insert_many(prescriptions_data)
    print(f"Added {len(prescriptions_data)} prescriptions")
    
    print("\n✅ EMR data seeding completed successfully!")
    print(f"Patient: test@test.com")
    print(f"Vitals: {len(vitals_data)} records")
    print(f"Prescriptions: {len(prescriptions_data)} records")

if __name__ == "__main__":
    asyncio.run(seed_emr_data())
    client.close()
