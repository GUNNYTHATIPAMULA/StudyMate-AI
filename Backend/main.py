import logging
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import io
import PyPDF2
import google.generativeai as genai
import json
import re
from dotenv import load_dotenv
import os
from typing import List

# -------------------- Logging --------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------- Load ENV --------------------
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("❌ GEMINI_API_KEY is missing. Set it in your environment variables.")

# -------------------- FastAPI App --------------------
app = FastAPI(title="StudyMate API", description="Granite for chat, Gemini for PDFs")

# ✅ CORS setup: allow your Vercel frontend + local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Gemini Setup --------------------
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-2.5-flash")

# -------------------- Schemas --------------------
class PromptRequest(BaseModel):
    prompt: str

class QuestionResponse(BaseModel):
    questions: List[str]
    model_used: str

# -------------------- PDF Extraction --------------------
def extract_pdf_text(pdf_bytes: bytes) -> str:
    text = ""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")
    
    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="No text could be extracted from the PDF. It might be scanned or protected."
        )
    
    return text

# -------------------- Endpoints --------------------
@app.post("/important_questions", response_model=QuestionResponse)
async def extract_questions(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        contents = await file.read()
        text = extract_pdf_text(contents)
        
        if len(text) > 6000:
            text = text[:3000] + text[-3000:]
        
        prompt = f"""
        Analyze the following document content and generate 15 to 20 important exam-style questions. 
        Return ONLY the questions, one per line, without numbering.

        DOCUMENT CONTENT:
        {text}
        """
        
        response = gemini_model.generate_content(prompt)
        raw_questions = response.text.strip()
        
        questions = []
        for line in raw_questions.split('\n'):
            line = line.strip()
            line = re.sub(r'^\d+[\.\)]\s*', '', line)  # Remove numbering
            if line and len(line) > 10:
                questions.append(line)
        
        questions = questions[:20]
        
        if not questions:
            raise HTTPException(status_code=500, detail="No questions could be generated.")
        
        return QuestionResponse(questions=questions, model_used="gemini-2.5-flash")
    
    except Exception as e:
        logger.error(f"Important questions error: {e}")
        raise HTTPException(status_code=500, detail=f"Error extracting questions: {str(e)}")

@app.post("/generate")
async def generate_response(request: PromptRequest):
    try:
        result = gemini_model.generate_content(request.prompt)
        return {"model_used": "gemini-2.5-flash", "result": result.text.strip()}
    except Exception as e:
        logger.error(f"Gemini error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

@app.post("/process_pdf")
async def process_pdf(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        contents = await file.read()
        text = extract_pdf_text(contents)

        prompt = f"Summarize the following document briefly:\n\n{text[:12000]}"
        response = gemini_model.generate_content(prompt)

        return {"model_used": "gemini-2.5-flash", "result": response.text.strip()}
    except Exception as e:
        logger.error(f"PDF processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/quiz")
async def generate_quiz(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        contents = await file.read()
        text = extract_pdf_text(contents)

        if not text.strip():
            raise HTTPException(status_code=400, detail="No text extracted")

        prompt = f"""
        From this document, generate 20 multiple-choice quiz questions in valid JSON format.
        Each question must have:
        - "question": the question text
        - "options": a list of 4 options
        - "answer": the correct option letter ("A", "B", "C", or "D")

        Return ONLY JSON array, no explanations.

        Content:
        {text[:10000]}
        """

        response = gemini_model.generate_content(prompt)
        raw_text = response.text.strip()

        try:
            quiz_data = json.loads(raw_text)
        except:
            match = re.search(r"\[.*\]", raw_text, re.DOTALL)
            if match:
                quiz_data = json.loads(match.group())
            else:
                raise ValueError("Gemini did not return valid JSON")

        return {"model_used": "gemini-2.5-flash", "quiz": quiz_data}

    except Exception as e:
        logger.error(f"Quiz generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")

@app.get("/")
async def root():
    return {
        "message": "🚀 FastAPI server is running (Granite for chat, Gemini for PDFs)",
        "active_model": "gemini-2.5-flash"
    }
