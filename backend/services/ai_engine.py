"""
AI Dosha Analysis Engine
Rule-based scoring system that maps symptoms to Vata, Pitta, and Kapha doshas.
Returns dominant dosha, confidence %, recommended therapies, medicines, and diet.
"""

# Symptom-to-Dosha weight mapping
# Each symptom maps to (vata_weight, pitta_weight, kapha_weight)
SYMPTOM_DOSHA_MAP = {
    # Vata-dominant symptoms
    "dry_skin": (3, 0, 0),
    "joint_pain": (3, 1, 0),
    "anxiety": (3, 0, 0),
    "insomnia": (3, 1, 0),
    "constipation": (3, 0, 0),
    "bloating": (3, 0, 1),
    "weight_loss": (3, 0, 0),
    "cracking_joints": (3, 0, 0),
    "restlessness": (3, 1, 0),
    "cold_hands_feet": (3, 0, 0),

    # Pitta-dominant symptoms
    "acidity": (0, 3, 0),
    "inflammation": (0, 3, 0),
    "skin_rash": (0, 3, 0),
    "excessive_sweating": (0, 3, 0),
    "heartburn": (0, 3, 0),
    "irritability": (1, 3, 0),
    "loose_stools": (0, 3, 0),
    "burning_sensation": (0, 3, 0),
    "fever": (0, 3, 0),
    "excessive_thirst": (0, 3, 0),

    # Kapha-dominant symptoms
    "weight_gain": (0, 0, 3),
    "lethargy": (0, 0, 3),
    "congestion": (0, 0, 3),
    "excess_mucus": (0, 0, 3),
    "heaviness": (0, 0, 3),
    "swelling": (0, 1, 3),
    "slow_digestion": (1, 0, 3),
    "excessive_sleep": (0, 0, 3),
    "cold_cough": (0, 0, 3),
    "water_retention": (0, 0, 3),

    # Mixed symptoms
    "headache": (2, 2, 1),
    "fatigue": (2, 1, 2),
    "back_pain": (2, 1, 1),
    "muscle_stiffness": (2, 0, 2),
    "poor_appetite": (1, 1, 2),
    "nausea": (1, 2, 1),
    "dizziness": (2, 1, 1),
    "body_pain": (2, 1, 1),
}

# Therapy recommendations per dosha
THERAPY_MAP = {
    "Vata": [
        "Abhyanga (Oil Massage)",
        "Basti (Medicated Enema)",
        "Swedana (Steam Therapy)",
        "Shirodhara (Oil Pouring on Forehead)",
        "Nasya (Nasal Administration)",
    ],
    "Pitta": [
        "Virechana (Purgation Therapy)",
        "Raktamokshana (Bloodletting)",
        "Sheetali Pranayama (Cooling Breath)",
        "Lepam (Herbal Paste Application)",
        "Takradhara (Buttermilk Pouring)",
    ],
    "Kapha": [
        "Vamana (Therapeutic Emesis)",
        "Udvartana (Herbal Powder Massage)",
        "Nasya (Nasal Administration)",
        "Dhumapana (Herbal Smoking)",
        "Swedana (Steam Therapy)",
    ],
}

# Medicine recommendations per dosha
MEDICINE_MAP = {
    "Vata": [
        "Ashwagandha Churna",
        "Dashamoola Kashayam",
        "Bala Taila (external)",
        "Triphala Guggulu",
        "Maharasnadi Kashayam",
    ],
    "Pitta": [
        "Shatavari Churna",
        "Avipattikar Churna",
        "Chandanasava",
        "Guduchi Satva",
        "Kamdudha Ras",
    ],
    "Kapha": [
        "Trikatu Churna",
        "Sitopaladi Churna",
        "Kanakasava",
        "Haridra Khanda",
        "Lavangadi Vati",
    ],
}

# Diet per dosha
DIET_MAP = {
    "Vata": {
        "favor": [
            "Warm, cooked foods",
            "Ghee and healthy oils",
            "Sweet fruits (bananas, grapes)",
            "Warm milk with spices",
            "Soups and stews",
        ],
        "avoid": [
            "Raw vegetables",
            "Cold beverages",
            "Dry snacks",
            "Bitter and astringent foods",
            "Caffeine",
        ],
    },
    "Pitta": {
        "favor": [
            "Cooling foods (cucumber, melon)",
            "Sweet and bitter vegetables",
            "Coconut water",
            "Milk and ghee",
            "Rice and wheat",
        ],
        "avoid": [
            "Spicy and fried foods",
            "Sour and fermented items",
            "Excessive salt",
            "Alcohol",
            "Red meat",
        ],
    },
    "Kapha": {
        "favor": [
            "Light, warm, and dry foods",
            "Spicy and bitter vegetables",
            "Honey (in moderation)",
            "Barley and millet",
            "Ginger tea",
        ],
        "avoid": [
            "Heavy and oily foods",
            "Dairy products",
            "Sweets and sugar",
            "Cold drinks",
            "Excessive wheat and rice",
        ],
    },
}


def analyze_dosha(symptoms: list[str]) -> dict:
    """
    Analyze symptoms and return Dosha assessment.

    Args:
        symptoms: List of symptom keys (e.g., ["dry_skin", "joint_pain", "anxiety"])

    Returns:
        dict with dosha scores, dominant dosha, confidence, therapy, medicines, diet
    """
    vata_score = 0
    pitta_score = 0
    kapha_score = 0
    matched = 0

    for symptom in symptoms:
        key = symptom.lower().strip().replace(" ", "_")
        if key in SYMPTOM_DOSHA_MAP:
            v, p, k = SYMPTOM_DOSHA_MAP[key]
            vata_score += v
            pitta_score += p
            kapha_score += k
            matched += 1

    total = vata_score + pitta_score + kapha_score
    if total == 0:
        return {
            "error": "No recognized symptoms provided",
            "available_symptoms": list(SYMPTOM_DOSHA_MAP.keys()),
        }

    # Calculate percentages
    vata_pct = round((vata_score / total) * 100, 1)
    pitta_pct = round((pitta_score / total) * 100, 1)
    kapha_pct = round((kapha_score / total) * 100, 1)

    # Determine dominant dosha
    scores = {"Vata": vata_pct, "Pitta": pitta_pct, "Kapha": kapha_pct}
    dominant = max(scores, key=scores.get)
    confidence = scores[dominant]

    # Get recommendations
    therapies = THERAPY_MAP.get(dominant, [])
    medicines = MEDICINE_MAP.get(dominant, [])
    diet = DIET_MAP.get(dominant, {})

    return {
        "scores": {
            "vata": vata_pct,
            "pitta": pitta_pct,
            "kapha": kapha_pct,
        },
        "dominant_dosha": dominant,
        "confidence": confidence,
        "matched_symptoms": matched,
        "total_symptoms": len(symptoms),
        "recommended_therapies": therapies,
        "recommended_medicines": medicines,
        "suggested_diet": diet,
    }


def get_available_symptoms() -> list[str]:
    """Return list of all recognized symptom keys."""
    return sorted(SYMPTOM_DOSHA_MAP.keys())
