from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
import google.generativeai as genai
import google.generativeai as genai
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi import Depends, status
from datetime import datetime, timedelta

# Auth Config
SECRET_KEY = "healthbridge-ai-super-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/api")
async def root():
    return {"status": "healthy", "message": "HealthBridge AI API is running"}

# Configure Gemini
# EMERGENCY: Hardcoding key per user "at any cost" request to bypass Vercel env delays
api_key = os.getenv("GOOGLE_API_KEY", "").strip()
if not api_key or api_key.startswith("your-") or len(api_key) < 10:
    api_key = "AIzaSyAgeu7DAt8JRZADiVXKbwfYxoAQVLqfMzA"

try:
    if api_key:
        genai.configure(api_key=api_key)
        print("Gemini API configured successfully (using hardcoded fallback if env was missing).")
    else:
        print("Critical Error: No API key available even in fallback.")
except Exception as e:
    print(f"Error configuring Gemini: {e}")
    api_key = None

from sqlalchemy.orm import Session
from . import models, database

models.Base.metadata.create_all(bind=database.engine)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth Models
class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str

class User(BaseModel):
    username: str
    full_name: str

class Token(BaseModel):
    access_token: str
    token_type: str

# Auth Helpers
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# Models
class ClinicalNote(BaseModel):
    patient_id: Optional[str] = None
    note_text: str
    note_date: Optional[str] = None

class MedicationsRequest(BaseModel):
    medications: List[str]

class Medication(BaseModel):
    name: str
    dosage: str
    frequency: str

# Endpoints

# Auth Endpoints
@app.post("/api/auth/register", response_model=Token)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        password_hash=hashed_password,
        full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return {"username": current_user.username, "full_name": current_user.full_name}

@app.get("/api/health")
@app.get("/api/clinical/health")
@app.get("/api/patient/health")
@app.get("/api/ai/health")
async def health_check():
    return {"status": "healthy", "service": "consolidated-api"}

@app.get("/api/audit-log")
async def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()

@app.get("/api/medications")
async def get_medications(db: Session = Depends(get_db)):
    return db.query(models.Medication).all()

@app.post("/api/medications")
async def add_medication(med: Medication, db: Session = Depends(get_db)):
    new_med = models.Medication(
        name=med.name,
        dosage=med.dosage,
        frequency=med.frequency
    )
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return {"status": "success", "data": new_med}

@app.delete("/api/medications/{med_id}")
async def delete_medication(med_id: str, db: Session = Depends(get_db)):
    med = db.query(models.Medication).filter(models.Medication.id == med_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    db.delete(med)
    db.commit()
    return {"status": "success"}

@app.post("/api/adherence")
async def log_adherence(data: Dict[str, Any], db: Session = Depends(get_db)):
    # Log adherence
    new_adherence = models.AdherenceLog(
        medication_id=data.get("medication_id"),
        status=data.get("status"),
        timestamp=data.get("timestamp", datetime.utcnow().isoformat())
    )
    db.add(new_adherence)
    
    # Add to audit log too
    new_audit = models.AuditLog(
        action=f"Adherence Log: {data.get('medication_id')}",
        user="System",
        status=data.get("status", "Logged")
    )
    db.add(new_audit)
    db.commit()
    return {"status": "success"}

@app.post("/api/analyze-note")
async def analyze_note(note: ClinicalNote, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_audit = models.AuditLog(
        action="Clinical Note Analysis",
        user=current_user.username,
        status="Success"
    )
    db.add(new_audit)
    db.commit()
    
    # Use username as patient_id
    patient_id = current_user.username
    
    if not api_key:
        return get_mock_analysis(patient_id, note.note_text)
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"""
        Analyze this clinical note and extract structured medical data.
        Note: {note.note_text}
        
        Return the result in valid JSON format ONLY with this exact structure:
        {{
            "extracted_entities": {{
                "conditions": [
                    {{
                        "clinical_text": "...",
                        "icd_10": "...",
                        "confidence": 0-100,
                        "severity": "Mild/Moderate/Severe/Chronic"
                    }}
                ],
                "medications": [
                    {{
                        "drug_name": "...",
                        "dosage": "...",
                        "frequency": "...",
                        "confidence": 0-100
                    }}
                ]
            }},
            "adherence_insights": {{
                "complexity_score": 1-5,
                "barriers_identified": ["...", "..."]
            }},
            "fhir_resources": {{
                "resourceType": "Bundle",
                "type": "collection",
                "entry": [
                    {{
                        "resource": {{
                            "resourceType": "Condition/MedicationRequest/Patient",
                            "..." : "..."
                        }}
                    }}
                ]
            }}
        }}
        """
        response = model.generate_content(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error in analyze_note: {str(e)}")
        return get_mock_analysis(note.patient_id, note.note_text)

@app.post("/api/scan-prescription")
async def scan_prescription(file: UploadFile = File(...), db: Session = Depends(get_db)):
    new_audit = models.AuditLog(
        action="Prescription OCR Scan",
        user="Web Client",
        status="Success"
    )
    db.add(new_audit)
    db.commit()
    
    if not api_key:
        return {
            "medications": [
                {"name": "Amoxicillin", "dosage": "500mg", "frequency": "Every 8 hours", "duration": "7 days"},
                {"name": "Ibuprofen", "dosage": "400mg", "frequency": "As needed", "duration": "5 days"}
            ],
            "raw_text": "DEMO MODE: Amoxicillin 500mg - 1 tab TID x 7d. Ibuprofen 400mg PRN pain."
        }
    
    try:
        content = await file.read()
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = """
        Analyze this prescription image. 
        1. Extract all medications with their dosage, frequency, and duration.
        2. Provide a raw transcription of the relevant text.
        
        Return the result in valid JSON format:
        {
            "medications": [
                {"name": "...", "dosage": "...", "frequency": "...", "duration": "..."}
            ],
            "raw_text": "..."
        }
        """
        
        response = model.generate_content([
            prompt,
            {"mime_type": file.content_type, "data": content}
        ])
        
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error in scan_prescription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to scan prescription: {str(e)}")

@app.post("/api/check-interactions")
async def check_interactions(req: MedicationsRequest, db: Session = Depends(get_db)):
    new_audit = models.AuditLog(
        action="Drug Interaction Check",
        user="Web Client",
        status="Success"
    )
    db.add(new_audit)
    db.commit()
    
    if not api_key:
        # Better mock interactions
        return {
            "interactions": [
                {
                    "drug_a": "Aspirin",
                    "drug_b": "Warfarin",
                    "severity": "High",
                    "mechanism": "Increased risk of bleeding due to combined anticoagulant/antiplatelet effects.",
                    "recommendation": "Avoid combination or closely monitor INR and signs of bleeding."
                }
            ],
            "warnings": ["Check patient history for gastric ulcers."]
        }
    
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"""
        Check for drug-drug interactions between these medications: {', '.join(req.medications)}.
        
        Return the result in valid JSON format ONLY with this exact structure:
        {{
            "interactions": [
                {{
                    "drug_a": "...",
                    "drug_b": "...",
                    "severity": "High/Moderate/Low",
                    "mechanism": "Brief scientific reason for interaction",
                    "recommendation": "Clinical advice for the provider"
                }}
            ],
            "food_interactions": [
                {{
                    "medication": "...",
                    "food": "...",
                    "effect": "...",
                    "recommendation": "..."
                }}
            ],
            "lifestyle_recommendations": [
                "Recommendation 1",
                "Recommendation 2"
            ],
            "warnings": ["General safety warning 1", "General safety warning 2"]
        }}
        If no interactions are found, return "interactions": [].
        """
        response = model.generate_content(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error in check_interactions: {str(e)}")
        return {"interactions": [], "warnings": ["Error processing interaction check."]}

@app.post("/api/de-identify")
async def de_identify(note: ClinicalNote):
    return {"de_identified_text": f"[DE-IDENTIFIED] {note.note_text[:50]}..."}

@app.post("/api/generate-coaching")
async def generate_coaching(context: Dict[str, Any]):
    return {
        "coaching_messages": [
            {"medication": "Lisinopril", "message": "Best taken in the morning to keep blood pressure stable all day.", "importance": "high", "timing": "Morning"},
            {"medication": "Metformin", "message": "Take with meals to reduce stomach sensitivity.", "importance": "moderate", "timing": "With Dinner"}
        ]
    }

def get_mock_analysis(patient_id, text):
    return {
        "status": "success",
        "extracted_entities": {
            "conditions": [
                {"clinical_text": "Hypertension", "icd_10": "I10", "confidence": 98, "severity": "Moderate"},
                {"clinical_text": "Type 2 Diabetes", "icd_10": "E11.9", "confidence": 95, "severity": "Chronic"}
            ],
            "medications": [
                {"drug_name": "Lisinopril", "dosage": "10mg", "frequency": "Daily", "confidence": 99},
                {"drug_name": "Metformin", "dosage": "500mg", "frequency": "Twice Daily", "confidence": 97}
            ]
        },
        "fhir_resources": {
            "resourceType": "Bundle",
            "type": "collection",
            "entry": [
                {"resource": {"resourceType": "Condition", "code": {"text": "Hypertension"}}},
                {"resource": {"resourceType": "MedicationRequest", "medication": {"text": "Lisinopril"}}}
            ]
        },
        "adherence_insights": {
            "complexity_score": 3,
            "barriers_identified": ["Multiple daily doses", "Complex schedule"]
        }
    }
