import requests
import base64
import time
import logging
from typing import Optional
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class ZoomService:
    def __init__(self):
        self.account_id = os.getenv("ZOOM_ACCOUNT_ID")
        self.client_id = os.getenv("ZOOM_CLIENT_ID")
        self.client_secret = os.getenv("ZOOM_CLIENT_SECRET")
        self.oauth_url = os.getenv("ZOOM_OAUTH_URL")
        self.api_base_url = os.getenv("ZOOM_API_BASE_URL")
        self.access_token: Optional[str] = None
        self.token_expires_at: float = 0
        self.token_buffer_seconds = 300
    
    def get_access_token(self) -> str:
        """Get a valid access token, refreshing if necessary."""
        current_time = time.time()
        if self.access_token and current_time < (self.token_expires_at - self.token_buffer_seconds):
            return self.access_token
        return self._refresh_access_token()
    
    def _refresh_access_token(self) -> str:
        """Request a new access token from Zoom OAuth endpoint."""
        try:
            credentials = f"{self.client_id}:{self.client_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            data = {"grant_type": "client_credentials"}
            
            response = requests.post(self.oauth_url, headers=headers, data=data, timeout=10)
            
            if response.status_code != 200:
                logger.error(f"Failed to get access token: {response.status_code} - {response.text}")
                raise Exception(f"Failed to get access token: {response.text}")
            
            response_data = response.json()
            self.access_token = response_data["access_token"]
            self.token_expires_at = time.time() + response_data.get("expires_in", 3600)
            
            logger.info("Successfully obtained new Zoom access token")
            return self.access_token
        except Exception as e:
            logger.error(f"Error refreshing token: {str(e)}")
            raise
    
    def _get_headers(self):
        """Get authorization headers with valid access token."""
        token = self.get_access_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def create_meeting(self, topic: str, start_time: datetime, duration: int = 60) -> dict:
        """Create a new Zoom meeting."""
        try:
            url = f"{self.api_base_url}/users/me/meetings"
            
            payload = {
                "topic": topic,
                "type": 2,  # Scheduled meeting
                "start_time": start_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "duration": duration,
                "timezone": "Asia/Kolkata",
                "password": "123456",
                "settings": {
                    "host_video": True,
                    "participant_video": True,
                    "join_before_host": False,
                    "mute_upon_entry": False,
                    "waiting_room": True,
                    "audio": "voip",
                    "auto_recording": "none"
                }
            }
            
            response = requests.post(url, headers=self._get_headers(), json=payload, timeout=10)
            
            if response.status_code not in [200, 201]:
                logger.error(f"Failed to create meeting: {response.status_code} - {response.text}")
                raise Exception(f"Failed to create meeting: {response.text}")
            
            data = response.json()
            return {
                "meeting_id": str(data["id"]),
                "join_url": data["join_url"],
                "password": data.get("password", "123456"),
                "start_url": data.get("start_url", "")
            }
        except Exception as e:
            logger.error(f"Error creating Zoom meeting: {str(e)}")
            raise
    
    def get_meeting(self, meeting_id: str) -> dict:
        """Get details of a specific meeting."""
        try:
            url = f"{self.api_base_url}/meetings/{meeting_id}"
            response = requests.get(url, headers=self._get_headers(), timeout=10)
            
            if response.status_code != 200:
                logger.error(f"Failed to get meeting: {response.status_code} - {response.text}")
                raise Exception(f"Failed to get meeting: {response.text}")
            
            return response.json()
        except Exception as e:
            logger.error(f"Error getting Zoom meeting: {str(e)}")
            raise
    
    def delete_meeting(self, meeting_id: str) -> None:
        """Delete a meeting."""
        try:
            url = f"{self.api_base_url}/meetings/{meeting_id}"
            response = requests.delete(url, headers=self._get_headers(), timeout=10)
            
            if response.status_code not in [204, 200]:
                logger.error(f"Failed to delete meeting: {response.status_code} - {response.text}")
                raise Exception(f"Failed to delete meeting: {response.text}")
            
            logger.info(f"Successfully deleted meeting {meeting_id}")
        except Exception as e:
            logger.error(f"Error deleting Zoom meeting: {str(e)}")
            raise
