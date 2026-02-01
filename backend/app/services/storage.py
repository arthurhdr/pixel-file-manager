import os
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException

class StorageService:
    def __init__(self):
        self.bucket_name = os.getenv("MINIO_DEFAULT_BUCKETS", "user-files")
        
        self.internal_endpoint = f"http://{os.getenv('MINIO_ENDPOINT', 'minio:9000')}"
        
        external_host = os.getenv('MINIO_EXTERNAL_ENDPOINT', 'localhost:9000')
        self.external_endpoint = f"http://{external_host}"

        self.client = boto3.client(
            "s3",
            endpoint_url=self.internal_endpoint,
            aws_access_key_id=os.getenv("MINIO_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("MINIO_SECRET_KEY"),
            config=Config(signature_version='s3v4')
        )

        self.signer_client = boto3.client(
            "s3",
            endpoint_url=self.external_endpoint,
            aws_access_key_id=os.getenv("MINIO_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("MINIO_SECRET_KEY"),
            config=Config(signature_version='s3v4')
        )

        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            try:
                self.client.create_bucket(Bucket=self.bucket_name)
            except ClientError as e:
                print(f"Error creating bucket: {e}")

    def upload_file(self, file: UploadFile, object_name: str, file_size: int):
        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=object_name,
                Body=file.file,
                ContentType=file.content_type,
                ContentLength=file_size
            )
            return True
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")

    def get_file_stream(self, object_name: str):
        try:
            response = self.client.get_object(Bucket=self.bucket_name, Key=object_name)
            return response['Body']
        except ClientError as e:
             raise HTTPException(status_code=404, detail="File not found in storage")

    def generate_presigned_url(self, object_name: str, filename: str, expiration=3600):
        try:
            url = self.signer_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name, 
                    'Key': object_name,
                    'ResponseContentDisposition': f'attachment; filename="{filename}"'
                },
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise HTTPException(status_code=500, detail="Could not generate link")

storage = StorageService()