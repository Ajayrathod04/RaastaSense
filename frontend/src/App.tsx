import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  PhoneCall, 
  AlertTriangle, 
  Gauge, 
  X, 
  Send,
  Navigation,
  Activity,
  User,
  ExternalLink,
  MapPin,
  Camera,
  CheckCircle2,
  Volume2,
  VolumeX,
  Radio,
  FileText
} from 'lucide-react';
import MapContainer from './components/MapContainer';
import RiskSpeedometer from './components/RiskSpeedometer';

// Coordinates centered around IIT Madras campus
const ROUTE_FASTEST = [
  [12.9915, 80.2336],
  [12.9925, 80.2356],
  [12.9940, 80.2386],
  [12.9960, 80.2410]
];

const ROUTE_SAFEST = [
  [12.9915, 80.2336],
  [12.9895, 80.2320],
  [12.9875, 80.2310],
  [12.9850, 80.2336]
];

const ROUTE_ECO = [
  [12.9915, 80.2336],
  [12.9900, 80.2360],
  [12.9915, 80.2390],
  [12.9940, 80.2410]
];

const ROUTE_EMERGENCY = [
  [12.9915, 80.2336],
  [12.9930, 80.2340],
  [12.9960, 80.2410]
];

const MOCK_INCIDENTS = [
  { id: '1', type: 'accident', description: 'Collision on highway - lanes partially blocked', location: 'IIT Gate Rd', latitude: 12.9940, longitude: 80.2386, severity: 'High', reportedBy: 'Police Telemetry' },
  { id: '2', type: 'police', description: 'Speed radar active checkpoint', location: 'Sardar Patel Rd', latitude: 12.9895, longitude: 80.2320, severity: 'Medium', reportedBy: 'Citizen Report' },
  { id: '3', type: 'pothole', description: 'Severe pothole cluster in right lane', location: 'Delhi Avenue', latitude: 12.9900, longitude: 80.2360, severity: 'Medium', reportedBy: 'Raasta Watchdog' }
];

const MOCK_HEATMAP = [
  { latitude: 12.9940, longitude: 80.2386, intensity: 0.85 },
  { latitude: 12.9900, longitude: 80.2360, intensity: 0.7 },
  { latitude: 12.9895, longitude: 80.2320, intensity: 0.45 }
];

const MOCK_ROADS = [
  { name: 'Sardar Patel Road', status: 'heavy' as const, coordinates: [[12.9915, 80.2336], [12.9895, 80.2320]] },
  { name: 'IIT Gate Main Road', status: 'moderate' as const, coordinates: [[12.9915, 80.2336], [12.9940, 80.2386]] },
  { name: 'Bonn Avenue Corridor', status: 'smooth' as const, coordinates: [[12.9915, 80.2336], [12.9850, 80.2336]] }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'command' | 'radar' | 'guardian' | 'roadwatch' | 'analytics'>('home');
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // 1. Simulators & State Parameters (Guardian Cockpit)
  const [speed, setSpeed] = useState(48); // km/h
  const [phoneUsage, setPhoneUsage] = useState(false);
  const [fatigue, setFatigue] = useState(false);
  const [weather, setWeather] = useState<'Clear' | 'Rainy' | 'Foggy'>('Clear');
  const [traffic, setTraffic] = useState<'Smooth' | 'Moderate' | 'Heavy'>('Smooth');
  const [roadCondition, setRoadCondition] = useState<'Dry Asphalt' | 'Wet Surface' | 'Severe Potholes'>('Dry Asphalt');
  const [visibility, setVisibility] = useState<'High' | 'Medium' | 'Low'>('High');
  const [laneDiscipline, setLaneDiscipline] = useState<'Perfect' | 'Drifting' | 'Erratic'>('Perfect');
  const [seatbeltStatus, setSeatbeltStatus] = useState<'Secured' | 'Unbuckled'>('Secured');

  // Digital Twin Map States
  const [mapLayer, setMapLayer] = useState<'standard' | 'traffic' | 'heatmap'>('standard');
  const [selectedRouteKey, setSelectedRouteKey] = useState<'safest' | 'fastest' | 'eco' | 'emergency'>('safest');

  // Emergency SOS State
  const [sosActive, setSosActive] = useState(false);
  const [sosCoords, setSosCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sosTimestamp, setSosTimestamp] = useState<string | null>(null);
  const [goldenHourTime, setGoldenHourTime] = useState(3600); // 1 hour countdown

  // RoadWatch AI Upload State
  const [selectedAnomalyType, setSelectedAnomalyType] = useState<'Pothole' | 'Accident' | 'Traffic' | 'Waterlogging' | 'Debris'>('Pothole');
  const [isAnalyzingAnomaly, setIsAnalyzingAnomaly] = useState(false);
  const [analyzedResult, setAnalyzedResult] = useState<any>(null);

  // Interactive Assistant mascot state
  const [chatOpen, setChatOpen] = useState(true);
  const lastSpokenMessage = useRef<string>('');

  // Default coordinate center (IIT Madras)
  const defaultCoords = { lat: 12.9915, lng: 80.2336 };

  // Calculate live dynamic risk index
  const calculateRiskScore = () => {
    let score = 8;
    
    // Speed
    if (speed > 80) score += 35;
    else if (speed > 55) score += (speed - 55) * 1.2;

    // Distracted Driving
    if (phoneUsage) score += 32;

    // Fatigue
    if (fatigue) score += 28;

    // Weather & Visibility
    if (weather === 'Rainy') score += 12;
    if (weather === 'Foggy') score += 10;
    if (visibility === 'Medium') score += 5;
    if (visibility === 'Low') score += 15;

    // Traffic Density
    if (traffic === 'Heavy') score += 10;
    if (traffic === 'Moderate') score += 4;

    // Road Condition
    if (roadCondition === 'Severe Potholes') score += 16;
    if (roadCondition === 'Wet Surface') score += 8;

    // Lane discipline
    if (laneDiscipline === 'Drifting') score += 10;
    if (laneDiscipline === 'Erratic') score += 25;

    // Seatbelt/Helmet
    if (seatbeltStatus === 'Unbuckled') score += 20;

    // Route surcharge
    if (selectedRouteKey === 'fastest') score += 6;
    if (selectedRouteKey === 'eco') score += 2;

    return Math.min(Math.round(score), 100);
  };

  const riskScore = calculateRiskScore();
  
  // Get Risk Level classifications
  const getRiskClassification = (score: number): 'Safe' | 'Warning' | 'Critical' => {
    if (score > 68) return 'Critical';
    if (score > 32) return 'Warning';
    return 'Safe';
  };

  const classification = getRiskClassification(riskScore);

  // Get AI recommendations
  const getAIRecommendations = () => {
    const recs: string[] = [];
    if (phoneUsage) recs.push("Put away your mobile device to eliminate cognitive driver load.");
    if (fatigue) recs.push("Driver micro-sleeps detected. Pull over for a 15-minute break.");
    if (speed > 80) recs.push("High-speed kinetic threat. De-accelerate to highway limit of 60 km/h.");
    if (seatbeltStatus === 'Unbuckled') recs.push("Buckle up! Seatbelt/helmet engagement reduces crash fatality risk by 80%.");
    if (laneDiscipline === 'Erratic') recs.push("Erratic lane drifts. Align vehicle within lane boundaries.");
    if (weather === 'Rainy') recs.push("Precipitation lowers asphalt traction. Maintain double follow gap.");
    if (recs.length === 0) recs.push("Telemetry parameters safe. Keep focus on the road ahead.");
    return recs;
  };

  const recommendations = getAIRecommendations();

  // Route Matrix Selector details
  const getRouteDetails = () => {
    switch (selectedRouteKey) {
      case 'fastest':
        return {
          coords: ROUTE_FASTEST,
          eta: "11 mins",
          risk: "44%",
          safety: "72%",
          accidentProb: "0.22",
          fuel: "7.2 L/100km",
          explanation: "Route Beta selected. Shaves off 7 mins but has 3 high risk pothole clusters near Sardar Patel road."
        };
      case 'eco':
        return {
          coords: ROUTE_ECO,
          eta: "15 mins",
          risk: "20%",
          safety: "85%",
          accidentProb: "0.08",
          fuel: "5.4 L/100km",
          explanation: "Bonn Avenue Bypass. Optimizes engine RPM curves to reduce fuel consumption by 15%."
        };
      case 'emergency':
        return {
          coords: ROUTE_EMERGENCY,
          eta: "9 mins",
          risk: "50%",
          safety: "65%",
          accidentProb: "0.35",
          fuel: "8.0 L/100km",
          explanation: "Emergency direct line corridor. Clears digital traffic lights ahead via satellite signals."
        };
      default: // safest
        return {
          coords: ROUTE_SAFEST,
          eta: "18 mins",
          risk: "6%",
          safety: "96%",
          accidentProb: "0.02",
          fuel: "6.1 L/100km",
          explanation: "Route Alpha recommended. Selected because local accident probability is 63% lower."
        };
    }
  };

  const currentRoute = getRouteDetails();

  // Assistant context text
  const getAIMessage = () => {
    if (sosActive) return "SOS active. Emergency dispatched. Medical path cleared.";
    if (riskScore > 68) return "Risk index CRITICAL! Please reduce speed and check safety cockpit.";
    if (phoneUsage) return "Distraction alarm! Please keep eyes on the corridor.";
    if (fatigue) return "Drowsiness alert. High risk of vehicle drift.";
    if (traffic === 'Heavy') return "Heavy congestion ahead. Alternating safe bypass suggested.";
    if (speed > 75) return "Speed threshold exceeded. Safe margin is 50 km/h.";
    return "Road ahead looks safe. Drive within legal limits!";
  };

  const aiMessageText = getAIMessage();

  // Text-To-Speech Safety Alerts
  useEffect(() => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    // Speak only on state change to avoid redundant speech loops
    if (aiMessageText !== lastSpokenMessage.current) {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(aiMessageText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      lastSpokenMessage.current = aiMessageText;
    }
  }, [aiMessageText, voiceEnabled]);

  // Golden hour SOS timer
  useEffect(() => {
    if (!sosActive) return;
    const interval = setInterval(() => {
      setGoldenHourTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [sosActive]);

  const formatGoldenHourTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Trigger Emergency Mode
  const triggerSOS = () => {
    setSosActive(true);
    setSosTimestamp(new Date().toLocaleTimeString());
    setGoldenHourTime(3600); // 1 hour

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSosCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          setSosCoords(defaultCoords);
        }
      );
    } else {
      setSosCoords(defaultCoords);
    }
  };

  // Handle Simulated RoadWatch Image upload diagnostics
  const handleAnomalyAnalysis = () => {
    setIsAnalyzingAnomaly(true);
    setAnalyzedResult(null);

    setTimeout(() => {
      setIsAnalyzingAnomaly(false);
      
      // Dynamic results based on type selected
      switch (selectedAnomalyType) {
        case 'Pothole':
          setAnalyzedResult({
            severity: 'CRITICAL',
            priority: 'HIGH',
            confidence: 94.8,
            action: 'Automated municipal repair ticket dispatched. Pavement telemetry flagged.',
            details: 'Depth: 14cm, Width: 42cm. High risk of two-wheeler rim damage.'
          });
          break;
        case 'Accident':
          setAnalyzedResult({
            severity: 'CRITICAL',
            priority: 'IMMEDIATE',
            confidence: 98.2,
            action: 'Golden Hour ambulance corridor activated. Alert flagged to Highway Patrol.',
            details: 'Two-car side collision. Debris blocking left and center lanes.'
          });
          break;
        case 'Waterlogging':
          setAnalyzedResult({
            severity: 'WARNING',
            priority: 'MEDIUM',
            confidence: 89.5,
            action: 'Redirecting traffic via Bonn Avenue. Flagged to stormwater desk.',
            details: 'Water depth: 25cm. Severe hydroplaning risk at speed > 30 km/h.'
          });
          break;
        case 'Traffic':
          setAnalyzedResult({
            severity: 'WARNING',
            priority: 'MEDIUM',
            confidence: 96.1,
            action: 'Smart traffic light timing adjustments requested at next junction.',
            details: 'Bumper-to-bumper queue density. Spillback extending 800 meters.'
          });
          break;
        default:
          setAnalyzedResult({
            severity: 'SAFE',
            priority: 'LOW',
            confidence: 91.3,
            action: 'Debris noted. Flagged to highway cleanup crew.',
            details: 'Tree branches on shoulder lane. No immediate lane blockage.'
          });
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#060810] text-[#f1f5f9] bg-road-grid font-sans relative pb-20 selection:bg-sky-500 selection:text-white overflow-x-hidden">
      
      {/* 🔮 Apple Vision Pro Cyber Glass Glowing Effects */}
      <div className="absolute top-[5%] left-[10%] w-[500px] h-[500px] rounded-full bg-sky-500/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[5%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-[60%] left-[5%] w-[400px] h-[400px] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />

      {/* 🚀 Top Navigation Dashboard Header */}
      <header className="sticky top-0 z-[1000] bg-[#060810]/80 backdrop-blur-xl border-b border-slate-900 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo and branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-lg tracking-wider bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
                RAASTASENSE AI
              </span>
              <span className="px-1.5 py-0.5 text-[8px] bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded font-black tracking-widest uppercase">OS V3</span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Road Safety Operating System</p>
          </div>
        </div>

        {/* Operating System Tab Controls */}
        <nav className="flex flex-wrap items-center justify-center bg-slate-950/80 border border-slate-850 p-1 rounded-2xl gap-0.5">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${activeTab === 'home' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-white'}`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('command')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${activeTab === 'command' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-white'}`}
          >
            Command Center
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${activeTab === 'radar' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-white'}`}
          >
            Route AI Map
          </button>
          <button
            onClick={() => setActiveTab('guardian')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${activeTab === 'guardian' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-white'}`}
          >
            Cockpit Simulator
          </button>
          <button
            onClick={() => setActiveTab('roadwatch')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${activeTab === 'roadwatch' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-white'}`}
          >
            RoadWatch AI
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${activeTab === 'analytics' ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10' : 'text-slate-400 hover:text-white'}`}
          >
            Analytics
          </button>
        </nav>

        {/* Global Controls (Voice Assistant & emergency alert call) */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition ${
              voiceEnabled 
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-sm' 
                : 'bg-slate-950 border-slate-850 text-slate-500'
            }`}
            title={voiceEnabled ? "Voice Assistant Active" : "Voice Assistant Muted"}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={triggerSOS}
            className="flex items-center space-x-1.5 px-4 py-2 bg-rose-655 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg border border-rose-500/20 animate-pulse transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>SOS BEACON</span>
          </button>
        </div>
      </header>

      {/* 📦 Main Page Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* ==================================================
            TAB: HOME SCREEN (Cinematic landing)
           ================================================== */}
        {activeTab === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-12"
          >
            <section className="relative glass-panel rounded-[40px] p-8 sm:p-12 overflow-hidden border border-slate-850 shadow-2xl">
              
              {/* Cinematic background animated highways */}
              <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.1)_0%,transparent_70%)]">
                <div className="absolute top-[45%] left-0 right-0 h-[2px] bg-slate-700/50" />
                <div className="absolute top-[55%] left-0 right-0 h-[2px] bg-slate-700/50" />
                <div className="absolute top-[50%] left-0 right-0 h-[2px] border-t-2 border-dashed border-slate-500/80 animate-[marquee_20s_linear_infinite]" />
                <div className="absolute top-[43%] left-[-20%] w-[100px] h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-cyan-500 rounded blur-[1px] animate-[marquee_12s_linear_infinite]" />
                <div className="absolute top-[53%] right-[-25%] w-[80px] h-[3px] bg-gradient-to-l from-transparent via-rose-500 to-rose-600 rounded blur-[1px] animate-[marquee_15s_linear_infinite_reverse]" />
              </div>

              <div className="max-w-3xl space-y-6 relative">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase">
                  <Radio className="w-3.5 h-3.5 mr-2 animate-ping" />
                  National Road Safety Ecosystem HUD
                </span>
                
                <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none bg-gradient-to-b from-white via-slate-100 to-slate-450 bg-clip-text text-transparent">
                  Predict Risk.<br/>
                  Prevent Accidents.<br/>
                  Protect Lives.
                </h1>
                
                <p className="text-slate-400 text-lg leading-relaxed max-w-xl font-medium">
                  An AI-powered road safety platform that detects threats, guides safer routes, and responds instantly during emergencies. Protecting drivers and commuters across 82+ districts.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <button 
                    onClick={() => setActiveTab('radar')}
                    className="flex items-center space-x-2 px-8 py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-sky-500/10 hover:shadow-sky-500/25 active:scale-95 transition-all duration-200"
                  >
                    <Navigation className="w-5 h-5 fill-slate-950" />
                    <span>Launch AI Route Engine</span>
                  </button>
                  
                  <button 
                    onClick={triggerSOS}
                    className="flex items-center space-x-2 px-8 py-4 bg-rose-655 hover:bg-rose-500 text-white font-black rounded-2xl shadow-xl border border-rose-500/20 hover:shadow-rose-600/30 active:scale-95 transition-all duration-200 animate-pulse"
                  >
                    <PhoneCall className="w-5 h-5" />
                    <span>Broadcast SOS Alert</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Core Stats Overview block */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Stat 1 */}
              <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl flex items-center justify-between shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Active Drivers Protected</span>
                  <span className="text-3xl font-black text-slate-100 font-mono">12,852</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl flex items-center justify-between shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Live Incidents Active</span>
                  <span className="text-3xl font-black text-slate-100 font-mono">3</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl flex items-center justify-between shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">AI Risk Alerts Dispatched</span>
                  <span className="text-3xl font-black text-slate-100 font-mono">18</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
              </div>

              {/* Stat 4 */}
              <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl flex items-center justify-between shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Emergency Responses</span>
                  <span className="text-3xl font-black text-slate-100 font-mono">142</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-sky-400" />
                </div>
              </div>

            </section>

            {/* Quick Diagnostic Card Summary */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Map Preview widget */}
              <div className="lg:col-span-8 h-[350px] relative rounded-3xl overflow-hidden border border-slate-850">
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <span className="text-xs text-sky-400 font-black tracking-widest uppercase">Digital Twin Radar Active</span>
                  <p className="text-xs text-slate-400 max-w-sm">Synchronized Leaflet corridor layers showing hotspots and accident markers in real-time.</p>
                  <button 
                    onClick={() => setActiveTab('radar')}
                    className="px-5 py-2 bg-slate-900 border border-slate-800 text-xs font-black rounded-xl hover:text-white transition"
                  >
                    Open Live Map Canvas
                  </button>
                </div>
              </div>

              {/* District risk snapshot */}
              <div className="lg:col-span-4 bg-slate-900/40 border border-slate-850 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-1">Local Corridor Risk Score</span>
                  <h3 className="text-lg font-black text-slate-200 flex items-center justify-between">
                    <span>Nagpur District</span>
                    <span className="text-sky-400 font-mono">82 / 100</span>
                  </h3>
                </div>

                <div className="space-y-2.5 my-4">
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-slate-400">🌧️ Weather Risk</span>
                    <span className="text-rose-500 font-extrabold uppercase">Rain Warnings</span>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-slate-400">🔴 Traffic Jam Index</span>
                    <span className="text-amber-500 font-extrabold uppercase">Heavy Congestion</span>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-slate-400">🚨 Accident Probability</span>
                    <span className="text-rose-500 font-extrabold uppercase">Accident Zone Ahead</span>
                  </div>
                </div>

                <div className="bg-sky-500/10 border border-sky-500/25 p-3.5 rounded-2xl text-[11px] leading-relaxed text-sky-400 font-bold">
                  💡 recommendation: Route B is currently advising a 63% safer path bypass around rain-affected zones.
                </div>
              </div>

            </section>
          </motion.div>
        )}

        {/* ==================================================
            TAB: AI COMMAND CENTER (Live Mission Control)
           ================================================== */}
        {activeTab === 'command' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="border-b border-slate-900 pb-4">
              <h2 className="text-2xl font-black uppercase tracking-widest text-slate-100">
                AI Command Center
              </h2>
              <p className="text-slate-500 text-xs mt-1">Real-time mission control tracking safety parameters and predicting accident horizons.</p>
            </div>

            {/* Mission control modules grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Module 1: Traffic Intelligence */}
              <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-xs font-black uppercase text-slate-300">Traffic Intelligence</span>
                  <span className="px-2 py-0.5 text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono rounded">96% Conf.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Status:</span>
                  <span className={`text-xs font-black uppercase ${traffic === 'Heavy' ? 'text-rose-500' : traffic === 'Moderate' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {traffic} Flow
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl text-[11px] leading-relaxed text-slate-400">
                  {traffic === 'Heavy' ? "Alternative arterial corridors suggested in route engine to offset delay." : "Flow speeds stable. No dynamic signal timing changes needed."}
                </div>
              </div>

              {/* Module 2: Accident Prediction */}
              <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-xs font-black uppercase text-slate-300">Accident Prediction</span>
                  <span className="px-2 py-0.5 text-[9px] bg-indigo-500/10 text-indigo-450 border border-indigo-500/20 font-mono rounded">88% Conf.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Accident Probability:</span>
                  <span className="text-xs font-black text-rose-500">{(riskScore * 0.8).toFixed(0)}% Risk index</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl text-[11px] leading-relaxed text-slate-400">
                  Prediction horizon: Next 3 km corridors. Primary threats: {weather === 'Rainy' ? 'hydroplaning, ' : ''}{phoneUsage ? 'distracted driver latency, ' : ''}{fatigue ? 'micro-sleeps' : 'low threats'}.
                </div>
              </div>

              {/* Module 3: Emergency Dispatch */}
              <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-xs font-black uppercase text-slate-300">Emergency Dispatch</span>
                  <span className="px-2 py-0.5 text-[9px] bg-rose-500/10 text-rose-500 border border-rose-500/20 font-mono rounded">99% Conf.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Transmitter Status:</span>
                  <span className="text-xs font-black text-emerald-400 uppercase">Resilient GPS Link</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl text-[11px] leading-relaxed text-slate-400">
                  Satellite coordinates lock available. Ambulance routing clears red lights within a 5 km grid instantly.
                </div>
              </div>

              {/* Module 4: Weather Risk */}
              <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-xs font-black uppercase text-slate-300">Weather Risk</span>
                  <span className="px-2 py-0.5 text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono rounded">92% Conf.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Impact score:</span>
                  <span className={`text-xs font-black uppercase ${weather === 'Clear' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {weather === 'Clear' ? 'Minimal' : 'Significant'}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl text-[11px] leading-relaxed text-slate-400">
                  {weather === 'Rainy' ? "Warning: severe precipitation detected. Friction index reduced from 0.8 to 0.45." : "Skies clear. Pavement moisture parameters ideal."}
                </div>
              </div>

              {/* Module 5: Road Infrastructure */}
              <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-xs font-black uppercase text-slate-300">Road Infrastructure</span>
                  <span className="px-2 py-0.5 text-[9px] bg-purple-500/10 text-purple-450 border border-purple-500/20 font-mono rounded">94% Conf.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Pavement Quality:</span>
                  <span className="text-xs font-black text-slate-200">{roadCondition}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl text-[11px] leading-relaxed text-slate-400">
                  {roadCondition === 'Severe Potholes' ? "Pavement warning: multiple severe potholes registered in right lane. Watch suspension levels." : "Asphalt integrity verified. Low roughness indicators."}
                </div>
              </div>

              {/* Module 6: Driver Safety */}
              <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-xs font-black uppercase text-slate-300">Driver Safety Cockpit</span>
                  <span className="px-2 py-0.5 text-[9px] bg-rose-500/10 text-rose-550 border border-rose-500/20 font-mono rounded">97% Conf.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Driver State Score:</span>
                  <span className={`text-xs font-black ${classification === 'Critical' ? 'text-rose-500' : classification === 'Warning' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {100 - riskScore} / 100 ({classification})
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl text-[11px] leading-relaxed text-slate-400">
                  Attention status: {phoneUsage ? "Distracted (Device active). " : "Attentive. "}{fatigue ? "Exhausted (Fatigue flags)." : "Active."}
                </div>
              </div>

            </div>

            {/* Accident prediction timeline block */}
            <section className="bg-slate-900/80 border border-slate-850 p-6 sm:p-8 rounded-[32px] space-y-6">
              <span className="text-[10px] text-sky-400 font-black tracking-widest uppercase block flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Accident Prediction Engine & Visual Horizon
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Horizon</span>
                  <span className="text-lg font-black text-slate-200">Next 15 Minutes</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Probability</span>
                  <span className="text-lg font-black text-slate-200 font-mono">{(riskScore * 0.7).toFixed(0)}%</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Potential Causes</span>
                  <span className="text-xs font-bold text-slate-350 line-clamp-1">
                    {phoneUsage ? 'Phone distraction, ' : ''}{fatigue ? 'drowsiness, ' : ''}{speed > 75 ? 'overspeeding, ' : ''}{weather !== 'Clear' ? 'pavement slickness, ' : 'none'}
                  </span>
                </div>
                <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Safety Zone</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Bypass Corridors Loaded
                  </span>
                </div>
              </div>

              {/* Visual timeline graph */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-[10px] text-slate-500 font-black uppercase tracking-wider">
                  <span>Start (IIT campus)</span>
                  <span>5 mins</span>
                  <span>10 mins</span>
                  <span>Destination</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden flex border border-slate-850">
                  <div className="h-full bg-emerald-500" style={{ width: '25%' }} />
                  <div className="h-full bg-amber-500" style={{ width: '35%' }} />
                  <div className={`h-full ${classification === 'Critical' ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: '20%' }} />
                  <div className="h-full bg-emerald-500" style={{ width: '20%' }} />
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {/* ==================================================
            TAB: ROUTE AI MAP (Digital Twin Leaflet Map)
           ================================================== */}
        {activeTab === 'radar' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-widest text-slate-100">
                  Live Digital Twin Map
                </h2>
                <p className="text-slate-500 text-xs mt-1">Multi-corridor geospatial route solver indexing safety metrics.</p>
              </div>

              {/* Map modes toggle */}
              <div className="bg-slate-950 border border-slate-850 p-1 rounded-2xl flex items-center space-x-1 shadow-inner">
                <button
                  onClick={() => setMapLayer('standard')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${mapLayer === 'standard' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setMapLayer('traffic')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${mapLayer === 'traffic' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  Traffic
                </button>
                <button
                  onClick={() => setMapLayer('heatmap')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${mapLayer === 'heatmap' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  Accident Heatmap
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Left Route Info Panel */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                
                {/* Route selection tab deck */}
                <div className="bg-slate-900/60 border border-slate-850 p-2 rounded-[24px] flex items-center justify-between gap-1">
                  {(['safest', 'fastest', 'eco', 'emergency'] as const).map((rKey) => (
                    <button
                      key={rKey}
                      onClick={() => setSelectedRouteKey(rKey)}
                      className={`flex-1 py-2 text-[10px] font-black rounded-xl capitalize transition ${
                        selectedRouteKey === rKey
                          ? 'bg-sky-500 text-slate-950 font-extrabold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {rKey}
                    </button>
                  ))}
                </div>

                {/* Selected Route Analytics */}
                <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-5 space-y-4">
                  <div className="border-b border-slate-850 pb-2">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Geospatial Solution</span>
                    <h3 className="text-base font-extrabold text-slate-200">{currentRoute.explanation.split('.')[0]}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-slate-950/70 border border-slate-850/50 p-2.5 rounded-xl">
                      <span className="text-[9px] text-slate-500 font-extrabold block uppercase">ETA</span>
                      <span className="text-slate-200 font-bold">{currentRoute.eta}</span>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-850/50 p-2.5 rounded-xl">
                      <span className="text-[9px] text-slate-500 font-extrabold block uppercase">Risk Factor</span>
                      <span className="text-rose-450 font-bold">{currentRoute.risk}</span>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-850/50 p-2.5 rounded-xl">
                      <span className="text-[9px] text-slate-500 font-extrabold block uppercase">Accident Prob.</span>
                      <span className="text-amber-450 font-bold">{currentRoute.accidentProb}</span>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-850/50 p-2.5 rounded-xl">
                      <span className="text-[9px] text-slate-500 font-extrabold block uppercase">Fuel Index</span>
                      <span className="text-purple-400 font-bold">{currentRoute.fuel}</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-sky-500/5 border border-sky-500/20 rounded-2xl text-[11px] leading-relaxed text-sky-400 font-bold">
                    💡 AI Explanation: {currentRoute.explanation}
                  </div>

                  {/* Open in Google Maps button */}
                  <a
                    href={`https://www.google.com/maps?q=${defaultCoords.lat},${defaultCoords.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-200 font-black rounded-2xl flex items-center justify-center space-x-2 text-xs transition active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Launch Google Maps Route</span>
                  </a>
                </div>

              </div>

              {/* Leaflet radar container */}
              <div className="lg:col-span-8 h-[400px]">
                <MapContainer 
                  userCoords={defaultCoords}
                  roads={MOCK_ROADS}
                  incidents={MOCK_INCIDENTS}
                  heatmap={MOCK_HEATMAP}
                  activeLayer={mapLayer}
                  setActiveLayer={setMapLayer}
                  selectedRoute={currentRoute.coords}
                  sosActive={sosActive}
                  sosCoords={sosCoords}
                />
              </div>

            </div>
          </motion.div>
        )}

        {/* ==================================================
            TAB: AI DRIVER GUARDIAN (Safety Cockpit & Simulators)
           ================================================== */}
        {activeTab === 'guardian' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="border-b border-slate-900 pb-4">
              <h2 className="text-2xl font-black uppercase tracking-widest text-slate-100">
                Driver Guardian AI Cockpit
              </h2>
              <p className="text-slate-500 text-xs mt-1">Simulate driving parameters to analyze safety risk indexes and trigger real-time counseling voice alerts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Telemetry settings slider panel */}
              <div className="lg:col-span-4 bg-slate-900/60 border border-slate-850 rounded-3xl p-6 space-y-4">
                <span className="text-[10px] text-sky-400 font-black tracking-widest uppercase block flex items-center">
                  <Gauge className="w-4 h-4 mr-1.5" />
                  Corridor Simulator HUD
                </span>

                {/* Speed Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-350">
                    <span>Speed Control</span>
                    <span className="font-mono text-sky-400">{speed} km/h</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="115" 
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full accent-sky-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                {/* Distracted & Fatigue toggles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => setPhoneUsage(!phoneUsage)}
                    className={`p-3 rounded-2xl border text-xs font-black transition duration-150 ${
                      phoneUsage 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-450 shadow-glow-red' 
                        : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    📱 Mobile Active
                  </button>

                  <button
                    onClick={() => setFatigue(!fatigue)}
                    className={`p-3 rounded-2xl border text-xs font-black transition duration-150 ${
                      fatigue 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-450 shadow-glow-red' 
                        : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    🥱 Fatigue Active
                  </button>
                </div>

                {/* Environmental selects */}
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Select Weather</span>
                  <select 
                    value={weather}
                    onChange={(e) => setWeather(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-350 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Clear">☀️ Clear Skies</option>
                    <option value="Rainy">🌧️ Severe Rain</option>
                    <option value="Foggy">🌫️ Low Visibility Fog</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Select Traffic</span>
                  <select 
                    value={traffic}
                    onChange={(e) => setTraffic(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-350 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Smooth">🟢 Smooth Flow</option>
                    <option value="Moderate">🟡 Moderate Traffic</option>
                    <option value="Heavy">🔴 Heavy Congestion</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Road Conditions</span>
                  <select 
                    value={roadCondition}
                    onChange={(e) => setRoadCondition(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-350 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Dry Asphalt">🟢 Dry Asphalt</option>
                    <option value="Wet Surface">🟡 Wet Surface</option>
                    <option value="Severe Potholes">🔴 Severe Potholes</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Visibility Index</span>
                  <select 
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-350 focus:outline-none focus:border-sky-500"
                  >
                    <option value="High">🟢 High (Clear Sight)</option>
                    <option value="Medium">🟡 Medium (Moderate Haze)</option>
                    <option value="Low">🔴 Low (Dense Mist/Smog)</option>
                  </select>
                </div>

                {/* Additional controls for OS V3 */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Seatbelt</span>
                    <button
                      onClick={() => setSeatbeltStatus(seatbeltStatus === 'Secured' ? 'Unbuckled' : 'Secured')}
                      className={`w-full py-2 rounded-xl border text-[10px] font-black transition ${
                        seatbeltStatus === 'Secured' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' : 'bg-rose-500/10 border-rose-500/20 text-rose-450 animate-pulse'
                      }`}
                    >
                      {seatbeltStatus === 'Secured' ? '🔒 Secured' : '🔓 Unbuckled'}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Lane Discipline</span>
                    <select
                      value={laneDiscipline}
                      onChange={(e) => setLaneDiscipline(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-2 text-[10px] font-bold text-slate-350 focus:outline-none"
                    >
                      <option value="Perfect">🟢 Perfect</option>
                      <option value="Drifting">🟡 Drifting</option>
                      <option value="Erratic">🔴 Erratic</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Risk speedometer and recommendations output */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <RiskSpeedometer 
                  score={riskScore}
                  classification={classification}
                  recommendations={recommendations}
                />

                {/* Safety Score Details card */}
                <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-2">Driver Cockpit HUD Details</span>
                    <div className="space-y-3.5">
                      <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                        <span className="text-slate-400">Driver Fatigue</span>
                        <span className={`font-mono font-bold ${fatigue ? 'text-rose-500' : 'text-emerald-400'}`}>{fatigue ? 'EXHAUSTED' : 'ACTIVE'}</span>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                        <span className="text-slate-400">Mobile Phone distracted</span>
                        <span className={`font-mono font-bold ${phoneUsage ? 'text-rose-500' : 'text-emerald-400'}`}>{phoneUsage ? 'YES' : 'NO'}</span>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                        <span className="text-slate-400">Lane Alignment</span>
                        <span className="font-mono font-bold text-slate-200">{laneDiscipline}</span>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                        <span className="text-slate-400">Seatbelt/Helmet</span>
                        <span className={`font-mono font-bold ${seatbeltStatus === 'Secured' ? 'text-emerald-400' : 'text-rose-500'}`}>{seatbeltStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-6 p-4 rounded-2xl border text-xs font-bold leading-relaxed ${
                    classification === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                    classification === 'Warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    🚀 Driver Safety Status: {classification === 'Critical' ? 'CRITICAL RISK ALERT. Speech synthesis warning dispatched.' : 'Status Normal. Safe corridors maintained.'}
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* ==================================================
            TAB: ROADWATCH AI (Anomaly reporting & simulation)
           ================================================== */}
        {activeTab === 'roadwatch' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="border-b border-slate-900 pb-4">
              <h2 className="text-2xl font-black uppercase tracking-widest text-slate-100">
                RoadWatch AI Report Engine
              </h2>
              <p className="text-slate-500 text-xs mt-1">Upload road anomalies to run neural diagnostic scans for local municipalities.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Report submission simulator */}
              <div className="lg:col-span-5 bg-slate-900/60 border border-slate-850 rounded-3xl p-6 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-[10px] text-sky-400 font-black tracking-widest uppercase block mb-4 flex items-center">
                    <Camera className="w-4 h-4 mr-1.5" />
                    Simulated Anomaly Uploader
                  </span>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Select Incident Type</span>
                      <select 
                        value={selectedAnomalyType}
                        onChange={(e) => setSelectedAnomalyType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-350 focus:outline-none"
                      >
                        <option value="Pothole">🕳️ Pothole Cluster</option>
                        <option value="Accident">💥 Collision / Accident</option>
                        <option value="Traffic">🚗 Bumper-to-Bumper Queue</option>
                        <option value="Waterlogging">🌧️ severe Waterlogging</option>
                        <option value="Debris">🪵 Road Debris / Obstacle</option>
                      </select>
                    </div>

                    {/* Simulated image upload placeholder click box */}
                    <div className="h-40 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-4 bg-slate-950/60">
                      <Camera className="w-8 h-8 text-slate-600 mb-2" />
                      <span className="text-xs text-slate-400 font-bold">raastasense_capture_{selectedAnomalyType.toLowerCase()}.png</span>
                      <span className="text-[9px] text-slate-600 uppercase tracking-wider mt-1">Ready for Neural diagnostic scan</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAnomalyAnalysis}
                  disabled={isAnalyzingAnomaly}
                  className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 text-slate-950 font-black rounded-2xl transition"
                >
                  {isAnalyzingAnomaly ? 'Running Deep Neural Diagnostics...' : 'Submit Report & Run AI Scan'}
                </button>
              </div>

              {/* Anomaly results analysis block */}
              <div className="lg:col-span-7 bg-slate-900/60 border border-slate-850 rounded-3xl p-6 sm:p-8 flex flex-col justify-center min-h-[350px]">
                
                {isAnalyzingAnomaly ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">Analyzing image features. Computing severity density...</p>
                  </div>
                ) : analyzedResult ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <h3 className="text-base font-black text-slate-200">AI Diagnostic Report</h3>
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono rounded font-black">
                        Confidence: {analyzedResult.confidence}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="bg-slate-950/60 border border-slate-850/60 p-3 rounded-xl">
                        <span className="text-[9px] text-slate-500 font-extrabold uppercase block">Severity</span>
                        <span className={`text-sm font-black ${analyzedResult.severity === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'}`}>
                          {analyzedResult.severity}
                        </span>
                      </div>

                      <div className="bg-slate-950/60 border border-slate-850/60 p-3 rounded-xl">
                        <span className="text-[9px] text-slate-500 font-extrabold uppercase block">Priority Level</span>
                        <span className={`text-sm font-black ${analyzedResult.priority === 'HIGH' || analyzedResult.priority === 'IMMEDIATE' ? 'text-rose-500' : 'text-slate-300'}`}>
                          {analyzedResult.priority}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850/60 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">Anomaly Specifics</span>
                      <p className="text-xs text-slate-350 leading-relaxed font-medium">{analyzedResult.details}</p>
                    </div>

                    <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-2xl space-y-1">
                      <span className="text-[10px] text-sky-400 font-black uppercase tracking-widest block">Dispatched Action plan</span>
                      <p className="text-xs text-sky-400 leading-relaxed font-bold">{analyzedResult.action}</p>
                    </div>

                  </motion.div>
                ) : (
                  <div className="text-center py-10 text-slate-500 space-y-2">
                    <FileText className="w-12 h-12 mx-auto text-slate-700" />
                    <h3 className="text-sm font-bold text-slate-400">No active scan performed</h3>
                    <p className="text-[11px] max-w-xs mx-auto">Select anomaly type and click submit to mock computer-vision diagnostics checks.</p>
                  </div>
                )}

              </div>

            </div>
          </motion.div>
        )}

        {/* ==================================================
            TAB: ANALYTICS HUB
           ================================================== */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="border-b border-slate-900 pb-4">
              <h2 className="text-2xl font-black uppercase tracking-widest text-slate-100">
                Analytics & Safety Comparison
              </h2>
              <p className="text-slate-500 text-xs mt-1">Multi-district safety index metrics and seasonal incident trends.</p>
            </div>

            {/* Visual SVG Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Graph 1: District Safety Indexes */}
              <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-[32px] space-y-4">
                <span className="text-xs text-slate-200 font-extrabold uppercase tracking-wider block">District Safety Indexes</span>
                
                {/* SVG Bar Chart */}
                <div className="h-60 flex items-end justify-between gap-4 pt-6 border-b border-slate-800 pb-2">
                  
                  {/* Nagpur */}
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">82</span>
                    <div className="w-full bg-sky-500/80 rounded-t-lg transition hover:bg-sky-400" style={{ height: '82%' }} />
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest truncate max-w-full">Nagpur</span>
                  </div>

                  {/* Mumbai */}
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">68</span>
                    <div className="w-full bg-sky-500/50 rounded-t-lg transition hover:bg-sky-400" style={{ height: '68%' }} />
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest truncate max-w-full">Mumbai</span>
                  </div>

                  {/* Pune */}
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">75</span>
                    <div className="w-full bg-sky-500/60 rounded-t-lg transition hover:bg-sky-400" style={{ height: '75%' }} />
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest truncate max-w-full">Pune</span>
                  </div>

                  {/* Nashik */}
                  <div className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">91</span>
                    <div className="w-full bg-emerald-500/80 rounded-t-lg transition hover:bg-emerald-450" style={{ height: '91%' }} />
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest truncate max-w-full">Nashik</span>
                  </div>

                </div>
              </div>

              {/* Graph 2: Seasonal Accident Index trends */}
              <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-[32px] space-y-4">
                <span className="text-xs text-slate-200 font-extrabold uppercase tracking-wider block">Weekly Accident Probability Index</span>
                
                {/* SVG Line/Area Chart */}
                <div className="h-60 relative border-b border-l border-slate-800/80 pt-4 flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                    {/* Glowing Area under line */}
                    <path 
                      d="M 0 160 Q 100 80 200 120 T 400 40 L 400 200 L 0 200 Z" 
                      fill="url(#areaGlow)" 
                    />
                    
                    {/* Actual trend Line */}
                    <path 
                      d="M 0 160 Q 100 80 200 120 T 400 40" 
                      fill="none" 
                      stroke="#38bdf8" 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                    />

                    {/* Gradient defs */}
                    <defs>
                      <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25"/>
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="absolute bottom-2 left-2 text-[9px] text-slate-600 uppercase font-black tracking-wider">Mon</div>
                  <div className="absolute bottom-2 left-1/4 text-[9px] text-slate-600 uppercase font-black tracking-wider">Wed</div>
                  <div className="absolute bottom-2 left-2/4 text-[9px] text-slate-600 uppercase font-black tracking-wider">Fri</div>
                  <div className="absolute bottom-2 right-2 text-[9px] text-slate-600 uppercase font-black tracking-wider">Sun</div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </main>

      {/* ==================================================
          EMERGENCY FULL SCREEN SOS MODAL OVERLAY
         ================================================== */}
      <AnimatePresence>
        {sosActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#02040a]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Glowing background halo */}
            <div className="absolute w-[350px] h-[350px] rounded-full bg-rose-500/10 blur-[80px] pointer-events-none" />

            <div className="max-w-md w-full space-y-6 relative border border-rose-500/20 rounded-[36px] bg-slate-950/75 p-8 shadow-2xl">
              
              {/* Pulsing Beacon Circle */}
              <div className="mx-auto w-24 h-24 rounded-full bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>

              <div className="space-y-2">
                <span className="text-xs text-rose-500 font-extrabold uppercase tracking-widest block">GOLDEN HOUR INCIDENT DETECTED</span>
                <h2 className="text-3xl font-black text-slate-100">SOS Active</h2>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Emergency alert broadcasted. Nearby trauma centers and police checkpoints have locked onto your location.
                </p>
              </div>

              {/* Countdown time HUD */}
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-[10px] text-rose-500 font-black tracking-widest uppercase">Golden Hour Countdown</span>
                <span className="text-4xl font-black font-mono text-rose-500 tracking-tight mt-1 animate-pulse">
                  {formatGoldenHourTime(goldenHourTime)}
                </span>
              </div>

              <div className="space-y-2.5">
                
                {/* Coordinates Display */}
                <div className="bg-slate-900 border border-slate-850/80 rounded-xl p-3 flex items-center justify-between text-xs text-slate-350">
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 mr-1.5" />
                    Coordinates:
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {sosCoords ? `${sosCoords.lat.toFixed(5)}, ${sosCoords.lng.toFixed(5)}` : "Tracking GPS..."}
                  </span>
                </div>

                {/* Timestamp Display */}
                {sosTimestamp && (
                  <div className="bg-slate-900 border border-slate-850/80 rounded-xl p-3 flex items-center justify-between text-xs text-slate-350">
                    <span className="flex items-center">
                      <Radio className="w-3.5 h-3.5 text-rose-500 mr-1.5 animate-pulse" />
                      Locked Time:
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {sosTimestamp}
                    </span>
                  </div>
                )}

                {/* Google Maps link button */}
                <a
                  href={sosCoords ? `https://www.google.com/maps?q=${sosCoords.lat},${sosCoords.lng}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl shadow-xl shadow-rose-600/10 hover:shadow-rose-600/25 active:scale-95 transition-all duration-200 border border-rose-500/30 flex items-center justify-center space-x-2 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in Google Maps</span>
                </a>

                {/* Cancel SOS */}
                <button
                  onClick={() => {
                    setSosActive(false);
                    setSosCoords(null);
                    setSosTimestamp(null);
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-black rounded-2xl text-xs transition"
                >
                  Cancel / False Alarm
                </button>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================
          ANIME AI ASSISTANT (RAASTA GUARDIAN)
         ================================================== */}
      <div className="fixed bottom-6 right-6 z-[2000] flex flex-col items-end">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-2xl w-[280px] mb-3 space-y-3 relative overflow-hidden"
            >
              {/* Cute digital border glow depending on state */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                sosActive ? 'bg-rose-500 animate-pulse' :
                riskScore > 68 ? 'bg-rose-500' :
                riskScore > 32 ? 'bg-amber-400' :
                'bg-sky-400'
              }`} />
              
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full animate-ping ${
                    sosActive || riskScore > 68 ? 'bg-rose-500' :
                    riskScore > 32 ? 'bg-amber-400' :
                    'bg-emerald-500'
                  }`} />
                  <span className="text-xs font-black tracking-wider uppercase text-slate-200">Raasta Guardian</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white transition">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-950/60 rounded-2xl border border-slate-850/60 p-3 text-xs leading-relaxed text-slate-350 font-medium">
                "{aiMessageText}"
              </div>

              <div className="flex items-center space-x-1">
                <input 
                  type="text" 
                  placeholder="Ask Raasta Guardian..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-sky-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      alert("Raasta Guardian: Analyzing local coordinates parameters.");
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <button className="p-2 bg-sky-500 text-slate-950 rounded-xl hover:bg-sky-400 active:scale-95 transition">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The floating clickable avatar button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-650 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition duration-200 border-2 border-white/10 group relative ${
            sosActive || riskScore > 68 ? 'shadow-[0_0_20px_rgba(244,63,94,0.6)] border-rose-500' :
            riskScore > 32 ? 'shadow-[0_0_15px_rgba(245,158,11,0.5)] border-amber-400' :
            'shadow-[0_0_15px_rgba(56,189,248,0.3)] border-sky-400'
          }`}
          title="Raasta Guardian AI"
        >
          {/* Pulsing glow ring around avatar */}
          <div className={`absolute inset-0 rounded-full border-2 animate-ping opacity-25 group-hover:opacity-40 ${
            sosActive || riskScore > 68 ? 'border-rose-500' :
            riskScore > 32 ? 'border-amber-400' :
            'border-sky-400'
          }`} />
          
          <User className="w-6 h-6 text-white" />
        </button>
      </div>

    </div>
  );
}
