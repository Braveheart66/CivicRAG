import React from 'react';

const ArchitectureView: React.FC = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Free-Stack RAG Architecture</h2>
      <p className="text-slate-600 mb-8">
        This prototype demonstrates the following open-source architecture for privacy-first, low-cost government scheme recommendation.
      </p>

      {/* CSS-based Diagram implementation of the ASCII art */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 overflow-x-auto">
        <div className="flex flex-col gap-8 min-w-[800px]">
          
          {/* Layer 1: Data Ingestion */}
          <div className="flex justify-center gap-12 relative">
            <div className="w-48 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
              <div className="font-bold text-blue-800">Source Docs</div>
              <div className="text-xs text-blue-600 mt-1">PDF / HTML</div>
            </div>
            
            <div className="self-center text-slate-400">⟶</div>
            
            <div className="w-48 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg text-center">
              <div className="font-bold text-indigo-800">Local Crawler/ETL</div>
              <div className="text-xs text-indigo-600 mt-1">Parse / OCR / Segment</div>
            </div>
          </div>

          <div className="flex justify-center">
             <div className="h-8 w-0.5 bg-slate-300"></div>
          </div>

          {/* Layer 2: Storage & Embedding */}
          <div className="flex justify-center gap-12">
            <div className="w-64 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg text-center relative">
               <div className="font-bold text-emerald-800">Chunk Store</div>
               <div className="text-xs text-emerald-600 mt-1">Local Files / DB</div>
               <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 bg-white px-2">sentence-transformers</div>
            </div>
          </div>

          <div className="flex justify-center">
             <div className="h-8 w-0.5 bg-slate-300"></div>
          </div>

          {/* Layer 3: Vector DB */}
          <div className="flex justify-center gap-12">
            <div className="w-64 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg text-center shadow-sm">
               <div className="font-bold text-purple-800">Local Vector DB</div>
               <div className="text-xs text-purple-600 mt-1">Chroma / FAISS</div>
            </div>
          </div>

           <div className="flex justify-center text-xs text-slate-400">
             (Retrieve Top-K Chunks)
          </div>
          <div className="flex justify-center">
             <div className="h-8 w-0.5 bg-slate-300"></div>
          </div>

          {/* Layer 4: Orchestration */}
          <div className="flex justify-center gap-24 relative">
             <div className="w-48 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg text-center z-10">
               <div className="font-bold text-orange-800">Backend API</div>
               <div className="text-xs text-orange-600 mt-1">FastAPI</div>
             </div>
             
             {/* LLM Sidecar */}
             <div className="absolute left-[60%] top-0 translate-x-4 w-56 p-4 bg-slate-800 text-white rounded-lg border-2 border-slate-600 shadow-xl">
               <div className="font-bold text-green-400">Local LLM Host</div>
               <div className="text-xs text-slate-300 mt-1">Llama 3 / Mistral (llama.cpp)</div>
               <div className="text-[10px] text-slate-400 mt-2 italic">Synthesizes Answer</div>
               
               {/* Arrow connecting Backend to LLM */}
               <div className="absolute top-1/2 -left-24 w-24 h-0.5 bg-slate-300"></div>
               <div className="absolute top-1/2 -left-4 text-[10px] text-slate-500 bg-white px-1">Context</div>
             </div>
          </div>

          <div className="flex justify-center">
             <div className="h-8 w-0.5 bg-slate-300"></div>
          </div>

          {/* Layer 5: Frontend */}
          <div className="flex justify-center gap-12">
            <div className="w-64 p-4 bg-blue-600 text-white rounded-lg text-center shadow-lg ring-4 ring-blue-100">
               <div className="font-bold">Frontend UI</div>
               <div className="text-xs text-blue-200 mt-1">React / Tailwind</div>
            </div>
          </div>

        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white border rounded shadow-sm">
          <h3 className="font-semibold text-slate-800">Why this architecture?</h3>
          <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
            <li><span className="font-medium text-slate-900">Zero Cost:</span> Uses open source models and databases.</li>
            <li><span className="font-medium text-slate-900">Privacy First:</span> No user data leaves the local network (in production).</li>
            <li><span className="font-medium text-slate-900">Offline Capable:</span> Can run on air-gapped systems if needed.</li>
          </ul>
        </div>
        <div className="p-4 bg-white border rounded shadow-sm">
          <h3 className="font-semibold text-slate-800">Current Prototype Status</h3>
          <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
             <li><span className="text-green-600 font-medium">Frontend:</span> React (Implemented)</li>
             <li><span className="text-orange-600 font-medium">Vector DB:</span> Simulated (Memory)</li>
             <li><span className="text-blue-600 font-medium">LLM:</span> Gemini API (Proxy for Local LLM)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureView;