from sqlalchemy import Column, Integer, String, Text, DateTime
from .database import Base
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    password_hash = Column(String)

class Medication(Base):
    __tablename__ = "medications"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, index=True)
    dosage = Column(String)
    frequency = Column(String)
    # Could add user_id here to link to user, but for now keeping it global/simple as per original mock

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    timestamp = Column(String, default=lambda: datetime.utcnow().isoformat())
    action = Column(String)
    user = Column(String)
    status = Column(String)

class AdherenceLog(Base):
    __tablename__ = "adherence_logs"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(String)
    status = Column(String)
    timestamp = Column(String)
