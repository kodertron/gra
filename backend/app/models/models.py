from sqlalchemy import Column, ForeignKey, Integer, String, Float, DateTime, event
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import joblib  
from datetime import datetime
import numpy as np



class User(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    fullname = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    branch = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    entries = relationship("SalesEntry", back_populates="user")
    trucks = relationship("Trucks", back_populates="truck_user")

class Trucks(Base):
    __tablename__ = "trucks"
    id = Column(Integer, primary_key=True, index=True)
    branch = Column(String, nullable=False)
    ago = Column(Float, default=0.0, nullable=False)
    pms = Column(Float, default=0.0, nullable=False)
    date = Column(DateTime, default=datetime.now(), nullable=False)
    driver = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    truck_number = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    truck_user = relationship("User", back_populates="trucks")

class SalesEntry(Base):
    __tablename__ = "daily_entries"

    id = Column(Integer, primary_key=True, index=True)
    branch = Column(String, nullable=False)
    date = Column(DateTime, default=datetime.now(), nullable=False)
    opening_meter_reading_ago = Column(Float, default=0.0, nullable=False)
    closing_meter_reading_ago = Column(Float, default=0.0, nullable=False)
    opening_meter_reading_pms = Column(Float, default=0.0, nullable=False)
    closing_meter_reading_pms = Column(Float, default=0.0, nullable=False)
    opening_tank_reading_ago = Column(Float, default=0.0, nullable=False)
    closing_tank_reading_ago = Column(Float, default=0.0, nullable=False)
    opening_tank_reading_pms = Column(Float, default=0.0, nullable=False)
    closing_tank_reading_pms = Column(Float, default=0.0, nullable=False)
    pump_test_ago = Column(Float, default=0.0, nullable=False)
    pump_test_pms = Column(Float, default=0.0, nullable=False)
    total_pump_test = Column(Float, default=0.0, nullable=False)
    received_ago = Column(Float, default=0.0, nullable=False)
    received_pms = Column(Float, default=0.0, nullable=False)
    total_received = Column(Float, default=0.0, nullable=False)
    actuals_ago = Column(Float, default=0.0, nullable=False)
    actuals_pms = Column(Float, default=0.0, nullable=False)
    total_actuals = Column(Float, default=0.0, nullable=False)
    sales_ago = Column(Float, default=0.0, nullable=False)
    sales_pms = Column(Float, default=0.0, nullable=False)
    total_sales = Column(Float, default=0.0, nullable=False)
    variation_ago = Column(Float, default=0.0, nullable=False)
    variation_pms = Column(Float, default=0.0, nullable=False)
    total_variation = Column(Float, default=0.0, nullable=False)
    unit_price_ago = Column(Float, default=0.0, nullable=False)
    unit_price_pms = Column(Float, default=0.0, nullable=False)
    sales_in_cedis_ago = Column(Float, default=0.0, nullable=False)
    sales_in_cedis_pms = Column(Float, default=0.0, nullable=False)
    total_sales_in_cedis = Column(Float, default=0.0, nullable=False)
    actuals_in_cedis_ago = Column(Float, default=0.0, nullable=False)
    actuals_in_cedis_pms = Column(Float, default=0.0, nullable=False)
    total_actuals_in_cedis = Column(Float, default=0.0, nullable=False)
    variation_in_cedis_ago = Column(Float, default=0.0, nullable=False)
    variation_in_cedis_pms = Column(Float, default=0.0, nullable=False)
    total_variation_in_cedis = Column(Float, default=0.0, nullable=False)
    credit_ago = Column(Float, default=0.0, nullable=False)
    credit_pms = Column(Float, default=0.0, nullable=False)
    total_credit = Column(Float, default=0.0, nullable=False)
    collections_cash = Column(Float, default=0.0, nullable=False)
    collections_cheque = Column(Float, default=0.0, nullable=False)
    total_collections = Column(Float, default=0.0, nullable=False)
    expenditure = Column(Float, default=0.0, nullable=False)
    comment = Column(String, nullable=True)
    net_sales = Column(Float, default=0.0, nullable=False)
    user_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="entries")


import os
full_path = os.path.join(os.getcwd(), "the_model.joblib")
#print(os.path.exists(full_path))


    # Load your pre-trained ML model
# Adjust the path to where your model is stored
ml_model = joblib.load(full_path)

print(ml_model.feature_names_in_)


# Define the threshold for acceptable difference between predicted and actual net sales
# Adjust this value based on your needs
THRESHOLD = 30.00  # 1 cedi difference

class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass

# Function to extract features for prediction
def extract_features(sales_entry):
    """
    Extract features from a SalesEntry object for ML prediction.
    Modify this to match the features your model was trained on.
    """
    features = [
        sales_entry.opening_meter_reading_ago,
        sales_entry.opening_meter_reading_pms,
        sales_entry.closing_meter_reading_ago,
        sales_entry.closing_meter_reading_pms,
        sales_entry.opening_tank_reading_ago,
        sales_entry.opening_tank_reading_pms,
        sales_entry.closing_tank_reading_ago,
        sales_entry.closing_tank_reading_pms,
        sales_entry.pump_test_ago,
        sales_entry.pump_test_pms,
        sales_entry.received_ago,
        sales_entry.received_pms,
        sales_entry.sales_ago,
        sales_entry.sales_pms,
        sales_entry.actuals_ago,
        sales_entry.actuals_pms,
        sales_entry.variation_ago,
        sales_entry.variation_pms,
        sales_entry.unit_price_ago,
        sales_entry.unit_price_pms,
        sales_entry.actuals_in_cedis_ago,
        sales_entry.actuals_in_cedis_pms,
        sales_entry.collections_cash,
        sales_entry.collections_cheque,
        sales_entry.credit_ago,
        sales_entry.credit_pms,
        sales_entry.expenditure
        # Add any other features your model uses
    ]
    
    return np.array([features])  # Return as 2D array for sklearn models


@event.listens_for(SalesEntry, 'before_insert')
@event.listens_for(SalesEntry, 'before_update')
def validate_and_calculate_totals(mapper, connection, target):

   # First, check if we need to fill in opening readings from previous entry
    # If all opening readings are zero, it's likely a new entry that needs data from previous entry
    opening_readings_empty = (
        target.opening_meter_reading_ago == 0.0 and
        target.opening_meter_reading_pms == 0.0 and
        target.opening_tank_reading_ago == 0.0 and
        target.opening_tank_reading_pms == 0.0
    )
    
    # If opening readings are empty, we should NOT validate the closing vs opening
    # as those will be filled in later
    
    # Calculate totals first
    calculate_totals(target)

    # Skip validation for tank readings if opening readings are empty
    if not opening_readings_empty:
        # Only validate if opening readings are non-zero
        if target.opening_tank_reading_ago > 0 and target.closing_tank_reading_ago > target.opening_tank_reading_ago:
            raise ValidationError("Closing tank reading AGO cannot be greater than opening tank reading AGO")
        
        if target.opening_tank_reading_pms > 0 and target.closing_tank_reading_pms > target.opening_tank_reading_pms:
            raise ValidationError("Closing tank reading PMS cannot be greater than opening tank reading PMS")
    
    # User-provided net sales value
    user_net_sales = target.net_sales
    
    # ML model prediction for net sales
    try:
        features = extract_features(target)
        predicted_net_sales = ml_model.predict(features)[0]
        
        # Calculate the percentage difference
        
        difference_percentage = abs(user_net_sales - predicted_net_sales) 
            
            # If the difference exceeds the threshold, raise an exception
        if difference_percentage > THRESHOLD:
            raise ValidationError(
                    f"Net sales value ({user_net_sales}) differs significantly from prediction "
                    f"({predicted_net_sales}). Please verify your entries."
                )
                
        # If validation passes, update net_sales with the user-provided value
        # You could also choose to use the predicted value or keep the original calculation
        target.net_sales = user_net_sales
        
    except (ValueError, TypeError) as e:
        # Handle cases where features are invalid for prediction
        raise ValidationError(f"Could not validate sales entry: {str(e)}")

def calculate_totals(target):
    #Calculate total pump test
    target.total_pump_test = target.pump_test_ago + target.pump_test_pms

    #Calculate total received
    target.total_received = target.received_ago + target.received_pms

    #Calculate actuals
    target.actuals_ago = target.closing_meter_reading_ago - target.opening_meter_reading_ago - target.pump_test_ago
    target.actuals_pms = target.closing_meter_reading_pms - target.opening_meter_reading_pms - target.pump_test_pms

    # Calculate total actuals
    target.total_actuals = target.actuals_ago + target.actuals_pms
    
    # Calculate sales
    target.sales_ago = target.opening_tank_reading_ago - target.closing_tank_reading_ago - target.received_ago
    target.sales_pms = target.opening_tank_reading_pms - target.closing_tank_reading_pms - target.received_pms

    # Calculate total sales
    target.total_sales = target.sales_ago + target.sales_pms
    
    # Calculate variation
    target.variation_ago = target.actuals_ago - target.sales_ago
    target.variation_pms = target.actuals_pms - target.sales_pms


    # Calculate total variation
    target.total_variation = target.variation_ago + target.variation_pms
    
    # Calculate sales in cedis
    target.sales_in_cedis_ago = target.sales_ago * target.unit_price_ago
    target.sales_in_cedis_pms = target.sales_pms * target.unit_price_pms
    target.total_sales_in_cedis = target.sales_in_cedis_ago + target.sales_in_cedis_pms

    # Calculate actuals in cedis
    target.actuals_in_cedis_ago = target.actuals_ago * target.unit_price_ago
    target.actuals_in_cedis_pms = target.actuals_pms * target.unit_price_pms
    target.total_actuals_in_cedis = target.actuals_in_cedis_ago + target.actuals_in_cedis_pms
    
    # Calculate variation in cedis
    target.variation_in_cedis_ago = target.variation_ago * target.unit_price_ago
    target.variation_in_cedis_pms = target.variation_pms * target.unit_price_pms
    target.total_variation_in_cedis = target.variation_in_cedis_ago + target.variation_in_cedis_pms

    # Calculate total credit
    target.total_credit = target.credit_ago + target.credit_pms

    # Calculate total collections
    target.total_collections = target.collections_cash + target.collections_cheque
    
    # Calculate net sales (assuming this is total sales minus expenditure)
    #target.net_sales = target.total_sales_in_cedis - target.expenditure