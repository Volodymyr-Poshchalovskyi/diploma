from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import compute, optimize, materials, share

app = FastAPI(title="Composite EM API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(compute.router,   prefix="/api/compute",   tags=["compute"])
app.include_router(optimize.router,  prefix="/api/optimize",  tags=["optimize"])
app.include_router(materials.router, prefix="/api/materials", tags=["materials"])
app.include_router(share.router,     prefix="/api/share",     tags=["share"])

@app.get("/health")
def health_check():
    return {"status": "ok"}