from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from datetime import datetime
from app.models.models import SalesEntry as EntryModel
from app.models.models import User as UserModel
from app.models.models import Trucks as TruckModel

from app.schema.schemas import (
    SalesEntry,
    SalesEntryCreate,
    SalesEntryUpdate,
    SalesEntryResponse,
    Branch,
    StockSummary,
    Trucks,
    TrucksCreate,
    TrucksResponse
    
)
from app.database.database import get_db
from app.crud.entries import (
    create_sales_entry as create_entry_crud,
    create_trucks_entry as create_truck_entry_crud,
    get_sales_entries as get_entries_crud,
    get_sales_entry_by_branch as get_entry_crud,
    update_sales_entry as update_entry_crud,
    delete_sales_entry as delete_entry_crud,
    get_stock_summary as get_stock_crud,
    get_trucks_entries as get_trucks_entries_crud,
    update_trucks_entry as update_truck_entry_crud,
    delete_trucks_entry as delete_truck_entry_crud
)
from app.authentication.auth import (
    get_current_user
)

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter(
    prefix="/api/entries",
    tags=["Entries"],
    responses={
        404: {"description": "Not found"},
        400: {"description": "Bad Request"},
        403: {"description": "Forbidden"}
    }
)

@router.get(
    "/info",
    status_code=status.HTTP_201_CREATED,
    summary="General Information about this API",
    description="This is the JUSAPP API",
    response_description="The welcome address"
)
async def info():
  return "Welcome to our API page"


    

@router.post(
    "/new",
    status_code=status.HTTP_201_CREATED,
    response_model=SalesEntryResponse,
    summary="Create a new sales entry",
    description="Create a new sales entry with the specified details",
    response_description="The created sales entry"
)
async def create_entry(
    entry_data: SalesEntryCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Create a new sales entry with the following details:
    - **branch**: Branch where the entry is recorded
    - **date**: Date of the entry
    - **readings**: Various meter readings and calculations

    Returns:
        SalesEntryResponse: The created sales entry information
    """
    try:
        # Validate branch
        if entry_data.branch not in [b.value for b in Branch]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid branch. Must be one of: {[b.value for b in Branch]}"
            )

        # Create entry
        new_entry = create_entry_crud(entry_data, db, current_user)
        logger.info(f"Created new sales entry for branch: {entry_data.branch}")
        return new_entry

    except Exception as e:
        logger.error(f"Error creating sales entry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the sales entry"
        )

@router.post(
    "/truck-new",
    status_code=status.HTTP_201_CREATED,
    response_model=TrucksResponse,
    summary="Create a new truck entry",
    description="Create a new truck entry with the specified details",
    response_description="The created truck entry"
)
async def create_truck_entry(
    entry_data: TrucksCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Create a new truck entry with the following details:
    - **branch**: Branch where the entry is recorded
    - **ago**: AGO reading
    - **pms**: PMS reading
    - **date**: Date of the entry
    - **driver**: Driver name
    - **destination**: Destination of the truck
    - **truck_number**: Truck number

    Returns:
        SalesEntryResponse: The created truck entry information
    """
    try:
        # Validate branch
        if entry_data.branch not in [b.value for b in Branch]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid branch. Must be one of: {[b.value for b in Branch]}"
            )

        # Create entry
        new_entry = create_truck_entry_crud(entry_data, db, current_user)
        logger.info(f"Created new truck entry for branch: {entry_data.branch}")
        return new_entry

    except Exception as e:
        logger.error(f"Error creating truck entry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the sales entry"
        )

@router.get(
    "/all",
    response_model=List[SalesEntryResponse],
    summary="Get all sales entries with pagination",
    description="Get a list of all sales entries with pagination support",
    response_description="List of sales entries"
)
async def get_entries(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, le=1000, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get a list of sales entries with optional filters:
    - **skip**: Number of items to skip (default: 0, max: 1000)
    - **limit**: Number of items to return (default: 100, max: 1000)
    - **branch**: Filter by branch name
    - **start_date**: Filter entries from this date
    - **end_date**: Filter entries up to this date

    Returns:
        List[SalesEntryResponse]: List of sales entries
    """
    try:
        entries = get_entries_crud(
            db,
            skip=skip,
            limit=limit
        )
        logger.info(f"Retrieved {len(entries)} entries with skip={skip} and limit={limit}")
        return entries

    except Exception as e:
        logger.error(f"Error retrieving entries: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving sales entries"
        )

@router.get(
    "/all-trucks",
    response_model=List[TrucksResponse],
    summary="Get all trucks entries with pagination",
    description="Get a list of all trucks entries with pagination support",
    response_description="List of trucks entries"
)
async def get_entries(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, le=1000, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of items to return"),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get a list of trucks entries with optional filters:
    - **skip**: Number of items to skip (default: 0, max: 1000)
    - **limit**: Number of items to return (default: 100, max: 1000)
    - **branch**: Filter by branch name
    - **start_date**: Filter entries from this date
    - **end_date**: Filter entries up to this date

    Returns:
        List[TrucksResponse]: List of trucks entries
    """
    try:
        entries = get_trucks_entries_crud(
            db,
            skip=skip,
            limit=limit
        )
        logger.info(f"Retrieved {len(entries)} entries with skip={skip} and limit={limit}")
        return entries

    except Exception as e:
        logger.error(f"Error retrieving entries: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving trucks entries"
        )


@router.get(
    "/stock-summary",
    response_model=List[StockSummary],
    summary="Get stock summary",
    description="Get a list of the total stocks per branch",
    response_description="List of stock summary"
)
async def get_stock_summary(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get a list of sales entries with optional filters:
    - **branch**: Filter by branch name
    

    Returns:
        List[StockSummary]: List of stock summary
    """
    try:
        # Call function with positional arguments matching the function definition
        entries = get_stock_crud(db, year)
        
        # Explicitly transform each entry to match the StockSummary schema
        # Handle both dictionary-like and object-like entries
        formatted_entries = []
        
        for entry in entries:
            try:
                # Try to handle both object and dictionary formats
                if hasattr(entry, 'branch'):
                    # It's an object with attributes
                    branch = entry.branch
                    
                    # Check if it's a SalesEntry object (different field names)
                    if hasattr(entry, 'sales_ago') and not hasattr(entry, 'total_ago'):
                        # It's a SalesEntry object, map the fields appropriately
                        total_ago = float(entry.sales_ago if entry.sales_ago is not None else 0)
                        total_pms = float(entry.sales_pms if entry.sales_pms is not None else 0)
                        year = entry.date.year if hasattr(entry, 'date') else None
                    else:
                        # It already has total_ago fields
                        total_ago = float(entry.total_ago if hasattr(entry, 'total_ago') and entry.total_ago is not None else 0)
                        total_pms = float(entry.total_pms if hasattr(entry, 'total_pms') and entry.total_pms is not None else 0)
                        year = entry.year if hasattr(entry, 'year') else None
                else:
                    # It's a dictionary
                    branch = entry["branch"]
                    
                    # Check if it has sales_ago instead of total_ago
                    if "sales_ago" in entry and "total_ago" not in entry:
                        total_ago = float(entry["sales_ago"] if entry["sales_ago"] is not None else 0)
                        total_pms = float(entry["sales_pms"] if entry["sales_pms"] is not None else 0)
                        year = entry["date"].year if "date" in entry else None
                    else:
                        total_ago = float(entry["total_ago"] if "total_ago" in entry and entry["total_ago"] is not None else 0)
                        total_pms = float(entry["total_pms"] if "total_pms" in entry and entry["total_pms"] is not None else 0)
                        year = entry["year"] if "year" in entry else None
                
                formatted_entries.append(StockSummary(
                    branch=branch,
                    total_ago=total_ago,
                    total_pms=total_pms,
                    year=year
                ))
            except Exception as e:
                logger.error(f"Error formatting entry: {e}, Entry: {entry}")
                # Continue with next entry if one fails
        
        logger.info(f"Retrieved {len(formatted_entries)} entries")
        return formatted_entries

    except Exception as e:
        logger.error(f"Error retrieving entries: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving sales entries"
        )

@router.get(
    "/{branch}",
    response_model=List[SalesEntryResponse],
    summary="Get sales entry by branch",
    description="Get a specific sales entry by their branch",
    response_description="Sales entry information"
)
async def get_entry(
    branch: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get a specific sales entry by their ID:
    - **branch**: Branch of the sales entry to retrieve

    Returns:
        SalesEntryResponse: Sales entry information
    """
    try:
        entry = get_entry_crud(branch, db)
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sales entry for branch {branch} not found"
            )
        return entry

    except Exception as e:
        logger.error(f"Error retrieving entry {branch}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the sales entry"
        )

@router.put(
    "/{entry_id}",
    response_model=SalesEntryResponse,
    summary="Update sales entry",
    description="Update a sales entry's details",
    response_description="Updated sales entry information"
)
async def update_entry(
    entry_id: int,
    entry_data: SalesEntryUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Update a sales entry's details:
    - **entry_id**: ID of the sales entry to update

    Returns:
        SalesEntryResponse: Updated sales entry information
    """
    try:
        # Validate branch if provided
        if entry_data.branch and entry_data.branch not in [b.value for b in Branch]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid branch. Must be one of: {[b.value for b in Branch]}"
            )

        # Update entry
        updated_entry = update_entry_crud(entry_id, entry_data, db, current_user)
        logger.info(f"Updated sales entry: {entry_id}")
        return updated_entry

    except Exception as e:
        logger.error(f"Error updating entry {entry_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the sales entry"
        )

@router.delete(
    "/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete sales entry",
    description="Delete a sales entry by their ID",
    response_description="Sales entry successfully deleted"
)
async def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Delete a sales entry by their ID:
    - **entry_id**: ID of the sales entry to delete

    Returns:
        None: Sales entry successfully deleted
    """
    try:
        # Delete entry
        delete_entry_crud(entry_id, db, current_user)
        logger.info(f"Deleted sales entry: {entry_id}")
        return None

    except Exception as e:
        logger.error(f"Error deleting entry {entry_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the sales entry"
        )

