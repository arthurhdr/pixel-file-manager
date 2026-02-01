import uuid
import os
import json
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from .. import database, schemas, models, auth
from ..services.storage import storage
from ..services.cache import cache_service
from datetime import datetime
from urllib.parse import quote

router = APIRouter(prefix="/files", tags=["Files"])

ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.pdf', '.txt'}
MAX_FILE_SIZE = 10 * 1024 * 1024

def validate_file(file: UploadFile):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    return size

@router.post("/upload", response_model=schemas.FileUploadResponse)
def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    file_size = validate_file(file)
    storage_key = f"{current_user.id}/{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
    
    storage.upload_file(file, storage_key, file_size)
    
    db_file = db.query(models.File).options(joinedload(models.File.versions)).filter(
        models.File.user_id == current_user.id,
        models.File.original_name == file.filename,
        models.File.is_deleted == False
    ).first()

    version_number = 1

    if not db_file:
        db_file = models.File(
            user_id=current_user.id,
            original_name=file.filename,
            content_type=file.content_type
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
    else:
        last_version = db_file.versions[0] if db_file.versions else None
        version_number = (last_version.version_number + 1) if last_version else 1
        
        db_file.updated_at = datetime.utcnow()
        db_file.content_type = file.content_type 

    new_version = models.FileVersion(
        file_id=db_file.id,
        storage_key=storage_key,
        size=file_size,
        version_number=version_number
    )
    db.add(new_version)
    db.commit()

    cache_service.invalidate_user_files(current_user.id)

    return {
        "file_id": db_file.id, 
        "filename": db_file.original_name, 
        "version": version_number,
        "status": "success"
    }

@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    file = db.query(models.File).filter(
        models.File.id == file_id,
        models.File.user_id == current_user.id,
        models.File.is_deleted == False
    ).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    latest_version = db.query(models.FileVersion).filter(
        models.FileVersion.file_id == file_id
    ).order_by(models.FileVersion.version_number.desc()).first()

    if not latest_version:
        raise HTTPException(status_code=404, detail="File has no versions")

    file_stream = storage.get_file_stream(latest_version.storage_key)
    filename_encoded = quote(file.original_name)
    
    return StreamingResponse(
        file_stream, 
        media_type=file.content_type,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename_encoded}"}
    )

@router.get("/", response_model=List[schemas.FileOut])
def list_files(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    cached_data = cache_service.get_user_files(current_user.id)
    if cached_data:
        return json.loads(cached_data)

    files = db.query(models.File).options(joinedload(models.File.versions)).filter(
        models.File.user_id == current_user.id,
        models.File.is_deleted == False
    ).all()
    
    results = []
    for f in files:
        if f.versions:
            latest = f.versions[0]
            
            versions_list = [
                {
                    "id": v.id,
                    "size": v.size,
                    "version_number": v.version_number,
                    "created_at": v.created_at.isoformat()
                } for v in f.versions
            ]
            
            file_dict = {
                "id": f.id,
                "original_name": f.original_name,
                "content_type": f.content_type,
                "created_at": f.created_at.isoformat(),
                "current_version": {
                    "id": latest.id,
                    "size": latest.size,
                    "version_number": latest.version_number,
                    "created_at": latest.created_at.isoformat()
                },
                "versions": versions_list
            }
            results.append(file_dict)
            
    if results:
        cache_service.set_user_files(current_user.id, json.dumps(results))
            
    return results

@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    file = db.query(models.File).filter(
        models.File.id == file_id,
        models.File.user_id == current_user.id,
        models.File.is_deleted == False
    ).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    file.is_deleted = True
    db.commit()

    cache_service.invalidate_user_files(current_user.id)
    
    return {"status": "deleted"}

@router.delete("/versions/{version_id}")
def delete_version(
    version_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    version = db.query(models.FileVersion).join(models.File).filter(
        models.FileVersion.id == version_id,
        models.File.user_id == current_user.id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    parent_file_id = version.file_id
    
    db.delete(version)
    db.commit()
    
    remaining_versions = db.query(models.FileVersion).filter(
        models.FileVersion.file_id == parent_file_id
    ).count()
    
    if remaining_versions == 0:
        parent_file = db.query(models.File).filter(models.File.id == parent_file_id).first()
        if parent_file:
            parent_file.is_deleted = True
            db.commit()

    cache_service.invalidate_user_files(current_user.id)
    return {"status": "version deleted"}

@router.get("/versions/{version_id}/download")
def download_version(
    version_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    version = db.query(models.FileVersion).join(models.File).filter(
        models.FileVersion.id == version_id,
        models.File.user_id == current_user.id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    file_stream = storage.get_file_stream(version.storage_key)
    filename_encoded = quote(version.file_parent.original_name)
    
    return StreamingResponse(
        file_stream, 
        media_type=version.file_parent.content_type,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename_encoded}"}
    )

@router.get("/{file_id}/share")
def share_file(
    file_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    file = db.query(models.File).options(joinedload(models.File.versions)).filter(
        models.File.id == file_id,
        models.File.user_id == current_user.id,
        models.File.is_deleted == False
    ).first()
    
    if not file or not file.versions:
        raise HTTPException(status_code=404, detail="File not found")

    latest_version = file.versions[0]
    url = storage.generate_presigned_url(latest_version.storage_key, file.original_name)
    
    return {"url": url, "expires_in": "3600s"}