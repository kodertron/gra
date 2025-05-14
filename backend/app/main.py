from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import entries, user
from app.authentication import router_auth
from app.database.database import engine
from app.models import models  

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_auth.router)
app.include_router(entries.router)
app.include_router(user.router)
