import sys
import logging
from firebase_admin import auth
from app.services.firebase import initialize_firebase

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def create_staff_user():
    logger.info("Initializing Firebase Admin SDK...")
    try:
        initialize_firebase()
    except Exception as exc:
        logger.error("Failed to initialize Firebase Admin SDK. Check your credentials in .env: %s", exc)
        sys.exit(1)

    email = "staff@groundcontrol.com"
    password = "stadium_ops_passcode_2026"
    
    logger.info("Checking if staff user already exists...")
    try:
        existing_user = auth.get_user_by_email(email)
        logger.info("Staff user already exists (UID: %s).", existing_user.uid)
        return
    except auth.UserNotFoundError:
        logger.info("Staff user not found. Creating user %s...", email)
    
    try:
        user = auth.create_user(
            email=email,
            email_verified=True,
            password=password,
            display_name="Stadium Ops Staff",
            disabled=False
        )
        logger.info("Successfully created staff user!")
        logger.info("UID: %s", user.uid)
        logger.info("Email: %s", user.email)
        logger.info("Password: %s", password)
    except Exception as exc:
        logger.error("Failed to create staff user: %s", exc)
        sys.exit(1)

if __name__ == "__main__":
    create_staff_user()
