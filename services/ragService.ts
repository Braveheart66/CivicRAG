import { Scheme, UserProfile } from '../types';
import { MOCK_SCHEMES } from '../constants';

/**
 * This function simulates the "Retrieval" and "Ranking" steps of the architecture.
 * In the full architecture, this would be:
 * 1. User Query -> Embedding Model -> Vector Search (Chroma)
 * 2. Vector Results -> Eligibility Rules Engine -> Filtered List
 * 
 * We use strict rule-based filtering here to ensure high precision for the prototype.
 */
export const retrieveSchemes = (profile: UserProfile): Scheme[] => {
  const results: Scheme[] = [];
  const age = Number(profile.age);
  const income = Number(profile.income);

  MOCK_SCHEMES.forEach((scheme) => {
    let score = 0;
    let isEligible = false; // Default to false for strictness

    // --- State Filter Logic ---
    // If scheme has a specific state defined (and it's not Central), 
    // it must match the user's state.
    if (scheme.state && scheme.state !== 'Central') {
       if (scheme.state !== profile.state) {
          // Skip this scheme immediately if states don't match
          return;
       }
       // If state matches, give a slight base score for geographic relevance
       score = 0.5;
    }

    // --- Specific Scheme Rules ---

    // PM Kisan: Farmer only
    if (scheme.id === 'pm-kisan') {
      if (profile.occupation.toLowerCase().includes('farmer')) {
        score = 0.9;
        isEligible = true;
      }
    }

    // PM SVANidhi: Vendor only
    if (scheme.id === 'pm-svanidhi') {
      if (profile.occupation.toLowerCase().includes('vendor')) {
        score = 0.9;
        isEligible = true;
      }
    }

    // Ayushman Bharat: Income check (simulated threshold)
    if (scheme.id === 'ayushman-bharat') {
      if (income < 500000) { // Assuming 5L limit for prototype simulation
        score = 0.8;
        isEligible = true;
      }
    }

    // Atal Pension: Age 18-40
    if (scheme.id === 'atal-pension') {
      if (age >= 18 && age <= 40) {
        score = 0.85;
        isEligible = true;
      }
    }

    // Sukanya Samriddhi: Girl child < 10. 
    if (scheme.id === 'sukanya-samriddhi') {
       if (profile.gender === 'Female' && age <= 10) {
         score = 0.95;
         isEligible = true;
       }
    }

    // --- State Specific Scheme Rules ---

    // Ladli Behna (MP): Women, 21-60, Income < 2.5L
    if (scheme.id === 'ladli-behna') {
      if (profile.gender === 'Female' && age >= 21 && age <= 60 && income < 250000) {
          score = 0.95;
          isEligible = true;
      } else {
        isEligible = false;
      }
    }

    // Rythu Bandhu (Telangana): Farmer
    if (scheme.id === 'rythu-bandhu') {
      if (profile.occupation.toLowerCase().includes('farmer')) {
          score = 0.95;
          isEligible = true;
      } else {
          isEligible = false;
      }
    }

    // Kanyashree (WB): Female, Student, 13-18
    if (scheme.id === 'kanyashree') {
       if (profile.gender === 'Female' && profile.occupation === 'Student' && age >= 13 && age <= 18) {
          score = 0.95;
          isEligible = true;
       } else {
          isEligible = false;
       }
    }

    // Delhi Electricity (Delhi): Residents (State match already checked above)
    if (scheme.id === 'delhi-electricity') {
       // Assuming all residents eligible for basic subsidy logic here
       isEligible = true;
       score = 0.9; 
    }

    if (isEligible && score > 0) {
      results.push({ ...scheme, matchScore: score });
    }
  });

  return results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
};