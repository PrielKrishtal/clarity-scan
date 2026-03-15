from supabase import create_client, Client
from app.core.config import settings

# Single shared Supabase client — used for all storage operations
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_key)

BUCKET = "receipts"


def upload_file(filename: str, content: bytes, mime_type: str) -> str:
    """Upload a file to Supabase Storage. Returns the stored filename."""
    supabase.storage.from_(BUCKET).upload(
        path=filename,
        file=content,
        file_options={"content-type": mime_type},
    )
    return filename


def get_signed_url(filename: str, expires_in: int = 3600) -> str:
    """Generate a signed URL valid for expires_in seconds (default 1 hour)."""
    result = supabase.storage.from_(BUCKET).create_signed_url(filename, expires_in)
    return result["signedURL"]


def download_file(filename: str) -> bytes:
    """Download a file from Supabase Storage. Returns raw bytes."""
    return supabase.storage.from_(BUCKET).download(filename)


def delete_file(filename: str) -> None:
    """Delete a file from Supabase Storage."""
    supabase.storage.from_(BUCKET).remove([filename])