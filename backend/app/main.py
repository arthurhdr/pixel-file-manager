from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, files

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Pixel Breeders API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(files.router)

@app.get("/")
def read_root():
    return {"status": "online", "service": "Pixel Breeders File Manager"}