from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import exc
import logging
from datetime import datetime

from app.schema.schemas import UserCreate, UserResponse, ShowUser, UserRole, Branch
from app.models.models import User as UserModel
from app.crud import hashing

# Configure logging
logger = logging.getLogger(__name__)

def create_user(user_data: UserCreate, db: Session) -> UserResponse:
    """
    Create a new user with proper error handling and validation.
    
    Args:
        user_data (UserCreate): User creation data
        db (Session): SQLAlchemy database session
    
    Returns:
        UserResponse: Created user data
    
    Raises:
        ValueError: If email already exists
        ValueError: If invalid role or branch
    """
    try:
        # Validate role
        if user_data.role not in [role.value for role in UserRole]:
            raise ValueError(f"Invalid user role. Must be one of: {[role.value for role in UserRole]}")
        
        # Validate branch
        if user_data.branch not in [branch.value for branch in Branch]:
            raise ValueError(f"Invalid branch. Must be one of: {[branch.value for branch in Branch]}")
        
        # Check if email already exists
        existing_user = db.query(UserModel).filter(UserModel.email == user_data.email).first()
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Create new user
        new_user = UserModel(
            fullname=user_data.fullname,
            email=user_data.email,
            hashed_password=hashing.Hash.bcrypt(user_data.password),
            role=user_data.role,
            branch=user_data.branch,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"Created new user: {new_user.email}")
        return new_user
    
    except exc.IntegrityError as e:
        logger.error(f"Database error creating user: {str(e)}")
        db.rollback()
        raise ValueError("Error creating user. Please check your input data.")
    
    except Exception as e:
        logger.error(f"Unexpected error creating user: {str(e)}")
        db.rollback()
        raise

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[ShowUser]:
    """
    Get a list of users with pagination.
    
    Args:
        db (Session): SQLAlchemy database session
        skip (int): Number of records to skip
        limit (int): Maximum number of records to return
    
    Returns:
        List[ShowUser]: List of user data
    """
    try:
        users = db.query(UserModel).offset(skip).limit(limit).all()
        logger.info(f"Retrieved {len(users)} users with skip={skip} and limit={limit}")
        return users
    
    except Exception as e:
        logger.error(f"Error retrieving users: {str(e)}")
        raise

def get_user(fullname: str, db: Session) -> Optional[ShowUser]:
    """
    Get a specific user by fullname.
    
    Args:
        fullname (str): The fullname of the user to update
        db (Session): SQLAlchemy database session
    
    Returns:
        Optional[ShowUser]: User data if found, None otherwise
    """
    try:
        user = db.query(UserModel).filter(UserModel.fullname == fullname).first()
        if user:
            logger.info(f"Retrieved user ID: {fullname}")
        return user
    
    except Exception as e:
        logger.error(f"Error retrieving user {fullname}: {str(e)}")
        raise

def get_current_active_user(fullname: str, db: Session) -> UserResponse:
    """
    Get the current active user's information.
    
    Args:
        fullname (str): The fullname of the user to update
        db (Session): SQLAlchemy database session
    
    Returns:
        UserResponse: User data if found
    
    Raises:
        ValueError: If user not found
    """
    try:
        user = db.query(UserModel).filter(UserModel.fullname == fullname).first()
        if not user:
            raise ValueError(f"User with ID {fullname} not found")
        
        logger.info(f"Retrieved current user ID: {fullname}")
        return user
    
    except Exception as e:
        logger.error(f"Error retrieving current user {fullname}: {str(e)}")
        raise

def update_user(fullname: str, user_data: UserCreate, db: Session) -> ShowUser:
    """
    Update an existing user's data.
    
    Args:
        fullname (str): The fullname of the user to update
        user_data (UserCreate): Updated user data
        db (Session): SQLAlchemy database session
    
    Returns:
        ShowUser: Updated user data
    
    Raises:
        ValueError: If user not found
        ValueError: If invalid role or branch
    """
    try:
        # Get existing user
        user = db.query(UserModel).filter(UserModel.fullname == fullname).first()
        if not user:
            raise ValueError(f"User with ID {fullname} not found")
        
        # Validate role
        if user_data.role not in [role.value for role in UserRole]:
            raise ValueError(f"Invalid user role. Must be one of: {[role.value for role in UserRole]}")
        
        # Validate branch
        if user_data.branch not in [branch.value for branch in Branch]:
            raise ValueError(f"Invalid branch. Must be one of: {[branch.value for branch in Branch]}")
        
        # Update user data
        user.fullname = user_data.fullname
        user.email = user_data.email
        user.hashed_password = hashing.Hash.bcrypt(user_data.password)
        user.role = user_data.role
        user.branch = user_data.branch
        user.updated_at = datetime.now()
        
        db.commit()
        db.refresh(user)
        
        logger.info(f"Updated user: {fullname}")
        return user
    
    except exc.IntegrityError as e:
        logger.error(f"Database error updating user: {str(e)}")
        db.rollback()
        raise ValueError("Error updating user. Please check your input data.")
    
    except Exception as e:
        logger.error(f"Unexpected error updating user: {str(e)}")
        db.rollback()
        raise

def delete_user(fullname: str, db: Session) -> None:
    """
    Delete a user by fullname.
    
    Args:
        fullname (str): The fullname of the user to delete
        db (Session): SQLAlchemy database session
    
    Raises:
        ValueError: If user not found
    """
    try:
        # Get user to delete
        user = db.query(UserModel).filter(UserModel.fullname == fullname).first()
        if not user:
            raise ValueError(f"User with ID {fullname} not found")
        
        # Delete user
        db.delete(user)
        db.commit()
        
        logger.info(f"Deleted user ID: {fullname}")
    
    except exc.IntegrityError as e:
        logger.error(f"Database error deleting user: {str(e)}")
        db.rollback()
        raise ValueError("Error deleting user. Please check if the user exists.")
    
    except Exception as e:
        logger.error(f"Unexpected error deleting user: {str(e)}")
        db.rollback()
        raise ValueError("Error deleting user. Please check if the user exists.")