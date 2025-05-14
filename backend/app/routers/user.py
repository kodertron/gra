from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
import logging
from app.models.models import User as UserModel

from app.schema.schemas import (
    User, 
    UserCreate, 
    UserResponse, 
    ShowUser,
    UserRole,
    Branch     # Added type annotation
)
from app.database.database import get_db
from app.crud.user import (
    create_user as create_user_crud,
    get_users as get_users_crud,
    get_user as get_user_crud,
    update_user as update_user_crud,
    delete_user as delete_user_crud,        
    get_current_active_user as get_current_active_user_crud
)
from app.authentication.auth import (
    get_current_user
)

# Configure logging with proper configuration
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Custom exception class
class UserException(Exception):
    def __init__(self, detail: str, status_code: int):
        self.detail = detail
        self.status_code = status_code

# Helper functions for validation
def validate_role(role: str) -> None:
    if role not in [r.value for r in UserRole]:
        raise UserException(
            detail=f"Invalid user role. Must be one of: {[r.value for r in UserRole]}",
            status_code=status.HTTP_400_BAD_REQUEST
        )

def validate_branch(branch: str) -> None:
    if branch not in [b.value for b in Branch]:
        raise UserException(
            detail=f"Invalid branch. Must be one of: {[b.value for b in Branch]}",
            status_code=status.HTTP_400_BAD_REQUEST
        )

router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
    responses={
        404: {"description": "Not found"},
        400: {"description": "Bad Request"},
        403: {"description": "Forbidden"}
    }
)

@router.post(
    "/create-user",
    status_code=status.HTTP_201_CREATED,
    response_model=UserResponse,
    summary="Create a new user",
    description="Create a new user with the specified details",
    response_description="The created user",
)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new user with the following details:
    - **fullname**: Full name of the user
    - **email**: Email address (must be unique)
    - **password**: Password (will be hashed)
    - **role**: User role (admin, manager, or station_supervisor)
    - **branch**: Branch assignment

    Returns:
        UserResponse: The created user information

    Example:
        {
            "fullname": "John Doe",
            "email": "john@example.com",
            "role": "admin",
            "branch": "main"
        }
    """
    try:
        # Validate role and branch
        validate_role(user_data.role)
        validate_branch(user_data.branch)

        # Check if email already exists
        existing_user = db.query(UserModel).filter(UserModel.email == user_data.email).first()
        if existing_user:
            raise UserException(
                detail="User with this email already exists",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        new_user = create_user_crud(user_data, db)
        logger.info(f"Created new user: {new_user.email}")
        return new_user

    except UserException as ue:
        logger.error(f"User validation error: {ue.detail}")
        raise HTTPException(status_code=ue.status_code, detail=ue.detail)
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the user"
        )

@router.get(
    "/all-users",
    response_model=List[ShowUser],
    summary="Get all users with pagination",
    description="Get a list of all users with pagination support",
    response_description="List of users"
)
async def get_users(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, le=1000, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
    current_user: User = Depends(get_current_user)
):
    """
    Get a list of users with pagination support:
    - **skip**: Number of items to skip (default: 0, max: 1000)
    - **limit**: Number of items to return (default: 100, max: 1000)

    Returns:
        List[ShowUser]: List of user information
    """
    try:
        users = get_users_crud(db, skip=skip, limit=limit)
        logger.info(f"Retrieved {len(users)} users with skip={skip} and limit={limit}")
        return users
    except Exception as e:
        logger.error(f"Error retrieving users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving users"
        )

@router.get(
    "/get-user/{fullname}",
    response_model=ShowUser,
    summary="Get user by fullname",
    description="Get a specific user by their fullname",
    response_description="User information"
)
async def get_user(
    fullname: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific user by their fullname:
    - fullname (str): The fullname of the user to update

    Returns:
        ShowUser: User information
    """
    try:
        user = get_user_crud(fullname, db)
        if not user:
            raise UserException(
                detail=f"User with name {fullname} not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        return user
    except UserException as ue:
        logger.error(f"User retrieval error: {ue.detail}")
        raise HTTPException(status_code=ue.status_code, detail=ue.detail)
    except Exception as e:
        logger.error(f"Error retrieving user {fullname}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the user"
        )

@router.put(
    "/update-user/{fullname}",
    response_model=ShowUser,
    summary="Update user details",
    description="Update a user's details",
    response_description="Updated user information"
)
async def update_user(
    fullname: str,
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a user's details:
    - **fullname**: The fullname of the user to update

    Returns:
        ShowUser: Updated user information
    """
    try:
        # Get existing user
        user = db.query(UserModel).filter(UserModel.fullname == fullname).first()
        if not user:
            raise UserException(
                detail=f"User with name {fullname} not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # Check if current user has permission to update
        if current_user.role != "admin":
            raise UserException(
                detail="Not authorized to update this user",
                status_code=status.HTTP_403_FORBIDDEN
            )

        # Update user data
        updated_user = update_user_crud(fullname, user_data, db)
        logger.info(f"Updated user: {fullname}")
        return updated_user
    except UserException as ue:
        logger.error(f"User update error: {ue.detail}")
        raise HTTPException(status_code=ue.status_code, detail=ue.detail)
    except Exception as e:
        logger.error(f"Error updating user {fullname}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the user"
        )   

@router.delete(
    "/delete-user/{fullname}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user",
    description="Delete a user by their fullname",
    response_description="User successfully deleted"
)
async def delete_user(
    fullname: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a user by their fullname:
    - fullname (str): The fullname of the user to delete

    Returns:
        None: User successfully deleted
    """
    try:
        # Get existing user
        user = db.query(UserModel).filter(UserModel.fullname == fullname).first()
        if not user:
            raise UserException(
                detail=f"User with name {fullname} not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # Check if current user has permission to delete
        if current_user.role != "admin":
            raise UserException(
                detail="Not authorized to delete this user",
                status_code=status.HTTP_403_FORBIDDEN
            )

        # Delete user
        delete_user_crud(fullname, db)
        logger.info(f"Deleted user: {fullname}")
        return None

    except UserException as ue:
        logger.error(f"User deletion error: {ue.detail}")
        raise HTTPException(status_code=ue.status_code, detail=ue.detail)
    except Exception as e:
        logger.error(f"Error deleting user {fullname}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the user"
        )

@router.get(
    "/me/{fullname}",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the currently authenticated user's information",
    response_description="Current user information"
)
async def get_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the currently authenticated user's information.

    Returns:
        UserResponse: Current user information
    """
    try:
        # Get user data from database
        user_data = get_current_active_user_crud(current_user.fullname, db)
        logger.info(f"Retrieved current user: {current_user.email}")
        return user_data

    except UserException as ue:
        logger.error(f"Current user retrieval error: {ue.detail}")
        raise HTTPException(status_code=ue.status_code, detail=ue.detail)
    except Exception as e:
        logger.error(f"Error retrieving current user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the current user"
        )