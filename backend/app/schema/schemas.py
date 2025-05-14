from pydantic import BaseModel, Field, EmailStr, field_validator, ValidationInfo
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "station_supervisor"

class Branch(str, Enum):
    ASANKRAGUA = "Asankragua"
    AYIEM = "Ayiem"
    ASSIN_FOSU = "Assin Fosu"
    ATTA_NE_ATTA = "Atta ne Atta"
    ATEBUBU = "Atebubu"
    BEPONG = "Bepong"
    BONGO = "Bongo"
    CAMP_15 = "Camp 15"
    DADIESO = "Dadieso"
    DAMANGO = "Damango"
    DORMAA = "Dormaa"
    DUNKWA = "Dunkwa"
    FEYIASE = "Feyiase"
    MAMASO = "Mamaso"
    MEDIE = "Medie"
    NKRUMA_NKWANTA = "Nkruma Nkwanta"
    OBUASI = "Obuasi"
    OSEIKROM = "Oseikrom"
    SUMA_AHENKRO = "Suma Ahenkro"
    TARKWA = "Tarkwa"
    TEMA = "Tema"
    TEPA = "Tepa"
    TINGA = "Tinga"
    TUMU = "Tumu"
    TUTUKA = "Tutuka"
    WA = "Wa"

class User(BaseModel):
    fullname: str
    email: EmailStr
    role: UserRole
    branch: Branch

class UserCreate(User):
    password: str

class UserUpdate(UserCreate):
    pass

class UserResponse(User):
    id: int
    fullname: str
    created_at: datetime
    updated_at: datetime


class SalesEntry(BaseModel):
    branch: Branch
    date: datetime = Field(default_factory=datetime.now)
    opening_meter_reading_ago: float = Field(default=0.0)
    closing_meter_reading_ago: float = Field(default=0.0)
    opening_meter_reading_pms: float = Field(default=0.0)
    closing_meter_reading_pms: float = Field(default=0.0)
    opening_tank_reading_ago: float = Field(default=0.0)
    closing_tank_reading_ago: float = Field(default=0.0)
    opening_tank_reading_pms: float = Field(default=0.0)
    closing_tank_reading_pms: float = Field(default=0.0)
    pump_test_ago: float = Field(default=0.0)
    pump_test_pms: float = Field(default=0.0)
    total_pump_test: float = Field(default=0.0)
    received_ago: float = Field(default=0.0)
    received_pms: float = Field(default=0.0)
    total_received: float = Field(default=0.0)
    sales_ago: float = Field(default=0.0)
    sales_pms: float = Field(default=0.0)
    total_sales: float = Field(default=0.0)
    actuals_ago: float = Field(default=0.0)
    actuals_pms: float = Field(default=0.0)
    total_actuals: float = Field(default=0.0)
    variation_ago: float = Field(default=0.0)
    variation_pms: float = Field(default=0.0)
    total_variation: float = Field(default=0.0)
    unit_price_ago: float = Field(default=0.0)
    unit_price_pms: float = Field(default=0.0)
    sales_in_cedis_ago: float = Field(default=0.0)
    sales_in_cedis_pms: float = Field(default=0.0)
    total_sales_in_cedis: float = Field(default=0.0)
    actuals_in_cedis_ago: float = Field(default=0.0)
    actuals_in_cedis_pms: float = Field(default=0.0)
    total_actuals_in_cedis: float = Field(default=0.0)
    variation_in_cedis_ago: float = Field(default=0.0)
    variation_in_cedis_pms: float = Field(default=0.0)
    total_variation_in_cedis: float = Field(default=0.0)
    collections_cash: float = Field(default=0.0)
    collections_cheque: float = Field(default=0.0)
    total_collections: float = Field(default=0.0)
    credit_ago: float = Field(default=0.0)
    credit_pms: float = Field(default=0.0)
    total_credit: float = Field(default=0.0)
    expenditure: float = Field(default=0.0)
    comment: str = Field(max_length=255)
    net_sales: float = 0.0
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    user_id: int

    @field_validator('*')
    def round_to_two_decimal_places(cls, v):
        if isinstance(v, float):
            return round(v, 2)
        return v

    
    @field_validator('closing_meter_reading_ago')
    def validate_closing_meter(cls, v, info: ValidationInfo):
        opening = info.data.get('opening_meter_reading_ago', 0)
        if opening > 0 and v < opening:
            raise ValueError('Closing meter reading cannot be less than opening reading')
        return v

    @field_validator('closing_tank_reading_ago')
    def validate_closing_tank(cls, v, info: ValidationInfo):
        opening = info.data.get('opening_tank_reading_ago', 0)
        if opening > 0 and v > opening:
            raise ValueError('Closing tank reading cannot be greater than opening reading')
        return v
    

    @field_validator('date')
    def validate_date(cls, v):

        #If v is timezone-aware, convert to naive by removing the timezone info
        if v.tzinfo is not None:
            v = v.replace(tzinfo=None)

        if v > datetime.now():
            raise ValueError('Date cannot be in the future')
        return v

    

class SalesEntryCreate(SalesEntry):
    pass

class SalesEntryUpdate(SalesEntryCreate):
    pass

class SalesEntryResponse(SalesEntryCreate):
    pass



class ShowUser(BaseModel):
    id: int
    fullname: str
    email: EmailStr
    branch: Branch
    role: UserRole
    entries: List[SalesEntry] = []
    created_at: datetime
    updated_at: datetime

class ShowEntry(BaseModel):
    entries: Optional[ShowUser] = None

    class Config:
        from_attributes = True

class Login(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class StockSummary(BaseModel):
    branch: str
    total_ago: float
    total_pms: float
    year: Optional[int] = None

class Trucks(BaseModel):
    id: int
    branch: str
    ago: float
    pms: float
    date: datetime
    driver: str
    destination: str
    truck_number: str
    user_id: int
    created_at: datetime
    updated_at: datetime
    
class TrucksCreate(Trucks):
    pass

class TrucksResponse(Trucks):
    pass
