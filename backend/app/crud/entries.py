from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, extract, func, union_all, literal, Numeric
from datetime import datetime
from typing import Optional
from sqlalchemy.exc import SQLAlchemyError
from app.schema.schemas import SalesEntryCreate, TrucksCreate
from app.models import models
from app.database.database import get_db


# Custom exception class
class ValidationError(Exception):
    def __init__(self, detail: str, status_code: int):
        self.detail = detail
        self.status_code = status_code

        
def get_latest_reading(db: Session, branch: str):
    return db.query(models.SalesEntry).filter(
        models.SalesEntry.branch == branch
    ).order_by(desc(models.SalesEntry.created_at)).first()   

def create_sales_entry(entry_data: SalesEntryCreate, db: Session, current_user: models.User):
    try:
        # Create the SQLAlchemy model from entry data
        new_entry = models.SalesEntry(
            branch=entry_data.branch,
            date=entry_data.date,
            opening_meter_reading_ago=entry_data.opening_meter_reading_ago,
            closing_meter_reading_ago=entry_data.closing_meter_reading_ago,
            opening_meter_reading_pms=entry_data.opening_meter_reading_pms,
            closing_meter_reading_pms=entry_data.closing_meter_reading_pms,
            opening_tank_reading_ago=entry_data.opening_tank_reading_ago,
            closing_tank_reading_ago=entry_data.closing_tank_reading_ago,
            opening_tank_reading_pms=entry_data.opening_tank_reading_pms,
            closing_tank_reading_pms=entry_data.closing_tank_reading_pms,
            pump_test_ago=entry_data.pump_test_ago,
            pump_test_pms=entry_data.pump_test_pms,
            total_pump_test=entry_data.total_pump_test,
            received_ago=entry_data.received_ago,
            received_pms=entry_data.received_pms,
            total_received=entry_data.total_received,
            actuals_ago=entry_data.actuals_ago,
            actuals_pms=entry_data.actuals_pms,
            total_actuals=entry_data.total_actuals,
            sales_ago=entry_data.sales_ago,
            sales_pms=entry_data.sales_pms,
            total_sales=entry_data.total_sales,
            variation_ago=entry_data.variation_ago,
            variation_pms=entry_data.variation_pms,
            total_variation=entry_data.total_variation,
            unit_price_ago=entry_data.unit_price_ago,
            unit_price_pms=entry_data.unit_price_pms,
            sales_in_cedis_ago=entry_data.sales_in_cedis_ago,
            sales_in_cedis_pms=entry_data.sales_in_cedis_pms,
            total_sales_in_cedis=entry_data.total_sales_in_cedis,
            actuals_in_cedis_ago=entry_data.actuals_in_cedis_ago,
            actuals_in_cedis_pms=entry_data.actuals_in_cedis_pms,
            total_actuals_in_cedis=entry_data.total_actuals_in_cedis,
            variation_in_cedis_ago=entry_data.variation_in_cedis_ago,
            variation_in_cedis_pms=entry_data.variation_in_cedis_pms,
            total_variation_in_cedis=entry_data.total_variation_in_cedis,
            credit_ago=entry_data.credit_ago,
            credit_pms=entry_data.credit_pms,
            total_credit=entry_data.total_credit,
            collections_cash=entry_data.collections_cash,
            collections_cheque=entry_data.collections_cheque,
            total_collections=entry_data.total_collections,
            expenditure=entry_data.expenditure,
            comment=entry_data.comment,
            net_sales=entry_data.net_sales,
            user_id=current_user.id,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # Check if opening readings need to be populated
        if (new_entry.opening_meter_reading_ago == 0.0 or
            new_entry.opening_meter_reading_pms == 0.0 or
            new_entry.opening_tank_reading_ago == 0.0 or
            new_entry.opening_tank_reading_pms == 0.0 or
            new_entry.unit_price_ago == 0.0 or
            new_entry.unit_price_pms == 0.0):
            
            # Get the latest reading
            latest_reading = get_latest_reading(db, new_entry.branch)
            
            if latest_reading:
                # Update the opening readings
                if new_entry.opening_meter_reading_ago == 0.0:
                    new_entry.opening_meter_reading_ago = latest_reading.closing_meter_reading_ago
                
                if new_entry.opening_meter_reading_pms == 0.0:
                    new_entry.opening_meter_reading_pms = latest_reading.closing_meter_reading_pms
                
                if new_entry.opening_tank_reading_ago == 0.0:
                    new_entry.opening_tank_reading_ago = latest_reading.closing_tank_reading_ago
                
                if new_entry.opening_tank_reading_pms == 0.0:
                    new_entry.opening_tank_reading_pms = latest_reading.closing_tank_reading_pms
                
                if new_entry.unit_price_ago == 0.0:
                    new_entry.unit_price_ago = latest_reading.unit_price_ago

                if new_entry.unit_price_pms == 0.0:
                    new_entry.unit_price_pms = latest_reading.unit_price_pms
        
        # Debug output
        print(f"Before commit - Opening tank AGO: {new_entry.opening_tank_reading_ago}, Closing tank AGO: {new_entry.closing_tank_reading_ago}")
        print(f"Before commit - unit price AGO: {new_entry.unit_price_ago}, unit price pms: {new_entry.unit_price_pms}")
        print(f"new_entry: {new_entry}")
        # Add to session
        db.add(new_entry)
        
        # Try to commit
        try:
            db.commit()
            db.refresh(new_entry)
            return new_entry
        except ValidationError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except SQLAlchemyError as e:
            db.rollback()
            if isinstance(e.__cause__, ValidationError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e.__cause__)
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database error: {str(e)}"
                )
    except Exception as e:
        if 'db' in locals() and db.is_active:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating sales entry: {str(e)}"
        )    
    
def create_trucks_entry(entry_data: TrucksCreate, db: Session, current_user: models.User):
    try:
        # Create the SQLAlchemy model from entry data
        new_entry = models.Trucks(
            branch=entry_data.branch,
            date=entry_data.date,
            ago=entry_data.ago,
            pms=entry_data.pms,
            driver=entry_data.driver,
            destination=entry_data.destination,
            truck_number=entry_data.truck_number,
            user_id=current_user.id,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        print(f"new_entry: {new_entry}")
        # Add to session
        db.add(new_entry)
        
        # Try to commit
        try:
            db.commit()
            db.refresh(new_entry)
            return new_entry
        except ValidationError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except SQLAlchemyError as e:
            db.rollback()
            if isinstance(e.__cause__, ValidationError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e.__cause__)
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database error: {str(e)}"
                )
    except Exception as e:
        if 'db' in locals() and db.is_active:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating sales entry: {str(e)}"
        )    
    

def get_sales_entry_by_branch(branch: str, db: Session = Depends(get_db)):
    entries = db.query(models.SalesEntry).filter(models.SalesEntry.branch == branch).all()

    return entries

def get_stock_summary(db: Session, year: Optional[int] = None):
    # Create a strict year filter condition - must match exactly
    if year is not None:
        # Convert year to integer to ensure proper comparison
        try:
            year_as_int = int(year)
            # Create a filter for the exact year
            year_filter = (extract('year', models.SalesEntry.date) == year_as_int)
        except (ValueError, TypeError):
            # If year conversion fails, return empty results
            return []
    else:
        # If no year specified, get current year
        year_as_int = datetime.now().year
        year_filter = (extract('year', models.SalesEntry.date) == year_as_int)
    
    # Aggregate data by branch with proper filtering
    branch_totals = db.query(
        models.SalesEntry.branch.label("branch"),
        func.round(func.cast(func.sum(models.SalesEntry.sales_ago), Numeric), 2).label("total_ago"),
        func.round(func.cast(func.sum(models.SalesEntry.sales_pms), Numeric), 2).label("total_pms"),
        literal(year_as_int).label("year")
    ).filter(
        year_filter  # Apply the strict year filter
    ).group_by(
        models.SalesEntry.branch  # Group only by branch to aggregate all entries for the year
    ).order_by(models.SalesEntry.branch).all()
    
    # Calculate the overall total for all branches in the specified year
    overall_totals = db.query(
        literal("Total").label("branch"),
        func.round(func.cast(func.sum(models.SalesEntry.sales_ago), Numeric), 2).label("total_ago"),
        func.round(func.cast(func.sum(models.SalesEntry.sales_pms), Numeric), 2).label("total_pms"),
        literal(year_as_int).label("year")
    ).filter(
        year_filter  # Apply the same year filter
    ).first()
    
    # Format the branch totals
    formatted_entries = [
        {
            "branch": entry.branch,
            "total_ago": entry.total_ago,
            "total_pms": entry.total_pms,
            "year": entry.year
        }
        for entry in branch_totals
    ]
    
    # Add the overall total row
    if overall_totals:
        formatted_entries.append({
            "branch": overall_totals.branch,
            "total_ago": overall_totals.total_ago,
            "total_pms": overall_totals.total_pms,
            "year": overall_totals.year
        })
    
    return formatted_entries


def get_sales_entries(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):

    """
    Retrieve sales entries with optional filtering and pagination
    
    Args:
        db: Database session
        skip: Number of items to skip
        limit: Maximum number of items to return
        branch: Filter by branch name
        start_date: Filter entries after this date
        end_date: Filter entries before this date
    
    Returns:
        List of SalesEntry objects
    """
    entries = db.query(models.SalesEntry).offset(skip).limit(limit).all()
    return entries

# This function has been moved and improved above
# The improved version filters by year and aggregates by branch


def get_trucks_entries(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):

    """
    Retrieve trucks entries with optional filtering and pagination
    
    Args:
        db: Database session
        skip: Number of items to skip
        limit: Maximum number of items to return
        branch: Filter by branch name
        start_date: Filter entries after this date
        end_date: Filter entries before this date
    
    Returns:
        List of Trucks objects
    """
    entries = db.query(models.Trucks).offset(skip).limit(limit).all()
    return entries

def update_sales_entry(entry_id: int, entry: SalesEntryCreate, db: Session, current_user: models.User):
    db_entry = db.query(models.SalesEntry).filter(models.SalesEntry.id == entry_id).first()
    
    if not db_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sales entry with id {entry_id} not found"
        )
        
    if db_entry.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this entry"
        )
    
    entry_data = entry.model_dump()
    for key, value in entry_data.items():
        setattr(db_entry, key, value)
    
    db_entry.updated_at = datetime.now()
    db.commit()
    db.refresh(db_entry)
    
    return db_entry

def update_trucks_entry(entry_id: int, entry: TrucksCreate, db: Session, current_user: models.User):
    db_entry = db.query(models.Trucks).filter(models.Trucks.id == entry_id).first()
    
    if not db_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trucks entry with id {entry_id} not found"
        )
        
    if db_entry.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this entry"
        )
    
    entry_data = entry.model_dump()
    for key, value in entry_data.items():
        setattr(db_entry, key, value)
    
    db_entry.updated_at = datetime.now()
    db.commit()
    db.refresh(db_entry)
    
    return db_entry

def delete_sales_entry(entry_id: int, db: Session, current_user: models.User):
    db_entry = db.query(models.SalesEntry).filter(models.SalesEntry.id == entry_id).first()
    
    if not db_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sales entry with id {entry_id} not found"
        )
        
    if db_entry.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this entry"
        )
    
    db.delete(db_entry)
    db.commit()
    return None

def delete_trucks_entry(entry_id: int, db: Session, current_user: models.User):
    db_entry = db.query(models.Trucks).filter(models.Trucks.id == entry_id).first()
    
    if not db_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trucks entry with id {entry_id} not found"
        )
        
    if db_entry.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this entry"
        )
    
    db.delete(db_entry)
    db.commit()
    return None