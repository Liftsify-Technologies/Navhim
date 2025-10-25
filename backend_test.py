#!/usr/bin/env python3
"""
NAVHIM Hospital Management System Backend API Tests
Testing payment and appointment functionality
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any

# Configuration
BASE_URL = "https://medconnect-98.preview.emergentagent.com/api"
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "Test@123"

class NAVHIMAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.access_token = None
        self.user_id = None
        self.test_results = []
        
    def log_result(self, test_name: str, success: bool, message: str, response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if not success and response_data:
            print(f"   Response: {response_data}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> requests.Response:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        
        default_headers = {"Content-Type": "application/json"}
        if self.access_token:
            default_headers["Authorization"] = f"Bearer {self.access_token}"
        
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def test_authentication(self):
        """Test user authentication"""
        print("\n=== Testing Authentication ===")
        
        # First try to register a new user if login fails
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        try:
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                
                self.log_result(
                    "User Login", 
                    True, 
                    f"Successfully logged in as {TEST_EMAIL}",
                    {"user_id": self.user_id, "token_received": bool(self.access_token)}
                )
                return True
            else:
                # Try to register new user
                print("Login failed, attempting to register new test user...")
                return self.test_user_registration()
                
        except Exception as e:
            self.log_result("User Login", False, f"Login error: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        from datetime import date
        
        register_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "first_name": "Test",
            "last_name": "Patient",
            "phone": "+1234567890",
            "date_of_birth": "1990-01-01",
            "gender": "male",
            "role": "patient"
        }
        
        try:
            response = self.make_request("POST", "/auth/register", register_data)
            
            if response.status_code == 201:
                data = response.json()
                self.access_token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                
                self.log_result(
                    "User Registration", 
                    True, 
                    f"Successfully registered and logged in as {TEST_EMAIL}",
                    {"user_id": self.user_id, "token_received": bool(self.access_token)}
                )
                return True
            else:
                self.log_result(
                    "User Registration", 
                    False, 
                    f"Registration failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("User Registration", False, f"Registration error: {str(e)}")
            return False
    
    def test_doctor_listing(self):
        """Test doctor listing APIs"""
        print("\n=== Testing Doctor Listing ===")
        
        # Test get specializations
        try:
            response = self.make_request("GET", "/specializations")
            if response.status_code == 200:
                data = response.json()
                specializations = data.get("specializations", [])
                self.log_result(
                    "Get Specializations",
                    True,
                    f"Retrieved {len(specializations)} specializations",
                    {"count": len(specializations), "first_few": specializations[:3]}
                )
                
                # Test doctors list with specialization
                if specializations:
                    spec = specializations[0]
                    response = self.make_request("GET", f"/doctors/list?specialization={spec}")
                    if response.status_code == 200:
                        doctors_data = response.json()
                        doctors = doctors_data.get("doctors", [])
                        self.log_result(
                            "Get Doctors by Specialization",
                            True,
                            f"Retrieved {len(doctors)} doctors for {spec}",
                            {"specialization": spec, "doctor_count": len(doctors)}
                        )
                        
                        # If no doctors found, create a test doctor
                        if not doctors:
                            doctor = self.create_test_doctor()
                            if doctor:
                                return doctor
                        else:
                            return doctors[0]
                    else:
                        self.log_result(
                            "Get Doctors by Specialization",
                            False,
                            f"Failed with status {response.status_code}",
                            response.text
                        )
            else:
                self.log_result(
                    "Get Specializations",
                    False,
                    f"Failed with status {response.status_code}",
                    response.text
                )
        except Exception as e:
            self.log_result("Doctor Listing", False, f"Error: {str(e)}")
        
        return None
    
    def create_test_doctor(self):
        """Create a test doctor for testing purposes"""
        print("Creating test doctor...")
        
        # Register doctor user
        doctor_register_data = {
            "email": "doctor@test.com",
            "password": "Doctor@123",
            "first_name": "John",
            "last_name": "Smith",
            "phone": "+1234567891",
            "date_of_birth": "1980-01-01",
            "gender": "male",
            "role": "doctor"
        }
        
        try:
            response = self.make_request("POST", "/auth/register", doctor_register_data)
            
            if response.status_code == 201:
                doctor_data = response.json()
                doctor_token = doctor_data.get("access_token")
                doctor_user_id = doctor_data.get("user", {}).get("id")
                
                # Update doctor profile
                doctor_profile_data = {
                    "specialization": "General Physician",
                    "qualifications": ["MBBS", "MD"],
                    "experience": 5,
                    "consultation_fee": 500.0,
                    "bio": "Experienced general physician",
                    "verified": True
                }
                
                # Temporarily switch to doctor token
                original_token = self.access_token
                self.access_token = doctor_token
                
                profile_response = self.make_request("PUT", "/doctors/profile", doctor_profile_data)
                
                # Switch back to patient token
                self.access_token = original_token
                
                if profile_response.status_code == 200:
                    # Get the doctor's ID from the doctors collection
                    doctors_response = self.make_request("GET", "/doctors/list?specialization=General Physician")
                    if doctors_response.status_code == 200:
                        doctors_data = doctors_response.json()
                        doctors = doctors_data.get("doctors", [])
                        if doctors:
                            self.log_result(
                                "Create Test Doctor",
                                True,
                                f"Successfully created test doctor: Dr. John Smith",
                                {"doctor_id": doctors[0]["id"], "specialization": "General Physician"}
                            )
                            return doctors[0]
                
                self.log_result(
                    "Create Test Doctor",
                    False,
                    "Failed to update doctor profile or retrieve doctor data"
                )
            else:
                # Doctor might already exist, try to get existing doctor
                return self.get_existing_doctor()
                
        except Exception as e:
            self.log_result("Create Test Doctor", False, f"Error: {str(e)}")
            return self.get_existing_doctor()
    
    def get_existing_doctor(self):
        """Try to get an existing doctor from the system"""
        try:
            # Try to get all doctors
            response = self.make_request("GET", "/doctors/list")
            if response.status_code == 200:
                doctors_data = response.json()
                doctors = doctors_data.get("doctors", [])
                if doctors:
                    self.log_result(
                        "Get Existing Doctor",
                        True,
                        f"Found existing doctor for testing",
                        {"doctor_id": doctors[0]["id"]}
                    )
                    return doctors[0]
        except Exception as e:
            pass
        
        return None
    
    def test_appointment_booking(self, doctor_data: Dict):
        """Test appointment booking"""
        print("\n=== Testing Appointment Booking ===")
        
        if not doctor_data:
            self.log_result("Appointment Booking", False, "No doctor data available for booking")
            return None
        
        # Create appointment data
        future_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        appointment_time = "14:30"
        
        appointment_data = {
            "doctor_id": doctor_data["id"],
            "appointment_date": future_date,
            "appointment_time": appointment_time,
            "appointment_type": "video",
            "symptoms": "Regular checkup and consultation",
            "notes": "Test appointment for API testing"
        }
        
        try:
            response = self.make_request("POST", "/appointments/book", appointment_data)
            
            if response.status_code == 201:
                data = response.json()
                appointment_id = data.get("id")
                
                self.log_result(
                    "Book Appointment",
                    True,
                    f"Successfully booked appointment {appointment_id}",
                    {
                        "appointment_id": appointment_id,
                        "doctor": f"Dr. {doctor_data.get('first_name', '')} {doctor_data.get('last_name', '')}",
                        "date": future_date,
                        "type": "video",
                        "fee": data.get("consultation_fee")
                    }
                )
                return data
            else:
                self.log_result(
                    "Book Appointment",
                    False,
                    f"Booking failed with status {response.status_code}",
                    response.text
                )
                return None
                
        except Exception as e:
            self.log_result("Book Appointment", False, f"Error: {str(e)}")
            return None
    
    def test_payment_flow(self, appointment_data: Dict):
        """Test complete payment flow"""
        print("\n=== Testing Payment Flow ===")
        
        if not appointment_data:
            self.log_result("Payment Flow", False, "No appointment data for payment testing")
            return False
        
        appointment_id = appointment_data.get("id")
        consultation_fee = appointment_data.get("consultation_fee", 500)
        
        # Step 1: Create payment order
        try:
            order_data = {
                "appointment_id": appointment_id,
                "amount": int(consultation_fee * 100)  # Convert to paise
            }
            
            response = self.make_request("POST", "/payments/create-order", order_data)
            
            if response.status_code == 200:
                order_response = response.json()
                order_id = order_response.get("order_id")
                
                self.log_result(
                    "Create Payment Order",
                    True,
                    f"Payment order created: {order_id}",
                    {
                        "order_id": order_id,
                        "amount": order_response.get("amount"),
                        "currency": order_response.get("currency"),
                        "razorpay_key_id": order_response.get("razorpay_key_id")
                    }
                )
                
                # Step 2: Verify mock payment
                return self.test_payment_verification(appointment_id, order_id)
            else:
                self.log_result(
                    "Create Payment Order",
                    False,
                    f"Order creation failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Create Payment Order", False, f"Error: {str(e)}")
            return False
    
    def test_payment_verification(self, appointment_id: str, order_id: str):
        """Test payment verification with mock data"""
        
        # Generate mock payment data
        timestamp = str(int(time.time()))
        mock_payment_id = f"pay_{timestamp}"
        mock_signature = f"sig_{timestamp}"
        
        verify_data = {
            "appointment_id": appointment_id,
            "razorpay_order_id": order_id,
            "razorpay_payment_id": mock_payment_id,
            "razorpay_signature": mock_signature
        }
        
        try:
            response = self.make_request("POST", "/payments/verify", verify_data)
            
            if response.status_code == 200:
                data = response.json()
                zoom_url = data.get("zoom_join_url")
                
                self.log_result(
                    "Verify Payment",
                    True,
                    f"Payment verified successfully",
                    {
                        "success": data.get("success"),
                        "message": data.get("message"),
                        "zoom_meeting_created": bool(zoom_url),
                        "zoom_join_url": zoom_url[:50] + "..." if zoom_url else None
                    }
                )
                return True
            else:
                self.log_result(
                    "Verify Payment",
                    False,
                    f"Payment verification failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Verify Payment", False, f"Error: {str(e)}")
            return False
    
    def test_appointment_retrieval(self):
        """Test appointment retrieval APIs"""
        print("\n=== Testing Appointment Retrieval ===")
        
        # Test get my appointments
        try:
            response = self.make_request("GET", "/appointments/my")
            
            if response.status_code == 200:
                data = response.json()
                appointments = data.get("appointments", [])
                
                self.log_result(
                    "Get My Appointments",
                    True,
                    f"Retrieved {len(appointments)} appointments",
                    {
                        "appointment_count": len(appointments),
                        "has_appointments": len(appointments) > 0
                    }
                )
                
                # Test get single appointment if appointments exist
                if appointments:
                    return self.test_single_appointment_details(appointments[0])
                else:
                    self.log_result(
                        "Get Single Appointment",
                        False,
                        "No appointments available to test single appointment API"
                    )
                    return False
            else:
                self.log_result(
                    "Get My Appointments",
                    False,
                    f"Failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Get My Appointments", False, f"Error: {str(e)}")
            return False
    
    def test_single_appointment_details(self, appointment: Dict):
        """Test single appointment details API"""
        
        appointment_id = appointment.get("id")
        
        try:
            response = self.make_request("GET", f"/appointments/{appointment_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify all required fields are present
                required_fields = [
                    "id", "patient_id", "doctor_id", "appointment_datetime",
                    "appointment_type", "status", "consultation_fee", "payment_status",
                    "doctor_details", "patient_details"
                ]
                
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    doctor_details = data.get("doctor_details", {})
                    zoom_details = {
                        "zoom_meeting_id": data.get("zoom_meeting_id"),
                        "zoom_join_url": data.get("zoom_join_url"),
                        "zoom_password": data.get("zoom_password")
                    }
                    
                    self.log_result(
                        "Get Single Appointment Details",
                        True,
                        f"Retrieved complete appointment details for {appointment_id}",
                        {
                            "appointment_id": appointment_id,
                            "appointment_type": data.get("appointment_type"),
                            "payment_status": data.get("payment_status"),
                            "doctor_name": f"Dr. {doctor_details.get('first_name', '')} {doctor_details.get('last_name', '')}",
                            "specialization": doctor_details.get("specialization"),
                            "has_zoom_details": any(zoom_details.values()),
                            "zoom_meeting_created": bool(data.get("zoom_join_url"))
                        }
                    )
                    return True
                else:
                    self.log_result(
                        "Get Single Appointment Details",
                        False,
                        f"Missing required fields: {missing_fields}",
                        data
                    )
                    return False
            else:
                self.log_result(
                    "Get Single Appointment Details",
                    False,
                    f"Failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Get Single Appointment Details", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🏥 NAVHIM Hospital Management System - Backend API Tests")
        print("=" * 60)
        
        # Test authentication first
        if not self.test_authentication():
            print("\n❌ Authentication failed - cannot proceed with other tests")
            return False
        
        # Test doctor listing
        doctor_data = self.test_doctor_listing()
        
        # Test appointment booking
        appointment_data = self.test_appointment_booking(doctor_data)
        
        # Test payment flow
        payment_success = self.test_payment_flow(appointment_data)
        
        # Test appointment retrieval
        retrieval_success = self.test_appointment_retrieval()
        
        # Print summary
        self.print_test_summary()
        
        return True
    
    def print_test_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)

if __name__ == "__main__":
    tester = NAVHIMAPITester()
    tester.run_all_tests()