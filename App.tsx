import React, { useState, useEffect } from 'react';
import { generateSpeech } from './services/gemini';
import { VOICES, DEFAULT_PRESETS, DEFAULT_INSTRUCTION } from './constants';
import { Preset, GeneratedAudio, Tab, GenerationMode } from './types';
import AudioPlayer from './components/AudioPlayer';
import { SparklesIcon, SaveIcon, TrashIcon, PlusIcon, SettingsIcon, XMarkIcon, UsersIcon, UserIcon } from './components/Icon';

function App() {
  // --- State ---
  // Tabs State
  const [tabs, setTabs] = useState<Tab[]>([{
    id: 'tab-1',
    title: 'New Project',
    text: '',
    mode: 'single',
    voice: VOICES[0].value,
    speakers: [
      { name: 'A', voice: VOICES[0].value },
      { name: 'B', voice: VOICES[2].value }
    ],
    systemInstruction: DEFAULT_INSTRUCTION,
    isGenerating: false,
    error: null
  }]);
  const [activeTabId, setActiveTabId] = useState('tab-1');

  // Global History & Presets
  const [history, setHistory] = useState<GeneratedAudio[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Derived state for current tab
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // --- Effects ---
  useEffect(() => {
    // Load data from localStorage
    const storedPresets = localStorage.getItem('voxgen_presets');
    if (storedPresets) {
      setPresets(JSON.parse(storedPresets));
    } else {
      setPresets(DEFAULT_PRESETS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('voxgen_presets', JSON.stringify(presets));
  }, [presets]);


  // --- Tab Management ---

  const createTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      title: 'New Project',
      text: '',
      mode: 'single',
      voice: VOICES[0].value,
      speakers: [
        { name: 'A', voice: VOICES[0].value },
        { name: 'B', voice: VOICES[2].value }
      ],
      systemInstruction: DEFAULT_INSTRUCTION,
      isGenerating: false,
      error: null
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Don't close last tab
    
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    
    if (id === activeTabId) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const updateActiveTab = (updates: Partial<Tab>) => {
    setTabs(tabs.map(t => {
      if (t.id === activeTabId) {
        // Auto-update title if text changes and title is default
        let newTitle = updates.title || t.title;
        if (updates.text !== undefined) {
           const cleanText = updates.text.trim();
           if (cleanText && (t.title === 'New Project' || t.title.startsWith('"'))) {
              newTitle = `"${cleanText.substring(0, 15)}${cleanText.length > 15 ? '...' : ''}"`;
           } else if (!cleanText) {
              newTitle = 'New Project';
           }
        }
        return { ...t, ...updates, title: newTitle };
      }
      return t;
    }));
  };

  const updateSpeaker = (index: number, field: 'name' | 'voice', value: string) => {
    const newSpeakers = [...activeTab.speakers];
    newSpeakers[index] = { ...newSpeakers[index], [field]: value };
    updateActiveTab({ speakers: newSpeakers });
  };


  // --- Handlers ---

  const handleGenerate = async () => {
    const tabToProcess = activeTab; // Capture current tab state
    
    if (!tabToProcess.text.trim()) {
      updateActiveTab({ error: "Please enter some text." });
      return;
    }

    // Set generating state for this tab
    setTabs(prev => prev.map(t => t.id === tabToProcess.id ? { ...t, isGenerating: true, error: null } : t));

    try {
      const { blob, duration } = await generateSpeech(
        tabToProcess.text, 
        {
          mode: tabToProcess.mode,
          voiceName: tabToProcess.voice,
          speakers: tabToProcess.speakers,
          systemInstruction: tabToProcess.systemInstruction
        }
      );
      const url = URL.createObjectURL(blob);
      
      const displayVoiceName = tabToProcess.mode === 'single' 
        ? tabToProcess.voice 
        : `Multi (${tabToProcess.speakers.map(s => s.name).join(', ')})`;

      const newItem: GeneratedAudio = {
        id: Date.now().toString(),
        text: tabToProcess.text.length > 50 ? tabToProcess.text.substring(0, 50) + '...' : tabToProcess.text,
        voice: displayVoiceName,
        timestamp: Date.now(),
        audioUrl: url,
        duration: duration
      };

      setHistory(prev => [newItem, ...prev]);
      
      // Update tab state to finished
      setTabs(prev => prev.map(t => t.id === tabToProcess.id ? { ...t, isGenerating: false } : t));
      
    } catch (err: any) {
      setTabs(prev => prev.map(t => t.id === tabToProcess.id ? { ...t, isGenerating: false, error: err.message || "Error" } : t));
    }
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: newPresetName,
      mode: activeTab.mode,
      voice: activeTab.voice,
      speakers: activeTab.speakers,
      systemInstruction: activeTab.systemInstruction,
    };
    setPresets([...presets, newPreset]);
    setNewPresetName('');
    setShowSavePresetModal(false);
  };

  const loadPreset = (preset: Preset) => {
    const updates: Partial<Tab> = {
      mode: preset.mode || 'single',
      systemInstruction: preset.systemInstruction
    };

    if (preset.mode === 'multi' && preset.speakers) {
       updates.speakers = preset.speakers;
    } else {
       // Validate single voice exists
       const voiceExists = VOICES.some(v => v.value === preset.voice);
       updates.voice = voiceExists ? preset.voice : VOICES[0].value;
    }
    
    updateActiveTab(updates);
  };

  const deletePreset = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPresets(presets.filter(p => p.id !== id));
  };

  // --- Render ---

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950 text-gray-200 font-sans">
      
      {/* Sidebar: Presets & History */}
      <aside className="w-full md:w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-screen overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center space-x-2">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
             <span className="font-bold text-white">V</span>
           </div>
           <h1 className="text-xl font-bold tracking-tight text-white">VoxGen AI</h1>
        </div>

        {/* Presets Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Presets</h2>
              <button 
                onClick={() => setShowSavePresetModal(true)}
                className="text-gray-400 hover:text-indigo-400 transition-colors"
                title="Create new preset"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {presets.map(preset => (
                <div 
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className="group flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 hover:border-indigo-500/50 border border-transparent cursor-pointer transition-all"
                  title={`Load preset: ${preset.name}`}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-gray-300 truncate group-hover:text-white">{preset.name}</p>
                    <p 
                        className="text-xs text-gray-500 flex items-center" 
                        title={preset.mode === 'multi' ? 'Multi-Speaker Mode' : 'Single Voice Mode'}
                    >
                       {preset.mode === 'multi' ? <UsersIcon className="w-3 h-3 mr-1" /> : <UserIcon className="w-3 h-3 mr-1" />}
                       {preset.mode === 'multi' ? 'Multi-Speaker' : preset.voice}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => deletePreset(e, preset.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-opacity p-1"
                    title="Delete preset"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent History Section */}
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Recent Generations</h2>
            <div className="space-y-3">
              {history.map(item => (
                <div key={item.id} className="bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded truncate max-w-[150px]">{item.voice}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2 italic">"{item.text}"</p>
                  <AudioPlayer src={item.audioUrl} duration={item.duration} />
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  <p className="text-sm">No history yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header with Tabs */}
        <header className="border-b border-gray-800 bg-gray-950 pt-2 z-10">
           <div className="flex items-center px-4 space-x-2 overflow-x-auto no-scrollbar">
             {tabs.map(tab => (
               <div 
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`
                    group relative flex items-center min-w-[150px] max-w-[200px] h-10 px-4 rounded-t-lg border-t border-x cursor-pointer select-none transition-all
                    ${activeTabId === tab.id 
                      ? 'bg-gray-900 border-gray-800 text-white' 
                      : 'bg-gray-950 border-transparent text-gray-500 hover:bg-gray-900/50 hover:text-gray-300'}
                  `}
                  title={`Switch to ${tab.title}`}
               >
                 <span className="text-xs font-medium truncate flex-1 mr-2">{tab.title}</span>
                 {tabs.length > 1 && (
                   <button 
                    onClick={(e) => closeTab(e, tab.id)}
                    className={`p-0.5 rounded-full hover:bg-gray-700 ${activeTabId === tab.id ? 'text-gray-400 hover:text-white' : 'invisible group-hover:visible'}`}
                    title="Close tab"
                   >
                     <XMarkIcon className="w-3 h-3" />
                   </button>
                 )}
                 {tab.isGenerating && (
                    <span className="absolute right-2 top-3 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                 )}
               </div>
             ))}
             <button 
                onClick={createTab}
                className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Create new project tab"
             >
               <PlusIcon className="w-5 h-5" />
             </button>
           </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-8 relative bg-gray-900/50">
          <div className="max-w-4xl mx-auto space-y-8 pb-32">
            
            {/* Input Form */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-xl">
              
              {/* Mode Toggle */}
              <div className="flex justify-center mb-6">
                <div className="bg-gray-950 p-1 rounded-lg inline-flex border border-gray-800">
                  <button
                    onClick={() => updateActiveTab({ mode: 'single' })}
                    title="Generate speech with a single voice"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab.mode === 'single' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Single Voice
                    </div>
                  </button>
                  <button
                    onClick={() => updateActiveTab({ mode: 'multi' })}
                    title="Generate a conversation between two speakers"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab.mode === 'multi' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                     <div className="flex items-center">
                      <UsersIcon className="w-4 h-4 mr-2" />
                      Multi-Speaker
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* Configuration Column */}
                <div className="space-y-6">
                   
                   {activeTab.mode === 'single' ? (
                      /* Single Voice Config */
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Voice Selection</label>
                        <div className="relative">
                          <select
                            value={activeTab.voice}
                            onChange={(e) => updateActiveTab({ voice: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 appearance-none"
                          >
                            {VOICES.map(voice => (
                              <option key={voice.value} value={voice.value}>
                                {voice.label} ({voice.gender})
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <SettingsIcon className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                   ) : (
                      /* Multi Speaker Config */
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-400">Speaker Mapping</label>
                        <p className="text-xs text-gray-500 mb-2">Define exactly 2 speakers. Use the names (e.g., "A", "B") in your script.</p>
                        
                        {activeTab.speakers.map((speaker, idx) => (
                           <div key={idx} className="flex space-x-2">
                              <div className="w-1/3">
                                <input 
                                  type="text" 
                                  value={speaker.name}
                                  onChange={(e) => updateSpeaker(idx, 'name', e.target.value)}
                                  className="w-full bg-gray-950 border border-gray-700 text-white text-sm rounded-lg p-2.5 placeholder-gray-600"
                                  placeholder="Name in script (e.g. Joe)"
                                />
                              </div>
                              <div className="w-2/3">
                                <select
                                  value={speaker.voice}
                                  onChange={(e) => updateSpeaker(idx, 'voice', e.target.value)}
                                  className="w-full bg-gray-950 border border-gray-700 text-white text-sm rounded-lg p-2.5"
                                >
                                  {VOICES.map(voice => (
                                    <option key={voice.value} value={voice.value}>
                                      {voice.label} ({voice.gender})
                                    </option>
                                  ))}
                                </select>
                              </div>
                           </div>
                        ))}
                      </div>
                   )}

                </div>

                {/* System Instruction Column (Shared) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">
                    Style Instruction 
                    <span className="ml-2 text-xs text-gray-500 font-normal">(Tone, Speed, Emotion)</span>
                  </label>
                  <textarea
                    value={activeTab.systemInstruction}
                    onChange={(e) => updateActiveTab({ systemInstruction: e.target.value })}
                    placeholder="e.g. Speak excitedly. For multi-speaker, this applies to the overall conversation tone."
                    rows={activeTab.mode === 'multi' ? 4 : 2}
                    className="w-full bg-gray-950 border border-gray-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 resize-none"
                  />
                </div>
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">Script</label>
                <textarea
                  value={activeTab.text}
                  onChange={(e) => updateActiveTab({ text: e.target.value })}
                  placeholder={
                    activeTab.mode === 'single' 
                      ? "Enter the text you want to convert to speech..." 
                      : `Enter dialogue using your speaker names:\n\n${activeTab.speakers[0].name}: Hello!\n${activeTab.speakers[1].name}: Hi there, how are you?`
                  }
                  rows={8}
                  className="w-full bg-gray-950 border border-gray-700 text-white text-base leading-relaxed rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-4 resize-none font-mono"
                />
              </div>

            </div>

             {/* Error Message */}
             {activeTab.error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg text-sm flex items-center">
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {activeTab.error}
              </div>
            )}
            
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md border-t border-gray-800 p-6 flex items-center justify-between z-20">
          <div className="hidden md:flex items-center text-sm text-gray-500 space-x-4">
             <span>Model: <span className="text-gray-300">gemini-2.5-flash-preview-tts</span></span>
             <span>•</span>
             <span>Mode: <span className="text-gray-300 capitalize">{activeTab.mode}</span></span>
             <span>•</span>
             <span>Characters: <span className="text-gray-300">{activeTab.text.length}</span></span>
          </div>
          
          <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowSavePresetModal(true)}
              className="px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 font-medium text-sm hover:bg-gray-800 hover:text-white transition-colors flex items-center"
              title="Save current configuration as a preset"
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Preset
            </button>
            <button
              onClick={handleGenerate}
              disabled={activeTab.isGenerating || !activeTab.text.trim()}
              title="Generate Speech"
              className={`px-6 py-2.5 rounded-lg font-medium text-sm text-white flex items-center shadow-lg shadow-indigo-900/20 transition-all
                ${activeTab.isGenerating || !activeTab.text.trim() 
                  ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
                  : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25 active:scale-95'
                }`}
            >
              {activeTab.isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Generate Speech
                </>
              )}
            </button>
          </div>
        </div>

      </main>

      {/* Save Preset Modal */}
      {showSavePresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-4">Save Preset</h3>
            <p className="text-sm text-gray-400 mb-4">
              Save current configuration as a quick preset.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Preset Name</label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="My Custom Setup"
                  className="w-full bg-gray-950 border border-gray-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3"
                  autoFocus
                />
              </div>
              <div className="bg-gray-950 p-3 rounded-lg text-xs text-gray-500">
                <p>Mode: <span className="text-gray-300 capitalize">{activeTab.mode}</span></p>
                {activeTab.mode === 'single' ? (
                   <p>Voice: <span className="text-gray-300">{activeTab.voice}</span></p>
                ) : (
                   <p>Speakers: <span className="text-gray-300">{activeTab.speakers.map(s => s.name).join(', ')}</span></p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSavePresetModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!newPresetName.trim()}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;