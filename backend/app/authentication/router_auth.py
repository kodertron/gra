from fastapi import APIRouter, status, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app.schema.schemas import Login
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.authentication import crud_auth, auth




router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)





@router.post("/login", status_code=status.HTTP_200_OK)
async def login(credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Convert OAuth2PasswordRequestForm to your Login schema if needed
    login_data = Login(email=credentials.username, password=credentials.password)
    results = await crud_auth.login(login_data, db)
    return results

@router.post("/refresh", response_model=auth.Token)
async def refresh_token(refresh_request: auth.RefreshRequest, db: Session = Depends(get_db)):
    """
    Get a new access token using a refresh token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify the refresh token
    try:
        # Check that it's a valid refresh token
        user = auth.verify_token(refresh_request.refresh_token, credentials_exception, db, token_type="refresh")
        
        # Generate new tokens
        access_token = auth.create_access_token(data={"sub": user.email})
        new_refresh_token = auth.create_refresh_token(data={"sub": user.email})
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }
        
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}")
        raise credentials_exception

# This is how you use get_current_user in endpoints that need authentication
@router.get("/users/me")
async def read_users_me(current_user = Depends(auth.get_current_user)):
    return current_user
