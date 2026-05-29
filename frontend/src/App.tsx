import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  MapPin, 
  PhoneCall, 
  Search, 
  AlertTriangle, 
  FileText, 
  HeartHandshake, 
  MessageSquare, 
  Send, 
  Compass, 
  CheckCircle,
  Sparkles,
  LifeBuoy,
  FileImage,
  Layers,
  Sun,
  CloudRain,
  CloudFog,
  Moon,
  Gauge,
  RefreshCw,
  Signal,
  MessageCircle,
  X
} from 'lucide-react';
import MapContainer from './components/MapContainer';
import RiskSpeedometer from './components/RiskSpeedometer';

// ==========================================
// 1. LIGHTWEIGHT INLINE ANIME SVGs
// ==========================================

// Wise, academic, amber-themed sensei with glasses and traffic colors
const TrafficSenseiSVG = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-md">
    <circle cx="50" cy="50" r="48" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
    {/* Hair */}
    <path d="M25,45 C20,30 35,20 50,22 C65,20 80,30 75,45 C80,55 70,70 50,68 C30,70 20,55 25,45 Z" fill="#64748b" />
    <path d="M30,35 Q50,15 70,35" fill="none" stroke="#e2e8f0" strokeWidth="2" />
    {/* Face */}
    <circle cx="50" cy="50" r="32" fill="#fed7aa" />
    {/* Wise Eyes & Eyebrows */}
    <path d="M38,42 Q44,40 45,45" fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
    <path d="M62,42 Q56,40 55,45" fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
    <line x1="35" y1="36" x2="45" y2="39" stroke="#475569" strokeWidth="2" />
    <line x1="65" y1="36" x2="55" y2="39" stroke="#475569" strokeWidth="2" />
    {/* Glasses */}
    <circle cx="42" cy="46" r="8" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
    <circle cx="58" cy="46" r="8" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
    <line x1="46" y1="46" x2="54" y2="46" stroke="#f59e0b" strokeWidth="2.5" />
    {/* Smile & Blush */}
    <path d="M46,58 Q50,62 54,58" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="34" cy="52" r="3" fill="#f43f5e" opacity="0.4" />
    <circle cx="66" cy="52" r="3" fill="#f43f5e" opacity="0.4" />
    {/* Academic Hat */}
    <polygon points="50,12 72,24 50,34 28,24" fill="#334155" stroke="#f59e0b" strokeWidth="2" />
    <line x1="72" y1="24" x2="72" y2="36" stroke="#f59e0b" strokeWidth="1.5" />
    <circle cx="72" cy="36" r="3" fill="#f59e0b" />
  </svg>
);

// Cybernetic road knight with blue visor and hazard warning aesthetics
const RoadGuardianSVG = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-md">
    <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#0ea5e9" strokeWidth="3" />
    {/* Heavy Helmet / Shield */}
    <path d="M22,35 L78,35 L74,70 L50,85 L26,70 Z" fill="#334155" stroke="#0ea5e9" strokeWidth="2" />
    {/* Hazard Orange Plates */}
    <path d="M22,35 L50,15 L78,35 L50,45 Z" fill="#f97316" opacity="0.85" />
    {/* Tech Visor */}
    <path d="M28,45 L72,45 L68,56 L50,64 L32,56 Z" fill="#0f172a" stroke="#0ea5e9" strokeWidth="2" />
    {/* Visor Glow */}
    <path d="M32,48 L68,48 C68,48 65,58 50,60 C35,58 32,48 32,48 Z" fill="#38bdf8" className="animate-pulse-glow" />
    <line x1="30" y1="48" x2="70" y2="48" stroke="#ffffff" strokeWidth="1.5" />
    {/* Tech details */}
    <circle cx="50" cy="74" r="4" fill="#0ea5e9" />
    <line x1="50" y1="78" x2="50" y2="83" stroke="#0ea5e9" strokeWidth="2" />
  </svg>
);

// Gentle angelic pink-toned spirit with medical cross halo and wings
const RescueSpiritSVG = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-md">
    <circle cx="50" cy="50" r="48" fill="#180f2a" stroke="#ec4899" strokeWidth="3" />
    {/* Wing Silhouettes */}
    <path d="M12,48 C4,30 25,32 30,45" fill="none" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    <path d="M88,48 C96,30 75,32 70,45" fill="none" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    {/* Soft glowing hair */}
    <path d="M30,40 C30,22 70,22 70,40 C75,50 72,72 50,75 C28,72 25,50 30,40 Z" fill="#f472b6" opacity="0.3" />
    {/* Face */}
    <circle cx="50" cy="50" r="28" fill="#fff1f2" />
    {/* Kind Anime Eyes & Blush */}
    <ellipse cx="40" cy="48" rx="3" ry="5" fill="#db2777" />
    <ellipse cx="60" cy="48" rx="3" ry="5" fill="#db2777" />
    <path d="M46,58 Q50,60 54,58" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
    <circle cx="36" cy="56" r="3" fill="#fda4af" />
    <circle cx="64" cy="56" r="3" fill="#fda4af" />
    {/* Glowing Medical Cross Halo */}
    <ellipse cx="50" cy="18" rx="18" ry="6" fill="none" stroke="#ec4899" strokeWidth="2" />
    <path d="M48,18 L52,18 M50,16 L50,20" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// ==========================================
// DATA INTERFACES
// ==========================================
interface TrafficRule {
  id: string;
  type: string;
  fineAmount: string;
  explanation: string;
  severity: 'Medium' | 'High' | 'Critical';
  characterAdvice: string;
  riskScore: number;
}

interface RoadIssueReport {
  id: string;
  type: 'pothole' | 'broken-signal' | 'road-damage' | 'streetlight-out';
  description: string;
  location: string;
  status: 'Reported' | 'Assigned' | 'Resolved';
  authority: string;
  createdAt: string;
  image?: string;
}

interface EmergencyService {
  name: string;
  type: 'Hospital' | 'Police' | 'Ambulance';
  phone: string;
  address: string;
  distance: string;
  status: string;
}

export default function App() {
  // Navigation & Primary Page State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rules' | 'reporter' | 'emergency' | 'chat'>('dashboard');
  
  // Rule Search Engine States
  const [rules, setRules] = useState<TrafficRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRule, setSelectedRule] = useState<TrafficRule | null>(null);
  const [recentChecks, setRecentChecks] = useState<TrafficRule[]>([]);

  // Issues Form and List States
  const [reports, setReports] = useState<RoadIssueReport[]>([]);
  const [reportType, setReportType] = useState<'pothole' | 'broken-signal' | 'road-damage' | 'streetlight-out'>('pothole');
  const [reportDesc, setReportDesc] = useState('');
  const [reportLoc, setReportLoc] = useState('');
  const [reportImage, setReportImage] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Geolocation & Emergency States
  const [emergencyData, setEmergencyData] = useState<EmergencyService[]>([]);
  const [gpsSimulated, setGpsSimulated] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | null>(null);
  const [sosActive, setSosActive] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Character Dialogue Bubble Overlay States
  const [activeCharacter, setActiveCharacter] = useState<'Traffic Sensei' | 'Road Guardian' | 'Rescue Spirit'>('Traffic Sensei');
  const [characterMessage, setCharacterMessage] = useState('Welcome back, young driver! Let us explore the paths of safety together. Fines and rules are our parameters of discipline!');
  const [characterMood, setCharacterMood] = useState<'neutral' | 'happy' | 'alert' | 'sad'>('neutral');

  // Interactive Chat Panel States
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'model', text: string, sender: string }>>([
    { role: 'model', text: 'Hello! I am Traffic Sensei, representing RaastaSense safety core. How can I help you guard your journey today?', sender: 'Traffic Sensei' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // ==========================================
  // SIMULATION & MAP CONTROL STATES
  // ==========================================
  const [speedSim, setSpeedSim] = useState(40);
  const [weatherSim, setWeatherSim] = useState<'Clear' | 'Rainy' | 'Foggy'>('Clear');
  const [timeSim, setTimeSim] = useState<'Day' | 'Night'>('Day');
  const [mapLayer, setMapLayer] = useState<'standard' | 'traffic' | 'heatmap'>('traffic');
  const [floatingChatOpen, setFloatingChatOpen] = useState(false);

  const [mapData, setMapData] = useState<{
    roads: any[];
    incidents: any[];
    heatmap: any[];
    center: number[];
  }>({
    roads: [],
    incidents: [],
    heatmap: [],
    center: [12.9716, 77.5946]
  });

  const [riskData, setRiskData] = useState<{
    riskScore: number;
    classification: 'Safe' | 'Risky' | 'Dangerous';
    recommendations: string[];
  }>({
    riskScore: 12,
    classification: 'Safe',
    recommendations: [
      'OPTIMAL FLOW: Drive within local speed parameters.',
      'Traffic Sensei says: Well done, young driver! Keep wearing safety seatbelts/helmets.'
    ]
  });

  // Load Rule engine and Emergency services initial data
  useEffect(() => {
    fetchRules();
    fetchReports();
    autoDetectLocation();
  }, []);

  // Fetch dynamic map data coordinates (with real-time polling every 3.5s)
  useEffect(() => {
    const lat = gpsCoords?.lat || 12.9716;
    const lng = gpsCoords?.lng || 77.5946;
    
    // Initial load
    fetchMapData(lat, lng);
    
    // Set up polling interval for real-time traffic corridor fluctuation & dynamic incidents
    const interval = setInterval(() => {
      fetchMapData(lat, lng);
    }, 3500);
    
    return () => clearInterval(interval);
  }, [gpsCoords, reports]);

  // Fetch dynamic risk calculations
  useEffect(() => {
    fetchRiskCalculations();
  }, [speedSim, weatherSim, timeSim]);

  const fetchMapData = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/map-data?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        setMapData(data);
      }
    } catch (e) {
      console.error("Map connection failed:", e);
    }
  };

  const fetchRiskCalculations = async () => {
    try {
      const res = await fetch(`/api/risk?speed=${speedSim}&weather=${weatherSim}&time=${timeSim}`);
      if (res.ok) {
        const data = await res.json();
        setRiskData(data);
      }
    } catch (e) {
      console.error("Risk score connection failed:", e);
    }
  };

  // Helper when clicking coordinates on map to auto-fill land-mark reporting form
  const handleMapClick = (lat: number, lng: number) => {
    setReportLoc(`Map Picked: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
    setActiveTab('reporter');
    
    setActiveCharacter('Road Guardian');
    setCharacterMessage(`Excellent choice! Landmark coordinates selected at [${lat.toFixed(4)}, ${lng.toFixed(4)}]. Write the details and submit!`);
    setCharacterMood('happy');
  };

  const autoDetectLocation = () => {
    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setGpsCoords(coords);
          setGpsSimulated(true);
          setGpsLoading(false);
          fetchEmergency(coords.lat, coords.lng);
          
          setActiveCharacter('Rescue Spirit');
          setCharacterMessage('Real-time location coordinates auto-detected successfully! Responders are aligned to your proximity. 👼💖');
          setCharacterMood('happy');
        },
        (error) => {
          console.log("Geolocation permission denied/failed:", error);
          setGpsLoading(false);
          // Fallback coords
          const fallbackCoords = { lat: 12.9716, lng: 77.5946 };
          setGpsCoords(fallbackCoords);
          setGpsSimulated(true);
          fetchEmergency(fallbackCoords.lat, fallbackCoords.lng);
        }
      );
    } else {
      const fallbackCoords = { lat: 12.9716, lng: 77.5946 };
      setGpsCoords(fallbackCoords);
      setGpsSimulated(true);
      fetchEmergency(fallbackCoords.lat, fallbackCoords.lng);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/rules');
      const data = await res.json();
      setRules(data);
      if (data.length > 0) {
        setSelectedRule(data[0]);
      }
    } catch (e) {
      // Offline fallback
      const localRules: TrafficRule[] = [
        { id: '1', type: 'Signal Jump', fineAmount: '₹5,000 / $100', explanation: 'Disregarding red signals causes serious intersection crashes.', severity: 'High', characterAdvice: 'Red means STOP! Wait for green, motorist!', riskScore: 75 },
        { id: '2', type: 'Overspeeding', fineAmount: '₹2,000 / $150', explanation: 'Overspeeding reduces reaction time.', severity: 'High', characterAdvice: 'Speed limits are calculations of safety!', riskScore: 60 },
        { id: '3', type: 'Drunk Driving', fineAmount: '₹10,000 / $500', explanation: 'Severely impairs reflexes and judgment.', severity: 'Critical', characterAdvice: 'Extremely dangerous! Take a cab home.', riskScore: 95 }
      ];
      setRules(localRules);
      setSelectedRule(localRules[0]);
    }
  };

  const fetchEmergency = async (lat?: number, lng?: number) => {
    try {
      const url = lat && lng ? `/api/emergency?lat=${lat}&lng=${lng}` : '/api/emergency';
      const res = await fetch(url);
      const data = await res.json();
      setEmergencyData(data);
    } catch (e) {
      // Offline Fallback
      setEmergencyData([
        { name: 'City General Hospital', type: 'Hospital', phone: '102', address: '456 Safety Blvd', distance: '1.2 km', status: '24x7 Active' },
        { name: 'Central Police Station', type: 'Police', phone: '100', address: '101 Guardian Plaza', distance: '0.8 km', status: 'Patrol Ready' }
      ]);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data);
    } catch (e) {
      // Fallback empty
    }
  };

  // Set character message dynamically when selecting a rule
  const handleSelectRule = (rule: TrafficRule) => {
    setSelectedRule(rule);
    setActiveCharacter('Traffic Sensei');
    setCharacterMessage(rule.characterAdvice);
    
    // Set dynamic emoji mood states based on numerical riskScore
    if (rule.riskScore < 40) {
      setCharacterMood('happy');
    } else if (rule.riskScore < 80) {
      setCharacterMood('alert');
    } else {
      setCharacterMood('sad'); // High hazard warning
    }

    // Append to unique recent checked violations list (capped at 3 items)
    setRecentChecks(prev => {
      const filtered = prev.filter(r => r.id !== rule.id);
      return [rule, ...filtered].slice(0, 3);
    });
  };

  // Mock Photo upload reader
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Report issues
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc || !reportLoc) {
      alert('Please fill out all fields.');
      return;
    }

    const payload = {
      type: reportType,
      description: reportDesc,
      location: reportLoc,
      image: reportImage || undefined,
      latitude: gpsCoords?.lat,
      longitude: gpsCoords?.lng
    };

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setReportSuccess(true);
        setReportDesc('');
        setReportLoc('');
        setReportImage(null);
        fetchReports();
        
        // Character responds
        setActiveCharacter('Road Guardian');
        setCharacterMessage(`Brave citizen! Your report on ${reportType.replace('-', ' ')} has been locked! I have alerted the authorities immediately. Keep shielding our roads!`);
        setCharacterMood('happy');

        setTimeout(() => setReportSuccess(false), 5000);
      }
    } catch (e) {
      alert('Error submitting report.');
    }
  };

  // Simulate Geo Location mapping trigger
  const handleGpsTrigger = () => {
    autoDetectLocation();
  };

  // Trigger SOS mode
  const handleSOS = () => {
    setSosActive(!sosActive);
    if (!sosActive) {
      setActiveCharacter('Rescue Spirit');
      setCharacterMessage('Emergency beacons are broadcasting! Please stay calm. Look at the instructions below and dial emergency lines immediately. I am guarding your spirit!');
      setCharacterMood('alert');
    }
  };

  // Handle chatbot communications
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');

    // Append user message to log
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg, sender: 'You' }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: [] })
      });
      const data = await res.json();

      setIsTyping(false);
      setChatHistory(prev => [...prev, { 
        role: 'model', 
        text: data.text, 
        sender: data.character 
      }]);

      // Highlight corresponding anime persona in the side character bubble
      setActiveCharacter(data.character);
      setCharacterMessage(data.text);
      setCharacterMood(data.avatarState);

    } catch (err) {
      setIsTyping(false);
      setChatHistory(prev => [...prev, { 
        role: 'model', 
        text: 'Connection error, motorist! But remember, always slow down at intersections and keep a clear head. 🚦', 
        sender: 'Traffic Sensei' 
      }]);
    }
  };

  // Render character visual avatar based on active character selection
  const renderAvatarSVG = () => {
    switch (activeCharacter) {
      case 'Traffic Sensei': return <TrafficSenseiSVG />;
      case 'Road Guardian': return <RoadGuardianSVG />;
      case 'Rescue Spirit': return <RescueSpiritSVG />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080c16] text-slate-100 overflow-x-hidden font-sans">
      
      {/* ==========================================
          LEFT RESPONSIVE SIDEBAR NAVIGATION
         ========================================== */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        {/* Brand Banner */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-red-500 rounded-xl shadow-glow-gold">
              <ShieldAlert className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
                RaastaSense
              </h1>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Anime Road Guide</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav buttons */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 font-medium ${activeTab === 'dashboard' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Compass className="w-5 h-5" />
            <span>Dashboard Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 font-medium ${activeTab === 'rules' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileText className="w-5 h-5" />
            <span>DriveLegal Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('reporter')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 font-medium ${activeTab === 'reporter' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span>RoadWatch Report</span>
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 font-medium ${activeTab === 'emergency' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <HeartHandshake className="w-5 h-5" />
            <span>RoadSOS Emergency</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 font-medium ${activeTab === 'chat' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Character AI Chat</span>
          </button>
        </nav>

        {/* Quick System Badge info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
          <div>Status: <span className="text-emerald-400 font-semibold">Production Ready</span></div>
          <div>Core logic: <span className="text-amber-400 font-semibold">100% Deterministic</span></div>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT VIEW (TABS & ANIMATIONS)
         ========================================== */}
      <main className="flex-1 p-6 md:p-8 flex flex-col space-y-8 max-w-7xl mx-auto w-full overflow-y-auto">
        
        {/* ==========================================
            UPPER SECTION: GLOBAL HERO ANIME CHAR PANEL
           ========================================== */}
        <motion.section 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-slate-800/80 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6"
        >
          {/* Neon background light effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
          
          <div className={`relative z-10 p-1 rounded-2xl bg-gradient-to-tr transition-all duration-500 shadow-inner ${
            characterMood === 'sad' ? 'from-rose-500/60 via-red-500/50 to-pink-500/60 shadow-[0_0_20px_rgba(244,63,94,0.35)] border border-rose-500/30' :
            characterMood === 'alert' ? 'from-amber-500/60 via-yellow-500/50 to-orange-500/60 shadow-[0_0_20px_rgba(245,158,11,0.35)] border border-amber-500/30' :
            'from-emerald-500/60 via-sky-500/50 to-teal-500/60 shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-500/30'
          }`}>
            {renderAvatarSVG()}
          </div>

          <div className="flex-1 relative z-10 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
              <h2 className="text-lg font-bold text-slate-100 flex items-center justify-center sm:justify-start">
                <Sparkles className="w-4 h-4 text-amber-400 mr-2" />
                {activeCharacter}
              </h2>
              <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 rounded-md px-2 py-0.5 uppercase tracking-wider font-mono">
                Expression: {characterMood}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] rounded-full uppercase tracking-wider font-semibold w-max mx-auto sm:mx-0 ${
                activeCharacter === 'Traffic Sensei' ? 'bg-amber-400/10 text-amber-400 border border-amber-500/20' :
                activeCharacter === 'Road Guardian' ? 'bg-sky-400/10 text-sky-400 border border-sky-500/20' :
                'bg-rose-400/10 text-rose-400 border border-rose-500/20'
              }`}>
                {activeCharacter === 'Traffic Sensei' ? 'DriveLegal Mentor' :
                 activeCharacter === 'Road Guardian' ? 'RoadWatch Knight' :
                 'RoadSOS Spirit'}
              </span>
            </div>
            
            {/* Anime Speech Bubble Card */}
            <div className="bg-slate-950/80 border border-slate-800/60 p-4 rounded-2xl text-slate-300 text-sm italic font-medium leading-relaxed max-w-3xl shadow-inner">
              "{characterMessage}"
            </div>
          </div>
        </motion.section>

        {/* ==========================================
            TAB BODY CONDITIONAL CONTROLLER
           ========================================== */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* CYBERPUNK SCROLLING NEON ALERTS MARQUEE */}
              <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl py-2.5 px-4 overflow-hidden relative shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10" />
                
                <div className="animate-marquee whitespace-nowrap flex items-center space-x-8 text-xs font-mono font-bold tracking-wider text-rose-450 uppercase">
                  <span className="flex items-center text-rose-500">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mr-2 animate-ping" />
                    BROADCAST: Cyber Bypass Highway heavy congested due to two-wheeler skid. lane partially blocked!
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center text-sky-400">
                    <span className="w-2 h-2 rounded-full bg-sky-400 mr-2 animate-pulse" />
                    RADAR: Police helmet checks and radar speed traps active near Neon Garden Crossing.
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
                    ADVISORY: Traffic Sensei says: Click seatbelts and wear certified helmets at all times!
                  </span>
                </div>
              </div>

              {/* DYNAMIC TOP STATS ANALYTICS BAR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Stats 1: Incidents */}
                <div className="glass-panel rounded-3xl p-5 border border-slate-800 flex items-center justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition" />
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Active Incidents</span>
                    <span className="text-2xl font-black font-mono text-slate-100 flex items-center">
                      {mapData.incidents.length}
                      <span className="text-rose-500 text-xs ml-2 font-bold font-sans tracking-normal bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md">LIVE</span>
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                </div>

                {/* Stats 2: Proximity Risk */}
                <div className="glass-panel rounded-3xl p-5 border border-slate-800 flex items-center justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition" />
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Proximity Risk</span>
                    <span className={`text-2xl font-black font-mono flex items-center uppercase ${
                      riskData.riskScore > 70 ? 'text-rose-500' : riskData.riskScore > 40 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {riskData.riskScore}%
                    </span>
                  </div>
                  <div className={`p-3 rounded-2xl border ${
                    riskData.riskScore > 70 ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                    riskData.riskScore > 40 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  }`}>
                    <Gauge className="w-5 h-5" />
                  </div>
                </div>

                {/* Stats 3: Location */}
                <div className="glass-panel rounded-3xl p-5 border border-slate-800 flex items-center justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-full blur-xl group-hover:bg-sky-500/10 transition" />
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Locked Proximity</span>
                    <span className="text-sm font-extrabold text-slate-200 block truncate">
                      {gpsCoords ? `${gpsCoords.lat.toFixed(4)}°N, ${gpsCoords.lng.toFixed(4)}°E` : 'Auto-Locating...'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                </div>

                {/* Stats 4: Climate Sim controls */}
                <div className="glass-panel rounded-3xl p-4 border border-slate-800 relative overflow-hidden flex flex-col justify-center">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold block mb-2">Climate Environment Simulator</span>
                  <div className="flex items-center space-x-2">
                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={() => setWeatherSim('Clear')}
                      className={`flex-1 p-2 rounded-xl border flex items-center justify-center transition duration-150 ${
                        weatherSim === 'Clear' ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                      }`}
                      title="Clear Weather"
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                    {/* Rainy Button */}
                    <button
                      type="button"
                      onClick={() => setWeatherSim('Rainy')}
                      className={`flex-1 p-2 rounded-xl border flex items-center justify-center transition duration-150 ${
                        weatherSim === 'Rainy' ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                      }`}
                      title="Monsoon Rain"
                    >
                      <CloudRain className="w-4 h-4 animate-bounce" />
                    </button>
                    {/* Foggy Button */}
                    <button
                      type="button"
                      onClick={() => setWeatherSim('Foggy')}
                      className={`flex-1 p-2 rounded-xl border flex items-center justify-center transition duration-150 ${
                        weatherSim === 'Foggy' ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                      }`}
                      title="Heavy Fog"
                    >
                      <CloudFog className="w-4 h-4" />
                    </button>
                    {/* Time toggler */}
                    <button
                      type="button"
                      onClick={() => setTimeSim(timeSim === 'Day' ? 'Night' : 'Day')}
                      className={`flex-1 p-2 rounded-xl border flex items-center justify-center transition duration-150 ${
                        timeSim === 'Night' ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'
                      }`}
                      title="Toggle Day/Night Cycle"
                    >
                      {timeSim === 'Day' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-sky-400" />}
                    </button>
                  </div>
                </div>

              </div>

              {/* MAIN HERO RADAR & RISK GAUGE ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Live Map Panel (Left 2/3 cols) */}
                <div className="lg:col-span-2 h-[480px] w-full">
                  <MapContainer
                    userCoords={gpsCoords}
                    roads={mapData.roads}
                    incidents={mapData.incidents}
                    heatmap={mapData.heatmap}
                    onMapClick={handleMapClick}
                    activeLayer={mapLayer}
                    setActiveLayer={setMapLayer}
                  />
                </div>

                {/* Smart Risk Engine (Right 1/3 cols) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  
                  {/* Speedometer card */}
                  <div className="flex-1 min-h-[300px]">
                    <RiskSpeedometer
                      score={riskData.riskScore}
                      classification={riskData.classification}
                      recommendations={riskData.recommendations}
                    />
                  </div>

                  {/* Simulator Sliders Controller */}
                  <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Simulated Vehicle Parameters</span>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-400">Current Velocity</span>
                        <span className="font-mono text-indigo-400 text-sm font-bold">{speedSim} km/h</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="140"
                        value={speedSim}
                        onChange={(e) => setSpeedSim(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-1">
                        <span>0 KM/H (IDLE)</span>
                        <span>60 KM/H (CITY)</span>
                        <span>140 KM/H (MAX)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-[10px] text-slate-550">
                      <span className="flex items-center">
                        <Signal className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                        Radar telemetry: active
                      </span>
                      <button 
                        type="button"
                        onClick={() => {
                          setSpeedSim(40);
                          setWeatherSim('Clear');
                          setTimeSim('Day');
                        }}
                        className="text-sky-400 font-extrabold hover:text-sky-300 transition flex items-center bg-transparent border-none p-0 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Reset telemetry
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* QUICK INLINE VIOLATIONS DIAL */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-800">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <Layers className="w-5 h-5 text-amber-500 mr-2" />
                  Quick DriveLegal Guide Lookout
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(recentChecks.length > 0 ? recentChecks : rules.slice(0, 3)).map(rule => (
                    <div 
                      key={rule.id}
                      onClick={() => {
                        handleSelectRule(rule);
                        setActiveTab('rules');
                      }}
                      className="p-4 bg-slate-950/60 hover:bg-slate-950 rounded-2xl border border-slate-850 hover:border-amber-500/25 transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <span className="font-extrabold text-sm text-slate-200 group-hover:text-amber-400 transition">{rule.type}</span>
                        <p className="text-[10px] text-slate-500 font-mono">Fine: {rule.fineAmount}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        rule.severity === 'Critical' ? 'bg-rose-500/15 text-rose-400' :
                        rule.severity === 'High' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-sky-500/15 text-sky-400'
                      }`}>
                        {rule.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 2: DRIVELEGAL RULES SEARCH GUIDE */}
          {activeTab === 'rules' && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left search bar + list */}
              <div className="lg:col-span-1 space-y-6">
                <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                  <h3 className="font-bold text-lg">DriveLegal Index</h3>
                  
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Search violations (e.g. speed)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500 transition text-slate-200"
                    />
                  </div>

                  {/* Filter list */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {rules
                      .filter(r => r.type.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(rule => (
                        <button
                          key={rule.id}
                          onClick={() => handleSelectRule(rule)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition duration-200 flex items-center justify-between ${
                            selectedRule?.id === rule.id
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold'
                              : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-sm">{rule.type}</span>
                          <span className={`px-2 py-0.5 text-[8px] rounded-full uppercase tracking-wider font-extrabold ${
                            rule.severity === 'Critical' ? 'bg-red-500/10 text-red-400' :
                            rule.severity === 'High' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-sky-500/10 text-sky-400'
                          }`}>
                            {rule.severity}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Right detail dashboard */}
              <div className="lg:col-span-2">
                {selectedRule ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 space-y-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-black bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                        {selectedRule.type}
                      </h2>
                      <span className={`px-3 py-1 text-xs rounded-full font-bold uppercase tracking-widest border ${
                        selectedRule.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-glow-red' :
                        selectedRule.severity === 'High' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-glow-gold' :
                        'bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-glow-blue'
                      }`}>
                        {selectedRule.severity} SEVERITY
                      </span>
                    </div>

                    {/* Fine Dial widget */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-center flex flex-col justify-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">
                          Standard Penalty Fine
                        </span>
                        <span className="text-lg font-black text-amber-400">
                          {selectedRule.fineAmount}
                        </span>
                      </div>

                      {/* Smart Risk Score circular SVG dial */}
                      <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block mb-2">
                          Smart Risk Score
                        </span>
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" className="stroke-slate-800" strokeWidth="10" fill="transparent" />
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="40" 
                              stroke={selectedRule.riskScore > 80 ? '#f43f5e' : selectedRule.riskScore > 50 ? '#f59e0b' : '#10b981'} 
                              strokeWidth="10" 
                              fill="transparent" 
                              strokeDasharray="251.2" 
                              strokeDashoffset={251.2 - (251.2 * (selectedRule.riskScore || 0)) / 100} 
                              strokeLinecap="round" 
                              className="transition-all duration-500 ease-out" 
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-sm font-black text-slate-100">{selectedRule.riskScore}%</span>
                            <span className={`text-[7px] font-extrabold uppercase tracking-wider ${selectedRule.riskScore > 80 ? 'text-red-400' : selectedRule.riskScore > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {selectedRule.riskScore > 80 ? 'Hazard' : selectedRule.riskScore > 50 ? 'Warning' : 'Safe'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex flex-col justify-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">
                          Legal Basis & Cause
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {selectedRule.explanation}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Sensei Quote Bubble */}
                    <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start space-x-4">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-xl shrink-0 flex items-center justify-center border border-amber-500/25">
                        <TrafficSenseiSVG />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-amber-400 block mb-1">Traffic Sensei Instruction:</span>
                        <p className="text-sm italic text-slate-200 leading-relaxed">
                          "{selectedRule.characterAdvice}"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-12 text-slate-500 glass-panel rounded-3xl">
                    Select a traffic violation rule from index to inspect details.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: ROADWATCH REPORTER */}
          {activeTab === 'reporter' && (
            <motion.div
              key="reporter"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Form module */}
              <div className="lg:col-span-2">
                <form onSubmit={handleReportSubmit} className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 space-y-6">
                  <h3 className="text-xl font-bold flex items-center">
                    <AlertTriangle className="w-5 h-5 text-indigo-400 mr-2" />
                    File RoadWatch Incident
                  </h3>

                  {reportSuccess && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center space-x-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Issue report uploaded successfully! Monitored by the Road Guardian protector!</span>
                    </div>
                  )}

                  {/* Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Incident Category</label>
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm focus:outline-none focus:border-indigo-500 transition text-slate-200"
                      >
                        <option value="pothole">Pothole / Crater</option>
                        <option value="broken-signal">Broken Signal Light</option>
                        <option value="road-damage">Severe Road Damage</option>
                        <option value="streetlight-out">Streetlights Dark Out</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Incident Landmark/Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Sector 4 Crossing, opposite Metro hub"
                        value={reportLoc}
                        onChange={(e) => setReportLoc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm focus:outline-none focus:border-indigo-500 transition text-slate-200"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Detailed Description</label>
                    <textarea
                      placeholder="Describe the danger level, size, or damage to help patrol services respond correctly..."
                      rows={4}
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm focus:outline-none focus:border-indigo-500 transition text-slate-200 resize-none"
                      required
                    />
                  </div>

                  {/* Photo upload */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      Upload Incident Photo (Optional)
                    </label>
                    <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center hover:border-indigo-500/40 transition relative cursor-pointer group bg-slate-950/20">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      
                      {reportImage ? (
                        <div className="space-y-2 flex flex-col items-center">
                          <img 
                            src={reportImage} 
                            alt="Uploaded preview" 
                            className="w-32 h-20 object-cover rounded-xl border border-slate-700" 
                          />
                          <span className="text-xs text-indigo-400 font-semibold block">Photo loaded successfully!</span>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col items-center">
                          <FileImage className="w-8 h-8 text-slate-600 group-hover:text-indigo-400 transition" />
                          <span className="text-xs text-slate-500 font-semibold block">
                            Click or drag to mock upload image
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-slate-950 font-bold py-3.5 px-6 rounded-2xl shadow-glow-blue transition duration-200"
                  >
                    Submit Report to Road Guardian
                  </button>
                </form>
              </div>

              {/* Character widget */}
              <div className="lg:col-span-1 space-y-6">
                <div className="glass-panel rounded-3xl p-6 border border-slate-800 text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-sky-500/5 flex items-center justify-center border border-sky-500/20">
                    <RoadGuardianSVG />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-200">Road Guardian Shield</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    "I actively crosscheck reports to direct public works and traffic authorities instantly. Your report is our sword against road failures!"
                  </p>
                  
                  <div className="pt-4 border-t border-slate-800 text-left space-y-3">
                    <h5 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Mock Authorities Engaged</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Potholes:</span>
                        <span className="text-indigo-400 font-medium">Public Works</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Signals:</span>
                        <span className="text-indigo-400 font-medium">Traffic Police</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Lights:</span>
                        <span className="text-indigo-400 font-medium">Electric Board</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: ROADSOS EMERGENCY SERVICES */}
          {activeTab === 'emergency' && (
            <motion.div
              key="emergency"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Emergency controls */}
                <div className="lg:col-span-1 space-y-6">
                  <div className={`rounded-3xl p-6 border transition duration-300 flex flex-col justify-between ${
                    sosActive 
                      ? 'bg-rose-500/10 border-rose-500/50 shadow-glow-red text-rose-400' 
                      : 'glass-panel border-slate-800 text-slate-100'
                  }`}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">RoadSOS Control Beacon</h3>
                        <div className={`w-3.5 h-3.5 rounded-full ${sosActive ? 'bg-rose-500 animate-ping' : 'bg-slate-700'}`} />
                      </div>
                      
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Triggering the SOS beacon logs coordinates immediately and alerts nearby dispatch zones. Stay calm, and follow first aid guides.
                      </p>

                      <button
                        onClick={handleSOS}
                        className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest transition duration-300 shadow-glow-red ${
                          sosActive 
                            ? 'bg-rose-500 text-slate-950' 
                            : 'bg-gradient-to-r from-red-500 to-rose-600 text-slate-950 hover:opacity-90'
                        }`}
                      >
                        {sosActive ? 'Deactivate SOS beacon' : 'Broadcast Live SOS!'}
                      </button>
                    </div>

                    {/* Geolocation trigger */}
                    <div className="pt-6 mt-6 border-t border-slate-800 space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Geolocation Tracker
                      </h4>
                      <button
                        onClick={handleGpsTrigger}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 border ${
                          gpsLoading ? 'bg-slate-900 border-slate-800 text-slate-550 cursor-not-allowed' :
                          gpsSimulated 
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                        disabled={gpsLoading}
                      >
                        <Compass className={`w-4 h-4 ${gpsLoading || gpsSimulated ? 'animate-spin' : ''}`} />
                        <span>
                          {gpsLoading ? 'Detecting Geolocation...' :
                           gpsSimulated ? 'Coordinates Locked!' : 
                           'Detect Geolocation'}
                        </span>
                      </button>

                      {gpsCoords && (
                        <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-[10px] text-slate-400 font-mono space-y-1">
                          <div>LATTITUDE: {gpsCoords.lat.toFixed(4)}° N</div>
                          <div>LONGITUDE: {gpsCoords.lng.toFixed(4)}° E</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nearby list */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-panel rounded-3xl p-6 border border-slate-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                      <LifeBuoy className="w-5 h-5 text-rose-500 mr-2" />
                      Nearest Response Centers
                    </h3>
                    
                    <div className="space-y-4">
                      {emergencyData.map((service, idx) => (
                        <div key={idx} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-rose-500/20 transition">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 text-[8px] rounded-full font-bold uppercase ${
                                service.type === 'Hospital' ? 'bg-rose-500/10 text-rose-400' :
                                service.type === 'Police' ? 'bg-sky-500/10 text-sky-400' :
                                'bg-amber-500/10 text-amber-400'
                              }`}>
                                {service.type}
                              </span>
                              <h4 className="font-bold text-sm text-slate-200 truncate">{service.name}</h4>
                            </div>
                            <p className="text-xs text-slate-400">{service.address}</p>
                            <div className="flex items-center text-[10px] text-slate-500 space-x-2">
                              <span>Distance: {service.distance}</span>
                              <span>•</span>
                              <span>{service.status}</span>
                            </div>
                          </div>

                          {/* Dial Button */}
                          <a
                            href={`tel:${service.phone}`}
                            className="p-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 rounded-2xl border border-rose-500/20 transition shrink-0 ml-4 flex items-center justify-center"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* CPR / FIRST AID INSTRUCTION BOARD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Rescue Spirit - CPR Instructions</span>
                  <h4 className="font-extrabold text-base">Cardiopulmonary Resuscitation (CPR) Guide</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    1. <strong>Call 102</strong> or emergency centers instantly.<br />
                    2. Lay the patient flat on their back on a firm surface.<br />
                    3. Place your hands stacked in the center of the chest.<br />
                    4. Push hard and fast: 100-120 compressions per minute (e.g. to the beat of "Stayin' Alive").<br />
                    5. Keep arms locked and allow full chest recoil between compressions.
                  </p>
                </div>

                <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Rescue Spirit - Choking Instructions</span>
                  <h4 className="font-extrabold text-base">Heimlich Maneuver Guide</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    1. Stand behind the person who is choking.<br />
                    2. Wrap your arms around their waist. Bend the person forward slightly.<br />
                    3. Make a fist with one hand and place it slightly above the navel.<br />
                    4. Grasp your fist with the other hand and press hard into the abdomen with a quick, upward thrust.<br />
                    5. Repeat until the blockage is dislodged or help arrives.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: CHARACTER AI CHAT */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            >
              {/* Chat settings/Character selector */}
              <div className="lg:col-span-1 space-y-6">
                <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                  <h3 className="font-bold text-lg">Active Safety Mentor</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Choose who you want to consult. The local AI will dynamically swap character modes depending on the context of your query!
                  </p>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveCharacter('Traffic Sensei');
                        setCharacterMessage('Speed limits and traffic rules are calculations of safety! Ask me about legal guidelines.');
                        setChatHistory(prev => [...prev, { role: 'model', text: 'I am Traffic Sensei! Let us check your understanding of road regulations.', sender: 'Traffic Sensei' }]);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition duration-200 flex items-center space-x-3 ${
                        activeCharacter === 'Traffic Sensei' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/5 flex items-center justify-center border border-amber-500/20 shrink-0">
                        <TrafficSenseiSVG />
                      </div>
                      <span className="text-xs">Traffic Sensei</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveCharacter('Road Guardian');
                        setCharacterMessage('Stand tall, citizen! I protect our tarmac passages. Ask me how to report potholes and broken streetlights.');
                        setChatHistory(prev => [...prev, { role: 'model', text: 'I am the Road Guardian! Report street hazards so we can shield our city!', sender: 'Road Guardian' }]);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition duration-200 flex items-center space-x-3 ${
                        activeCharacter === 'Road Guardian' ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 font-bold' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-500/5 flex items-center justify-center border border-sky-500/20 shrink-0">
                        <RoadGuardianSVG />
                      </div>
                      <span className="text-xs">Road Guardian</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveCharacter('Rescue Spirit');
                        setCharacterMessage('Breathe deeply... I am the Rescue Spirit. I provide accident instructions, hospital lists, and calming guidance.');
                        setChatHistory(prev => [...prev, { role: 'model', text: 'I am the Rescue Spirit, protecting your safety journey. Stay calm, how can I help?', sender: 'Rescue Spirit' }]);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition duration-200 flex items-center space-x-3 ${
                        activeCharacter === 'Rescue Spirit' ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 font-bold' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-500/5 flex items-center justify-center border border-rose-500/20 shrink-0">
                        <RescueSpiritSVG />
                      </div>
                      <span className="text-xs">Rescue Spirit</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Chat Console */}
              <div className="lg:col-span-3">
                <div className="glass-panel rounded-3xl border border-slate-800 flex flex-col h-[550px] overflow-hidden">
                  
                  {/* Header info */}
                  <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-3">
                      <div className="p-1 rounded-xl bg-slate-950/80 border border-slate-750">
                        {renderAvatarSVG()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-100">{activeCharacter}</h4>
                        <span className="text-[10px] text-slate-500">Live Interactive Counselor</span>
                      </div>
                    </div>
                  </div>

                  {/* Message Bubble List */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/30">
                    {chatHistory.map((chat, idx) => (
                      <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed border ${
                          chat.role === 'user' 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 rounded-tr-none' 
                            : chat.sender === 'Traffic Sensei' ? 'bg-slate-900 border-amber-500/20 text-slate-200 rounded-tl-none shadow-glow-gold'
                            : chat.sender === 'Road Guardian' ? 'bg-slate-900 border-sky-500/20 text-slate-200 rounded-tl-none shadow-glow-blue'
                            : 'bg-slate-900 border-rose-500/20 text-slate-200 rounded-tl-none shadow-glow-red'
                        }`}>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block mb-1">
                            {chat.sender}
                          </span>
                          <p>{chat.text}</p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-500 italic">
                          {activeCharacter} is formulating a response...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input form footer */}
                  <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex items-center space-x-3 shrink-0">
                    <input
                      type="text"
                      placeholder={`Chat with ${activeCharacter}... (Ask about fines, reporting, or first-aid)`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition text-slate-200"
                    />
                    <button
                      type="submit"
                      className="p-3 bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 rounded-2xl shadow-glow-gold transition flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* ==========================================
          FLOATING AI ASSISTANT OVERLAY HUB
         ========================================== */}
      <div className="fixed bottom-6 right-6 z-[2000] flex flex-col items-end">
        <AnimatePresence>
          {floatingChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9 }}
              className="w-[320px] sm:w-[360px] h-[460px] bg-slate-900/95 border border-slate-800 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden mb-4 backdrop-blur-lg"
            >
              {/* Header */}
              <div className="p-3.5 bg-slate-950/80 border-b border-slate-850 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    {renderAvatarSVG()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-200">{activeCharacter}</h4>
                    <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-wider block">Safety Counselor</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFloatingChatOpen(false)}
                  className="p-1.5 bg-slate-950 border-none hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick swap buttons */}
              <div className="p-2 bg-slate-950/40 border-b border-slate-850 flex items-center gap-1">
                {['Traffic Sensei', 'Road Guardian', 'Rescue Spirit'].map((charName) => (
                  <button
                    key={charName}
                    type="button"
                    onClick={() => {
                      setActiveCharacter(charName as any);
                      const welcomeMsg = charName === 'Traffic Sensei' ? 'Speed limits and safety gear are essential parameters, learner!' :
                                         charName === 'Road Guardian' ? 'I watch over the city tarmac! Report road damage directly.' :
                                         'Gently now... I provide emergency guidelines and CPR coordinates.';
                      setCharacterMessage(welcomeMsg);
                      setChatHistory(prev => [...prev, { role: 'model', text: welcomeMsg, sender: charName }]);
                    }}
                    className={`flex-1 text-[9px] py-1 px-1 rounded-lg border font-extrabold tracking-wider uppercase transition truncate cursor-pointer ${
                      activeCharacter === charName 
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                        : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {charName.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Chat Message Box logs */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/20">
                {chatHistory.map((chat, idx) => (
                  <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed border ${
                      chat.role === 'user'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 rounded-tr-none'
                        : 'bg-slate-900 border-slate-850 text-slate-350 rounded-tl-none'
                    }`}>
                      <span className="text-[8px] uppercase tracking-widest font-black text-slate-500 block mb-0.5">{chat.sender}</span>
                      <p>{chat.text}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-slate-900 border border-slate-850 rounded-2xl rounded-tl-none p-3 text-[10px] text-slate-550 italic">
                      {activeCharacter} is formulating a response...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat form footer */}
              <form onSubmit={handleSendMessage} className="p-3 bg-slate-950/60 border-t border-slate-850 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={`Chat with ${activeCharacter.split(' ')[0]}...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-550 hover:bg-indigo-650 text-slate-950 font-bold rounded-xl transition flex items-center justify-center shadow-lg border-none cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-slate-950" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Bubble Icon */}
        <button
          type="button"
          onClick={() => setFloatingChatOpen(!floatingChatOpen)}
          className={`p-4 rounded-full text-slate-950 font-bold hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl relative border flex items-center justify-center cursor-pointer ${
            activeCharacter === 'Traffic Sensei' ? 'bg-amber-500 border-amber-400 shadow-glow-gold' :
            activeCharacter === 'Road Guardian' ? 'bg-sky-500 border-sky-400 shadow-glow-blue' :
            'bg-rose-500 border-rose-400 shadow-glow-red'
          }`}
        >
          {floatingChatOpen ? <X className="w-6 h-6 text-slate-950" /> : <MessageCircle className="w-6 h-6 text-slate-950" />}
          
          {/* Pulsing indicator marker */}
          {!floatingChatOpen && (
            <div className="absolute top-[-3px] right-[-3px] w-4 h-4 bg-white border border-slate-900 rounded-full flex items-center justify-center text-[8px] font-black text-rose-600 animate-bounce">
              1
            </div>
          )}
        </button>
      </div>

    </div>
  );
}
