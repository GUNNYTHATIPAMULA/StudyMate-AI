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

load_dotenv()
# -------------------- FastAPI App --------------------
app = FastAPI(title="StudyMate API", description="Granite for chat, Gemini for PDFs")

app.add_middleware(
    CORSMiddleware,

    allow_origins=[               # local dev
        "https://study-mate-ai-sigma.vercel.app/",
        
        "http://localhost:3001",# deployed frontend on Vercel
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Gemini Setup --------------------
GEMINI_API_KEY =  os.getenv("GEMINI_API_KEY")   # 🔑 your Gemini API key
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
        raise HTTPException(status_code=400, detail="No text could be extracted from the PDF. It might be a scanned image or protected PDF.")
    
    return text

# -------------------- Important Questions --------------------
@app.post("/important_questions", response_model=QuestionResponse)
async def extract_questions(file: UploadFile = File(...)):
    try:
        # Check if file is PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Read and extract text from PDF
        contents = await file.read()
        text = extract_pdf_text(contents)
        
        # Limit text length to avoid token limits
        if len(text) > 6000:
            text = text[:3000] + text[-3000:]  # Take first and last parts
        
        # Create a more specific prompt
        prompt = f"""
        Analyze the following document content and generate 15 to 20 important exam-style questions 
        that would help someone study this material. Return ONLY the questions, one per line, 
        without any numbering, prefixes, or additional text.
        
        DOCUMENT CONTENT:
        {text}
        """
        
        # Generate questions
        response = gemini_model.generate_content(prompt)
        
        # Process the response to extract questions
        raw_questions = response.text.strip()
        
        # Split into individual questions and clean up
        questions = []
        for line in raw_questions.split('\n'):
            line = line.strip()
            # Remove any numbering like "1.", "2)" etc.
            line = re.sub(r'^\d+[\.\)]\s*', '', line)
            if line and len(line) > 10:  # Ensure it's a reasonable question length
                questions.append(line)
        
        # Limit to 20 questions max
        questions = questions[:20]
        
        if not questions:
            raise HTTPException(status_code=500, detail="No questions could be generated from the PDF content.")
        
        return QuestionResponse(questions=questions, model_used="gemini-2.5-flash")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Important questions error: {e}")
        raise HTTPException(status_code=500, detail=f"Error extracting questions: {str(e)}")

# -------------------- Other endpoints remain the same --------------------
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
        - "options": a list of 4 options like ["A. ...", "B. ...", "C. ...", "D. ..."]
        - "answer": the correct option letter ("A", "B", "C", or "D")

        Only return JSON array, no explanations.

        Content:
        {text[:10000]}
        """

        response = gemini_model.generate_content(prompt)
        raw_text = response.text.strip()

        # 🔹 Try extracting valid JSON (handles extra text around JSON)
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
