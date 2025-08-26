from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict
from bedrock_client import summarize_infra
app = FastAPI(title="AI Summarizer Service")
app.add_middleware(
CORSMiddleware,
allow_origins=["*"],
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)
class SummarizeRequest(BaseModel):
summary: Dict[str, Any]
@app.post("/summarize")
async def summarize(req: SummarizeRequest):
try:
text = summarize_infra(req.summary)
return {"ok": True, "summary_text": text}
except Exception as e:
raise HTTPException(status_code=500, detail=f"Bedrock error: {e}")
@app.get("/")
async def root():
return {"service": "ai", "status": "ok"}
