import razorpay
import hmac
import hashlib
import os
import logging

logger = logging.getLogger(__name__)

class RazorpayService:
    def __init__(self):
        self.key_id = os.getenv("RAZORPAY_KEY_ID")
        self.key_secret = os.getenv("RAZORPAY_KEY_SECRET")
        self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
    
    def create_order(self, amount: float, currency: str = "INR", receipt: str = None) -> dict:
        """
        Create a Razorpay order.
        Amount should be in rupees, will be converted to paise.
        """
        try:
            amount_in_paise = int(amount * 100)
            order_data = {
                "amount": amount_in_paise,
                "currency": currency,
                "payment_capture": 1
            }
            if receipt:
                order_data["receipt"] = receipt
            
            order = self.client.order.create(data=order_data)
            logger.info(f"Created Razorpay order: {order['id']}")
            return order
        except Exception as e:
            logger.error(f"Error creating Razorpay order: {str(e)}")
            raise
    
    def verify_payment_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        """
        Verify the payment signature from Razorpay.
        """
        try:
            generated_signature = hmac.new(
                self.key_secret.encode(),
                f"{order_id}|{payment_id}".encode(),
                hashlib.sha256
            ).hexdigest()
            
            is_valid = hmac.compare_digest(generated_signature, signature)
            if is_valid:
                logger.info(f"Payment signature verified for payment: {payment_id}")
            else:
                logger.warning(f"Invalid payment signature for payment: {payment_id}")
            return is_valid
        except Exception as e:
            logger.error(f"Error verifying payment signature: {str(e)}")
            return False
    
    def get_payment_details(self, payment_id: str) -> dict:
        """Get details of a payment."""
        try:
            payment = self.client.payment.fetch(payment_id)
            return payment
        except Exception as e:
            logger.error(f"Error fetching payment details: {str(e)}")
            raise
