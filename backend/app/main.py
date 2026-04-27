from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import compute, optimize, materials, share

app = FastAPI(title="Composite EM API", version="0.1.0")

# Додаємо Vercel у список дозволених джерел
origins = [
    "http://localhost:5173",                 # Для локальної розробки
    "https://твій-проект.vercel.app",        # ВАЖЛИВО: Твій лінк з Vercel (БЕЗ слеша в кінці!)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,                   # Вставляємо наш список сюди
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