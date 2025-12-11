import { Scheme } from './types';

// This simulates the "Chunk Store" and "Vector DB" content
export const MOCK_SCHEMES: Scheme[] = [
  {
    id: 'pm-kisan',
    name: 'PM Kisan Samman Nidhi',
    name_hi: 'प्रधानमंत्री किसान सम्मान निधि',
    description: 'Income support of Rs 6000 per year for all land holding farmer families.',
    description_hi: 'सभी भूमिधारक किसान परिवारों के लिए प्रति वर्ष 6000 रुपये की आय सहायता।',
    eligibilityCriteria: [
      'Landholding farmer families',
      'Excludes institutional landholders',
      'Excludes income tax payers'
    ],
    eligibilityCriteria_hi: [
        'भूमिधारक किसान परिवार',
        'संस्थागत भूमिधारकों को छोड़कर',
        'आयकर दाताओं को छोड़कर'
    ],
    benefits: 'INR 6000 per year in 3 installments.',
    benefits_hi: '3 किस्तों में प्रति वर्ष 6000 रुपये।',
    category: 'Agriculture',
    category_hi: 'कृषि',
    sourceUrl: 'https://pmkisan.gov.in',
    state: 'Central'
  },
  {
    id: 'ayushman-bharat',
    name: 'Ayushman Bharat (PM-JAY)',
    name_hi: 'आयुष्मान भारत (PM-JAY)',
    description: 'Health assurance scheme providing cover of Rs. 5 lakhs per family per year for secondary and tertiary care hospitalization.',
    description_hi: 'माध्यमिक और तृतीयक देखभाल अस्पताल में भर्ती के लिए प्रति परिवार प्रति वर्ष 5 लाख रुपये का स्वास्थ्य कवर।',
    eligibilityCriteria: [
      'Identified families based on SECC 2011 data',
      'Households with no adult member between 16-59',
      'Households with no able-bodied adult member'
    ],
    eligibilityCriteria_hi: [
        'एसईसीसी 2011 डेटा के आधार पर पहचाने गए परिवार',
        'ऐसे परिवार जिनमें 16-59 वर्ष के बीच कोई वयस्क सदस्य नहीं है',
        'ऐसे परिवार जिनमें कोई सक्षम वयस्क सदस्य नहीं है'
    ],
    benefits: 'Cashless access to health care services up to INR 5 Lakhs.',
    benefits_hi: '5 लाख रुपये तक की कैशलेस स्वास्थ्य सेवाएँ।',
    category: 'Health',
    category_hi: 'स्वास्थ्य',
    sourceUrl: 'https://pmjay.gov.in',
    state: 'Central'
  },
  {
    id: 'pm-svanidhi',
    name: 'PM SVANidhi',
    name_hi: 'पीएम स्वनिधि',
    description: 'Special Micro-Credit Facility for Street Vendors.',
    description_hi: 'सड़क विक्रेताओं के लिए विशेष माइक्रो-क्रेडिट सुविधा।',
    eligibilityCriteria: [
      'Street vendors in urban areas',
      'Vending on or before 24 March 2020'
    ],
    eligibilityCriteria_hi: [
        'शहरी क्षेत्रों में सड़क विक्रेता',
        '24 मार्च 2020 को या उससे पहले वेंडिंग'
    ],
    benefits: 'Working capital loan up to Rs. 10,000.',
    benefits_hi: '10,000 रुपये तक का कार्यशील पूंजी ऋण।',
    category: 'Business/Loan',
    category_hi: 'व्यापार/ऋण',
    sourceUrl: 'https://pmsvanidhi.mohua.gov.in',
    state: 'Central'
  },
  {
    id: 'sukanya-samriddhi',
    name: 'Sukanya Samriddhi Yojana',
    name_hi: 'सुकन्या समृद्धि योजना',
    description: 'A small deposit scheme for the girl child.',
    description_hi: 'बालिकाओं के लिए एक छोटी जमा योजना।',
    eligibilityCriteria: [
      'Girl child below 10 years of age',
      'Account can be opened by parent/guardian'
    ],
    eligibilityCriteria_hi: [
        '10 वर्ष से कम उम्र की बालिका',
        'खाता माता-पिता/अभिभावक द्वारा खोला जा सकता है'
    ],
    benefits: 'High interest rate, tax benefits under 80C.',
    benefits_hi: 'उच्च ब्याज दर, 80सी के तहत कर लाभ।',
    category: 'Child Welfare',
    category_hi: 'बाल कल्याण',
    sourceUrl: 'https://www.nsiindia.gov.in',
    state: 'Central'
  },
  {
    id: 'atal-pension',
    name: 'Atal Pension Yojana',
    name_hi: 'अटल पेंशन योजना',
    description: 'Pension scheme for unorganized sector workers.',
    description_hi: 'असंगठित क्षेत्र के श्रमिकों के लिए पेंशन योजना।',
    eligibilityCriteria: [
      'Age between 18-40 years',
      'Have a savings bank account'
    ],
    eligibilityCriteria_hi: [
        'उम्र 18-40 वर्ष के बीच',
        'बचत बैंक खाता होना चाहिए'
    ],
    benefits: 'Guaranteed pension of Rs 1000-5000 per month after 60 years.',
    benefits_hi: '60 वर्ष के बाद 1000-5000 रुपये प्रति माह की गारंटीड पेंशन।',
    category: 'Pension',
    category_hi: 'पेंशन',
    sourceUrl: 'https://www.npscra.nsdl.co.in',
    state: 'Central'
  },
  // State Specific Schemes
  {
    id: 'ladli-behna',
    name: 'Mukhyamantri Ladli Behna Yojana (MP)',
    name_hi: 'मुख्यमंत्री लाड़ली बहना योजना (मध्य प्रदेश)',
    description: 'Financial assistance scheme for women in Madhya Pradesh.',
    description_hi: 'मध्य प्रदेश में महिलाओं के लिए वित्तीय सहायता योजना।',
    eligibilityCriteria: [
      'Resident of Madhya Pradesh',
      'Married women aged 21-60 years',
      'Family income less than 2.5 Lakhs'
    ],
    eligibilityCriteria_hi: [
        'मध्य प्रदेश की निवासी',
        '21-60 वर्ष की विवाहित महिलाएं',
        'पारिवारिक आय 2.5 लाख से कम'
    ],
    benefits: 'INR 1250 per month directly to bank account.',
    benefits_hi: '1250 रुपये प्रति माह सीधे बैंक खाते में।',
    category: 'Women Welfare',
    category_hi: 'महिला कल्याण',
    sourceUrl: 'https://cmladlibehna.mp.gov.in/',
    state: 'Madhya Pradesh'
  },
  {
    id: 'rythu-bandhu',
    name: 'Rythu Bandhu (Telangana)',
    name_hi: 'रायथु बंधु (तेलंगाना)',
    description: 'Investment Support Scheme for landholding farmers.',
    description_hi: 'भूमिधारक किसानों के लिए निवेश सहायता योजना।',
    eligibilityCriteria: [
      'Resident of Telangana',
      'Must own farm land',
      'Commercial farmers excluded'
    ],
    eligibilityCriteria_hi: [
        'तेलंगाना के निवासी',
        'कृषि भूमि का स्वामी होना चाहिए',
        'वाणिज्यिक किसान शामिल नहीं'
    ],
    benefits: 'INR 5000 per acre per season.',
    benefits_hi: '5000 रुपये प्रति एकड़ प्रति सीजन।',
    category: 'Agriculture',
    category_hi: 'कृषि',
    sourceUrl: 'http://rythubandhu.telangana.gov.in/',
    state: 'Telangana'
  },
  {
    id: 'kanyashree',
    name: 'Kanyashree Prakalpa (West Bengal)',
    name_hi: 'कन्याश्री प्रकल्प (पश्चिम बंगाल)',
    description: 'Conditional Cash Transfer Scheme for improving the status and well being of the girl child.',
    description_hi: 'बालिकाओं की स्थिति और कल्याण में सुधार के लिए सशर्त नकद हस्तांतरण योजना।',
    eligibilityCriteria: [
      'Resident of West Bengal',
      'Girl student aged 13-18 years',
      'Unmarried'
    ],
    eligibilityCriteria_hi: [
        'पश्चिम बंगाल की निवासी',
        '13-18 वर्ष की छात्रा',
        'अविवाहित'
    ],
    benefits: 'Annual scholarship of INR 1000 and one-time grant of INR 25,000.',
    benefits_hi: '1000 रुपये की वार्षिक छात्रवृत्ति और 25,000 रुपये का एकमुश्त अनुदान।',
    category: 'Education/Women',
    category_hi: 'शिक्षा/महिला',
    sourceUrl: 'https://www.wbkanyashree.gov.in/',
    state: 'West Bengal'
  },
   {
    id: 'delhi-electricity',
    name: 'Delhi Free Electricity Scheme',
    name_hi: 'दिल्ली मुफ्त बिजली योजना',
    description: 'Subsidy on electricity bills for domestic consumers in Delhi.',
    description_hi: 'दिल्ली में घरेलू उपभोक्ताओं के लिए बिजली बिल पर सब्सिडी।',
    eligibilityCriteria: [
      'Resident of Delhi',
      'Domestic electricity connection',
      'Consumption up to 200 units (Free)'
    ],
    eligibilityCriteria_hi: [
        'दिल्ली के निवासी',
        'घरेलू बिजली कनेक्शन',
        '200 यूनिट तक खपत (मुफ्त)'
    ],
    benefits: 'Zero bill for consumption up to 200 units.',
    benefits_hi: '200 यूनिट तक की खपत के लिए शून्य बिल।',
    category: 'Utility',
    category_hi: 'उपयोगिता',
    sourceUrl: 'https://delhi.gov.in',
    state: 'Delhi'
  }
];

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

export const OCCUPATIONS = [
  'Farmer',
  'Street Vendor',
  'Student',
  'Unemployed',
  'Salaried (Private)',
  'Salaried (Government)',
  'Self-Employed/Business',
  'Daily Wage Worker',
  'Homemaker'
];