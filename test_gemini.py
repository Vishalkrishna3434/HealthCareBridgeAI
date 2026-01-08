import google.generativeai as genai
import os

# The hardcoded key from api/index.py
api_key = "AIzaSyAgeu7DAt8JRZADiVXKbwfYxoAQVLqfMzA"

print(f"Testing API Key: {api_key}")

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-flash-latest')
    response = model.generate_content("Hello, are you working?")
    print("Success!")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
