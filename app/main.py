from fastapi import FastAPI

# Initialize the FastAPI application
app = FastAPI(
    title="ClarityScan API",
    description="Backend for the ClarityScan Expense Management SaaS",
    version="1.0.0"
)

@app.get("/health")
async def health_check():
    """
    Sanity check endpoint to verify the API is running.
    """
    return {"status": "ok", "message": "ClarityScan API is up and running!"}
   