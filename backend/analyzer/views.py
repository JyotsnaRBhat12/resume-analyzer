import fitz
import re
import os
import json
from groq import Groq
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

def extract_pdf_text(file):
    pdf = fitz.open(stream=file.read(), filetype="pdf")
    text = ""
    for page in pdf:
        text += page.get_text()
    return text

def run_groq(prompt, max_tokens=1500):
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens
    )
    return response.choices[0].message.content

@api_view(['GET'])
def hello(request):
    return Response({"message": "Backend is working!"})

@api_view(['POST'])
@parser_classes([MultiPartParser])
def upload_resume(request):
    file = request.FILES.get('resume')
    if not file:
        return Response({"error": "No file uploaded"}, status=400)
    if not file.name.endswith('.pdf'):
        return Response({"error": "Please upload a PDF file"}, status=400)
    text = extract_pdf_text(file)
    return Response({"text": text})

@api_view(['POST'])
@parser_classes([MultiPartParser])
def analyze_resume(request):
    file = request.FILES.get('resume')
    jd = request.data.get('job_description', '')

    if not file:
        return Response({"error": "No file uploaded"}, status=400)
    if not jd:
        return Response({"error": "No job description provided"}, status=400)

    resume_text = extract_pdf_text(file)

    prompt = f"""
You are an expert ATS (Applicant Tracking System) and resume analyst.

Semantically compare this resume against the job description. Understand meaning, not just exact words.
For example: "ML" and "Machine Learning" are the same. "Built APIs" matches "REST API development".

Resume:
{resume_text}

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

    raw = run_groq(prompt, max_tokens=1500)

    try:
        clean = raw.strip()
        if "```" in clean:
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        data = json.loads(clean.strip())
    except Exception:
        return Response({"error": "AI response parsing failed. Try again."}, status=500)

    return Response({
        "ats_score": data.get("ats_score", 0),
        "matched_keywords": data.get("matched_skills", []),
        "missing_keywords": data.get("missing_skills", []),
        "total_jd_keywords": len(data.get("matched_skills", [])) + len(data.get("missing_skills", [])),
        "match_summary": data.get("match_summary", "")
    })

@api_view(['POST'])
@parser_classes([MultiPartParser])
def ai_suggestions(request):
    file = request.FILES.get('resume')
    jd = request.data.get('job_description', '')

    if not file:
        return Response({"error": "No file uploaded"}, status=400)
    if not jd:
        return Response({"error": "No job description provided"}, status=400)

    resume_text = extract_pdf_text(file)

    prompt = f"""
You are an expert resume coach.

A student has uploaded their resume and a job description. Your job is to:
1. Identify 2-3 weak or generic bullet points from the resume
2. Rewrite each one to be stronger, more specific, and aligned with the job description
3. Give one overall tip to improve the resume for this specific role

Resume:
{resume_text}

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
    return Response({"suggestions": run_groq(prompt)})

@api_view(['POST'])
@parser_classes([MultiPartParser])
def learning_roadmap(request):
    file = request.FILES.get('resume')
    jd = request.data.get('job_description', '')

    if not file:
        return Response({"error": "No file uploaded"}, status=400)
    if not jd:
        return Response({"error": "No job description provided"}, status=400)

    resume_text = extract_pdf_text(file)

    prompt = f"""
You are an expert tech career coach.

Based on this resume and job description, create a personalized learning roadmap.
Focus on what's missing or weak in the resume compared to the job requirements.

Resume:
{resume_text}

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
    return Response({"roadmap": run_groq(prompt)})

@api_view(['POST'])
@parser_classes([MultiPartParser])
def cover_letter(request):
    file = request.FILES.get('resume')
    jd = request.data.get('job_description', '')

    if not file:
        return Response({"error": "No file uploaded"}, status=400)
    if not jd:
        return Response({"error": "No job description provided"}, status=400)

    resume_text = extract_pdf_text(file)

    prompt = f"""
You are an expert cover letter writer.

Write a professional, personalized cover letter for a student applying for this job.
Make it sound human, confident, and tailored — not generic.
Keep it to 3 paragraphs. Do not use placeholders like [Your Name] or [Date].
Start directly with "Dear Hiring Manager,"

Resume:
{resume_text}

Job Description:
{jd}
"""
    return Response({"cover_letter": run_groq(prompt)})