# 🏥 HealthBridge AI

HealthBridge AI is a state-of-the-art healthcare intelligence platform designed to bridge the gap between clinical documentation and patient care. Using advanced AI (Google Gemini), it transforms messy clinical notes and handwritten prescriptions into structured, actionable medical data.

## ✨ Key Features

- **🧠 Clinical Intelligence**: Ingests clinical notes and automatically extracts medical entities (conditions, medications) while mapping them to FHIR R4 resources.
- **📸 Smart Prescription Scanner**: AI-powered OCR that extracts medication name, dosage, frequency, and duration from prescription images.
- **🛡️ Safety Guard**: Real-time drug-to-drug interaction checking to prevent adverse events.
- **📋 Medication Manager**: A unified dashboard for patients and providers to track medication adherence and schedules.
- **🔍 Audit Intelligence**: Transparent logging of all AI-driven actions to ensure clinical accountability and HIPAA-compliant tracking.

## 🛠️ Technology Stack

- **Frontend**: React.js with Vite, styled with a modern Glassmorphic UI using Vanilla CSS.
- **Backend**: FastAPI (Python) serving as a high-performance consolidated API.
- **AI Engine**: Google Gemini 1.5 Pro & Flash for medical entity extraction and vision-based OCR.
- **Compliance**: Built-in de-identification features for PHI protection.
- **Deployment**: Configured for seamless deployment via Vercel.

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Google Gemini API Key

### Backend Setup
1. Navigate to the root directory.
2. Create a `.env` file and add your `GOOGLE_API_KEY`.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the API:
   ```bash
   uvicorn api.index:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

```text
├── api/                # Consolidated FastAPI backend
│   └── index.py        # Main entry point for API endpoints
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # Modular UI components
│   │   └── api.js      # Centralized API service layer
├── vercel.json         # Vercel deployment configuration
└── requirements.txt    # Python dependencies
```

## 📜 License
Internal use only for TechSprint.
Drug Interaction Checker feature in progress.

