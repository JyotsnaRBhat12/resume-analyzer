from django.urls import path
from . import views

urlpatterns = [
    path('hello/', views.hello),
    path('upload-resume/', views.upload_resume),
    path('analyze-resume/', views.analyze_resume),
    path('ai-suggestions/', views.ai_suggestions),
    path('learning-roadmap/', views.learning_roadmap),
    path('cover-letter/', views.cover_letter),
]