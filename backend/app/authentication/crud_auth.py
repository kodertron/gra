from fastapi import status, Depends, HTTPException
from app.schema.schemas import Login
from sqlalchemy.orm import Session
from app.database import database
from app.models import models
from app.crud.hashing import pwd_ctx
from app.authentication import auth



async def login(credentials: Login, db: Session = Depends(database.get_db)):
    #if "@" in credentials.user_identifier:
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    
    #else:
    #    user = db.query(models.Client).filter(models.Client.name == credentials.user_identifier).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid Credentials"
        )

    #verify password
        
    if not pwd_ctx.verify(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incorrect password"
        )
    

    # Generate JWT tokens
    # Create access token (short-lived)
    access_token = auth.create_access_token(data={"sub": user.email})
    
    # Create refresh token (long-lived)
    refresh_token = auth.create_refresh_token(data={"sub": user.email})
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # For backward compatibility
    verification_token = auth.verify_token(access_token, credentials_exception, db)

    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer", 
        "verification_token": verification_token
    }

    
