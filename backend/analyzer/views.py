import fitz
import re
import os
import json
from groq import Groq
from django_ratelimit.decorators import ratelimit
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

MAX_FILE_SIZE_MB = 5
MAX_JD_CHARS = 5000

def extract_pdf_text(file):
    try:
        pdf = fitz.open(stream=file.read(), filetype="pdf")
        text = ""
        for page in pdf:
            text += page.get_text()
        return text.strip()
    except Exception:
        return ""

def run_groq(prompt, max_tokens=1500):
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens
    )
    return response.choices[0].message.content

def validate_inputs(request, check_file=True):
    if check_file:
        file = request.FILES.get('resume')
        if not file:
            return None, None, Response({"error": "No file uploaded. Please upload a PDF resume."}, status=400)
        if not file.name.endswith('.pdf'):
            return None, None, Response({"error": "Invalid file type. Please upload a PDF file only."}, status=400)
        if file.size > MAX_FILE_SIZE_MB * 1024 * 1024:
            return None, None, Response({"error": f"File too large. Please upload a PDF under {MAX_FILE_SIZE_MB}MB."}, status=400)
    else:
        file = None

    jd = request.data.get('job_description', '').strip()
    if not jd:
        return None, None, Response({"error": "Job description is empty. Please paste the job description."}, status=400)
    if len(jd) < 50:
        return None, None, Response({"error": "Job description is too short. Please paste the full job description."}, status=400)
    if len(jd) > MAX_JD_CHARS:
        jd = jd[:MAX_JD_CHARS]

    return file, jd, None

@api_view(['GET'])
def hello(request):
    return Response({"message": "Backend is working!"})

@api_view(['POST'])
@parser_classes([MultiPartParser])
def upload_resume(request):
    file = request.FILES.get('resume')
    if not file:
        return Response({"error": "No file uploaded."}, status=400)
    if not file.name.endswith('.pdf'):
        return Response({"error": "Please upload a PDF file."}, status=400)
    if file.size > MAX_FILE_SIZE_MB * 1024 * 1024:
        return Response({"error": f"File too large. Max {MAX_FILE_SIZE_MB}MB."}, status=400)
    text = extract_pdf_text(file)
    if not text:
        return Response({"error": "Could not extract text from this PDF. Make sure it is not a scanned image PDF."}, status=400)
    return Response({"text": text})

@ratelimit(key='ip', rate='10/m', block=True)
@api_view(['POST'])
@parser_classes([MultiPartParser])
def analyze_resume(request):
    file, jd, err = validate_inputs(request)
    if err:
        return err

    resume_text = extract_pdf_text(file)

    if not resume_text:
        return Response({"error": "Could not read your PDF. Make sure it is a text-based PDF, not a scanned image."}, status=400)

    if len(resume_text) < 100:
        return Response({"error": "Your resume appears to be empty or too short. Please check your PDF."}, status=400)

    prompt = f"""
You are an expert ATS (Applicant Tracking System) and resume analyst.

Semantically compare this resume against the job description. Understand meaning, not just exact words.
For example: "ML" and "Machine Learning" are the same. "Built APIs" matches "REST API development".

Resume:
{resume_text[:3000]}

Job Description:
{jd}

Respond ONLY with a valid JSON object, no explanation, no markdown, no extra text:
{{
  "ats_score": <integer 0-100>,
  "matched_skills": [<list of skills/concepts from JD that ARE present in resume, semantically>],
  "missing_skills": [<list of skills/concepts from JD that are NOT present in resume, semantically>],
  "match_summary": "<2 sentence summary of how well this resume fits the job>"
}}
"""

    try:
        raw = run_groq(prompt, max_tokens=1500)
        clean = raw.strip()
        if "```" in clean:
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        data = json.loads(clean.strip())
    except json.JSONDecodeError:
        return Response({"error": "AI response was unexpected. Please try again."}, status=500)
    except Exception:
        return Response({"error": "AI service is temporarily unavailable. Please try again in a moment."}, status=503)

    return Response({
        "ats_score": data.get("ats_score", 0),
        "matched_keywords": data.get("matched_skills", []),
        "missing_keywords": data.get("missing_skills", []),
        "total_jd_keywords": len(data.get("matched_skills", [])) + len(data.get("missing_skills", [])),
        "match_summary": data.get("match_summary", "")
    })

@ratelimit(key='ip', rate='5/m', block=True)
@api_view(['POST'])
@parser_classes([MultiPartParser])
def ai_suggestions(request):
    file, jd, err = validate_inputs(request)
    if err:
        return err

    resume_text = extract_pdf_text(file)
    if not resume_text:
        return Response({"error": "Could not read your PDF. Please check your file."}, status=400)

    prompt = f"""
You are an expert resume coach.

A student has uploaded their resume and a job description. Your job is to:
1. Identify 2-3 weak or generic bullet points from the resume
2. Rewrite each one to be stronger, more specific, and aligned with the job description
3. Give one overall tip to improve the resume for this specific role

Resume:
{resume_text[:3000]}

Job Description:
{jd}

Respond in this exact format:

WEAK BULLET 1:
<original bullet point>

IMPROVED BULLET 1:
<rewritten version>

WEAK BULLET 2:
<original bullet point>

IMPROVED BULLET 2:
<rewritten version>

WEAK BULLET 3:
<original bullet point>

IMPROVED BULLET 3:
<rewritten version>

OVERALL TIP:
<one actionable tip>
"""
    try:
        return Response({"suggestions": run_groq(prompt)})
    except Exception:
        return Response({"error": "AI service is temporarily unavailable. Please try again in a moment."}, status=503)

@ratelimit(key='ip', rate='5/m', block=True)
@api_view(['POST'])
@parser_classes([MultiPartParser])
def learning_roadmap(request):
    file, jd, err = validate_inputs(request)
    if err:
        return err

    resume_text = extract_pdf_text(file)
    if not resume_text:
        return Response({"error": "Could not read your PDF. Please check your file."}, status=400)

    prompt = f"""
You are an expert tech career coach.

Based on this resume and job description, create a personalized learning roadmap.
Focus on what is missing or weak in the resume compared to the job requirements.

Resume:
{resume_text[:3000]}

Job Description:
{jd}

Respond in this exact format:

ROLE SUMMARY:
<what kind of role this is and what level>

TOP 5 SKILLS TO LEARN:
1. <skill> — <why it's important for this role>
2. <skill> — <why it's important for this role>
3. <skill> — <why it's important for this role>
4. <skill> — <why it's important for this role>
5. <skill> — <why it's important for this role>

4-WEEK LEARNING PLAN:
Week 1: <what to focus on>
Week 2: <what to focus on>
Week 3: <what to focus on>
Week 4: <what to focus on>

FREE RESOURCES:
- <resource name> — <platform> — <what to learn from it>
- <resource name> — <platform> — <what to learn from it>
- <resource name> — <platform> — <what to learn from it>

QUICK TIP:
<one motivational and practical tip for this specific student>
"""
    try:
        return Response({"roadmap": run_groq(prompt)})
    except Exception:
        return Response({"error": "AI service is temporarily unavailable. Please try again in a moment."}, status=503)

@ratelimit(key='ip', rate='5/m', block=True)
@api_view(['POST'])
@parser_classes([MultiPartParser])
def cover_letter(request):
    file, jd, err = validate_inputs(request)
    if err:
        return err

    resume_text = extract_pdf_text(file)
    if not resume_text:
        return Response({"error": "Could not read your PDF. Please check your file."}, status=400)

    prompt = f"""
You are an expert cover letter writer.

Write a professional, personalized cover letter for a student applying for this job.
Make it sound human, confident, and tailored — not generic.
Keep it to 3 paragraphs. Do not use placeholders like [Your Name] or [Date].
Start directly with "Dear Hiring Manager,"

Resume:
{resume_text[:3000]}

Job Description:
{jd}
"""
    try:
        return Response({"cover_letter": run_groq(prompt)})
    except Exception:
        return Response({"error": "AI service is temporarily unavailable. Please try again in a moment."}, status=503)