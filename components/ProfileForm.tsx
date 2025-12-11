import React, { useState, useEffect } from 'react';
import { UserProfile, Language } from '../types';
import { STATES, OCCUPATIONS } from '../constants';

interface ProfileFormProps {
  onSubmit: (profile: UserProfile) => void;
  initialData?: UserProfile;
  language: Language;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSubmit, initialData, language }) => {
  // Use empty strings for numbers to allow "blank" state instead of 0
  const emptyState: UserProfile = {
    age: '',
    income: '',
    occupation: 'Farmer',
    state: 'Delhi',
    category: 'General',
    gender: 'Male',
    disability: false
  };

  const [formData, setFormData] = useState<UserProfile>(initialData || emptyState);

  // Effect to update form if initialData changes (for reset)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
        setFormData(emptyState);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate that numbers are entered
    if (formData.age === '' || formData.income === '') {
        alert(language === 'hi' ? "कृपया मान्य आयु और आय दर्ज करें" : "Please enter valid age and income");
        return;
    }
    onSubmit(formData);
  };

  // Translation helpers
  const t = (key: string) => {
    const dict: Record<string, { en: string; hi: string }> = {
        title: { en: "Your Profile", hi: "आपकी प्रोफ़ाइल" },
        age: { en: "Age", hi: "आयु" },
        income: { en: "Annual Income (INR)", hi: "वार्षिक आय (₹)" },
        occupation: { en: "Occupation", hi: "व्यवसाय" },
        state: { en: "State", hi: "राज्य" },
        gender: { en: "Gender", hi: "लिंग" },
        category: { en: "Category", hi: "श्रेणी" },
        disability: { en: "I have a disability (PwD)", hi: "क्या आप दिव्यांग हैं?" },
        submit: { en: "Find Eligible Schemes", hi: "पात्र योजनाएं खोजें" },
        male: { en: "Male", hi: "पुरुष" },
        female: { en: "Female", hi: "महिला" },
        other: { en: "Other", hi: "अन्य" },
        general: { en: "General", hi: "सामान्य" },
        obc: { en: "OBC", hi: "ओबीसी (OBC)" },
        sc: { en: "SC", hi: "अनुसूचित जाति (SC)" },
        st: { en: "ST", hi: "अनुसूचित जनजाति (ST)" },
    };
    return dict[key]?.[language === 'hi' ? 'hi' : 'en'] || key;
  };

  const tOcc = (occ: string) => {
    if (language !== 'hi') return occ;
    const map: Record<string, string> = {
        'Farmer': 'किसान',
        'Street Vendor': 'सड़क विक्रेता',
        'Student': 'छात्र',
        'Unemployed': 'बेरोजगार',
        'Salaried (Private)': 'वेतनभोगी (निजी)',
        'Salaried (Government)': 'वेतनभोगी (सरकारी)',
        'Self-Employed/Business': 'स्वरोजगार/व्यवसाय',
        'Daily Wage Worker': 'दिहाड़ी मजदूर',
        'Homemaker': 'गृहिणी'
    };
    return map[occ] || occ;
  };

  const tState = (state: string) => {
    if (language !== 'hi') return state;
    const map: Record<string, string> = {
      'Andhra Pradesh': 'आंध्र प्रदेश',
      'Arunachal Pradesh': 'अरुणाचल प्रदेश',
      'Assam': 'असम',
      'Bihar': 'बिहार',
      'Chhattisgarh': 'छत्तीसगढ़',
      'Goa': 'गोवा',
      'Gujarat': 'गुजरात',
      'Haryana': 'हरियाणा',
      'Himachal Pradesh': 'हिमाचल प्रदेश',
      'Jharkhand': 'झारखंड',
      'Karnataka': 'कर्नाटक',
      'Kerala': 'केरल',
      'Madhya Pradesh': 'मध्य प्रदेश',
      'Maharashtra': 'महाराष्ट्र',
      'Manipur': 'मणिपुर',
      'Meghalaya': 'मेघालय',
      'Mizoram': 'मिजोरम',
      'Nagaland': 'नागालैंड',
      'Odisha': 'ओडिशा',
      'Punjab': 'पंजाब',
      'Rajasthan': 'राजस्थान',
      'Sikkim': 'सिक्किम',
      'Tamil Nadu': 'तमिलनाडु',
      'Telangana': 'तेलंगाना',
      'Tripura': 'त्रिपुरा',
      'Uttar Pradesh': 'उत्तर प्रदेश',
      'Uttarakhand': 'उत्तराखंड',
      'West Bengal': 'पश्चिम बंगाल',
      'Delhi': 'दिल्ली'
    };
    return map[state] || state;
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {t('title')}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('age')}</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder={language === 'hi' ? "उदाहरण 35" : "e.g. 35"}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('income')}</label>
            <input
              type="number"
              name="income"
              value={formData.income}
              onChange={handleChange}
              placeholder={language === 'hi' ? "उदाहरण 100000" : "e.g. 100000"}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-slate-900"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('occupation')}</label>
            <select
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-slate-900"
            >
              {OCCUPATIONS.map(occ => <option key={occ} value={occ} className="text-slate-900">{tOcc(occ)}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('state')}</label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-slate-900"
            >
              {STATES.map(state => <option key={state} value={state} className="text-slate-900">{tState(state)}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('gender')}</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-slate-900"
            >
              <option value="Male" className="text-slate-900">{t('male')}</option>
              <option value="Female" className="text-slate-900">{t('female')}</option>
              <option value="Other" className="text-slate-900">{t('other')}</option>
            </select>
          </div>

           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('category')}</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white text-slate-900"
            >
              <option value="General" className="text-slate-900">{t('general')}</option>
              <option value="OBC" className="text-slate-900">{t('obc')}</option>
              <option value="SC" className="text-slate-900">{t('sc')}</option>
              <option value="ST" className="text-slate-900">{t('st')}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
           <input
              type="checkbox"
              name="disability"
              id="disability"
              checked={formData.disability}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
           />
           <label htmlFor="disability" className="text-sm text-slate-700">{t('disability')}</label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md flex justify-center items-center gap-2"
        >
          <span>{t('submit')}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;