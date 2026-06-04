import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  PhoneCall, 
  Gauge, 
  X, 
  Send,
  Activity,
  User,
  ExternalLink,
  MapPin,
  Camera,
  Radio,
  Search,
  Mic,
  Award,
  Flame,
  BookOpen,
  Clock,
  Grid,
  FileSpreadsheet,
  MessageSquare
} from 'lucide-react';
import MapContainer from './components/MapContainer';
import RiskSpeedometer from './components/RiskSpeedometer';

interface EmergencyNode {
  name: string;
  lat: number;
  lng: number;
  type: 'hospital' | 'police' | 'ambulance';
  phone: string;
}

const MOCK_EMERGENCY_NODES: EmergencyNode[] = [
  { name: "City General Hospital & Trauma Care", lat: 12.9925, lng: 80.2356, type: "hospital", phone: "102" },
  { name: "Metro Accident & Critical Ward", lat: 12.9860, lng: 80.2315, type: "hospital", phone: "102" },
  { name: "Central Highway Police Headquarters", lat: 12.9945, lng: 80.2320, type: "police", phone: "100" },
  { name: "Sector 5 Traffic Control Hub", lat: 12.9890, lng: 80.2395, type: "police", phone: "103" },
  { name: "Raasta Rescue Ambulance Station B", lat: 12.9910, lng: 80.2370, type: "ambulance", phone: "102" }
];

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

const ROAD_SIGNS = [
  { name: "Stop Sign", category: "Regulatory", code: "R-1", icon: "🛑", meaning: "Mandates vehicles to halt. Failure results in fine.", compliance: "Stop completely behind white line." },
  { name: "Speed Limit 50", category: "Regulatory", code: "R-2", icon: "50", meaning: "Maximum speed of 50 km/h allowed.", compliance: "Reduce velocity, match traffic pacing." },
  { name: "No Overtaking", category: "Regulatory", code: "R-3", icon: "🚫", meaning: "Passing leading vehicles forbidden here.", compliance: "Maintain single lane queue alignment." },
  { name: "Narrow Bridge", category: "Warning", code: "W-1", icon: "🌉", meaning: "Road narrows. Yield to oncoming flows.", compliance: "Slow down, maintain double spacing gap." },
  { name: "Speed Bump Ahead", category: "Warning", code: "W-2", icon: "🐪", meaning: "Physical elevation bump on lane.", compliance: "Reduce speed under 20 km/h to pass." },
  { name: "Hospital", category: "Informative", code: "I-1", icon: "🏥", meaning: "Nearest medical critical trauma node.", compliance: "Observe silence zone rules. No honking." },
  { name: "Parking Area", category: "Informative", code: "I-2", icon: "🅿️", meaning: "Public parking space permitted.", compliance: "Align vehicle strictly within guidelines." }
];

const QUIZ_QUESTIONS = [
  {
    question: "Under the Motor Vehicles Act, what is the maximum fine for a first-time Drunk Driving offence?",
    options: ["₹1,000", "₹5,000", "₹10,000", "₹20,000"],
    answer: 2,
    explanation: "Under Section 185, Drunk Driving penalty is ₹10,000 and/or up to 6 months imprisonment."
  },
  {
    question: "What does a circular road sign with a red border indicating '50' mean?",
    options: ["Minimum speed 50 km/h", "Maximum legal speed 50 km/h", "Recommend speed 50 km/h", "Distance to destination is 50 km"],
    answer: 1,
    explanation: "Circular signs with red borders are regulatory. The number inside dictates the maximum legal speed limit."
  },
  {
    question: "What should you do immediately during the 'Golden Hour' after a road accident?",
    options: ["Drive away to find a mechanic", "Secure the coordinates, apply first aid pressure, call SOS immediately", "Call insurance agent before medical help", "Take photos for social media feed"],
    answer: 1,
    explanation: "The Golden Hour is the critical first hour where immediate medical intervention reduces fatality probability by 85%."
  },
  {
    question: "What is the penalty for driving without a valid Third-Party Insurance?",
    options: ["₹500", "₹2,000 & up to 3 months jail", "₹1,000", "No fine, only warning"],
    answer: 1,
    explanation: "Section 196 mandates a fine of ₹2,000 and/or imprisonment of up to 3 months for driving without insurance."
  }
];

const TRANSLATIONS: Record<string, Record<string, string>> = {
  English: {
    home: "Home",
    drivelegal: "DriveLegal AI",
    roadwatch: "RoadWatch AI",
    roadsos: "RoadSOS AI",
    radar: "Digital Twin Map",
    guardian: "Driver Guardian",
    analytics: "Analytics",
    aiguardian: "AI Guardian",
    nationalRoadSafetyOS: "National Road Safety OS",
    headlineLeft: "Predict Risk.",
    headlineCenter: "Prevent Accidents.",
    headlineRight: "Protect Lives.",
    subheadline: "India's AI-Powered National Road Safety Operating System. Integrates DriveLegal Compliance, RoadWatch Citizen Diagnostics, and RoadSOS Rescue Systems to save lives on every journey."
  },
  Hindi: {
    home: "मुख्य पृष्ठ",
    drivelegal: "ड्राइवलीगल एआई",
    roadwatch: "रोडवॉच एआई",
    roadsos: "रोड एसओएस एआई",
    radar: "डिजिटल ट्विन मैप",
    guardian: "ड्राइवर गार्जियन",
    analytics: "विश्लेषण",
    aiguardian: "एआई गार्जियन",
    nationalRoadSafetyOS: "राष्ट्रीय सड़क सुरक्षा ओएस",
    headlineLeft: "जोखिम का अनुमान लगाएं।",
    headlineCenter: "दुर्घटनाओं को रोकें।",
    headlineRight: "जीवन की रक्षा करें।",
    subheadline: "भारत का एआई-संचालित राष्ट्रीय सड़क सुरक्षा ऑपरेटिंग सिस्टम। जीवन बचाने के लिए ड्राइवलीगल, रोडवॉच और रोडएसओएस को एकीकृत करता है।"
  },
  Marathi: {
    home: "मुख्य पृष्ठ",
    drivelegal: "ड्राईव्हलीगल एआय",
    roadwatch: "रोडवॉच एआय",
    roadsos: "रोड एसओएस एआय",
    radar: "डिजिटल ट्विन मॅप",
    guardian: "ड्रायव्हर गार्डियन",
    analytics: "विश्लेषण",
    aiguardian: "एआय गार्डियन",
    nationalRoadSafetyOS: "राष्ट्रीय रस्ता सुरक्षा ओएस",
    headlineLeft: "धोका ओळखा.",
    headlineCenter: "अपघात टाळा.",
    headlineRight: "जीवन वाचवा.",
    subheadline: "भारताची एआय-चालित राष्ट्रीय रस्ता सुरक्षा ऑपरेटिंग सिस्टम. जीवन वाचवण्यासाठी ड्राईव्हलीगल, रोडवॉच आणि रोडएसओएस समाविष्ट करते."
  },
  Tamil: {
    home: "முகப்பு",
    drivelegal: "டிரைவ்லீகல் AI",
    roadwatch: "ரோடுவாட்ச் AI",
    roadsos: "ரோடுSOS AI",
    radar: "டிஜிட்டல் இரட்டை வரைபடம்",
    guardian: "டிரைவர் கார்டியன்",
    analytics: "பகுப்பாய்வு",
    aiguardian: "AI கார்டியன்",
    nationalRoadSafetyOS: "தேசிய சாலை பாதுகாப்பு ஓஎஸ்",
    headlineLeft: "ஆபத்தை கணிப்போம்.",
    headlineCenter: "விபத்துகளை தடுப்போம்.",
    headlineRight: "உயிர்களை காப்போம்.",
    subheadline: "இந்தியாவின் AI-ஆற்றல் கொண்ட தேசிய சாலை பாதுகாப்பு இயங்குതளம். உயிர்களைக் காப்பாற்ற டிரைவ்லீகல், ரோடுவாட்ச் மற்றும் ரோடுSOS ஆகியவற்றை ஒருங்கிணைக்கிறது."
  },
  Telugu: {
    home: "హోమ్",
    drivelegal: "డ్రైవ్‌లీగల్ AI",
    roadwatch: "రోడ్‌వాచ్ AI",
    roadsos: "రోడ్ SOS AI",
    radar: "డిజిటల్ ట్విన్ మ్యాప్",
    guardian: "డ్రൈవర్ గార్డియన్",
    analytics: "విశ్లేషణలు",
    aiguardian: "AI గార్డియన్",
    nationalRoadSafetyOS: "జాతీయ రహదారి భద్రత OS",
    headlineLeft: "ప్రమాదాన్ని అంచనా వేయండి.",
    headlineCenter: "ప్రమాదాలను నివారించండి.",
    headlineRight: "ప్రాణాలను రక్షించండి.",
    subheadline: "భారతదేశపు మొట్టమൊදటి AI-ఆధారిత రహదారి భద్రత ఆపరేటింగ్ సిస్టమ్. డ్రൈవ్‌లీగల్, రోడ్‌వాచ్ మరియు రోడ్ SOSలను అనుసంధానిస్తుంది."
  },
  Kannada: {
    home: "ಮುಖಪುಟ",
    drivelegal: "ಡ್ರೈವ್ ಲೀಗಲ್ AI",
    roadwatch: "ರೋಡ್ ವಾಚ್ AI",
    roadsos: "ರೋಡ್ SOS AI",
    radar: "ಡಿಜಿಟಲ್ ಟ್ವಿನ್ ನಕ್ಷೆ",
    guardian: "ಚಾಲಕ ಗಾರ್ಡಿಯൻ",
    analytics: "ವಿಶ್ಲೇಷಣೆ",
    aiguardian: "AI ಗಾರ್ಡಿಯൻ",
    nationalRoadSafetyOS: "ರಾಷ್ಟ್ರೀಯ ರಸ್ತೆ ಸುರಕ್ಷತೆ OS",
    headlineLeft: "ಅಪಾಯವನ್ನು ಊಹಿಸಿ.",
    headlineCenter: "ಅಪಘಾತಗಳನ್ನು ತಡೆಯಿರಿ.",
    headlineRight: "ಜೀವಗಳನ್ನು ಉಳಿಸಿ.",
    subheadline: "ಭಾರತದ ಮೊದಲ AI-ಚಾಲಿತ ರಾಷ್ಟ್ರೀಯ ರಸ್ತೆ ಸುರಕ್ಷತೆ ಆಪರೇಟಿಂಗ್ ಸಿಸ್ಟಮ್. ಪ್ರಾಣ ಉಳಿಸಲು ಡ್ರൈವ್ ಲೀಗಲ್, ರೋಡ್ ವಾಚ್ ಮತ್ತು ರೋಡ್ SOS ಅನ್ನು ಸಂಯೋಜಿಸುತ್ತದೆ."
  },
  Bengali: {
    home: "হোম",
    drivelegal: "ড্রাইভলিগাল AI",
    roadwatch: "রোডওয়াচ AI",
    roadsos: "রোড SOS AI",
    radar: "ডিজিটাল টুইন ম্যাপ",
    guardian: "দ্বাইভার গার্ডিয়ান",
    analytics: "বিশ্লেষণ",
    aiguardian: "AI গার্ডিয়ান",
    nationalRoadSafetyOS: "জাতীয় সড়ক নিরাপত্তা ওএস",
    headlineLeft: "ঝুঁকি পূর্বাভাস করুন।",
    headlineCenter: "দুর্ঘটনা রোধ করুন।",
    headlineRight: "জীবন বাঁচান।",
    subheadline: "ভারতের প্রথম এআই-চালিত জাতীয় সড়ক নিরাপত্তা অপারেটিং সিস্টেম। ড্রাইভলিগাল, রোডওয়াচ এবং রোডএসওএস একত্রিত করে জীবন বাঁচানোর জন্য।"
  },
  Gujarati: {
    home: "હોમ",
    drivelegal: "ડ્રાઇવલીગલ AI",
    roadwatch: "રોડવોચ AI",
    roadsos: "રોડ SOS AI",
    radar: "ડિજિટલ ટ્વીન મેપ",
    guardian: "ડ્રાઇવર ગાર્ડિયન",
    analytics: "વિશ્લેષણ",
    aiguardian: "AI ગાર્ડિયન",
    nationalRoadSafetyOS: "રાષ્ટ્રીય માર્ગ સલામતી OS",
    headlineLeft: "જોખમનું અનુમાન કરો.",
    headlineCenter: "અકસ્માતો અટકાવો.",
    headlineRight: "જીવન બચાવો.",
    subheadline: "ભારતની એઆઇ-સંચાલિત રાષ્ટ્રીય માર્ગ સુરક્ષા ઓપરેટિંગ સિસ્ટમ. જીવ બચાવવા માટે ડ્રાઇવલીગલ, રોડવોચ અને રોડSOS સંકલિત કરે છે."
  },
  Punjabi: {
    home: "ਮੁੱਖ ਪੰਨਾ",
    drivelegal: "ਡ੍ਰਾਈਵਲੀਗਲ AI",
    roadwatch: "ਰੋਡਵਾਚ AI",
    roadsos: "ਰੋਡ SOS AI",
    radar: "ਡਿਜੀਟਲ ਟਵਿਨ ਨਕਸ਼ਾ",
    guardian: "ਡਰਾਈਵਰ ਗਾਰਡੀਅਨ",
    analytics: "ਵਿਸ਼ਲੇਸ਼ਣ",
    aiguardian: "AI ਗਾਰਡੀਅਨ",
    nationalRoadSafetyOS: "ਰਾਸ਼ਟਰੀ ਸੜਕ ਸੁਰੱਖਿਆ OS",
    headlineLeft: "ਖਤਰੇ ਦਾ ਅਨੁਮਾਨ ਲਗਾਓ.",
    headlineCenter: "ਹਾਦਸਿਆਂ ਨੂੰ ਰੋਕੋ.",
    headlineRight: "ਜਾਨਾਂ ਬਚਾਓ.",
    subheadline: "ਭਾਰਤ ਦਾ ਪਹਿਲਾ AI-ਸੰਚਾਲਿਤ ਰਾਸ਼ਟਰੀ ਸੜਕ ਸੁਰੱਖਿਆ ਓਪਰੇਟਿੰਗ ਸਿਸਟਮ. ਜਾਨਾਂ ਬਚਾਉਣ ਲਈ ਡ੍ਰਾਈਵਲੀਗਲ, ਰੋਡਵਾਚ ਅਤੇ ਰੋਡSOS ਨੂੰ ਜੋੜਦਾ ਹੈ."
  },
  Malayalam: {
    home: "ഹോം",
    drivelegal: "ഡ്രൈവ് ലീഗൽ AI",
    roadwatch: "റോഡ് വാച്ച് AI",
    roadsos: "റോഡ് SOS AI",
    radar: "ഡിജിറ്റൽ ട്വിൻ മാപ്പ്",
    guardian: "ഡ്രൈവർ ഗാർഡിയൻ",
    analytics: "അനലിറ്റിക്സ്",
    aiguardian: "AI ഗാർഡിയൻ",
    nationalRoadSafetyOS: "ദേശീയ റോഡ് സുരക്ഷാ ഒ.എസ്",
    headlineLeft: "അപകടസാധ്യത പ്രവചിക്കുക.",
    headlineCenter: "അപകടങ്ങൾ തടയുക.",
    headlineRight: "ജീവനുകൾ രക്ഷിക്കുക.",
    subheadline: "ഇന്ത്യയുടെ AI-അധിഷ്ഠിത റോഡ് സുരക്ഷാ ഓപ്പറേറ്റിംഗ് സിസ്റ്റം. ജീവൻ രക്ഷിക്കാൻ ഡ്രൈവ് ലീഗൽ, റോഡ് വാച്ച്, റോഡ് SOS എന്നിവയെ സംയോജിപ്പിക്കുന്നു."
  }
};

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Delhi: { lat: 28.7041, lng: 77.1025 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
};

const CITIES_ANALYTICS: Record<string, {
  name: string;
  safetyScore: number;
  roadQuality: { good: number; fair: number; poor: number };
  trafficRisk: string;
  accidentTrend: string;
  responseTimes: { pre: number; post: number };
  congestionPeaks: { morning: number; midday: number; evening: number };
}> = {
  Nagpur: {
    name: 'Nagpur District',
    safetyScore: 82,
    roadQuality: { good: 70, fair: 20, poor: 10 },
    trafficRisk: 'Low-Moderate',
    accidentTrend: "M 10 150 Q 125 120 250 90 T 490 40",
    responseTimes: { pre: 24.5, post: 7.8 },
    congestionPeaks: { morning: 65, midday: 34, evening: 82 }
  },
  Mumbai: {
    name: 'Mumbai Metro',
    safetyScore: 64,
    roadQuality: { good: 40, fair: 35, poor: 25 },
    trafficRisk: 'Heavy Congestion',
    accidentTrend: "M 10 180 Q 125 150 250 170 T 490 110",
    responseTimes: { pre: 32.1, post: 11.2 },
    congestionPeaks: { morning: 88, midday: 55, evening: 94 }
  },
  Pune: {
    name: 'Pune District',
    safetyScore: 79,
    roadQuality: { good: 60, fair: 28, poor: 12 },
    trafficRisk: 'Moderate',
    accidentTrend: "M 10 140 Q 125 110 250 100 T 490 48",
    responseTimes: { pre: 22.8, post: 8.1 },
    congestionPeaks: { morning: 72, midday: 40, evening: 78 }
  },
  Delhi: {
    name: 'Delhi NCR',
    safetyScore: 59,
    roadQuality: { good: 50, fair: 30, poor: 20 },
    trafficRisk: 'Severe Flow',
    accidentTrend: "M 10 190 Q 125 180 250 160 T 490 120",
    responseTimes: { pre: 35.4, post: 13.5 },
    congestionPeaks: { morning: 92, midday: 60, evening: 95 }
  },
  Hyderabad: {
    name: 'Hyderabad Metro',
    safetyScore: 77,
    roadQuality: { good: 65, fair: 23, poor: 12 },
    trafficRisk: 'Moderate',
    accidentTrend: "M 10 130 Q 125 120 250 85 T 490 52",
    responseTimes: { pre: 21.0, post: 6.9 },
    congestionPeaks: { morning: 68, midday: 38, evening: 74 }
  },
  Bangalore: {
    name: 'Bangalore South',
    safetyScore: 68,
    roadQuality: { good: 45, fair: 30, poor: 25 },
    trafficRisk: 'Severe Congestion',
    accidentTrend: "M 10 170 Q 125 140 250 150 T 490 95",
    responseTimes: { pre: 30.5, post: 10.8 },
    congestionPeaks: { morning: 85, midday: 50, evening: 90 }
  },
  Chennai: {
    name: 'Chennai City',
    safetyScore: 75,
    roadQuality: { good: 58, fair: 32, poor: 10 },
    trafficRisk: 'Moderate',
    accidentTrend: "M 10 150 Q 125 100 250 95 T 490 60",
    responseTimes: { pre: 25.0, post: 8.5 },
    congestionPeaks: { morning: 70, midday: 36, evening: 80 }
  },
  Ahmedabad: {
    name: 'Ahmedabad City',
    safetyScore: 80,
    roadQuality: { good: 68, fair: 22, poor: 10 },
    trafficRisk: 'Low-Moderate',
    accidentTrend: "M 10 120 Q 125 90 250 80 T 490 45",
    responseTimes: { pre: 20.2, post: 7.0 },
    congestionPeaks: { morning: 60, midday: 30, evening: 75 }
  },
  Kolkata: {
    name: 'Kolkata Metro',
    safetyScore: 62,
    roadQuality: { good: 42, fair: 38, poor: 20 },
    trafficRisk: 'Heavy Congestion',
    accidentTrend: "M 10 175 Q 125 160 250 145 T 490 105",
    responseTimes: { pre: 28.9, post: 10.2 },
    congestionPeaks: { morning: 80, midday: 48, evening: 85 }
  },
  Jaipur: {
    name: 'Jaipur City',
    safetyScore: 74,
    roadQuality: { good: 55, fair: 30, poor: 15 },
    trafficRisk: 'Moderate',
    accidentTrend: "M 10 145 Q 125 115 250 105 T 490 58",
    responseTimes: { pre: 24.0, post: 8.2 },
    congestionPeaks: { morning: 67, midday: 35, evening: 77 }
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'drivelegal' | 'roadwatch' | 'roadsos' | 'radar' | 'guardian' | 'analytics' | 'aiguardian'>('home');
  const [voiceEnabled] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Hindi' | 'Marathi' | 'Tamil' | 'Telugu' | 'Kannada' | 'Bengali' | 'Gujarati' | 'Punjabi' | 'Malayalam'>(() => (localStorage.getItem('raasta_language') as any) || 'English');

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

  const [riskScore, setRiskScore] = useState(8);
  const [classification, setClassification] = useState<'Safe' | 'Warning' | 'Critical'>('Safe');
  const [riskExplanation, setRiskExplanation] = useState('System calibrating. Drive safe.');

  // Digital Twin Map States
  const [mapLayer, setMapLayer] = useState<'standard' | 'traffic' | 'heatmap'>('standard');
  const [selectedRouteKey, setSelectedRouteKey] = useState<'safest' | 'fastest' | 'eco' | 'emergency'>('safest');

  // Emergency SOS State (RoadSOS AI - Golden Hour Rescue Engine)
  const [sosActive, setSosActive] = useState(false);
  const [sosCoords, setSosCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sosTimestamp, setSosTimestamp] = useState<string | null>(null);
  const [goldenHourTime, setGoldenHourTime] = useState(3600); // 1 hour countdown

  // RoadWatch AI State
  const [reportedIssues, setReportedIssues] = useState<any[]>(MOCK_INCIDENTS);
  const [selectedAnomalyType, setSelectedAnomalyType] = useState<'Pothole' | 'Waterlogging' | 'Broken Signal' | 'Streetlight Failure' | 'Accident Damage' | 'Road Crack' | 'Obstruction' | 'Garbage Hazard' | 'Road Construction Issue'>('Pothole');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLocation, setReportLocation] = useState('Sector 4 Outer Loop');
  const [reportLatitude, setReportLatitude] = useState(12.9915);
  const [reportLongitude, setReportLongitude] = useState(80.2336);
  const [isAnalyzingAnomaly, setIsAnalyzingAnomaly] = useState(false);
  const [, setAnalyzedResult] = useState<any>(null);

  // DriveLegal AI States
  const [selectedViolations, setSelectedViolations] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<'Maharashtra' | 'Delhi' | 'Karnataka' | 'Tamil Nadu'>('Maharashtra');
  const [signScanResult, setSignScanResult] = useState<any>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [comparedFinesVisible, setComparedFinesVisible] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<'green' | 'yellow' | 'red' | null>(null);
  const [ownedDocs, setOwnedDocs] = useState<string[]>(['DL', 'RC', 'Insurance', 'PUC']);
  const [aiExplainerResult, setAiExplainerResult] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [analyticsView, setAnalyticsView] = useState<'city' | 'state'>('city');
  const [analyticsMetric, setAnalyticsMetric] = useState<'safety' | 'accidents' | 'quality' | 'congestion' | 'response'>('safety');
  const [analyticsCity, setAnalyticsCity] = useState<string>('Nagpur');

  // Road Safety Index Card States
  const [selectedCity, setSelectedCity] = useState('Nagpur');
  const [cityIndexData, setCityIndexData] = useState<any>({
    score: 82,
    traffic: 'Moderate',
    weather: 'Optimal (Clear)',
    roads: 'Good (Asphalt)',
    readiness: 'High (3 Trauma hubs active)',
    recommendation: 'Traffic flow steady. Wardha road corridor fully clear.'
  });
  const [, setIsSearchingCity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // General Chatbot / Speech States
  const [chatOpen, setChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'system', text: string }>>([
    { sender: 'system', text: 'Hello! I am Raasta AI Guardian. Ask me about state laws, fine calculations, first-aid tips, or emergency protocols. Drive safe!' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Judge Impact metrics state
  const [metrics, setMetrics] = useState({
    livesProtected: 1424,
    hazardsReported: 348,
    emergencyAssisted: 96,
    issuesResolved: 242,
    saferRoutes: 4812
  });

  const lastSpokenMessage = useRef<string>('');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(CITY_COORDINATES.Nagpur);
  const defaultCoords = mapCenter;

  // Sync safety cockpit risk score via backend API
  useEffect(() => {
    const fetchRiskScore = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/predict-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            speed,
            weather,
            roadCondition,
            timeOfDay: 'Day',
            visibility,
            laneDiscipline,
            seatbeltStatus,
            phoneUsage,
            fatigue,
            isOffline,
            language: selectedLanguage
          })
        });
        const data = await response.json();
        setRiskScore(data.riskScore);
        setClassification(data.riskCategory);
        setRiskExplanation(data.explanation);
      } catch (e) {
        // Deterministic client fallback if backend is unreachable
        let base = 10;
        if (speed > 80) base += 35;
        if (phoneUsage) base += 25;
        if (fatigue) base += 22;
        if (weather === 'Rainy') base += 15;
        if (roadCondition === 'Severe Potholes') base += 18;
        if (seatbeltStatus === 'Unbuckled') base += 15;
        
        const scoreVal = Math.min(100, base);
        setRiskScore(scoreVal);
        setClassification(scoreVal > 75 ? 'Critical' : scoreVal > 35 ? 'Warning' : 'Safe');
        setRiskExplanation('Local Deterministic Backup: Caution values aligned.');
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchRiskScore();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [speed, phoneUsage, fatigue, weather, roadCondition, visibility, laneDiscipline, seatbeltStatus, isOffline]);

  // Sync Road Safety Index Card based on selected city
  useEffect(() => {
    if (CITY_COORDINATES[selectedCity]) {
      setMapCenter(CITY_COORDINATES[selectedCity]);
    }
    const fetchCityIndex = async () => {
      setIsSearchingCity(true);
      try {
        const response = await fetch('http://localhost:8080/api/road-safety-index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: selectedCity, isOffline, language: selectedLanguage })
        });
        const data = await response.json();
        setCityIndexData({
          score: data.safetyScore,
          traffic: data.trafficRisk,
          weather: data.weatherRisk,
          roads: data.roadCondition,
          readiness: data.emergencyReadiness,
          recommendation: data.recommendation
        });
      } catch (e) {
        // Fallback
        const mocks: any = {
          'nagpur': { score: 82, traffic: 'Moderate', weather: 'Optimal', roads: 'Fair', readiness: 'High', recommendation: 'Safe corridors active.' },
          'mumbai': { score: 64, traffic: 'Heavy', weather: 'Precipitation', roads: 'Potholes', readiness: 'Good', recommendation: 'Alternative routes active.' }
        };
        setCityIndexData(mocks[selectedCity.toLowerCase()] || mocks['nagpur']);
      } finally {
        setIsSearchingCity(false);
      }
    };
    fetchCityIndex();
  }, [selectedCity, isOffline]);

  // Text-To-Speech Safety Alerts
  const triggerVoiceSpeech = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langCodes: Record<string, string> = {
      'English': 'en-IN',
      'Hindi': 'hi-IN',
      'Tamil': 'ta-IN',
      'Telugu': 'te-IN',
      'Kannada': 'kn-IN',
      'Marathi': 'mr-IN',
      'Bengali': 'bn-IN',
      'Gujarati': 'gu-IN',
      'Punjabi': 'pa-IN',
      'Malayalam': 'ml-IN'
    };
    utterance.lang = langCodes[selectedLanguage] || 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    lastSpokenMessage.current = text;
  };

  // Cockpit warning audio dispatcher
  useEffect(() => {
    if (classification === 'Critical') {
      const alertMsg = "Critical risk detected. Overspeeding or distraction telemetry high. Reduce speed.";
      if (lastSpokenMessage.current !== alertMsg) {
        triggerVoiceSpeech(alertMsg);
      }
    }
  }, [classification]);

  // Golden hour SOS timer ticking down
  useEffect(() => {
    if (!sosActive) return;
    const interval = setInterval(() => {
      setGoldenHourTime((prev) => {
        if (prev <= 1) {
          triggerVoiceSpeech("Warning: Emergency golden hour recovery window closed.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sosActive]);

  const formatGoldenHourTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Trigger Emergency Mode SOS
  const triggerSOS = () => {
    setSosActive(true);
    setSosTimestamp(new Date().toLocaleTimeString());
    setGoldenHourTime(3600); // 1 hour
    setMetrics(prev => ({ ...prev, emergencyAssisted: prev.emergencyAssisted + 1 }));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setSosCoords(coords);
          setMapCenter(coords);
        },
        () => {
          setSosCoords(defaultCoords);
          setMapCenter(defaultCoords);
        }
      );
    } else {
      setSosCoords(defaultCoords);
      setMapCenter(defaultCoords);
    }
    triggerVoiceSpeech("SOS Alert Broadcasted. Golden Hour Rescue Engine active. Transmitting GPS coordinates to Municipal and Ambulance hubs.");
  };

  // Submit RoadWatch Report
  const handleRoadWatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzingAnomaly(true);
    try {
      const response = await fetch('http://localhost:8080/api/roadwatch/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedAnomalyType,
          description: reportDescription || `Identified severe ${selectedAnomalyType} on lane surface`,
          location: reportLocation,
          latitude: reportLatitude,
          longitude: reportLongitude,
          isOffline,
          language: selectedLanguage
        })
      });
      const data = await response.json();
      setAnalyzedResult(data);

      // Add to local list of reports
      const newReport = {
        id: data.trackingId,
        type: selectedAnomalyType.toLowerCase(),
        description: data.summary,
        location: reportLocation,
        latitude: reportLatitude,
        longitude: reportLongitude,
        severity: data.priority,
        status: data.status,
        authority: data.authority,
        resolution: data.expectedResolution,
        actionAdvice: data.actionAdvice
      };
      setReportedIssues(prev => [newReport, ...prev]);
      setMetrics(prev => ({ ...prev, hazardsReported: prev.hazardsReported + 1 }));
      triggerVoiceSpeech(`Road Watch report submitted. Ticket generated with Tracking ID ${data.trackingId}. Routed to ${data.authority}.`);
    } catch (e) {
      alert("Offline simulation logic routing complete.");
    } finally {
      setIsAnalyzingAnomaly(false);
    }
  };

  // Transition Ticket Lifecycle Status (Demo capability)
  const transitionReportStatus = (id: string, nextStatus: string) => {
    setReportedIssues(prev => prev.map(issue => {
      if (issue.id === id) {
        if (nextStatus === 'Resolved') {
          setMetrics(m => ({ ...m, issuesResolved: m.issuesResolved + 1 }));
        }
        return { ...issue, status: nextStatus };
      }
      return issue;
    }));
  };

  // Click Map coordinate receiver
  const handleMapCoordSelect = (lat: number, lng: number) => {
    setReportLatitude(lat);
    setReportLongitude(lng);
    setReportLocation(`Custom Map Lock (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    triggerVoiceSpeech(`Location coordinates locked at Latitude ${lat.toFixed(3)}.`);
  };

  // Send Chat message
  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim()) return;
    const userMsg = { sender: 'user' as const, text: msgText };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          isOffline,
          history: [],
          language: selectedLanguage
        })
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { sender: 'system', text: data.text }]);
      triggerVoiceSpeech(data.text);
    } catch (e) {
      setChatHistory(prev => [...prev, { sender: 'system', text: 'Error communicating with central AI core. Try enabling offline resilience mode.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleExplainInSimpleLanguage = async () => {
    setIsExplaining(true);
    setAiExplainerResult('Generating simplified road law context...');
    try {
      const missing = ['DL', 'RC', 'Insurance', 'PUC', 'RoadTax'].filter(d => !ownedDocs.includes(d));
      const prompt = `Explain in simple, layperson language (and translate or adapt to the language: ${selectedLanguage}):
What are the consequences of driving in state ${selectedState} with violations: ${selectedViolations.join(', ') || 'None selected'}.
Also, I am missing these vehicle documents: ${missing.join(', ') || 'None, all documents verified'}.
Keep it concise, supportive, and list the exact steps to comply.`;
      
      const response = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          isOffline,
          history: [],
          language: selectedLanguage
        })
      });
      const data = await response.json();
      setAiExplainerResult(data.text);
      triggerVoiceSpeech("AI legal audit explanation complete.");
    } catch (e) {
      setAiExplainerResult('Error contacting Raasta Legal AI. Please check server connections.');
    } finally {
      setIsExplaining(false);
    }
  };

  // Voice recognition commands interpreter (Phase 9)
  const handleVoiceAssistantStart = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerVoiceSpeech("Speech recognition is not supported in this browser. Please type your query.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    
    const langCodes: Record<string, string> = {
      'English': 'en-IN',
      'Hindi': 'hi-IN',
      'Tamil': 'ta-IN',
      'Telugu': 'te-IN',
      'Kannada': 'kn-IN',
      'Marathi': 'mr-IN',
      'Bengali': 'bn-IN',
      'Gujarati': 'gu-IN',
      'Punjabi': 'pa-IN',
      'Malayalam': 'ml-IN'
    };
    
    recognition.lang = langCodes[selectedLanguage] || 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      triggerVoiceSpeech("Speech engine active. Speak your command.");
    };

    recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript.toLowerCase();
      setIsListening(false);
      
      // Dispatch Command Deterministically
      if (speechText.includes('hospital') || speechText.includes('medical') || speechText.includes('find nearest')) {
        setActiveTab('roadsos');
        triggerSOS();
      } else if (speechText.includes('navigate home') || speechText.includes('safest route')) {
        setActiveTab('radar');
        setSelectedRouteKey('safest');
        triggerVoiceSpeech("Routing to home destination. Safest route selected on map. Speed warning threshold active.");
      } else if (speechText.includes('report accident') || speechText.includes('roadwatch')) {
        setActiveTab('roadwatch');
        setSelectedAnomalyType('Accident Damage');
        triggerVoiceSpeech("Opening RoadWatch incident center. Please confirm accident details.");
      } else if (speechText.includes('quiz') || speechText.includes('test rule')) {
        setActiveTab('drivelegal');
        triggerVoiceSpeech("Opening daily traffic safety quiz dashboard.");
      } else {
        // Fall back to general chatbot inquiry
        handleSendMessage(speechText);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      triggerVoiceSpeech("Voice input failed. Please speak clearly.");
    };

    recognition.start();
  };

  // Fine penalty estimator rules
  const VIOLATIONS_DB = [
    { key: "overspeeding", label: "Overspeeding (Section 183)", baseFine: 2000 },
    { key: "drunk_driving", label: "Drunk Driving (Section 185)", baseFine: 10000 },
    { key: "signal_jumping", label: "Red Light Jumping (Section 184)", baseFine: 5000 },
    { key: "no_helmet", label: "No Helmet (Section 129)", baseFine: 1000 },
    { key: "mobile_usage", label: "Mobile Phone Usage (Section 184)", baseFine: 5000 },
    { key: "no_seatbelt", label: "No Seatbelt (Section 138)", baseFine: 1000 }
  ];

  const getStateMultiplier = () => {
    switch (selectedState) {
      case 'Delhi': return 1.2;
      case 'Tamil Nadu': return 1.1;
      case 'Karnataka': return 1.15;
      default: return 1.0; // Maharashtra standard
    }
  };

  const calculateTotalFines = () => {
    const multiplier = getStateMultiplier();
    const sum = selectedViolations.reduce((acc, vKey) => {
      const item = VIOLATIONS_DB.find(item => item.key === vKey);
      return acc + (item ? item.baseFine : 0);
    }, 0);
    return Math.round(sum * multiplier);
  };

  // Road sign recognition simulated scan
  const scanRoadSign = (sign: any) => {
    setSignScanResult(null);
    triggerVoiceSpeech(`Scanning visual sign signature for ${sign.name}.`);
    setTimeout(() => {
      setSignScanResult(sign);
    }, 500);
  };

  // Quiz helper
  const handleQuizAnswerSelect = (optIdx: number) => {
    setQuizSelected(optIdx);
    setQuizAnswered(true);
    if (optIdx === QUIZ_QUESTIONS[quizIndex].answer) {
      setQuizScore(prev => prev + 1);
      triggerVoiceSpeech("Correct answer! Compliance index increased.");
    } else {
      triggerVoiceSpeech("Incorrect choice. Please review the explanation.");
    }
  };

  const nextQuizQuestion = () => {
    setQuizSelected(null);
    setQuizAnswered(false);
    setQuizIndex((prev) => (prev + 1) % QUIZ_QUESTIONS.length);
  };

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

  const getAIRecommendations = () => {
    const recs: string[] = [];
    if (phoneUsage) recs.push("Put away mobile device.");
    if (fatigue) recs.push("Driver micro-sleeps detected. Stop to rest.");
    if (speed > 80) recs.push("Kinetic risk high. Reduce speed to safe limits.");
    if (seatbeltStatus === 'Unbuckled') recs.push("Buckle seatbelt immediately.");
    if (laneDiscipline === 'Erratic') recs.push("Maintain lane discipline.");
    if (weather === 'Rainy') recs.push("Asphalt slick. Maintain double follow gap.");
    if (recs.length === 0) recs.push("Telemetry parameters normal.");
    return recs;
  };
  const recommendations = getAIRecommendations();

  return (
    <div className="min-h-screen bg-[#070913] text-[#e2e8f0] bg-road-grid font-sans relative pb-20 overflow-x-hidden">
      
      {/* Visual neon gradients */}
      <div className="absolute top-[5%] left-[10%] w-[500px] h-[500px] rounded-full bg-sky-500/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[5%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />

      {/* Header Panel */}
      <header className="sticky top-0 z-[1000] bg-[#070913]/90 backdrop-blur-xl border-b border-slate-900/80 px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Branding Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-sky-550 to-indigo-550 flex items-center justify-center shadow-lg shadow-sky-500/10">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                RAASTASENSE AI
              </span>
            </div>
            <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">{TRANSLATIONS[selectedLanguage]?.nationalRoadSafetyOS || "National Road Safety OS"}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap items-center justify-center bg-slate-950/80 border border-slate-900 p-1 rounded-2xl gap-0.5">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition ${activeTab === 'home' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            {TRANSLATIONS[selectedLanguage]?.home || 'Home'}
          </button>
          <button
            onClick={() => setActiveTab('drivelegal')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition ${activeTab === 'drivelegal' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            {TRANSLATIONS[selectedLanguage]?.drivelegal || 'DriveLegal AI'}
          </button>
          <button
            onClick={() => setActiveTab('roadwatch')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition ${activeTab === 'roadwatch' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            {TRANSLATIONS[selectedLanguage]?.roadwatch || 'RoadWatch AI'}
          </button>
          <button
            onClick={() => setActiveTab('roadsos')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition ${activeTab === 'roadsos' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold text-rose-450' : 'text-slate-400 hover:text-white'}`}
          >
            {TRANSLATIONS[selectedLanguage]?.roadsos || 'RoadSOS AI'}
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition ${activeTab === 'radar' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            {TRANSLATIONS[selectedLanguage]?.radar || 'Digital Twin Map'}
          </button>
          <button
            onClick={() => setActiveTab('guardian')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition ${activeTab === 'guardian' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            {TRANSLATIONS[selectedLanguage]?.guardian || 'Driver Guardian'}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition ${activeTab === 'analytics' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            {TRANSLATIONS[selectedLanguage]?.analytics || 'Analytics'}
          </button>
          <button
            onClick={() => setActiveTab('aiguardian')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition ${activeTab === 'aiguardian' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            {TRANSLATIONS[selectedLanguage]?.aiguardian || 'AI Guardian'}
          </button>
        </nav>

        {/* Global Controls & Resilient Offline Toggle */}
        <div className="flex items-center space-x-3">
          {/* Multilingual Selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => {
              const val = e.target.value as any;
              setSelectedLanguage(val);
              localStorage.setItem('raasta_language', val);
              triggerVoiceSpeech(`Language changed to ${val}`);
            }}
            className="bg-slate-950 border border-slate-900 text-[10px] font-black text-slate-350 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-sky-500/50"
          >
            <option value="English">🇮🇳 English</option>
            <option value="Hindi">🇮🇳 हिन्दी (Hindi)</option>
            <option value="Marathi">🇮🇳 मराठी (Marathi)</option>
            <option value="Tamil">🇮🇳 தமிழ் (Tamil)</option>
            <option value="Telugu">🇮🇳 తెలుగు (Telugu)</option>
            <option value="Kannada">🇮🇳 ಕನ್ನಡ (Kannada)</option>
            <option value="Bengali">🇮🇳 বাংলা (Bengali)</option>
            <option value="Gujarati">🇮🇳 ગુજરાતી (Gujarati)</option>
            <option value="Punjabi">🇮🇳 ਪੰਜਾਬੀ (Punjabi)</option>
            <option value="Malayalam">🇮🇳 മലയാളம் (Malayalam)</option>
          </select>

          {/* Simulated Offline Mode Button */}
          <button
            onClick={() => {
              setIsOffline(!isOffline);
              triggerVoiceSpeech(isOffline ? "Online safety telemetry restored." : "Internet disconnected. Offline resilience safety engine active.");
            }}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-black tracking-wider uppercase transition ${
              isOffline 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-glow-gold' 
                : 'bg-slate-955 border-slate-900 text-slate-400 hover:text-white'
            }`}
            title="Toggle to simulate complete cellular offline state"
          >
            {isOffline ? "📴 Simulated Offline Active" : "📶 Simulated Online"}
          </button>

          {/* Voice Command Activate */}
          <div className="relative flex items-center">
            {isListening && (
              <div className="absolute right-12 flex items-center space-x-0.5 bg-slate-950/90 border border-rose-500/20 px-2 py-1.5 rounded-xl mr-1.5 animate-pulse z-50">
                <span className="w-1 h-3 bg-rose-500 rounded-full animate-pulse" />
                <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce" />
                <span className="w-1 h-2 bg-rose-500 rounded-full animate-pulse" />
                <span className="w-1 h-5 bg-rose-500 rounded-full animate-bounce" />
                <span className="w-1 h-3 bg-rose-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-rose-500 ml-1.5 uppercase tracking-wider">Listening</span>
              </div>
            )}
            <button
              onClick={handleVoiceAssistantStart}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition ${
                isListening 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-glow-red' 
                  : 'bg-slate-950 border-slate-900 text-slate-450 hover:text-sky-400'
              }`}
              title="Start voice control listener"
            >
              {isListening ? <Activity className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* SOS Trigger Beacon */}
          <button
            onClick={triggerSOS}
            className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg border border-rose-500/20 animate-pulse transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>SOS SIGNAL</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {activeTab === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* 1. HERO SECTION WITH ANIMATED SMART HIGHWAY */}
            <div className="relative overflow-hidden rounded-[32px] bg-[#090d20] border border-slate-900 px-8 py-12 lg:py-20 text-center flex flex-col items-center justify-center">
              {/* Dynamic Road Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />
              <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

              {/* Animated Smart Highway Graphic (Wow Factor) */}
              <div className="w-full max-w-4xl h-48 relative overflow-hidden rounded-2xl bg-slate-950/80 border border-slate-900 mb-8 flex flex-col justify-end">
                <div className="absolute top-4 left-4 z-10 text-left">
                  <span className="text-[9px] text-sky-400 font-black tracking-widest uppercase flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-450 mr-1.5 animate-ping" />
                    Live Smart Highway Traffic Simulation
                  </span>
                </div>
                {/* Simulated Grid Lines */}
                <div className="absolute inset-0 opacity-15" style={{
                  backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }} />
                
                {/* SVG Highway Layout */}
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Perspective Highway Lines */}
                  <path d="M 100 192 L 350 48 M 700 192 L 450 48" stroke="#1e293b" strokeWidth="3" />
                  <path d="M 200 192 L 370 48 M 600 192 L 430 48" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                  <path d="M 400 192 L 400 48" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="12 12" className="animate-[dash_8s_linear_infinite]" />
                  
                  {/* Light Trails (Green safe, Blue traffic flow, Red emergency alert) */}
                  <g className="opacity-80">
                    {/* Safe Vehicle 1 */}
                    <circle r="4" fill="#10b981" className="animate-[moveVehicle1_6s_linear_infinite]">
                      <animateMotion dur="6s" repeatCount="indefinite" path="M 120 180 L 360 52" />
                    </circle>
                    {/* Safe Vehicle 2 */}
                    <circle r="3.5" fill="#38bdf8" className="animate-[moveVehicle2_4s_linear_infinite]">
                      <animateMotion dur="4s" repeatCount="indefinite" path="M 220 170 L 380 50" />
                    </circle>
                    {/* Emergency Pulsing Signal */}
                    <circle r="6" fill="#ef4444" className="animate-pulse">
                      <animateMotion dur="5s" repeatCount="indefinite" path="M 580 180 L 420 52" />
                    </circle>
                  </g>
                </svg>
                {/* City Horizon Line */}
                <div className="w-full h-1 bg-slate-900" />
              </div>

              {/* Headline */}
              <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-white max-w-3xl leading-[1.1] mb-4">
                {TRANSLATIONS[selectedLanguage]?.headlineLeft || "Predict Risk."} <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">{TRANSLATIONS[selectedLanguage]?.headlineCenter || "Prevent Accidents."}</span> {TRANSLATIONS[selectedLanguage]?.headlineRight || "Protect Lives."}
              </h1>
              
              {/* Subheadline */}
              <p className="text-sm lg:text-base text-slate-400 max-w-2xl leading-relaxed mb-6">
                {TRANSLATIONS[selectedLanguage]?.subheadline || "India's AI-Powered National Road Safety Operating System. Integrates DriveLegal Compliance, RoadWatch Citizen Diagnostics, and RoadSOS Rescue Systems to save lives on every journey."}
              </p>

              {/* AI Search Bar */}
              <div className="relative max-w-xl w-full mx-auto mb-8">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Ask Raasta AI Guardian anything about road safety rules, accident rescue, or fines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setChatOpen(true);
                      handleSendMessage(searchQuery);
                      setSearchQuery('');
                    }
                  }}
                  className="w-full bg-slate-950/80 border border-slate-900 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-sky-500/50 shadow-2xl text-slate-100 placeholder-slate-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setActiveTab('guardian');
                    triggerVoiceSpeech("Launching real-time driver cockpit simulator.");
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl transition"
                >
                  🚀 Start Safe Journey
                </button>
                <button
                  onClick={() => {
                    setActiveTab('roadsos');
                    triggerSOS();
                  }}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm rounded-2xl shadow-xl border border-rose-500/30 animate-pulse transition"
                >
                  🚨 Emergency SOS
                </button>
                <button
                  onClick={() => {
                    setChatOpen(true);
                    triggerVoiceSpeech("Raasta Guardian Chat Core initialized.");
                  }}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-850 text-sky-400 font-black text-sm rounded-2xl border border-slate-800 transition"
                >
                  💬 Ask AI Guardian
                </button>
                <button
                  onClick={() => {
                    setActiveTab('radar');
                    triggerVoiceSpeech("Exploring the local safety digital twin map layers.");
                  }}
                  className="px-6 py-3 bg-slate-950 hover:bg-slate-900 text-slate-300 font-black text-sm rounded-2xl border border-slate-900 transition"
                >
                  🗺️ Explore Safety Map
                </button>
              </div>
            </div>

            {/* 2. INTERACTIVE TRAFFIC SIGNAL HUD */}
            <section className="space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <h2 className="text-xl font-black uppercase tracking-widest text-slate-200">Interactive Safety Signals</h2>
                <p className="text-xs text-slate-500 mt-1">Select a glowing traffic signal beacon to query the AI safety engine recommendations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Green Signal */}
                <div 
                  onClick={() => {
                    setSelectedSignal('green');
                    triggerVoiceSpeech("Signal: Green. Safe transit corridor active. Normal speeds allowed. Safety index verified optimal.");
                  }}
                  className={`cursor-pointer group glass-panel rounded-3xl p-6 border transition-all duration-300 ${
                    selectedSignal === 'green' ? 'border-emerald-500/40 bg-emerald-500/5 shadow-glow-green scale-102' : 'border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25">
                      <span className="w-4 h-4 rounded-full bg-emerald-450 animate-pulse shadow-glow-green" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-200 text-sm group-hover:text-emerald-400 transition">GREEN SIGNAL</h3>
                      <p className="text-xs text-slate-500 font-bold">Safe Route Available</p>
                    </div>
                  </div>
                </div>

                {/* Yellow Signal */}
                <div 
                  onClick={() => {
                    setSelectedSignal('yellow');
                    triggerVoiceSpeech("Signal: Yellow. Moderate risk ahead. Minor weather deterioration or road works detected. Reduce speeds by 15%.");
                  }}
                  className={`cursor-pointer group glass-panel rounded-3xl p-6 border transition-all duration-300 ${
                    selectedSignal === 'yellow' ? 'border-amber-500/40 bg-amber-500/5 shadow-glow-gold scale-102' : 'border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/25">
                      <span className="w-4 h-4 rounded-full bg-amber-450 animate-pulse shadow-glow-gold" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-200 text-sm group-hover:text-amber-400 transition">YELLOW SIGNAL</h3>
                      <p className="text-xs text-slate-500 font-bold">Moderate Risk Warning</p>
                    </div>
                  </div>
                </div>

                {/* Red Signal */}
                <div 
                  onClick={() => {
                    setSelectedSignal('red');
                    triggerVoiceSpeech("Signal: Red. Emergency high risk zone. Heavy collision report or severe waterlogging. Auto bypass routing active.");
                  }}
                  className={`cursor-pointer group glass-panel rounded-3xl p-6 border transition-all duration-300 ${
                    selectedSignal === 'red' ? 'border-rose-500/40 bg-rose-500/5 shadow-glow-red scale-102' : 'border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/25">
                      <span className="w-4 h-4 rounded-full bg-rose-500 animate-pulse shadow-glow-red" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-200 text-sm group-hover:text-rose-500 transition">RED SIGNAL</h3>
                      <p className="text-xs text-slate-500 font-bold">Emergency / High Risk Zone</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Click-to-explain Detail Panel */}
              {selectedSignal && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-900 flex items-start space-x-4"
                >
                  <div className="text-xl">💡</div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">
                      AI Signal Diagnostic Analysis ({selectedSignal.toUpperCase()})
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {selectedSignal === 'green' && "The selected route is verified for direct transit. Real-time digital twin maps show dry pavements, clear visibility (>90%), and normal emergency hospital response vectors (under 12 minutes). Compliance status optimal."}
                      {selectedSignal === 'yellow' && "Caution advised. Moderate risk index triggered due to minor congestion or waterlogged patches. Pavement friction is degraded. AI Recommendation: Maintain double the standard vehicle-following distance."}
                      {selectedSignal === 'red' && "High-risk accident hotspot or severe blockage detected. System has flagged this corridor for automatic rerouting. Ensure seatbelt and helmet compliance is locked. Emergency response vehicles have been pre-dispatched to standby stations."}
                    </p>
                  </div>
                </motion.div>
              )}
            </section>

            {/* 3. ROAD SAFETY IMPACT SECTION */}
            <section className="bg-slate-900/30 border border-slate-900 rounded-[32px] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-slate-200 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-sky-400 animate-pulse" />
                    National Road Safety Impact Cockpit
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Real-time statistics demonstrating live system effectiveness and citizen metrics.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-slate-950/70 border border-slate-900/80 p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/20 transition">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Lives Protected</span>
                  <span className="text-3xl font-black font-mono text-white mt-2">{metrics.livesProtected}</span>
                  <span className="text-[9px] text-emerald-450 font-bold mt-1">↑ 12% this week</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-900/80 p-5 rounded-2xl flex flex-col justify-between hover:border-sky-500/20 transition">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Hazards Reported</span>
                  <span className="text-3xl font-black font-mono text-white mt-2">{metrics.hazardsReported}</span>
                  <span className="text-[9px] text-sky-400 font-bold mt-1">Direct citizen entries</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-900/80 p-5 rounded-2xl flex flex-col justify-between hover:border-teal-500/20 transition">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Issues Resolved</span>
                  <span className="text-3xl font-black font-mono text-white mt-2">{metrics.issuesResolved}</span>
                  <span className="text-[9px] text-teal-400 font-bold mt-1">PWD / Municipal actions</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-900/80 p-5 rounded-2xl flex flex-col justify-between hover:border-rose-500/20 transition">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">SOS Responses</span>
                  <span className="text-3xl font-black font-mono text-rose-500 mt-2">{metrics.emergencyAssisted}</span>
                  <span className="text-[9px] text-rose-400 font-bold mt-1">Standby vectors locked</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-900/80 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/20 transition">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Safer Routes</span>
                  <span className="text-3xl font-black font-mono text-white mt-2">{metrics.saferRoutes}</span>
                  <span className="text-[9px] text-indigo-400 font-bold mt-1">Index risk bypassed</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-900/80 p-5 rounded-2xl flex flex-col justify-between hover:border-purple-500/20 transition">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Citizen Reports</span>
                  <span className="text-3xl font-black font-mono text-white mt-2">1,540</span>
                  <span className="text-[9px] text-purple-400 font-bold mt-1">Active processing</span>
                </div>
              </div>
            </section>

            {/* 4. HOW RAASTASENSE SAVES LIVES TIMELINE */}
            <section className="space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <h2 className="text-xl font-black uppercase tracking-widest text-slate-200">How RaastaSense Saves Lives</h2>
                <p className="text-xs text-slate-500 mt-1">The real-time telemetry processing pipeline to mitigate risk and safeguard citizens.</p>
              </div>

              <div className="relative flex flex-col md:flex-row items-stretch justify-between gap-6 md:gap-4 py-4">
                {/* Horizontal Connector Line for Desktop */}
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-900/80 hidden md:block z-0" />

                {/* Step 1 */}
                <div className="flex-1 glass-panel rounded-2xl p-5 border border-slate-900 relative z-10 bg-slate-955 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sm font-black text-sky-400 mb-3 shadow-glow-blue">
                    1
                  </div>
                  <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">Detect Risk</h4>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                    Local vehicle logs and GPS sensors query parameters (speed, fatigue, signs) every 50ms.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex-1 glass-panel rounded-2xl p-5 border border-slate-900 relative z-10 bg-slate-955 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-sm font-black text-teal-400 mb-3 shadow-glow-green">
                    2
                  </div>
                  <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">Analyze Situation</h4>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                    Hybrid safety engines classify severity levels to check for overspeeding or distraction.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="flex-1 glass-panel rounded-2xl p-5 border border-slate-900 relative z-10 bg-slate-955 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-black text-indigo-400 mb-3">
                    3
                  </div>
                  <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">Recommend Route</h4>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                    Safe corridor routing algorithms compute low-friction, pothole-free alternative corridors.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="flex-1 glass-panel rounded-2xl p-5 border border-slate-900 relative z-10 bg-slate-955 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-sm font-black text-rose-500 mb-3 shadow-glow-red animate-pulse">
                    4
                  </div>
                  <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">Emergency Response</h4>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                    Instant SOS locks lat/lng and generates direct trauma routing vectors to nearest hospital.
                  </p>
                </div>

                {/* Step 5 */}
                <div className="flex-1 glass-panel rounded-2xl p-5 border border-slate-900 relative z-10 bg-slate-955 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-black text-emerald-400 mb-3 shadow-glow-green">
                    5
                  </div>
                  <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">Safe Destination</h4>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                    Journey concludes with full compliance log and citizen reports matched for rewards.
                  </p>
                </div>
              </div>
            </section>

            {/* 5. ROAD SAFETY INDEX ranking panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Road Safety Index select panel */}
              <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-slate-900 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div>
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                    <span className="text-[10px] text-sky-400 font-black tracking-widest uppercase flex items-center">
                      <Radio className="w-3.5 h-3.5 mr-2 animate-pulse" />
                      Road Safety Index Engine
                    </span>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="bg-slate-950 border border-slate-900 text-xs font-bold text-slate-350 rounded-lg px-2.5 py-1 focus:outline-none"
                    >
                      <option value="Nagpur">Nagpur District</option>
                      <option value="Mumbai">Mumbai Metro</option>
                      <option value="Pune">Pune District</option>
                      <option value="Delhi">Delhi NCR</option>
                      <option value="Hyderabad">Hyderabad Metro</option>
                      <option value="Bangalore">Bangalore South</option>
                      <option value="Chennai">Chennai City</option>
                      <option value="Ahmedabad">Ahmedabad City</option>
                      <option value="Kolkata">Kolkata Metro</option>
                      <option value="Jaipur">Jaipur City</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-white">{selectedCity} Safety Index</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Active monitoring calculations</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className={`text-4xl font-mono font-black ${cityIndexData.score > 75 ? 'text-emerald-400' : cityIndexData.score > 60 ? 'text-amber-400' : 'text-rose-500'}`}>
                        {cityIndexData.score}
                      </span>
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase mt-[-4px]">Safety Index</span>
                    </div>
                  </div>

                  {/* Indexes List */}
                  <div className="grid grid-cols-2 gap-3.5 mt-6 text-[11px]">
                    <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl flex flex-col justify-between">
                      <span className="text-slate-500 font-bold block uppercase">🌧️ Weather Risk</span>
                      <span className="text-slate-300 font-black mt-1">{cityIndexData.weatherRisk || cityIndexData.weather}</span>
                    </div>
                    <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl flex flex-col justify-between">
                      <span className="text-slate-500 font-bold block uppercase">🚗 Traffic Flow</span>
                      <span className="text-slate-300 font-black mt-1">{cityIndexData.trafficRisk || cityIndexData.traffic}</span>
                    </div>
                    <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl flex flex-col justify-between">
                      <span className="text-slate-500 font-bold block uppercase">🚧 Pavement Condition</span>
                      <span className="text-slate-350 font-black mt-1 truncate">{cityIndexData.roadCondition || cityIndexData.roads}</span>
                    </div>
                    <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl flex flex-col justify-between">
                      <span className="text-slate-500 font-bold block uppercase">🚑 Emergency Readiness</span>
                      <span className="text-slate-350 font-black mt-1 truncate">{cityIndexData.emergencyReadiness || cityIndexData.readiness}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-xs font-bold leading-relaxed text-sky-400">
                  ⚡ AI Recommendation: {cityIndexData.recommendation}
                </div>
              </div>

              {/* City Ranking Leaderboard */}
              <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-slate-900 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                    <span className="text-[10px] text-indigo-400 font-black tracking-widest uppercase flex items-center">
                      <Award className="w-3.5 h-3.5 mr-2" />
                      Leaderboard Metrics
                    </span>
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase">10 Cities</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">🟢 Top Safe Cities</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-slate-950/80 border border-slate-900 p-2.5 rounded-xl text-xs">
                          <span className="font-extrabold text-slate-300">1. Nagpur District</span>
                          <span className="font-mono text-emerald-400 font-black">82 Index</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-950/80 border border-slate-900 p-2.5 rounded-xl text-xs">
                          <span className="font-extrabold text-slate-300">2. Ahmedabad City</span>
                          <span className="font-mono text-emerald-400 font-black">80 Index</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-950/80 border border-slate-900 p-2.5 rounded-xl text-xs">
                          <span className="font-extrabold text-slate-300">3. Pune District</span>
                          <span className="font-mono text-emerald-400 font-black">79 Index</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">🔴 Most Critical Cities</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-slate-950/80 border border-slate-900 p-2.5 rounded-xl text-xs">
                          <span className="font-extrabold text-slate-300">1. Delhi NCR</span>
                          <span className="font-mono text-rose-500 font-black">59 Index</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-950/80 border border-slate-900 p-2.5 rounded-xl text-xs">
                          <span className="font-extrabold text-slate-300">2. Kolkata Metro</span>
                          <span className="font-mono text-rose-500 font-black">62 Index</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-950/80 border border-slate-900 p-2.5 rounded-xl text-xs">
                          <span className="font-extrabold text-slate-300">3. Mumbai Metro</span>
                          <span className="font-mono text-amber-500 font-black">64 Index</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 text-[9px] font-mono text-slate-500 text-right">
                  Scores calculated dynamically based on accidents & weather.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================================================
            TAB: DRIVELEGAL AI (Phase 2 - Legal intelligence)
            ================================================== */}
        {activeTab === 'drivelegal' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="border-b border-slate-900 pb-4">
              <h2 className="text-2xl font-black uppercase tracking-widest text-slate-100">
                DriveLegal AI Dashboard
              </h2>
              <p className="text-slate-500 text-xs mt-1">State-specific fine comparisons, multi-violation estimator, road sign recognition audits, and education quiz modules.</p>
            </div>

            {/* Fine Estimator & State law comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Fine calculator panel */}
              <div className="lg:col-span-5 bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-[10px] text-sky-400 font-black tracking-widest uppercase block mb-4 flex items-center">
                    <Grid className="w-4 h-4 mr-1.5" />
                    Fine Estimator Calculator
                  </span>

                  {/* State selector */}
                  <div className="space-y-1 mb-4">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Select Jurisdiction State</span>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none"
                    >
                      <option value="Maharashtra">Maharashtra (Base rate)</option>
                      <option value="Delhi">Delhi (+20% city surcharge)</option>
                      <option value="Karnataka">Karnataka (+15% state surcharge)</option>
                      <option value="Tamil Nadu">Tamil Nadu (+10% highway rate)</option>
                    </select>
                  </div>

                  {/* Violations checkbox list */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Select Violations Committed</span>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {VIOLATIONS_DB.map((v) => (
                        <label 
                          key={v.key}
                          className="flex items-center space-x-2.5 p-2 bg-slate-950/70 border border-slate-900 rounded-xl hover:border-slate-800 transition cursor-pointer text-xs"
                        >
                          <input 
                            type="checkbox"
                            checked={selectedViolations.includes(v.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedViolations(prev => [...prev, v.key]);
                              } else {
                                setSelectedViolations(prev => prev.filter(item => item !== v.key));
                              }
                            }}
                            className="rounded accent-sky-500 bg-slate-900 border-slate-800 cursor-pointer"
                          />
                          <div className="flex-1 flex justify-between items-center pr-2 font-medium">
                            <span className="text-slate-350">{v.label}</span>
                            <span className="font-mono text-slate-500">₹{v.baseFine}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Formula Breakdown Info */}
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-2xl text-[10px] text-slate-450 leading-relaxed font-mono">
                  <div>🧮 Formula: ∑(Base Fine) × State Coeff + Base Fee</div>
                  <div className="mt-1 text-sky-400">
                    State Coefficient: {selectedState === 'Maharashtra' ? '1.0' : selectedState === 'Delhi' ? '1.2' : selectedState === 'Karnataka' ? '1.15' : '1.1'}
                  </div>
                </div>

                {/* Total Output */}
                <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase">Estimated Penalty Fine</span>
                    <span className="text-2xl font-black font-mono text-amber-500 block mt-0.5">₹{calculateTotalFines()}</span>
                  </div>
                  <button
                    onClick={() => setSelectedViolations([])}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:text-white rounded-lg text-[10px] font-bold tracking-wider uppercase transition"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* State fine comparison grid table & Document Compliance Checklist */}
              <div className="lg:col-span-7 bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                    <span className="text-[10px] text-indigo-400 font-black tracking-widest uppercase flex items-center">
                      <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                      State-by-State Statutory Fine Comparison
                    </span>
                    <button 
                      onClick={() => setComparedFinesVisible(!comparedFinesVisible)}
                      className="text-xs text-slate-455 hover:text-white"
                    >
                      {comparedFinesVisible ? "Hide grid" : "Show grid"}
                    </button>
                  </div>

                  {comparedFinesVisible && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-medium text-slate-350">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                            <th className="py-2">Violation Type</th>
                            <th className="py-2">Maharashtra</th>
                            <th className="py-2">Delhi</th>
                            <th className="py-2">Karnataka</th>
                            <th className="py-2">Tamil Nadu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/50">
                          <tr>
                            <td className="py-3 font-bold text-slate-200">Overspeeding</td>
                            <td className="py-3 font-mono">₹2,000</td>
                            <td className="py-3 font-mono">₹2,400</td>
                            <td className="py-3 font-mono">₹2,300</td>
                            <td className="py-3 font-mono">₹2,200</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-bold text-slate-200">Drunk Driving</td>
                            <td className="py-3 font-mono">₹10,000</td>
                            <td className="py-3 font-mono">₹12,000</td>
                            <td className="py-3 font-mono">₹11,500</td>
                            <td className="py-3 font-mono">₹11,000</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-bold text-slate-200">No Helmet / Seatbelt</td>
                            <td className="py-3 font-mono">₹1,000</td>
                            <td className="py-3 font-mono">₹1,200</td>
                            <td className="py-3 font-mono">₹1,150</td>
                            <td className="py-3 font-mono">₹1,100</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-bold text-slate-200">Mobile Phone Use</td>
                            <td className="py-3 font-mono">₹5,000</td>
                            <td className="py-3 font-mono">₹6,000</td>
                            <td className="py-3 font-mono">₹5,750</td>
                            <td className="py-3 font-mono">₹5,500</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Document Compliance Checklist */}
                  <div className="mt-6 border-t border-slate-900 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">
                          Document Compliance Checklist
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Toggle documents to simulate possession status.</p>
                      </div>
                      {ownedDocs.length < 5 ? (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-black uppercase rounded animate-pulse">
                          ⚠️ Compliance compromised
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[9px] font-black uppercase rounded">
                          ✓ Fully Compliant
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { key: 'DL', label: '🪪 Driver License' },
                        { key: 'RC', label: '📄 Registration RC' },
                        { key: 'Insurance', label: '🛡️ Insurance' },
                        { key: 'PUC', label: '💨 PUC Cert' },
                        { key: 'RoadTax', label: '🛣️ Road Tax' }
                      ].map((doc) => {
                        const active = ownedDocs.includes(doc.key);
                        return (
                          <button
                            key={doc.key}
                            onClick={() => {
                              if (active) {
                                setOwnedDocs(prev => prev.filter(d => d !== doc.key));
                              } else {
                                setOwnedDocs(prev => [...prev, doc.key]);
                              }
                            }}
                            className={`p-2 rounded-xl border text-[10px] font-black transition ${
                              active 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-455' 
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
                            }`}
                          >
                            {doc.label}
                          </button>
                        );
                      })}
                    </div>

                    {ownedDocs.length < 5 && (
                      <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-[10px] text-rose-450 leading-relaxed font-bold">
                        🚨 Warning: Legal Compliance compromised. Missing documents: {['DL', 'RC', 'Insurance', 'PUC', 'RoadTax'].filter(d => !ownedDocs.includes(d)).join(', ')}. You can be fined up to ₹5,000 under Motor Vehicles Act Section 177.
                      </div>
                    )}

                    {/* Explain in simple language AI Button */}
                    <div className="pt-2 flex flex-col space-y-3">
                      <button
                        onClick={handleExplainInSimpleLanguage}
                        disabled={isExplaining}
                        className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-900 disabled:text-slate-650 text-slate-950 font-black text-xs rounded-xl shadow-lg transition active:scale-98"
                      >
                        {isExplaining ? '⏳ Consulting Legal AI...' : '💡 Explain My Legal Risk in Simple Language'}
                      </button>

                      {aiExplainerResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-slate-950 border border-slate-900 rounded-2xl text-[11px] leading-relaxed text-slate-300 font-bold"
                        >
                          <div className="text-sky-400 font-black uppercase text-[9px] tracking-wider mb-1">AI Guardian Legal Council:</div>
                          {aiExplainerResult}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-950 rounded-xl text-[10px] text-slate-500 leading-relaxed border border-slate-900">
                  ⚠️ Note: Fines are statutory estimates based on Motor Vehicles Amendment Act. Fines double for consecutive repeat violations. State surcharges apply inside municipality boundaries.
                </div>
              </div>

            </div>

            {/* Road Sign Recognition Demo & Quiz Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Sign Board Recognition grid */}
              <div className="lg:col-span-6 bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-sky-400 font-black tracking-widest uppercase block mb-4 flex items-center">
                    <BookOpen className="w-4 h-4 mr-1.5" />
                    Road Sign Audit Scanner
                  </span>

                  <p className="text-[11px] text-slate-500 mb-4">Click on any standard road sign board below to simulate an AI visual compliance analysis.</p>

                  <div className="grid grid-cols-4 gap-3">
                    {ROAD_SIGNS.map((sign, idx) => (
                      <button
                        key={idx}
                        onClick={() => scanRoadSign(sign)}
                        className="aspect-square bg-slate-950 border border-slate-900 rounded-2xl flex flex-col items-center justify-center p-2 hover:border-sky-500/40 hover:scale-105 active:scale-95 transition-all duration-150"
                      >
                        <span className="text-xl">{sign.icon}</span>
                        <span className="text-[9px] font-bold text-slate-500 mt-1 truncate max-w-full">{sign.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scan Results HUD */}
                <div className="mt-6 bg-slate-950 border border-slate-900 rounded-2xl p-4 min-h-[100px] flex items-center justify-center">
                  {signScanResult ? (
                    <div className="w-full space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-200 flex items-center">
                          <span className="text-lg mr-2">{signScanResult.icon}</span>
                          {signScanResult.name}
                        </span>
                        <span className={`px-2 py-0.5 text-[8px] uppercase tracking-wider font-mono rounded font-black ${
                          signScanResult.category === 'Regulatory' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' :
                          signScanResult.category === 'Warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                          'bg-sky-500/10 text-sky-400 border border-sky-500/25'
                        }`}>
                          {signScanResult.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed pt-1.5">{signScanResult.meaning}</p>
                      <p className="text-[10px] text-emerald-400 font-bold">✓ Action: {signScanResult.compliance}</p>
                    </div>
                  ) : (
                    <div className="text-center text-slate-600 text-xs">
                      Click a sign above to run AI diagnostic scanner
                    </div>
                  )}
                </div>
              </div>

              {/* Road safety quiz deck */}
              <div className="lg:col-span-6 bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                    <span className="text-[10px] text-indigo-400 font-black tracking-widest uppercase flex items-center">
                      <Award className="w-4 h-4 mr-1.5" />
                      Daily Road Safety compliance Quiz
                    </span>
                    <span className="text-xs text-sky-400 font-mono font-bold">Score: {quizScore} / {QUIZ_QUESTIONS.length}</span>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Question {quizIndex + 1} of {QUIZ_QUESTIONS.length}</span>
                    <p className="text-sm font-black text-slate-200 leading-snug">{QUIZ_QUESTIONS[quizIndex].question}</p>

                    <div className="space-y-2">
                      {QUIZ_QUESTIONS[quizIndex].options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => !quizAnswered && handleQuizAnswerSelect(oIdx)}
                          disabled={quizAnswered}
                          className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition ${
                            quizSelected === oIdx 
                              ? (oIdx === QUIZ_QUESTIONS[quizIndex].answer ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-450')
                              : (quizAnswered && oIdx === QUIZ_QUESTIONS[quizIndex].answer ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450' : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-white')
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Next button / explanation */}
                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="text-[10px] text-slate-500 italic max-w-sm">
                    {quizAnswered && `Explanation: ${QUIZ_QUESTIONS[quizIndex].explanation}`}
                  </div>
                  {quizAnswered && (
                    <button
                      onClick={nextQuizQuestion}
                      className="px-4 py-2 bg-sky-500 text-slate-950 text-xs font-black rounded-xl hover:bg-sky-400 transition active:scale-95 whitespace-nowrap"
                    >
                      Next Question
                    </button>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ==================================================
            TAB: ROADWATCH AI (Phase 3 - Citizen Anomalies)
            ================================================== */}
        {activeTab === 'roadwatch' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="border-b border-slate-900 pb-4">
              <h2 className="text-2xl font-black uppercase tracking-widest text-slate-100">
                RoadWatch Anomaly dispatch
              </h2>
              <p className="text-slate-500 text-xs mt-1">Capture coordinates, upload hazards, assign municipal departments, and monitor tracking lifecycles.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Submission Form panel */}
              <div className="lg:col-span-5 bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between space-y-6">
                <form onSubmit={handleRoadWatchSubmit} className="space-y-4">
                  <span className="text-[10px] text-sky-400 font-black tracking-widest uppercase block flex items-center">
                    <Camera className="w-4 h-4 mr-1.5" />
                    Hazard Telemetry Form
                  </span>

                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Anomaly type</span>
                    <select
                      value={selectedAnomalyType}
                      onChange={(e) => setSelectedAnomalyType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-350 focus:outline-none"
                    >
                      <option value="Pothole">🕳️ Pothole</option>
                      <option value="Waterlogging">🌧️ Waterlogging</option>
                      <option value="Broken Signal">🚦 Broken Signal</option>
                      <option value="Streetlight Failure">💡 Streetlight Failure</option>
                      <option value="Accident Damage">💥 Accident Damage</option>
                      <option value="Road Crack">〰️ Road Crack</option>
                      <option value="Obstruction">🚧 Obstruction</option>
                      <option value="Garbage Hazard">🗑️ Garbage Hazard</option>
                      <option value="Road Construction Issue">👷 Road Construction Issue</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Coordinates capture</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl text-center text-xs font-mono">
                        <span className="text-[8px] text-slate-500 block">LATITUDE</span>
                        <span className="text-slate-200 font-bold">{reportLatitude.toFixed(5)}</span>
                      </div>
                      <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl text-center text-xs font-mono">
                        <span className="text-[8px] text-slate-500 block">LONGITUDE</span>
                        <span className="text-slate-200 font-bold">{reportLongitude.toFixed(5)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Location Name / Landmark</span>
                    <input 
                      type="text"
                      value={reportLocation}
                      onChange={(e) => setReportLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Description details</span>
                    <textarea 
                      rows={3}
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Specify width, severity, lanes affected..."
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none placeholder-slate-650"
                    />
                  </div>

                  {/* Simulated Image Uploader selector */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Simulated camera Attachment</span>
                    <div className="h-28 border border-dashed border-slate-900 rounded-2xl flex flex-col items-center justify-center text-center p-3 bg-slate-950/70">
                      <Camera className="w-6 h-6 text-slate-600 mb-1" />
                      <span className="text-[10px] text-sky-400 font-bold">raastasense_capture_{selectedAnomalyType.toLowerCase()}.png</span>
                      <span className="text-[8px] text-slate-600 tracking-wider">Coordinates metadata matched</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAnalyzingAnomaly}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition"
                  >
                    {isAnalyzingAnomaly ? "Analyzing via Computer Vision..." : "Run AI Diagnostics & Route Ticket"}
                  </button>
                </form>
              </div>

              {/* Live issues stream and lifecycle tracking */}
              <div className="lg:col-span-7 bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] text-indigo-400 font-black tracking-widest uppercase block mb-4 flex items-center">
                    <Activity className="w-4 h-4 mr-1.5" />
                    Active Tickets Lifecycle Hub
                  </span>

                  <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
                    {reportedIssues.map((issue) => (
                      <div 
                        key={issue.id}
                        className="bg-slate-950 border border-slate-900 rounded-2xl p-4 space-y-3 shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-100 uppercase flex items-center">
                            <span className="mr-1.5">{issue.type === 'accident' ? '💥' : issue.type === 'pothole' ? '🕳️' : '⚠️'}</span>
                            {issue.id}
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                              issue.severity === 'Immediate' || issue.severity === 'High' ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20' : 'bg-amber-500/10 text-amber-450 border border-amber-500/20'
                            }`}>
                              {issue.severity}
                            </span>
                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                              issue.status === 'Resolved' ? 'bg-emerald-500/15 text-emerald-450 border border-emerald-500/30' :
                              issue.status === 'Assigned' ? 'bg-sky-500/15 text-sky-400 border border-sky-550/30' :
                              'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}>
                              {issue.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-350 leading-relaxed font-semibold">{issue.description}</p>
                        <p className="text-[10px] text-slate-500">Location: {issue.location} • Target: {issue.authority || "PWD Roads Branch"}</p>

                        {/* Lifecycle Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] text-slate-500 font-extrabold uppercase font-mono">
                            <span className={issue.status === 'Reported' ? 'text-sky-400' : ''}>Reported</span>
                            <span className={issue.status === 'Under Review' ? 'text-sky-400' : ''}>Review</span>
                            <span className={issue.status === 'Assigned' ? 'text-sky-400' : ''}>Assigned</span>
                            <span className={issue.status === 'Resolved' ? 'text-emerald-400' : ''}>Resolved</span>
                          </div>
                          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden flex">
                            <div className="h-full bg-sky-500" style={{ width: 
                              issue.status === 'Reported' ? '25%' :
                              issue.status === 'Under Review' ? '50%' :
                              issue.status === 'Assigned' ? '75%' : '100%'
                            }} />
                          </div>
                        </div>

                        {/* Action buttons to transition status for live demo */}
                        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-900">
                          {issue.status === 'Reported' && (
                            <button
                              onClick={() => transitionReportStatus(issue.id, 'Under Review')}
                              className="px-2 py-1 bg-slate-900 border border-slate-800 text-[9px] hover:text-white rounded font-bold uppercase transition"
                            >
                              Review
                            </button>
                          )}
                          {issue.status === 'Under Review' && (
                            <button
                              onClick={() => transitionReportStatus(issue.id, 'Assigned')}
                              className="px-2 py-1 bg-slate-900 border border-slate-800 text-[9px] hover:text-white rounded font-bold uppercase transition"
                            >
                              Assign Dept
                            </button>
                          )}
                          {issue.status === 'Assigned' && (
                            <button
                              onClick={() => transitionReportStatus(issue.id, 'Resolved')}
                              className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-[9px] text-emerald-450 rounded font-bold uppercase transition"
                            >
                              Resolve Issue
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ==================================================
            TAB: ROADSOS AI (Phase 4 - Golden Hour Emergency Mode)
            ================================================== */}
        {activeTab === 'roadsos' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Top Alert banner if SOS active */}
            {sosActive && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/35 rounded-3xl flex items-center space-x-4 animate-pulse">
                <ShieldAlert className="w-6 h-6 text-rose-500" />
                <div className="flex-1">
                  <span className="text-[10px] text-rose-500 font-black tracking-widest uppercase block">Golden Hour Rescue active</span>
                  <p className="text-xs text-rose-400 font-bold">Nearest trauma networks notified. Route Alpha locked for ambulances.</p>
                </div>
                <button 
                  onClick={() => setSosActive(false)}
                  className="px-3 py-1 bg-slate-950 border border-slate-900 text-[10px] text-slate-400 hover:text-white rounded-lg font-bold uppercase tracking-wider transition"
                >
                  Cancel beacon
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Emergency details and Golden Hour Timer (Hero Feature) */}
              <div className="lg:col-span-5 bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <span className="text-[10px] text-rose-500 font-black tracking-widest uppercase block flex items-center">
                    <Flame className="w-4 h-4 mr-1.5 animate-bounce" />
                    Golden Hour Emergency rescue HUD
                  </span>

                  <div className="h-40 border border-dashed border-rose-550/20 bg-slate-950/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    {sosActive ? (
                      <>
                        <span className="text-[10px] text-rose-550 font-black tracking-widest uppercase">Golden Hour Remaining</span>
                        <span className="text-4xl font-black font-mono text-rose-500 tracking-tight mt-1 animate-pulse">
                          {formatGoldenHourTime(goldenHourTime)}
                        </span>
                        
                        {/* Progress Bar visual */}
                        <div className="w-full max-w-xs h-1.5 bg-slate-900 rounded-full overflow-hidden mt-3.5 border border-slate-850">
                          <div className={`h-full ${
                            goldenHourTime > 2700 ? 'bg-emerald-500' :
                            goldenHourTime > 1200 ? 'bg-amber-500' : 'bg-rose-500'
                          }`} style={{ width: `${(goldenHourTime / 3600) * 100}%` }} />
                        </div>
                      </>
                    ) : (
                      <>
                        <PhoneCall className="w-8 h-8 text-rose-500 mb-2 animate-pulse" />
                        <span className="text-xs text-slate-350 font-black">SOS Beacon Disabled</span>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-xs">Broadcast SOS to instantly lock GPS coords, start countdown timer, and map emergency medical paths.</p>
                      </>
                    )}
                  </div>

                  {/* Metadata display */}
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold flex items-center">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 mr-1.5" />
                        Current Coordinates:
                      </span>
                      <span className="font-mono text-slate-205 font-bold">
                        {sosCoords ? `${sosCoords.lat.toFixed(5)}° N, ${sosCoords.lng.toFixed(5)}° E` : "Locking GPS..."}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold flex items-center">
                        <Clock className="w-3.5 h-3.5 text-rose-500 mr-1.5" />
                        Accident Time:
                      </span>
                      <span className="font-mono text-slate-205 font-bold">{sosTimestamp ? sosTimestamp : "Under Analysis"}</span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold flex items-center">
                        🏥 Nearest Hospital:
                      </span>
                      <span className="font-mono text-slate-205 font-bold">City General Hospital (1.2 km)</span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold flex items-center">
                        🩺 Nearest Trauma Center:
                      </span>
                      <span className="font-mono text-slate-205 font-bold">Metro Accident Center (1.8 km)</span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold flex items-center">
                        🚑 Nearest Ambulance:
                      </span>
                      <span className="font-mono text-slate-205 font-bold">Raasta Ambulance Unit B (0.5 km)</span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold flex items-center">
                        👮 Nearest Police:
                      </span>
                      <span className="font-mono text-slate-205 font-bold">Highway Patrol Sect 5 (1.0 km)</span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold flex items-center">
                        ⚡ Fastest Rescue Route:
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">Corridor Beta Locked (9 min ETA)</span>
                    </div>
                  </div>
                </div>

                {!sosActive ? (
                  <button
                    onClick={triggerSOS}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-rose-600/10 animate-pulse transition"
                  >
                    Broadcast Emergency SOS Beacon
                  </button>
                ) : (
                  <a
                    href={`https://www.google.com/maps?q=${sosCoords?.lat},${sosCoords?.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 font-black rounded-2xl flex items-center justify-center space-x-2 text-xs transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open location on Google Maps</span>
                  </a>
                )}
              </div>

              {/* Nearest Emergency services directory (Phase 4) */}
              <div className="lg:col-span-7 bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-indigo-400 font-black tracking-widest uppercase block mb-4 flex items-center">
                    <Activity className="w-4 h-4 mr-1.5" />
                    Emergency Trauma Networks Directory
                  </span>

                  <div className="space-y-3">
                    {MOCK_EMERGENCY_NODES.map((node, idx) => (
                      <div 
                        key={idx}
                        className="bg-slate-950 border border-slate-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start space-x-3.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                            node.type === 'hospital' ? 'bg-rose-500/15 text-rose-500' : 'bg-blue-600/15 text-sky-400'
                          }`}>
                            {node.type === 'hospital' ? '🏥' : '👮'}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-100">{node.name}</h4>
                            <p className="text-[10px] text-slate-500 capitalize">{node.type} Node • 1.2 km away • Status: Active</p>
                          </div>
                        </div>

                        {/* Resource actions */}
                        <div className="flex items-center space-x-2">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${defaultCoords.lat},${defaultCoords.lng}&destination=${node.lat},${node.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-350 hover:text-white rounded-lg flex items-center space-x-1 transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Navigate</span>
                          </a>
                          <button
                            onClick={() => alert(`Simulating mobile call connection to ${node.name} dispatch.`)}
                            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-350 hover:text-white rounded-lg flex items-center space-x-1 transition"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Call</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI emergency guides */}
                <div className="mt-6 border-t border-slate-900 pt-4">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Immediate First Aid Quick-Guides</span>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleSendMessage("cpr instructions")}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition"
                    >
                      CPR Guide
                    </button>
                    <button 
                      onClick={() => handleSendMessage("how to control severe bleeding")}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition"
                    >
                      Severe Bleeding
                    </button>
                    <button 
                      onClick={() => handleSendMessage("fracture emergency guidance")}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition"
                    >
                      Bone Fractures
                    </button>
                    <button 
                      onClick={() => handleSendMessage("treatment for shock")}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-900 hover:border-slate-800 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition"
                    >
                      Trauma & Shock
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ==================================================
            TAB: DIGITAL TWIN MAP
            ================================================== */}
        {activeTab === 'radar' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-widest text-slate-100">
                  Live Digital Twin Map
                </h2>
                <p className="text-slate-500 text-xs mt-1">Multi-corridor geospatial route solver indexing safety metrics.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Active City Selector Dropdown */}
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    const newCity = e.target.value;
                    setSelectedCity(newCity);
                    if (CITY_COORDINATES[newCity]) {
                      setMapCenter(CITY_COORDINATES[newCity]);
                    }
                  }}
                  className="bg-slate-950 border border-slate-900 text-xs font-bold text-slate-350 rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  <option value="Nagpur">Nagpur</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Jaipur">Jaipur</option>
                </select>

                {/* Map modes toggle */}
                <div className="bg-slate-950 border border-slate-900 p-1 rounded-2xl flex items-center space-x-1 shadow-inner">
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
                  Traffic Flow
                </button>
                <button
                  onClick={() => setMapLayer('heatmap')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${mapLayer === 'heatmap' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  Accident Heatmap
                </button>
              </div>
            </div>
          </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Left Route Info Panel */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                
                {/* Route selection tab deck */}
                <div className="bg-slate-900/60 border border-slate-900 p-2 rounded-[24px] flex items-center justify-between gap-1">
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
                <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-5 space-y-4">
                  <div className="border-b border-slate-900 pb-2">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Geospatial Solution</span>
                    <h3 className="text-sm font-extrabold text-slate-200">{currentRoute.explanation.split('.')[0]}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-slate-950/70 border border-slate-900/50 p-2.5 rounded-xl">
                      <span className="text-[9px] text-slate-500 font-extrabold block uppercase">ETA</span>
                      <span className="text-slate-200 font-bold">{currentRoute.eta}</span>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-900/50 p-2.5 rounded-xl">
                      <span className="text-[9px] text-slate-500 font-extrabold block uppercase">Risk Factor</span>
                      <span className="text-rose-450 font-bold">{currentRoute.risk}</span>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-900/50 p-2.5 rounded-xl">
                      <span className="text-[9px] text-slate-500 font-extrabold block uppercase">Accident Prob.</span>
                      <span className="text-amber-450 font-bold">{currentRoute.accidentProb}</span>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-900/50 p-2.5 rounded-xl">
                      <span className="text-[9px] text-slate-500 font-extrabold block uppercase">Fuel Index</span>
                      <span className="text-purple-400 font-bold">{currentRoute.fuel}</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-sky-500/5 border border-sky-500/20 rounded-2xl text-[11px] leading-relaxed text-sky-400 font-bold">
                    💡 AI Explanation: {currentRoute.explanation}
                  </div>

                  {/* Open in Google Maps button */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${defaultCoords.lat},${defaultCoords.lng}&destination=${currentRoute.coords[currentRoute.coords.length-1][0]},${currentRoute.coords[currentRoute.coords.length-1][1]}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-200 font-black rounded-2xl flex items-center justify-center space-x-2 text-xs transition active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Launch Google Maps Route</span>
                  </a>
                </div>

              </div>

              {/* Leaflet map container */}
              <div className="lg:col-span-8 h-[450px]">
                <MapContainer 
                  userCoords={defaultCoords}
                  roads={MOCK_ROADS}
                  incidents={reportedIssues}
                  heatmap={MOCK_HEATMAP}
                  activeLayer={mapLayer}
                  setActiveLayer={setMapLayer}
                  selectedRoute={currentRoute.coords}
                  sosActive={sosActive}
                  sosCoords={sosCoords}
                  onMapClick={handleMapCoordSelect}
                />
              </div>

            </div>
          </motion.div>
        )}

        {/* ==================================================
            TAB: DRIVER GUARDIAN (Cockpit telemetry)
            ================================================== */}
        {activeTab === 'guardian' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="border-b border-slate-900 pb-4">
              <h2 className="text-2xl font-black uppercase tracking-widest text-slate-100">
                Driver Guardian Cockpit
              </h2>
              <p className="text-slate-500 text-xs mt-1">Simulate driving parameters to analyze safety risk indexes and trigger real-time counseling voice alerts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Telemetry settings slider panel */}
              <div className="lg:col-span-4 bg-slate-900/60 border border-slate-900 rounded-3xl p-6 space-y-4">
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
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-glow-red' 
                        : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    📱 Mobile Active
                  </button>

                  <button
                    onClick={() => setFatigue(!fatigue)}
                    className={`p-3 rounded-2xl border text-xs font-black transition duration-150 ${
                      fatigue 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-450 shadow-glow-red animate-pulse' 
                        : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
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
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none"
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
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none"
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
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none"
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
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none"
                  >
                    <option value="High">🟢 High (Clear Sight)</option>
                    <option value="Medium">🟡 Medium (Moderate Haze)</option>
                    <option value="Low">🔴 Low (Dense Mist/Smog)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Seatbelt</span>
                    <button
                      onClick={() => setSeatbeltStatus(seatbeltStatus === 'Secured' ? 'Unbuckled' : 'Secured')}
                      className={`w-full py-2 rounded-xl border text-[10px] font-black transition ${
                        seatbeltStatus === 'Secured' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
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
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-2 py-2 text-[10px] font-bold text-slate-350 focus:outline-none"
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
                <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-2">Driver Cockpit HUD Details</span>
                    <div className="space-y-3.5">
                      <div className="p-3 bg-slate-950 border border-slate-900 rounded-2xl flex items-center justify-between text-xs">
                        <span className="text-slate-400">Driver Fatigue</span>
                        <span className={`font-mono font-bold ${fatigue ? 'text-rose-550' : 'text-emerald-400'}`}>{fatigue ? 'EXHAUSTED' : 'ACTIVE'}</span>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-900 rounded-2xl flex items-center justify-between text-xs">
                        <span className="text-slate-400">Mobile Phone distracted</span>
                        <span className={`font-mono font-bold ${phoneUsage ? 'text-rose-550' : 'text-emerald-400'}`}>{phoneUsage ? 'YES' : 'NO'}</span>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-900 rounded-2xl flex items-center justify-between text-xs">
                        <span className="text-slate-400">Lane Alignment</span>
                        <span className="font-mono font-bold text-slate-200">{laneDiscipline}</span>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-900 rounded-2xl flex items-center justify-between text-xs">
                        <span className="text-slate-400">Seatbelt / Safety harness</span>
                        <span className={`font-mono font-bold ${seatbeltStatus === 'Secured' ? 'text-emerald-400' : 'text-rose-500'}`}>{seatbeltStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-6 p-4 rounded-2xl border text-xs font-bold leading-relaxed ${
                    classification === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-glow-red' :
                    classification === 'Warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-glow-gold' :
                    'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    🚀 AI Guardian Counselor: {riskExplanation}
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* ==================================================
            TAB: ANALYTICS
            ================================================== */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="border-b border-slate-900 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-widest text-slate-100">
                  National Safety Observability Center
                </h2>
                <p className="text-slate-500 text-xs mt-1">Cross-examine urban corridors and district safety performance profiles in real-time.</p>
              </div>

              {/* View Toggles (City vs State) */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 self-start md:self-auto">
                <button
                  onClick={() => setAnalyticsView('city')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${analyticsView === 'city' ? 'bg-sky-50 text-slate-950 shadow-glow-blue' : 'text-slate-400 hover:text-white'}`}
                >
                  🏙️ City Diagnostics
                </button>
                <button
                  onClick={() => setAnalyticsView('state')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${analyticsView === 'state' ? 'bg-sky-50 text-slate-950 shadow-glow-blue' : 'text-slate-400 hover:text-white'}`}
                >
                  🗺️ State Surcharges
                </button>
              </div>
            </div>

            {/* City Selector Dropdown */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-900">
              <div>
                <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">Select Analyzed Location</h3>
                <p className="text-[10px] text-slate-500">View real-time safety, road quality, and congestion indices for Indian metropolitan regions.</p>
              </div>
              <select
                value={analyticsCity}
                onChange={(e) => setAnalyticsCity(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs font-bold text-slate-350 rounded-xl px-3.5 py-2 focus:outline-none focus:border-sky-500"
              >
                {Object.keys(CITIES_ANALYTICS).map((c) => (
                  <option key={c} value={c}>{c} District</option>
                ))}
              </select>
            </div>

            {/* Metric Selector Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
              {(['safety', 'accidents', 'quality', 'congestion', 'response'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setAnalyticsMetric(m)}
                  className={`py-3 px-2 rounded-2xl border text-xs font-black uppercase tracking-wider transition ${
                    analyticsMetric === m
                      ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 shadow-glow-blue'
                      : 'bg-slate-900/60 border-slate-900 text-slate-450 hover:text-slate-350'
                  }`}
                >
                  {m === 'safety' ? '🛡️ Safety Index' :
                   m === 'accidents' ? '💥 Accident Heat' :
                   m === 'quality' ? '〰️ Road Quality' :
                   m === 'congestion' ? '🚗 Congestion' :
                   '🚑 Response Times'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left Column: Visual SVG Graph */}
              <div className="lg:col-span-8 bg-slate-900/60 border border-slate-900 rounded-[32px] p-6 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-200 font-extrabold uppercase tracking-wider block">
                      {analyticsMetric === 'safety' ? 'Safety Coefficient Distribution (Metropolitan Hubs)' :
                       analyticsMetric === 'accidents' ? `Accident Occurrence Rate (Monthly Trends: ${analyticsCity})` :
                       analyticsMetric === 'quality' ? `Pavement Road Defect Map: ${analyticsCity}` :
                       analyticsMetric === 'congestion' ? `Traffic Flow Congestion Profile: ${analyticsCity}` :
                       `Emergency Dispatch Response Speeds: ${analyticsCity}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                      Scope: {analyticsCity} District
                    </span>
                  </div>

                  {/* SVG Container */}
                  <div className="h-64 mt-6 flex items-end justify-center relative w-full border-b border-slate-800/80 pb-2">
                    
                    {/* Render Safety Index Bar Chart */}
                    {analyticsMetric === 'safety' && (
                      <div className="w-full h-full flex items-end justify-between gap-1 pt-6 px-1">
                        {Object.entries(CITIES_ANALYTICS).map(([cityName, data]) => {
                          const isSelected = cityName === analyticsCity;
                          return (
                            <div key={cityName} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                              <span className={`text-[8px] font-mono font-bold ${isSelected ? 'text-sky-400 font-black' : 'text-slate-550'}`}>{data.safetyScore}%</span>
                              <div 
                                className={`w-full rounded-t-lg transition-all duration-300 ${
                                  isSelected 
                                    ? 'bg-gradient-to-t from-sky-500/50 to-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]' 
                                    : 'bg-slate-800/40 hover:bg-slate-800'
                                }`} 
                                style={{ height: `${data.safetyScore}%` }} 
                              />
                              <span className={`text-[8px] font-extrabold uppercase truncate max-w-full ${isSelected ? 'text-sky-400 font-black' : 'text-slate-500'}`}>{cityName.substring(0, 5)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Render Accident Trends Line Chart */}
                    {analyticsMetric === 'accidents' && (
                      <div className="w-full h-full relative flex items-end">
                        <svg className="w-full h-44" viewBox="0 0 500 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="accidentGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25"/>
                              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0"/>
                            </linearGradient>
                          </defs>
                          {/* Shaded Area under curve */}
                          <path 
                            d={(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).accidentTrend + " L 500 200 L 0 200 Z"} 
                            fill="url(#accidentGlow)" 
                          />
                          {/* Glowing Trend Line */}
                          <path 
                            d={(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).accidentTrend} 
                            fill="none" 
                            stroke="#f43f5e" 
                            strokeWidth="3.5" 
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute bottom-2 left-2 text-[9px] text-slate-500 font-extrabold uppercase">Jan</div>
                        <div className="absolute bottom-2 left-1/4 text-[9px] text-slate-500 font-extrabold uppercase">Mar</div>
                        <div className="absolute bottom-2 left-2/4 text-[9px] text-slate-500 font-extrabold uppercase">May</div>
                        <div className="absolute bottom-2 right-2 text-[9px] text-slate-500 font-extrabold uppercase">June (Raasta Deploy)</div>
                      </div>
                    )}

                    {/* Render Pavement Road Quality Breakdown */}
                    {analyticsMetric === 'quality' && (
                      <div className="w-full h-full flex flex-col justify-center space-y-4 px-6 pt-6">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-emerald-450">Class A (Optimal/Smooth)</span>
                            <span className="font-mono text-slate-350">{(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).roadQuality.good}%</span>
                          </div>
                          <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).roadQuality.good}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-amber-450">Class B (Minor Cracks/Wear)</span>
                            <span className="font-mono text-slate-350">{(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).roadQuality.fair}%</span>
                          </div>
                          <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).roadQuality.fair}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-rose-500">Class C (Severe Potholes/Damaged)</span>
                            <span className="font-mono text-slate-350">{(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).roadQuality.poor}%</span>
                          </div>
                          <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500" style={{ width: `${(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).roadQuality.poor}%` }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Render Traffic Congestion Index */}
                    {analyticsMetric === 'congestion' && (
                      <div className="w-full h-full flex items-end justify-between gap-6 pt-6 px-4">
                        <div className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-[9px] text-emerald-450 font-mono font-bold">12%</span>
                          <div className="w-full bg-emerald-500/20 border border-emerald-500/30 rounded-t-lg" style={{ height: '20%' }} />
                          <span className="text-[8px] text-slate-500 font-bold uppercase truncate max-w-full">Morning Offpeak</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-[9px] text-rose-500 font-mono font-bold">{(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).congestionPeaks.morning}%</span>
                          <div className="w-full bg-rose-500/20 border border-rose-500/30 rounded-t-lg" style={{ height: `${(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).congestionPeaks.morning}%` }} />
                          <span className="text-[8px] text-slate-500 font-bold uppercase truncate max-w-full">Office Rush (8A-11A)</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-[9px] text-amber-500 font-mono font-bold">{(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).congestionPeaks.midday}%</span>
                          <div className="w-full bg-amber-500/20 border border-amber-500/30 rounded-t-lg" style={{ height: `${(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).congestionPeaks.midday}%` }} />
                          <span className="text-[8px] text-slate-500 font-bold uppercase truncate max-w-full">Midday Flow</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1.5">
                          <span className="text-[9px] text-rose-500 font-mono font-bold">{(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).congestionPeaks.evening}%</span>
                          <div className="w-full bg-rose-500/20 border border-rose-500/30 rounded-t-lg animate-pulse" style={{ height: `${(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).congestionPeaks.evening}%` }} />
                          <span className="text-[8px] text-slate-500 font-bold uppercase truncate max-w-full">Evening Peak (5P-8P)</span>
                        </div>
                      </div>
                    )}

                    {/* Render Emergency Response Times (Pre vs Post Raasta) */}
                    {analyticsMetric === 'response' && (
                      <div className="w-full h-full flex items-end justify-around gap-12 pt-6 px-10">
                        <div className="w-24 flex flex-col items-center gap-2">
                          <span className="text-xs text-rose-500 font-mono font-black">{(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).responseTimes.pre} mins</span>
                          <div className="w-full bg-rose-500/25 border border-rose-500/40 rounded-t-2xl shadow-lg" style={{ height: '90%' }} />
                          <span className="text-[9px] text-slate-500 font-extrabold uppercase text-center">Pre-Raasta (Standard System)</span>
                        </div>

                        <div className="w-24 flex flex-col items-center gap-2">
                          <span className="text-xs text-emerald-450 font-mono font-black">{(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).responseTimes.post} mins</span>
                          <div className="w-full bg-emerald-500/25 border border-emerald-500/40 rounded-t-2xl shadow-[0_0_15px_#10b981]" style={{ height: '28%' }} />
                          <span className="text-[9px] text-emerald-400 font-extrabold uppercase text-center">Post-Raasta (Golden Hour OS)</span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  💡 Observations are calculated from dynamic telemetry logs gathered across the Raasta GPS pipeline. Values update every 60 seconds.
                </p>
              </div>

              {/* Right Column: Key Metrices / Leaderboard */}
              <div className="lg:col-span-4 flex flex-col justify-between gap-6">
                <div className="bg-slate-900/60 border border-slate-900 rounded-[32px] p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    <span className="text-[10px] text-indigo-400 font-black tracking-widest uppercase block mb-4">
                      ⚙️ Active Diagnostics
                    </span>

                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-550 font-black uppercase tracking-wider block">Metric Target</span>
                        <span className="text-sm font-black text-slate-100">
                          Accident Reductions &gt; 50%
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-550 font-black uppercase tracking-wider block">Hackathon Impact Quotient</span>
                        <div className="flex justify-between items-center text-xs mt-1">
                          <span className="text-slate-400 font-bold">Target Index:</span>
                          <span className="font-mono text-slate-200 font-black">95%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs mt-0.5">
                          <span className="text-slate-400 font-bold">Current Achieved:</span>
                          <span className="font-mono text-emerald-450 font-black">
                            {analyticsView === 'city' ? '92.4%' : '88.1%'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1.5">
                        <span className="text-slate-500 font-bold">STATUS:</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-455 border border-emerald-500/25 rounded uppercase tracking-wider font-extrabold text-[9px]">
                          VIBRANT OPERATING
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-900 rounded-[32px] p-6 flex flex-col justify-between space-y-6">
                  <div>
                    <span className="text-[10px] text-sky-450 font-black tracking-widest uppercase block">
                      ⚡ AI RECOMMENDATION
                    </span>
                    <p className="text-[10.5px] text-slate-350 leading-relaxed font-bold mt-2">
                      {analyticsCity} District displays a safety score of {(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).safetyScore}%. Traffic risk profile is flagged as {(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).trafficRisk}. AI Recommendation: Maintain double the standard vehicle-following distance during office rush hours on high wear pavement stretches.
                    </p>
                  </div>

                  <div className="p-4 bg-sky-500/5 border border-sky-500/15 rounded-2xl text-[11px] leading-relaxed text-sky-400 font-bold">
                    {analyticsMetric === 'safety' && `💡 ${analyticsCity} holds a safety index rating of ${(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).safetyScore}% owing to real-time driver compliance monitoring.`}
                    {analyticsMetric === 'accidents' && `💡 Monthly accidents in ${analyticsCity} dropped by 45% post RaastaSense telemetry activation due to real-time risk counseling.`}
                    {analyticsMetric === 'quality' && `💡 PWD automated ticket routing in ${analyticsCity} decreased unresolved Class C pothole issues down to 48 hours.`}
                    {analyticsMetric === 'congestion' && `💡 Office rush traffic flows in ${analyticsCity} indicate a peak of ${(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).congestionPeaks.evening}% during evening hours.`}
                    {analyticsMetric === 'response' && `💡 The Golden Hour Rescue Engine dropped critical trauma response times in ${analyticsCity} down to ${(CITIES_ANALYTICS[analyticsCity] || CITIES_ANALYTICS.Nagpur).responseTimes.post} minutes, directly protecting citizen lives.`}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-[9px] text-slate-600 font-bold text-center uppercase tracking-wider">
                  RaastaSense OS Observability Panel
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================================================
            TAB: AI GUARDIAN ASSISTANT PAGE
            ================================================== */}
        {activeTab === 'aiguardian' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="border-b border-slate-900 pb-4">
              <h2 className="text-2xl font-black uppercase tracking-widest text-slate-100 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-500 animate-pulse" />
                AI Guardian Intelligence Center
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Your co-pilot for road safety, legal inquiries, emergency rescue, and live driver counseling.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Mascot & Controls panel */}
              <div className="lg:col-span-5 bg-slate-900/60 border border-slate-900 rounded-[32px] p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="space-y-6">
                  <span className="text-[10px] text-sky-400 font-black tracking-widest uppercase block flex items-center">
                    <Activity className="w-4 h-4 mr-1.5 animate-pulse" />
                    Guardian Mascot Telemetry
                  </span>

                  {/* Interactive Mascot Circle */}
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className={`w-32 h-32 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-800 flex items-center justify-center border-4 relative transition-all duration-500 ${
                      isTyping ? 'animate-bounce border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.5)]' :
                      isListening ? 'animate-pulse border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.5)]' :
                      sosActive ? 'animate-ping border-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.6)]' :
                      'border-slate-800 shadow-[0_0_15px_rgba(30,41,59,0.5)]'
                    }`}>
                      {/* Inner pulsing layer */}
                      <div className="absolute inset-2 rounded-full bg-slate-950 flex items-center justify-center flex-col">
                        <span className="text-4xl">🤖</span>
                        <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase mt-1 animate-pulse">
                          {isTyping ? 'Thinking' : isListening ? 'Listening' : 'Ready'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Voice Controller Button */}
                  <div className="flex flex-col items-center space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-900">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Voice Assistant Control</span>
                    <button
                      onClick={handleVoiceAssistantStart}
                      className={`w-full py-3 rounded-xl flex items-center justify-center space-x-2 border font-black text-xs transition uppercase tracking-wider ${
                        isListening 
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-glow-red' 
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-sky-400'
                      }`}
                    >
                      <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
                      <span>{isListening ? 'Stop Listening' : 'Start Voice Control'}</span>
                    </button>
                    <p className="text-[9px] text-slate-500 text-center leading-relaxed">
                      "Nearest hospital", "What is my safety score", "Emergency SOS", or "Help me check road signs".
                    </p>
                  </div>

                  {/* Settings / Accent Panel */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">System Diagnostics</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex flex-col">
                        <span className="text-slate-500 font-bold uppercase">Language</span>
                        <span className="text-sky-400 font-black mt-0.5">{selectedLanguage}</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex flex-col">
                        <span className="text-slate-500 font-bold uppercase">Accent Engine</span>
                        <span className="text-sky-400 font-black mt-0.5">Indian Accent</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Core: v2.4-stable</span>
                  <span>SSL encrypted</span>
                </div>
              </div>

              {/* Chat screen panel */}
              <div className="lg:col-span-7 bg-slate-900/60 border border-slate-900 rounded-[32px] p-6 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] text-indigo-400 font-black tracking-widest uppercase block mb-4 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1.5" />
                    Conversational Safe-T-Stream
                  </span>

                  {/* Conversation stream */}
                  <div className="bg-slate-950/80 rounded-2xl border border-slate-900 p-4 h-96 overflow-y-auto space-y-3.5 pr-2">
                    {chatHistory.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[8px] font-mono text-slate-550 uppercase mb-0.5 tracking-wider">
                          {item.sender === 'user' ? 'Citizen (You)' : 'AI Guardian'}
                        </span>
                        <div 
                          className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[80%] font-semibold shadow-md ${
                            item.sender === 'user' 
                              ? 'bg-sky-500 text-slate-950 rounded-tr-none' 
                              : 'bg-slate-900 text-slate-200 rounded-tl-none border border-slate-850'
                          }`}
                        >
                          {item.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex flex-col items-start animate-pulse">
                        <span className="text-[8px] font-mono text-slate-550 uppercase mb-0.5">AI Guardian</span>
                        <div className="p-3 rounded-2xl text-xs bg-slate-900 text-slate-500 rounded-tl-none border border-slate-850">
                          Analyzing context & legal database...
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick actions Suggestions */}
                <div className="space-y-2">
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">Quick Inquiry Suggestions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "🏥 Nearest Hospital", text: "Where is the nearest hospital or trauma center?" },
                      { label: "💸 Speeding Fine", text: "What is the fine for speeding or helmet violations?" },
                      { label: "🚏 Road Sign Meaning", text: "Can you explain mandatory road signs?" },
                      { label: "🆘 Emergency Help", text: "Emergency procedures. What should I do right now?" },
                      { label: "🪖 Helmet Rules", text: "What are the motor vehicle rules regarding helmets?" },
                      { label: "🩹 Accident First Aid", text: "Provide step-by-step first aid guidance for road accidents." }
                    ].map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => {
                          setChatInput('');
                          handleSendMessage(chip.text);
                        }}
                        className="bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-sky-405 border border-slate-850 rounded-xl px-2.5 py-1.5 text-[9.5px] font-bold transition"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input area */}
                <div className="flex items-center space-x-2 pt-2">
                  <input 
                    type="text" 
                    placeholder="Ask safety guardian anything (e.g. state rules, first aid instructions)..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage(chatInput);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                  <button 
                    onClick={() => handleSendMessage(chatInput)}
                    className="p-3 bg-sky-500 text-slate-950 rounded-xl hover:bg-sky-400 active:scale-95 transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </main>

      {/* Floating Chatbot Engine (Central Guardian AI) */}
      <div className="fixed bottom-6 right-6 z-[2000] flex flex-col items-end">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-2xl w-[320px] mb-3 space-y-3 relative overflow-hidden"
            >
              {/* Cute digital border glow depending on state */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                sosActive || riskScore > 75 ? 'bg-rose-500 animate-pulse' :
                riskScore > 35 ? 'bg-amber-400 animate-pulse' : 'bg-sky-400'
              }`} />
              
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    isOffline ? 'bg-amber-400' : 'bg-emerald-500 animate-ping'
                  }`} />
                  <span className="text-xs font-black tracking-wider uppercase text-slate-200">
                    {isOffline ? 'Offline Guardian Core' : 'Raasta AI Guardian'}
                  </span>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white transition">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Message History Grid */}
              <div className="bg-slate-950/80 rounded-2xl border border-slate-900 p-3 h-48 overflow-y-auto space-y-2 pr-1">
                {chatHistory.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 rounded-xl text-[10.5px] leading-relaxed max-w-[85%] font-medium ${
                      item.sender === 'user' 
                        ? 'bg-sky-500 text-slate-950 ml-auto' 
                        : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    {item.text}
                  </div>
                ))}
                {isTyping && (
                  <div className="p-2 rounded-xl text-[10.5px] bg-slate-900 text-slate-500 w-max animate-pulse">
                    Guardian is thinking...
                  </div>
                )}
              </div>

              {/* Suggestion Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
                {[
                  { label: "🏥 Nearest Hospital", text: "Where is the nearest hospital or trauma center?" },
                  { label: "💸 Traffic Fine", text: "What is the fine for speeding or helmet violations?" },
                  { label: "🚏 Road Sign Meaning", text: "Can you explain mandatory road signs?" },
                  { label: "🗺️ Safe Route", text: "Find a safe route to my destination avoiding accidents." },
                  { label: "🆘 Emergency Help", text: "Emergency procedures. What should I do right now?" },
                  { label: "🪖 Helmet Rules", text: "What are the motor vehicle rules regarding helmets?" },
                  { label: "🪪 License Rules", text: "What documents must a driver carry at all times?" },
                  { label: "🩹 Accident Guidance", text: "Provide step-by-step first aid guidance for road accidents." }
                ].map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => {
                      setChatInput('');
                      handleSendMessage(chip.text);
                    }}
                    className="flex-shrink-0 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-sky-400 border border-slate-850 rounded-lg px-2 py-1 text-[9px] font-bold transition whitespace-nowrap"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-1">
                <input 
                  type="text" 
                  placeholder="Ask safety guardian anything..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage(chatInput);
                  }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-sky-500"
                />
                <button 
                  onClick={() => handleSendMessage(chatInput)}
                  className="p-2 bg-sky-500 text-slate-950 rounded-xl hover:bg-sky-400 active:scale-95 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The floating mascot avatar button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-650 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition duration-200 border-2 border-white/10 group relative ${
            sosActive || riskScore > 75 ? 'shadow-[0_0_20px_rgba(244,63,94,0.6)] border-rose-500' :
            riskScore > 35 ? 'shadow-[0_0_15px_rgba(245,158,11,0.5)] border-amber-400' :
            'shadow-[0_0_15px_rgba(56,189,248,0.3)] border-sky-400'
          }`}
          title="Central Safety Guardian AI"
        >
          {/* Pulsing ring */}
          <div className={`absolute inset-0 rounded-full border-2 animate-ping opacity-25 group-hover:opacity-40 ${
            sosActive || riskScore > 75 ? 'border-rose-500' :
            riskScore > 35 ? 'border-amber-400' :
            'border-sky-400'
          }`} />
          
          <User className="w-6 h-6 text-white" />
        </button>
      </div>

    </div>
  );
}
