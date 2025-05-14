from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.models.models import User as UserModel
from app.database.database import get_db
from app.schema.schemas import Token, RefreshRequest
from sqlalchemy.orm import Session
import logging


# Configure logging with proper configuration
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

SECRET_KEY = "XRIBgK1LyJm03uW239EzkY7RRHeludmXi090dDSwUFY="
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")




def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    to_encode.update({"token_type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    to_encode.update({"token_type": "refresh"})  # Mark this as a refresh token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(db: Session, email: str):
    """Get user by email from database"""
    return db.query(UserModel).filter(UserModel.email == email).first()

def verify_token(token: str, credentials_exception: HTTPException, db: Session, token_type: str = "access"):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            logger.error("Email not found in token payload")
            raise credentials_exception
            
        # Check token type if specified
        if token_type and payload.get("token_type") != token_type:
            logger.error(f"Invalid token type. Expected {token_type}, got {payload.get('token_type')}")
            raise credentials_exception
        
    except JWTError as e:
        logger.error(f"JWT Error: {str(e)}")
        raise credentials_exception
    
    user = get_user_by_email(db, email=email)
    
    if not user:
        logger.error(f"User not found for email: {email}")
        raise credentials_exception
    
    return user



async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    return verify_token(token, credentials_exception, db)


