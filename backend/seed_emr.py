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
            "blood_pressure_systolic": 125,
            "blood_pressure_diastolic": 83,
            "heart_rate": 78,
            "temperature": 98.8,
            "weight": 71.2,
            "height": 175,
            "recorded_at": datetime.utcnow() - timedelta(days=90)
        },
        {
            "patient_id": patient_id,
            "recorded_by": doctor_user["_id"],
            "blood_pressure_systolic": 122,
            "blood_pressure_diastolic": 81,
            "heart_rate": 74,
            "temperature": 98.6,
            "weight": 70.8,
            "height": 175,
            "recorded_at": datetime.utcnow() - timedelta(days=60)
        },
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
            "blood_pressure_systolic": 116,
            "blood_pressure_diastolic": 76,
            "heart_rate": 70,
            "temperature": 98.5,
            "weight": 69.5,
            "height": 175,
            "recorded_at": datetime.utcnow() - timedelta(days=7)
        },
        {
            "patient_id": patient_id,
            "recorded_by": doctor_user["_id"],
            "blood_pressure_systolic": 119,
            "blood_pressure_diastolic": 79,
            "heart_rate": 71,
            "temperature": 98.6,
            "weight": 69.9,
            "height": 175,
            "recorded_at": datetime.utcnow() - timedelta(days=2)
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
            "diagnosis": "Acute Respiratory Infection",
            "medications": [
                {
                    "name": "Azithromycin",
                    "dosage": "500mg",
                    "frequency": "Once daily",
                    "duration": "5 days"
                },
                {
                    "name": "Paracetamol",
                    "dosage": "650mg",
                    "frequency": "Every 6 hours if needed",
                    "duration": "7 days"
                },
                {
                    "name": "Cough Syrup",
                    "dosage": "10ml",
                    "frequency": "Three times daily",
                    "duration": "7 days"
                }
            ],
            "notes": "Rest and stay hydrated. Avoid cold drinks. Complete the antibiotic course even if symptoms improve. Return if fever persists beyond 3 days.",
            "created_at": datetime.utcnow() - timedelta(days=75)
        },
        {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "appointment_id": None,
            "diagnosis": "Gastroesophageal Reflux Disease (GERD)",
            "medications": [
                {
                    "name": "Pantoprazole",
                    "dosage": "40mg",
                    "frequency": "Once daily before breakfast",
                    "duration": "30 days"
                },
                {
                    "name": "Domperidone",
                    "dosage": "10mg",
                    "frequency": "Three times daily before meals",
                    "duration": "15 days"
                }
            ],
            "notes": "Avoid spicy and oily foods. Eat smaller, frequent meals. Don't lie down immediately after eating. Elevate head while sleeping.",
            "created_at": datetime.utcnow() - timedelta(days=55)
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
            "notes": "Monitor blood pressure daily. Reduce salt intake. Regular exercise recommended. Follow up in 3 months for BP review.",
            "created_at": datetime.utcnow() - timedelta(days=45)
        },
        {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "appointment_id": None,
            "diagnosis": "Seasonal Allergies",
            "medications": [
                {
                    "name": "Cetirizine",
                    "dosage": "10mg",
                    "frequency": "Once daily at bedtime",
                    "duration": "30 days"
                },
                {
                    "name": "Fluticasone Nasal Spray",
                    "dosage": "50mcg",
                    "frequency": "Two sprays each nostril twice daily",
                    "duration": "30 days"
                }
            ],
            "notes": "Avoid known allergens. Keep windows closed during high pollen season. Use air purifier if possible. Follow up if symptoms don't improve.",
            "created_at": datetime.utcnow() - timedelta(days=20)
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
            "notes": "Take supplements with meals for better absorption. Increase sun exposure 15-20 min daily. Include Vitamin D rich foods. Recheck levels after 2 months.",
            "created_at": datetime.utcnow() - timedelta(days=10)
        },
        {
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "appointment_id": None,
            "diagnosis": "Anxiety Management",
            "medications": [
                {
                    "name": "Alprazolam",
                    "dosage": "0.25mg",
                    "frequency": "As needed, max twice daily",
                    "duration": "30 days"
                },
                {
                    "name": "Propranolol",
                    "dosage": "10mg",
                    "frequency": "Once daily",
                    "duration": "30 days"
                }
            ],
            "notes": "Practice relaxation techniques daily. Regular sleep schedule important. Avoid caffeine after 2 PM. Consider counseling therapy. Follow up in 4 weeks.",
            "created_at": datetime.utcnow() - timedelta(days=3)
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
