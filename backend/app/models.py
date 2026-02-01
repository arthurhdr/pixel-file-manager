from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
from zoneinfo import ZoneInfo

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    files = relationship("File", back_populates="owner")

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    original_name = Column(String, index=True) 
    content_type = Column(String)
    is_deleted = Column(Boolean, default=False) 
    created_at = Column(DateTime, default=datetime.now(ZoneInfo("America/Sao_Paulo")))
    updated_at = Column(DateTime, default=datetime.now(ZoneInfo("America/Sao_Paulo")), onupdate=datetime.now(ZoneInfo("America/Sao_Paulo")))

    owner = relationship("User", back_populates="files")
    versions = relationship("FileVersion", back_populates="file_parent", order_by="desc(FileVersion.version_number)")

class FileVersion(Base):
    __tablename__ = "file_versions"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("files.id"))
    storage_key = Column(String, unique=True) 
    size = Column(Integer) 
    version_number = Column(Integer) 
    created_at = Column(DateTime, default=datetime.now(ZoneInfo("America/Sao_Paulo")))

    file_parent = relationship("File", back_populates="versions")