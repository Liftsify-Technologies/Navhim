import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from auth import hash_password

async def seed_database():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("Seeding database with sample data...")
    
    # Sample doctors data
    doctors_data = [
        {
            "email": "dr.sharma@navhim.com",
            "password": "doctor123",
            "first_name": "Rajesh",
            "last_name": "Sharma",
            "role": "doctor",
            "phone": "+911234567890",
            "date_of_birth": "1980-05-15",
            "gender": "male",
            "specialization": "Cardiologist",
            "qualifications": ["MBBS", "MD Cardiology"],
            "experience": 15,
            "consultation_fee": 800.0,
            "bio": "Experienced cardiologist specializing in heart diseases and interventional cardiology.",
        },
        {
            "email": "dr.patel@navhim.com",
            "password": "doctor123",
            "first_name": "Priya",
            "last_name": "Patel",
            "role": "doctor",
            "phone": "+911234567891",
            "date_of_birth": "1985-08-20",
            "gender": "female",
            "specialization": "Pediatrician",
            "qualifications": ["MBBS", "MD Pediatrics"],
            "experience": 10,
            "consultation_fee": 600.0,
            "bio": "Child specialist with expertise in pediatric care and vaccinations.",
        },
        {
            "email": "dr.kumar@navhim.com",
            "password": "doctor123",
            "first_name": "Amit",
            "last_name": "Kumar",
            "role": "doctor",
            "phone": "+911234567892",
            "date_of_birth": "1978-03-10",
            "gender": "male",
            "specialization": "Dermatologist",
            "qualifications": ["MBBS", "MD Dermatology"],
            "experience": 18,
            "consultation_fee": 700.0,
            "bio": "Skin specialist treating various skin conditions and cosmetic dermatology.",
        },
        {
            "email": "dr.singh@navhim.com",
            "password": "doctor123",
            "first_name": "Anjali",
            "last_name": "Singh",
            "role": "doctor",
            "phone": "+911234567893",
            "date_of_birth": "1982-11-25",
            "gender": "female",
            "specialization": "Gynecologist",
            "qualifications": ["MBBS", "MD Gynecology"],
            "experience": 12,
            "consultation_fee": 750.0,
            "bio": "Women's health specialist providing comprehensive gynecological care.",
        },
        {
            "email": "dr.mehta@navhim.com",
            "password": "doctor123",
            "first_name": "Vikram",
            "last_name": "Mehta",
            "role": "doctor",
            "phone": "+911234567894",
            "date_of_birth": "1975-06-30",
            "gender": "male",
            "specialization": "Orthopedist",
            "qualifications": ["MBBS", "MS Orthopedics"],
            "experience": 20,
            "consultation_fee": 900.0,
            "bio": "Orthopedic surgeon specializing in joint replacements and sports injuries.",
        },
    ]
    
    for doctor_data in doctors_data:
        # Check if doctor already exists
        existing_user = await db.users.find_one({"email": doctor_data["email"]})
        if existing_user:
            print(f"Doctor {doctor_data['email']} already exists, skipping...")
            continue
        
        # Create user
        user_dict = {
            "email": doctor_data["email"],
            "password": hash_password(doctor_data["password"]),
            "role": doctor_data["role"],
            "first_name": doctor_data["first_name"],
            "last_name": doctor_data["last_name"],
            "phone": doctor_data["phone"],
            "date_of_birth": doctor_data["date_of_birth"],
            "gender": doctor_data["gender"],
            "created_at": datetime.utcnow()
        }
        
        result = await db.users.insert_one(user_dict)
        user_id = str(result.inserted_id)
        
        # Create doctor profile
        doctor_profile = {
            "user_id": user_id,
            "specialization": doctor_data["specialization"],
            "qualifications": doctor_data["qualifications"],
            "experience": doctor_data["experience"],
            "consultation_fee": doctor_data["consultation_fee"],
            "rating": 4.5,
            "bio": doctor_data["bio"],
            "availability": [],
            "verified": True,
            "created_at": datetime.utcnow()
        }
        
        await db.doctors.insert_one(doctor_profile)
        print(f"Created doctor: Dr. {doctor_data['first_name']} {doctor_data['last_name']} ({doctor_data['specialization']})")
    
    print("Database seeding completed!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
