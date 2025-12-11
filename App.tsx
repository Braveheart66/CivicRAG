import React, { useState, useEffect } from 'react';
import { UserProfile, AppView, Scheme, Language } from './types';
import ProfileForm from './components/ProfileForm';
import ChatAssistant from './components/ChatAssistant';
import ArchitectureView from './components/ArchitectureView';
import { retrieveSchemes } from './services/ragService';
import { synthesizeRecommendations, checkIsApiKeyAvailable } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [synthesis, setSynthesis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  // Key to force reset of ProfileForm
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
     if(!checkIsApiKeyAvailable()) {
       setApiKeyMissing(true);
     }
  }, []);

  const handleReset = () => {
    setProfile(null);
    setSchemes([]);
    setSynthesis('');
    setFormKey(prev => prev + 1); // Force re-render of form with clean state
    setCurrentView(AppView.PROFILE);
  };

  const handleProfileSubmit = async (data: UserProfile) => {
    setProfile(data);
    setLoading(true);
    setCurrentView(AppView.RESULTS);

    try {
      // 1. Retrieval
      const retrieved = retrieveSchemes(data);
      setSchemes(retrieved);

      // 2. Generation
      if (retrieved.length > 0) {
        const summary = await synthesizeRecommendations(data, retrieved, language);
        setSynthesis(summary);
      } else {
        setSynthesis(language === 'hi' 
            ? "आपकी प्रोफ़ाइल से मेल खाने वाली कोई विशिष्ट योजना नहीं मिली।"
            : "No specific schemes found matching your profile criteria strictly.");
      }
    } catch (e) {
      console.error(e);
      setSynthesis("Error occurred during eligibility analysis.");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.HOME:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight mt-10">
              Democratizing Access to <span className="text-blue-600">Government Schemes</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl leading-relaxed">
              A "Free-Stack" RAG architecture using local AI to recommend eligible government benefits while protecting user privacy.
            </p>

            {/* Language Selection / Continue */}
            <div className="flex flex-wrap gap-4 justify-center mb-8">
               <button 
                onClick={() => { setLanguage('en'); handleReset(); }}
                className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-semibold px-6 py-3 rounded-lg shadow-sm transition-all"
               >
                 Continue in English 🇬🇧
               </button>
               <button 
                onClick={() => { setLanguage('hi'); handleReset(); }}
                className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-semibold px-6 py-3 rounded-lg shadow-sm transition-all font-serif"
               >
                 हिंदी में जारी रखें 🇮🇳
               </button>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <button 
                onClick={handleReset}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-8 py-4 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1"
              >
                {language === 'hi' ? 'योजनाएं खोजें' : 'Find Schemes For Me'}
              </button>
              <button 
                onClick={() => setCurrentView(AppView.ARCHITECTURE)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-lg font-semibold px-8 py-4 rounded-xl shadow-sm transition-colors"
              >
                View Architecture
              </button>
            </div>
            {apiKeyMissing && (
               <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm max-w-lg">
                 <strong>Note:</strong> No API Key detected. The retrieval part will work (simulated), but the AI explanation/chat (Generative) features will return placeholder text. 
               </div>
            )}
          </div>
        );

      case AppView.ARCHITECTURE:
        return <ArchitectureView />;

      case AppView.PROFILE:
        return (
           <div className="py-8">
              <ProfileForm key={formKey} onSubmit={handleProfileSubmit} initialData={undefined} language={language} />
           </div>
        );

      case AppView.RESULTS:
        return (
          <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Schemes List */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* AI Summary Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-xl shadow-sm">
                <h3 className="text-blue-900 font-bold flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {language === 'hi' ? 'पात्रता विश्लेषण' : 'Eligibility Analysis'}
                </h3>
                {loading ? (
                   <div className="animate-pulse space-y-2">
                     <div className="h-4 bg-blue-200 rounded w-3/4"></div>
                     <div className="h-4 bg-blue-200 rounded w-1/2"></div>
                   </div>
                ) : (
                  <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {synthesis}
                  </div>
                )}
              </div>

              {/* List of Schemes */}
              <div>
                 <h3 className="text-xl font-bold text-slate-800 mb-4">
                     {language === 'hi' ? 'सुझाई गई योजनाएं' : 'Recommended Schemes'}
                 </h3>
                 {schemes.length === 0 && !loading ? (
                   <div className="text-center p-8 bg-white rounded-lg border border-dashed border-slate-300 text-slate-500">
                     {language === 'hi' ? 'कोई योजना नहीं मिली। कृपया अपनी प्रोफ़ाइल समायोजित करें।' : 'No schemes found matching strictly. Try adjusting your profile filters.'}
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {schemes.map(scheme => (
                       <div key={scheme.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition shadow-sm group">
                         <div className="flex justify-between items-start mb-2">
                           <div>
                             <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded mb-2 uppercase tracking-wide">
                                {language === 'hi' ? (scheme.category_hi || scheme.category) : scheme.category}
                             </span>
                             <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {language === 'hi' ? (scheme.name_hi || scheme.name) : scheme.name}
                             </h4>
                           </div>
                           {scheme.matchScore && (
                             <div className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                               {Math.round(scheme.matchScore * 100)}% {language === 'hi' ? 'मैच' : 'Match'}
                             </div>
                           )}
                         </div>
                         <p className="text-slate-600 text-sm mb-3">
                             {language === 'hi' ? (scheme.description_hi || scheme.description) : scheme.description}
                         </p>
                         <div className="text-sm bg-slate-50 p-3 rounded-lg text-slate-700 mb-3">
                            <span className="font-semibold text-slate-900">{language === 'hi' ? 'लाभ: ' : 'Benefit: '}</span> 
                            {language === 'hi' ? (scheme.benefits_hi || scheme.benefits) : scheme.benefits}
                         </div>
                         <div className="flex gap-2 text-xs text-blue-600 font-medium">
                            <a href={scheme.sourceUrl} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                               {language === 'hi' ? 'आधिकारिक वेबसाइट' : 'Official Website'}
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>

            {/* Right Column: Chat RAG */}
            <div className="lg:col-span-1">
               <div className="sticky top-6">
                 <ChatAssistant schemes={schemes} language={language} />
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView(AppView.HOME)}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">C</div>
            <span className="text-xl font-bold text-slate-800">Civic<span className="text-blue-600">RAG</span></span>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <button onClick={() => setCurrentView(AppView.HOME)} className={`hover:text-blue-600 ${currentView === AppView.HOME ? 'text-blue-600' : ''}`}>
                {language === 'hi' ? 'होम' : 'Home'}
            </button>
            <button onClick={() => setCurrentView(AppView.ARCHITECTURE)} className={`hover:text-blue-600 ${currentView === AppView.ARCHITECTURE ? 'text-blue-600' : ''}`}>
                {language === 'hi' ? 'आर्किटेक्चर' : 'Architecture'}
            </button>
            <button onClick={handleReset} className={`hover:text-blue-600 ${currentView === AppView.PROFILE ? 'text-blue-600' : ''}`}>
                {language === 'hi' ? 'योजनाएं खोजें' : 'Search Schemes'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center text-sm">
        <div className="max-w-7xl mx-auto">
          <p className="mb-2">Free-Stack Architecture Reference Implementation</p>
          <p className="text-slate-600">
            {language === 'hi' 
              ? 'नोट: यह एक प्रोटोटाइप है। परिणाम सलाहकार हैं। आधिकारिक पात्रता संबंधित विभागों से सत्यापित की जानी चाहिए।' 
              : 'Note: This is a prototype. Results are advisory. Official eligibility should be verified with respective departments.'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;