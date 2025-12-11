# app.py
"""
Backend for CivicRAG React frontend.

Endpoints:
- POST /retrieve   -> { profile } -> returns list of matched schemes
- POST /synthesize -> { profile, schemes, language } -> returns synthesized text (Gemini)
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import requests

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civicrag_server")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_BASE_URL = os.environ.get("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com")
PORT = int(os.environ.get("PORT", "8000"))

app = FastAPI(title="CivicRAG Backend (Retrieve + Synthesize)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- Data models ---------
class ProfileIn(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    income: Optional[float] = None
    occupation: Optional[str] = None
    text: Optional[str] = None

class SchemeOut(BaseModel):
    id: str
    name: str
    name_hi: Optional[str] = None
    description: Optional[str] = None
    description_hi: Optional[str] = None
    eligibilityCriteria: Optional[List[str]] = []
    eligibilityCriteria_hi: Optional[List[str]] = []
    benefits: Optional[str] = None
    benefits_hi: Optional[str] = None
    category: Optional[str] = None
    category_hi: Optional[str] = None
    sourceUrl: Optional[str] = None
    state: Optional[str] = None
    matchScore: Optional[float] = 0.0

class RetrieveIn(BaseModel):
    profile: ProfileIn

class SynthesizeIn(BaseModel):
    profile: ProfileIn
    schemes: List[SchemeOut]
    language: Optional[str] = "en"

# --------- Mock schemes (copied from your frontend) ---------
SCHEMES: List[Dict[str, Any]] = [
  {
    "id": "pm-kisan",
    "name": "PM Kisan Samman Nidhi",
    "name_hi": "प्रधानमंत्री किसान सम्मान निधि",
    "description": "Income support of Rs 6000 per year for all land holding farmer families.",
    "description_hi": "सभी भूमिधारक किसान परिवारों के लिए प्रति वर्ष 6000 रुपये की आय सहायता।",
    "eligibilityCriteria": [
      "Landholding farmer families",
      "Excludes institutional landholders",
      "Excludes income tax payers"
    ],
    "eligibilityCriteria_hi": [
        "भूमिधारक किसान परिवार",
        "संस्थागत भूमिधारकों को छोड़कर",
        "आयकर दाताओं को छोड़कर"
    ],
    "benefits": "INR 6000 per year in 3 installments.",
    "benefits_hi": "3 किस्तों में प्रति वर्ष 6000 रुपये।",
    "category": "Agriculture",
    "category_hi": "कृषि",
    "sourceUrl": "https://pmkisan.gov.in",
    "state": "Central"
  },
  {
    "id": "ayushman-bharat",
    "name": "Ayushman Bharat (PM-JAY)",
    "name_hi": "आयुष्मान भारत (PM-JAY)",
    "description": "Health assurance scheme providing cover of Rs. 5 lakhs per family per year for secondary and tertiary care hospitalization.",
    "description_hi": "माध्यमिक और तृतीयक देखभाल अस्पताल में भर्ती के लिए प्रति परिवार प्रति वर्ष 5 लाख रुपये का स्वास्थ्य कवर।",
    "eligibilityCriteria": [
      "Identified families based on SECC 2011 data",
      "Households with no adult member between 16-59",
      "Households with no able-bodied adult member"
    ],
    "eligibilityCriteria_hi": [
        "एसईसीसी 2011 डेटा के आधार पर पहचाने गए परिवार",
        "ऐसे परिवार जिनमें 16-59 वर्ष के बीच कोई वयस्क सदस्य नहीं है",
        "ऐसे परिवार जिनमें कोई सक्षम वयस्क सदस्य नहीं है"
    ],
    "benefits": "Cashless access to health care services up to INR 5 Lakhs.",
    "benefits_hi": "5 लाख रुपये तक की कैशलेस स्वास्थ्य सेवाएँ।",
    "category": "Health",
    "category_hi": "स्वास्थ्य",
    "sourceUrl": "https://pmjay.gov.in",
    "state": "Central"
  },
  {
    "id": "pm-svanidhi",
    "name": "PM SVANidhi",
    "name_hi": "पीएम स्वनिधि",
    "description": "Special Micro-Credit Facility for Street Vendors.",
    "description_hi": "सड़क विक्रेताओं के लिए विशेष माइक्रो-क्रेडिट सुविधा।",
    "eligibilityCriteria": [
      "Street vendors in urban areas",
      "Vending on or before 24 March 2020"
    ],
    "eligibilityCriteria_hi": [
        "शहरी क्षेत्रों में सड़क विक्रेता",
        "24 मार्च 2020 को या उससे पहले वेंडिंग"
    ],
    "benefits": "Working capital loan up to Rs. 10,000.",
    "benefits_hi": "10,000 रुपये तक का कार्यशील पूंजी ऋण।",
    "category": "Business/Loan",
    "category_hi": "व्यापार/ऋण",
    "sourceUrl": "https://pmsvanidhi.mohua.gov.in",
    "state": "Central"
  },
  {
    "id": "sukanya-samriddhi",
    "name": "Sukanya Samriddhi Yojana",
    "name_hi": "सुकन्या समृद्धि योजना",
    "description": "A small deposit scheme for the girl child.",
    "description_hi": "बालिकाओं के लिए एक छोटी जमा योजना।",
    "eligibilityCriteria": [
      "Girl child below 10 years of age",
      "Account can be opened by parent/guardian"
    ],
    "eligibilityCriteria_hi": [
        "10 वर्ष से कम उम्र की बालिका",
        "खाता माता-पिता/अभिभावक द्वारा खोला जा सकता है"
    ],
    "benefits": "High interest rate, tax benefits under 80C.",
    "benefits_hi": "उच्च ब्याज दर, 80सी के तहत कर लाभ।",
    "category": "Child Welfare",
    "category_hi": "बाल कल्याण",
    "sourceUrl": "https://www.nsiindia.gov.in",
    "state": "Central"
  },
  {
    "id": "atal-pension",
    "name": "Atal Pension Yojana",
    "name_hi": "अटल पेंशन योजना",
    "description": "Pension scheme for unorganized sector workers.",
    "description_hi": "असंगठित क्षेत्र के श्रमिकों के लिए पेंशन योजना।",
    "eligibilityCriteria": [
      "Age between 18-40 years",
      "Have a savings bank account"
    ],
    "eligibilityCriteria_hi": [
        "उम्र 18-40 वर्ष के बीच",
        "बचत बैंक खाता होना चाहिए"
    ],
    "benefits": "Guaranteed pension of Rs 1000-5000 per month after 60 years.",
    "benefits_hi": "60 वर्ष के बाद 1000-5000 रुपये प्रति माह की गारंटीड पेंशन।",
    "category": "Pension",
    "category_hi": "पेंशन",
    "sourceUrl": "https://www.npscra.nsdl.co.in",
    "state": "Central"
  },
  {
    "id": "ladli-behna",
    "name": "Mukhyamantri Ladli Behna Yojana (MP)",
    "name_hi": "मुख्यमंत्री लाड़ली बहना योजना (मध्य प्रदेश)",
    "description": "Financial assistance scheme for women in Madhya Pradesh.",
    "description_hi": "मध्य प्रदेश में महिलाओं के लिए वित्तीय सहायता योजना।",
    "eligibilityCriteria": [
      "Resident of Madhya Pradesh",
      "Married women aged 21-60 years",
      "Family income less than 2.5 Lakhs"
    ],
    "eligibilityCriteria_hi": [
        "मध्य प्रदेश की निवासी",
        "21-60 वर्ष की विवाहित महिलाएं",
        "पारिवारिक आय 2.5 लाख से कम"
    ],
    "benefits": "INR 1250 per month directly to bank account.",
    "benefits_hi": "1250 रुपये प्रति माह सीधे बैंक खाते में।",
    "category": "Women Welfare",
    "category_hi": "महिला कल्याण",
    "sourceUrl": "https://cmladlibehna.mp.gov.in/",
    "state": "Madhya Pradesh"
  },
  {
    "id": "rythu-bandhu",
    "name": "Rythu Bandhu (Telangana)",
    "name_hi": "रायथु बंधु (तेलंगाना)",
    "description": "Investment Support Scheme for landholding farmers.",
    "description_hi": "भूमिधारक किसानों के लिए निवेश सहायता योजना।",
    "eligibilityCriteria": [
      "Resident of Telangana",
      "Must own farm land",
      "Commercial farmers excluded"
    ],
    "eligibilityCriteria_hi": [
        "तेलंगाना के निवासी",
        "कृषि भूमि का स्वामी होना चाहिए",
        "वाणिज्यिक किसान शामिल नहीं"
    ],
    "benefits": "INR 5000 per acre per season.",
    "benefits_hi": "5000 रुपये प्रति एकड़ प्रति सीजन।",
    "category": "Agriculture",
    "category_hi": "कृषि",
    "sourceUrl": "http://rythubandhu.telangana.gov.in/",
    "state": "Telangana"
  },
  {
    "id": "kanyashree",
    "name": "Kanyashree Prakalpa (West Bengal)",
    "name_hi": "कन्याश्री प्रकल्प (पश्चिम बंगाल)",
    "description": "Conditional Cash Transfer Scheme for improving the status and well being of the girl child.",
    "description_hi": "बालिकाओं की स्थिति और कल्याण में सुधार के लिए सशर्त नकद हस्तांतरण योजना।",
    "eligibilityCriteria": [
      "Resident of West Bengal",
      "Girl student aged 13-18 years",
      "Unmarried"
    ],
    "eligibilityCriteria_hi": [
        "पश्चिम बंगाल की निवासी",
        "13-18 वर्ष की छात्रा",
        "अविवाहित"
    ],
    "benefits": "Annual scholarship of INR 1000 and one-time grant of INR 25,000.",
    "benefits_hi": "1000 रुपये की वार्षिक छात्रवृत्ति और 25,000 रुपये का एकमुश्त अनुदान।",
    "category": "Education/Women",
    "category_hi": "शिक्षा/महिला",
    "sourceUrl": "https://www.wbkanyashree.gov.in/",
    "state": "West Bengal"
  },
  {
    "id": "delhi-electricity",
    "name": "Delhi Free Electricity Scheme",
    "name_hi": "दिल्ली मुफ्त बिजली योजना",
    "description": "Subsidy on electricity bills for domestic consumers in Delhi.",
    "description_hi": "दिल्ली में घरेलू उपभोक्ताओं के लिए बिजली बिल पर सब्सिडी।",
    "eligibilityCriteria": [
      "Resident of Delhi",
      "Domestic electricity connection",
      "Consumption up to 200 units (Free)"
    ],
    "eligibilityCriteria_hi": [
        "दिल्ली के निवासी",
        "घरेलू बिजली कनेक्शन",
        "200 यूनिट तक खपत (मुफ्त)"
    ],
    "benefits": "Zero bill for consumption up to 200 units.",
    "benefits_hi": "200 यूनिट तक की खपत के लिए शून्य बिल।",
    "category": "Utility",
    "category_hi": "उपयोगिता",
    "sourceUrl": "https://delhi.gov.in",
    "state": "Delhi"
  }
]

# --------- Retrieval logic (mirrors the TS prototype) ---------
def strict_retrieve(profile: ProfileIn) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []

    age = None
    income = None
    try:
        age = int(profile.age) if profile.age is not None else None
    except Exception:
        age = None
    try:
        income = float(profile.income) if profile.income is not None else None
    except Exception:
        income = None

    occupation = profile.occupation.lower() if profile.occupation else ""

    for scheme in SCHEMES:
        score = 0.0
        is_eligible = False

        # State filter: if scheme is state-specific and not 'Central' it must match
        scheme_state = scheme.get("state")
        if scheme_state and scheme_state != "Central":
            if profile.state is None or scheme_state != profile.state:
                continue
            else:
                score = 0.5

        sid = scheme.get("id")

        # PM Kisan -> farmer
        if sid == "pm-kisan":
            if "farmer" in occupation:
                score = 0.9
                is_eligible = True

        # PM SVANidhi -> vendor
        if sid == "pm-svanidhi":
            if "vendor" in occupation or "street" in occupation:
                score = 0.9
                is_eligible = True

        # Ayushman Bharat -> income < 500000 (simulated)
        if sid == "ayushman-bharat":
            if income is not None and income < 500000:
                score = 0.8
                is_eligible = True

        # Atal Pension -> age 18-40
        if sid == "atal-pension":
            if age is not None and 18 <= age <= 40:
                score = 0.85
                is_eligible = True

        # Sukanya Samriddhi -> female child < 10 (here we assume profile.age is child's age)
        if sid == "sukanya-samriddhi":
            if (profile.gender and profile.gender.lower().startswith("f")) and (age is not None and age <= 10):
                score = 0.95
                is_eligible = True

        # Ladli Behna (MP)
        if sid == "ladli-behna":
            if (profile.gender and profile.gender.lower().startswith("f")) and (age is not None and 21 <= age <= 60) and (income is not None and income < 250000):
                score = 0.95
                is_eligible = True
            else:
                is_eligible = False

        # Rythu Bandhu (Telangana)
        if sid == "rythu-bandhu":
            if "farmer" in occupation:
                score = 0.95
                is_eligible = True
            else:
                is_eligible = False

        # Kanyashree (WB)
        if sid == "kanyashree":
            if (profile.gender and profile.gender.lower().startswith("f")) and (profile.occupation and profile.occupation.lower() == "student") and (age is not None and 13 <= age <= 18):
                score = 0.95
                is_eligible = True
            else:
                is_eligible = False

        # Delhi electricity (assume all Delhi residents)
        if sid == "delhi-electricity":
            if scheme_state == "Delhi":
                is_eligible = True
                score = 0.9

        if is_eligible and score > 0:
            entry = scheme.copy()
            entry["matchScore"] = score
            results.append(entry)

    # sort by score desc
    results_sorted = sorted(results, key=lambda x: x.get("matchScore", 0), reverse=True)
    return results_sorted

# --------- Gemini call helpers ---------
def build_gemini_payload(prompt_text: str) -> Dict[str, Any]:
    return {
        "model": GEMINI_MODEL,
        "temperature": 0.0,
        "max_output_tokens": 512,
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt_text}
                ]
            }
        ]
    }

def call_gemini(prompt: str) -> Optional[str]:
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set")
        return None

    # Use v1beta or v1 endpoint; attempt common patterns
    endpoints = [
        f"{GEMINI_BASE_URL}/v1beta/models/{GEMINI_MODEL}:generateContent",
        f"{GEMINI_BASE_URL}/v1/models/{GEMINI_MODEL}:generateContent",
        f"{GEMINI_BASE_URL}/v1beta/models/{GEMINI_MODEL}:generateText",
        f"{GEMINI_BASE_URL}/v1/models/{GEMINI_MODEL}:generateText"
    ]

    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}
    body = build_gemini_payload(prompt)

    for ep in endpoints:
        try:
            url_with_key = ep + ("?key=" + GEMINI_API_KEY if "?" not in ep else "&key=" + GEMINI_API_KEY)
            logger.debug("Calling Gemini endpoint: %s", url_with_key)
            resp = requests.post(url_with_key, headers=headers, json=body, timeout=25)
            resp.raise_for_status()
            data = resp.json()
            # robust extraction
            # try candidates -> content -> text parts
            if isinstance(data, dict):
                if "candidates" in data and isinstance(data["candidates"], list) and len(data["candidates"]) > 0:
                    cand = data["candidates"][0]
                    if isinstance(cand, dict):
                        # candidate may have 'content' which is list of parts
                        if "content" in cand and isinstance(cand["content"], list):
                            texts = []
                            for part in cand["content"]:
                                if isinstance(part, dict) and "text" in part:
                                    texts.append(part["text"])
                            if texts:
                                return "\n".join(texts)
                        if "text" in cand and isinstance(cand["text"], str):
                            return cand["text"]
                # alternate shapes
                if "output" in data:
                    out = data["output"]
                    if isinstance(out, dict) and "text" in out:
                        return out["text"]
            # fallback: try top-level text
            if isinstance(data, dict) and "text" in data and isinstance(data["text"], str):
                return data["text"]
            # else stringify some portion
            logger.debug("Gemini response unparsed: %s", json.dumps(data)[:800])
            return json.dumps(data)
        except Exception as e:
            logger.warning("Gemini endpoint %s failed: %s", ep, str(e))
            continue

    return None

# Create a user-friendly prompt for synthesis
def build_synthesis_prompt(profile: ProfileIn, schemes: List[Dict[str, Any]], language: str) -> str:
    lang_name = "Hindi" if language and language.lower().startswith("h") else "English"
    # user context
    user_ctx = f"Name: {profile.name}\nAge: {profile.age}\nGender: {profile.gender}\nState: {profile.state}\nIncome: INR {profile.income}\nOccupation: {profile.occupation}\n"
    # schemes context
    ctx_lines = []
    for s in schemes:
        ctx_lines.append(f"Scheme: {s.get('name')}\nBenefits: {s.get('benefits')}\nEligibility: {', '.join(s.get('eligibilityCriteria') or [])}\nSource: {s.get('sourceUrl')}\n---")
    ctx_text = "\n".join(ctx_lines)[:8000]  # cap length

    prompt = (
        "You are a helpful government-scheme consultant. Do not provide legal advice. Provide advisory guidance only.\n\n"
        f"Respond in {lang_name}.\n\n"
        "User Profile:\n"
        f"{user_ctx}\n\n"
        "Retrieved Schemes (context):\n"
        f"{ctx_text}\n\n"
        "Instructions:\n"
        " - For each scheme, write one short bullet explaining why the user might be eligible (point to matching criteria).\n"
        " - If a scheme does not match, do not include it.\n"
        " - Provide a final short next-step suggestion (1-2 bullets) for how the user can apply or verify eligibility.\n"
        " - Keep the response concise (approx. 6-12 short bullets or lines).\n"
        "Return plain text suitable for display in a UI."
    )
    return prompt

# --------- Endpoints ---------
@app.get("/health")
def health():
    return {"status": "ok", "gemini_configured": bool(GEMINI_API_KEY)}

@app.post("/retrieve")
def retrieve(body: RetrieveIn):
    profile = body.profile
    try:
        matched = strict_retrieve(profile)
        # cast to SchemeOut array
        return {"schemes": matched}
    except Exception as e:
        logger.exception("Retrieve error: %s", e)
        raise HTTPException(status_code=500, detail="Retrieve failed")

@app.post("/synthesize")
def synthesize(body: SynthesizeIn):
    profile = body.profile
    schemes = body.schemes or []
    language = body.language or "en"

    # If there are no schemes provided, return an immediate message
    if not schemes:
        msg = "No schemes provided for synthesis." if not language.startswith("h") else "सिंथेसिस के लिए कोई योजना प्रदान नहीं की गई।"
        return {"text": msg}

    prompt = build_synthesis_prompt(profile, schemes, language)

    logger.info("Synthesizing with Gemini (configured=%s) ...", bool(GEMINI_API_KEY))
    if GEMINI_API_KEY:
        try:
            out = call_gemini(prompt)
            if out:
                return {"text": out}
            else:
                # fallback text if Gemini returned nothing
                fallback = "Could not generate analysis from Gemini. Please try again later." if not language.startswith("h") else "Gemini से विश्लेषण प्राप्त नहीं कर सके। कृपया बाद में पुनः प्रयास करें।"
                return {"text": fallback}
        except Exception as e:
            logger.exception("Gemini call failed: %s", e)
            fallback = "Error while generating analysis." if not language.startswith("h") else "विश्लेषण उत्पन्न करते समय त्रुटि हुई।"
            return {"text": fallback}
    else:
        # Local deterministic fallback (construct simple bullets)
        lines = []
        for s in schemes:
            reason = None
            sid = s.get("id")
            # simple heuristic mapping to reasons (mimic frontend logic)
            if sid == "pm-kisan":
                reason = "You are a farmer, and PM-Kisan supports landholding farmers."
            elif sid == "pm-svanidhi":
                reason = "You are a street vendor; PM SVANidhi offers micro-credit to vendors."
            elif sid == "ayushman-bharat":
                reason = "Your income is below the simulated threshold for Ayushman Bharat."
            elif sid == "atal-pension":
                reason = "Your age falls in the Atal Pension eligible range."
            elif sid == "sukanya-samriddhi":
                reason = "Your profile matches the Sukanya Samriddhi criteria for a girl child."
            elif sid == "ladli-behna":
                reason = "You are a woman resident of MP within the eligible age and income range."
            elif sid == "rythu-bandhu":
                reason = "You are a farmer in Telangana, matching Rythu Bandhu."
            elif sid == "kanyashree":
                reason = "You are a girl student in the eligible age range for Kanyashree."
            elif sid == "delhi-electricity":
                reason = "You are a Delhi resident eligible for basic electricity subsidy."
            else:
                reason = f"Matches some published eligibility criteria: {', '.join(s.get('eligibilityCriteria') or [])}"

            lines.append(f"- {s.get('name')}: {reason}")

        next_steps = "- Verify documents (Aadhaar, Income certificate, Residence proof)\n- Visit the official scheme page or your local helpdesk to apply."
        if language.lower().startswith("h"):
            # Hindi fallback phrases
            lines_hi = []
            for l in lines:
                # simple translation for common phrases (not exhaustive)
                lines_hi.append(l.replace("You are", "आप").replace("Your", "आपकी").replace("Verify documents", "प्रमाणपत्र सत्यापित करें"))
            next_steps_hi = "- दस्तावेज़ सत्यापित करें (आधार, आय प्रमाण, निवास प्रमाण)\n- आवेदन हेतु आधिकारिक पोर्टल या नजदीकी सहायता केंद्र पर जाएँ।"
            payload_text = "\n".join(lines_hi) + "\n\n" + next_steps_hi
            return {"text": payload_text}
        payload_text = "\n".join(lines) + "\n\n" + next_steps
        return {"text": payload_text}

# -------------- SAFE STARTUP PATCH (WORKS ON RESTRICTED HOSTS) --------------
if __name__ == "__main__":
    import uvicorn
    import os
    import logging

    PORT = int(os.environ.get("PORT", "8000"))

    # Enable reload ONLY in local development by setting:
    #    ENABLE_UVICORN_RELOAD=true
    enable_reload = os.environ.get("ENABLE_UVICORN_RELOAD", "false").lower() in (
        "1", "true", "yes"
    )

    try:
        uvicorn.run(
            "app:app",
            host="0.0.0.0",
            port=PORT,
            reload=enable_reload
        )
    except ValueError as e:
        # Happens on Streamlit Cloud / restricted environments
        logging.warning(
            "Uvicorn reload mode failed due to environment restrictions. "
            "Retrying with reload=False. Error: %s",
            str(e)
        )
        uvicorn.run(
            "app:app",
            host="0.0.0.0",
            port=PORT,
            reload=False
        )
