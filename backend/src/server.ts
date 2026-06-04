import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CloudLogger } from './services/cloudLogger.js';
import { FirestoreService } from './services/firestoreService.js';
import { AnalyticsService } from './services/analyticsService.js';

// Static asset path resolution for production serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multi-path self-healing resolution strategy to locate React build static assets
let frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (!fs.existsSync(path.join(frontendDistPath, 'index.html'))) {
  const cwdDistPath = path.join(process.cwd(), 'frontend/dist');
  if (fs.existsSync(path.join(cwdDistPath, 'index.html'))) {
    frontendDistPath = cwdDistPath;
  } else {
    const relativeDistPath = path.join(process.cwd(), '../frontend/dist');
    if (fs.existsSync(path.join(relativeDistPath, 'index.html'))) {
      frontendDistPath = relativeDistPath;
    }
  }
}

// Load environment variables (resolving from root workspace directory)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ==========================================
// 1. RULE GUIDE DATABASE (DriveLegal Core)
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

const trafficRules: Record<string, TrafficRule> = {
  'signal-jump': {
    id: '1',
    type: 'Signal Jump',
    fineAmount: 'â¹5,000 / $100',
    explanation: 'Disregarding red traffic signals is a major cause of broadside collisions at intersections.',
    severity: 'High',
    characterAdvice: 'Traffic Sensei says: Red means STOP! Impatience costs lives. Wait for the green light, young motorist!',
    riskScore: 75
  },
  'overspeeding': {
    id: '2',
    type: 'Overspeeding',
    fineAmount: 'â¹2,000 / $150',
    explanation: 'Exceeding the speed limit dramatically reduces reaction time and increases stopping distance.',
    severity: 'High',
    characterAdvice: 'Traffic Sensei says: Speed limits are not suggestions! Control your speed, or gravity will control you.',
    riskScore: 60
  },
  'drunk-driving': {
    id: '3',
    type: 'Drunk Driving',
    fineAmount: 'â¹10,000 / $500 + License Suspension',
    explanation: 'Driving under the influence of alcohol severely impairs motor control, reflexes, and cognitive judgment.',
    severity: 'Critical',
    characterAdvice: 'Traffic Sensei says: Extremely dangerous! Never get behind the wheel after drinking. Call a cab, or let the Road Guardian guide you safely.',
    riskScore: 95
  },
  'no-helmet': {
    id: '4',
    type: 'No Helmet',
    fineAmount: 'â¹1,000 / $50',
    explanation: 'Riding a two-wheeler without a safety helmet increases the chance of fatal traumatic brain injuries by 300%.',
    severity: 'Medium',
    characterAdvice: 'Traffic Sensei says: Protect your brain! A certified helmet is your shield of honor. Donât ride without it.',
    riskScore: 40
  },
  'no-seatbelt': {
    id: '5',
    type: 'No Seatbelt',
    fineAmount: 'â¹1,000 / $80',
    explanation: 'Failure to buckle seatbelts reduces vehicle safety cell effectiveness, leading to cabin ejection in crashes.',
    severity: 'Medium',
    characterAdvice: 'Traffic Sensei says: Click it or ticket! Seatbelts keep you anchored in your seat. Fasten it before starting.',
    riskScore: 35
  },
  'mobile-usage': {
    id: '6',
    type: 'Using Mobile Phone',
    fineAmount: 'â¹5,000 / $120',
    explanation: 'Texting or taking calls while driving causes visual, cognitive, and manual distraction from the road.',
    severity: 'High',
    characterAdvice: 'Traffic Sensei says: Put the phone down! No notification is worth your life. Keep your eyes on the road.',
    riskScore: 70
  }
};

// ==========================================
// 2. ROAD ISSUES DATABASE (RoadWatch Core)
// ==========================================
interface RoadIssueReport {
  id: string;
  type: 'pothole' | 'broken-signal' | 'road-damage' | 'streetlight-out';
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  image?: string; // base64 string
  status: 'Reported' | 'Assigned' | 'Resolved';
  authority: string;
  createdAt: string;
}

const mockAuthorities = {
  'pothole': 'Municipal Public Works Dept',
  'broken-signal': 'City Traffic Management Police',
  'road-damage': 'State Highway Authority',
  'streetlight-out': 'Metro Electricity Board'
};

const issueReports: RoadIssueReport[] = [
  {
    id: 'rep-1',
    type: 'pothole',
    description: 'Massive pothole in the middle of the left lane, forcing cars to swerve dangerously.',
    location: 'Sector 4 Metro Junction',
    latitude: 12.9716,
    longitude: 77.5946,
    status: 'Assigned',
    authority: 'Municipal Public Works Dept',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hrs ago
  },
  {
    id: 'rep-2',
    type: 'broken-signal',
    description: 'The pedestrian crossing signal light is completely dead.',
    location: 'Outer Ring Road near Central Mall',
    latitude: 12.9254,
    longitude: 77.6782,
    status: 'Reported',
    authority: 'City Traffic Management Police',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hrs ago
  }
];

// ==========================================
// 3. EMERGENCY SERVICES DATA (RoadSOS Core)
// ==========================================
interface EmergencyService {
  name: string;
  type: 'Hospital' | 'Police' | 'Ambulance';
  phone: string;
  address: string;
  distance: string;
  status: string;
  latitude: number;
  longitude: number;
}

const emergencyServices: EmergencyService[] = [
  {
    name: 'City General Hospital & Trauma Care',
    type: 'Hospital',
    phone: '102',
    address: '456 Safety Blvd, Sector 4',
    distance: '1.2 km',
    status: '24x7 Emergency Active',
    latitude: 12.9725,
    longitude: 77.5955
  },
  {
    name: 'Metro Accident & Critical Ward',
    type: 'Hospital',
    phone: '102',
    address: '789 Lifesaver Lane, Sector 9',
    distance: '3.4 km',
    status: 'Trauma Surgeons On-Duty',
    latitude: 12.9260,
    longitude: 77.6795
  },
  {
    name: 'Central Highway Police Headquarters',
    type: 'Police',
    phone: '100',
    address: '101 Guardian Plaza, Sector 2',
    distance: '0.8 km',
    status: 'Patrol Units Dispatched',
    latitude: 12.9705,
    longitude: 77.5930
  },
  {
    name: 'Sector 5 Traffic Control Hub',
    type: 'Police',
    phone: '103',
    address: '303 Flow Avenue, Sector 5',
    distance: '2.1 km',
    status: 'Tow Trucks & Rescue Ready',
    latitude: 12.9300,
    longitude: 77.6500
  },
  {
    name: 'Raasta Rescue Ambulance Service',
    type: 'Ambulance',
    phone: '102',
    address: 'Mobile Dispatch Zone A',
    distance: 'Immediate',
    status: '3 Ambulances Stationed',
    latitude: 12.9690,
    longitude: 77.5910
  }
];

// ==========================================
// API ROUTES
// ==========================================

// Get rule guide configurations
app.get('/api/rules', (req: Request, res: Response) => {
  res.json(Object.values(trafficRules));
});

app.get('/api/rules/:type', (req: Request, res: Response) => {
  const type = req.params.type.toLowerCase();
  const rule = trafficRules[type];
  if (rule) {
    res.json(rule);
  } else {
    res.status(404).json({ error: `Rule type '${type}' not found.` });
  }
});

// Get emergency services
app.get('/api/emergency', (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  
  if (lat && lng) {
    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);

    // Calculate actual distance if coordinates available (using quick Manhattan distance for demo speed)
    const servicesWithRealDistance = emergencyServices.map(service => {
      const diffLat = Math.abs(service.latitude - userLat);
      const diffLng = Math.abs(service.longitude - userLng);
      // Rough conversion: 1 degree latitude ~ 111 km
      const distanceKm = Math.sqrt(diffLat * diffLat + diffLng * diffLng) * 111;
      return {
        ...service,
        distance: `${distanceKm.toFixed(1)} km`
      };
    }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    res.json(servicesWithRealDistance);
  } else {
    res.json(emergencyServices);
  }
});

// ==========================================
// NEW: DYNAMIC SIMULATOR & MAP API ROUTES
// ==========================================

// Global in-memory states to simulate real-time road conditions
interface DynamicIncident {
  id: string;
  type: string;
  description: string;
  location: string;
  latOffset: number;
  lngOffset: number;
  severity: string;
  pulse: boolean;
  reportedBy: string;
}

const dynamicRoadStatus: Record<string, 'heavy' | 'moderate' | 'smooth'> = {
  'Cyber Bypass Highway': 'heavy',
  'Sector 5 Tech Corridor': 'moderate',
  'Neon Garden Avenue': 'smooth',
  'Sentinel Ring Road': 'heavy'
};

const dynamicIncidents: DynamicIncident[] = [
  {
    id: 'inc-1',
    type: 'accident',
    description: 'Minor two-wheeler skid at the turning, lane partially blocked.',
    location: 'Cyber Bypass Exit 3',
    latOffset: 0.002,
    lngOffset: -0.002,
    severity: 'High',
    pulse: true,
    reportedBy: 'Road Guardian Patrol'
  },
  {
    id: 'inc-2',
    type: 'pothole',
    description: 'Deep hazardous pothole in high-speed lane.',
    location: 'Sector 5 Tech Corridor',
    latOffset: -0.006,
    lngOffset: 0.002,
    severity: 'Medium',
    pulse: false,
    reportedBy: 'User-1082'
  },
  {
    id: 'inc-3',
    type: 'police',
    description: 'Speed radar interception and compliance radar checkpoints.',
    location: 'Neon Garden Avenue Crossing',
    latOffset: 0.004,
    lngOffset: 0.001,
    severity: 'Low',
    pulse: true,
    reportedBy: 'Traffic Division HQ'
  },
  {
    id: 'inc-4',
    type: 'streetlight-out',
    description: 'Three consecutive streetlights down, high crime/crash risk at night.',
    location: 'Sentinel Ring Road Dark Zone',
    latOffset: -0.010,
    lngOffset: -0.005,
    severity: 'High',
    pulse: false,
    reportedBy: 'Community Shield'
  }
];

// Background simulation loop: runs every 4 seconds to simulate dynamic traffic shifts
setInterval(() => {
  // 1. Shuffling traffic flow densities (40% chance of shift per road segment)
  const statusOptions: ('heavy' | 'moderate' | 'smooth')[] = ['heavy', 'moderate', 'smooth'];
  Object.keys(dynamicRoadStatus).forEach(roadName => {
    if (Math.random() < 0.4) {
      const current = dynamicRoadStatus[roadName];
      const alternatives = statusOptions.filter(s => s !== current);
      dynamicRoadStatus[roadName] = alternatives[Math.floor(Math.random() * alternatives.length)];
    }
  });

  // 2. Dynamic incident spawning / resolving (30% spawn chance, 25% resolve chance)
  if (Math.random() < 0.3 && dynamicIncidents.length < 8) {
    const types = ['accident', 'pothole', 'police', 'streetlight-out'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    const uniqueId = `sim-inc-${Date.now()}`;
    
    let description = 'Automated sensor alert: general corridor slow-down.';
    let location = 'Zone-Alpha Ring Road';
    let severity = 'Medium';
    
    if (chosenType === 'accident') {
      description = 'Multi-vehicle bumper scrap blocking lane 2.';
      location = 'Junction-A Bypass Route';
      severity = 'High';
    } else if (chosenType === 'pothole') {
      description = 'Severe pavement depression reported by smart tires.';
      location = 'Sector 5 Outer Boulevard';
      severity = 'Medium';
    } else if (chosenType === 'police') {
      description = 'Mobile police safety checking unit active.';
      location = 'Westside Highway Corridor';
      severity = 'Low';
    } else if (chosenType === 'streetlight-out') {
      description = 'Light grid failure on local lane segment.';
      location = 'Neon Garden Boulevard north';
      severity = 'High';
    }

    dynamicIncidents.push({
      id: uniqueId,
      type: chosenType,
      description,
      location,
      latOffset: (Math.random() - 0.5) * 0.015,
      lngOffset: (Math.random() - 0.5) * 0.015,
      severity,
      pulse: Math.random() > 0.4,
      reportedBy: 'AI Radar Sentinel'
    });
  } else if (Math.random() < 0.25 && dynamicIncidents.length > 2) {
    // Resolve oldest simulated incident
    const indexToRemove = dynamicIncidents.findIndex(inc => inc.id.startsWith('sim-inc-'));
    if (indexToRemove !== -1) {
      dynamicIncidents.splice(indexToRemove, 1);
    }
  }
}, 4000);

// Get dynamic traffic lines, localized incidents, and heatmap layers
app.get('/api/map-data', (req: Request, res: Response) => {
  const lat = req.query.lat;
  const lng = req.query.lng;

  const userLat = lat ? parseFloat(lat as string) : 12.9716;
  const userLng = lng ? parseFloat(lng as string) : 77.5946;

  // 1. Generate live dynamic traffic polylines centered around user coordinates
  const roads = [
    {
      name: 'Cyber Bypass Highway',
      status: dynamicRoadStatus['Cyber Bypass Highway'],
      coordinates: [
        [userLat - 0.008, userLng - 0.015],
        [userLat - 0.003, userLng - 0.008],
        [userLat + 0.002, userLng - 0.002],
        [userLat + 0.006, userLng + 0.005],
        [userLat + 0.012, userLng + 0.010]
      ]
    },
    {
      name: 'Sector 5 Tech Corridor',
      status: dynamicRoadStatus['Sector 5 Tech Corridor'],
      coordinates: [
        [userLat - 0.012, userLng + 0.005],
        [userLat - 0.006, userLng + 0.002],
        [userLat, userLng - 0.001],
        [userLat + 0.005, userLng - 0.004],
        [userLat + 0.010, userLng - 0.008]
      ]
    },
    {
      name: 'Neon Garden Avenue',
      status: dynamicRoadStatus['Neon Garden Avenue'],
      coordinates: [
        [userLat - 0.005, userLng - 0.012],
        [userLat, userLng - 0.008],
        [userLat + 0.004, userLng + 0.001],
        [userLat + 0.008, userLng + 0.008]
      ]
    },
    {
      name: 'Sentinel Ring Road',
      status: dynamicRoadStatus['Sentinel Ring Road'],
      coordinates: [
        [userLat - 0.015, userLng - 0.005],
        [userLat - 0.010, userLng - 0.005],
        [userLat - 0.002, userLng + 0.006],
        [userLat + 0.005, userLng + 0.012],
        [userLat + 0.011, userLng + 0.015]
      ]
    }
  ];

  // 2. Translate dynamic incident offsets relative to coordinates
  const incidents = dynamicIncidents.map(inc => ({
    id: inc.id,
    type: inc.type,
    description: inc.description,
    location: inc.location,
    latitude: userLat + inc.latOffset,
    longitude: userLng + inc.lngOffset,
    severity: inc.severity,
    pulse: inc.pulse,
    reportedBy: inc.reportedBy
  }));

  // 3. Collect active user-reported incidents that have coordinates
  const userIncidents = issueReports
    .filter(r => r.latitude && r.longitude)
    .map(r => ({
      id: r.id,
      type: r.type,
      description: r.description,
      location: r.location,
      latitude: r.latitude!,
      longitude: r.longitude!,
      severity: r.type === 'broken-signal' || r.type === 'pothole' ? 'High' : 'Medium',
      pulse: true,
      reportedBy: 'Civic Report'
    }));

  const allIncidents = [...userIncidents, ...incidents];

  // 4. Generate dynamic incident heatmap data spots
  const heatmapPoints = allIncidents.map(inc => ({
    latitude: inc.latitude,
    longitude: inc.longitude,
    intensity: inc.severity === 'High' ? 0.95 : inc.severity === 'Medium' ? 0.65 : 0.4
  }));

  res.json({
    center: [userLat, userLng],
    roads,
    incidents: allIncidents,
    heatmap: heatmapPoints
  });
});

// Calculate live road safety risk percentage based on parameters
app.get('/api/risk', (req: Request, res: Response) => {
  const speed = parseFloat(req.query.speed as string) || 40;
  const weather = (req.query.weather as string) || 'Clear';
  const timeOfDay = (req.query.time as string) || 'Day';

  let baseRisk = 12;

  // Speed factor logic
  if (speed > 100) {
    baseRisk += 58;
  } else if (speed > 80) {
    baseRisk += 42;
  } else if (speed > 60) {
    baseRisk += 26;
  } else if (speed > 40) {
    baseRisk += 10;
  }

  // Environmental factors
  if (weather === 'Rainy') {
    baseRisk += 16;
  } else if (weather === 'Foggy') {
    baseRisk += 24;
  }

  if (timeOfDay === 'Night') {
    baseRisk += 10;
  }

  const finalScore = Math.min(100, Math.max(0, baseRisk));

  let classification: 'Safe' | 'Risky' | 'Dangerous' = 'Safe';
  let recommendations: string[] = [];

  if (finalScore >= 70) {
    classification = 'Dangerous';
    recommendations = [
      'CRITICAL DANGER: Slow down immediately! Road friction limits severely reduced.',
      'Rescue Spirit says: High hydroplaning hazard. Keep active hazards and maintain a 50m vehicle gap. ðð¼',
      'Traffic Sensei says: Class dismissed, pull over! Speeds are mathematically illegal under these factors. ð'
    ];
  } else if (finalScore >= 40) {
    classification = 'Risky';
    recommendations = [
      'MODERATE RISK: Surface friction and visibility are degraded.',
      'Road Guardian says: Shield up! Watch out for pothole spots and slow pedestrian zones. ð§ð¡ï¸',
      'Traffic Sensei says: Ease off the accelerator! Stay disciplined on these tarmac bends. ð¦'
    ];
  } else {
    classification = 'Safe';
    recommendations = [
      'OPTIMAL DRIVE INDEX: Road variables are within safe levels.',
      'Traffic Sensei says: Excellent safety discipline. Keep wearing helmets and buckle up! ð¦ð',
      'Road Guardian says: Paths ahead are quiet and secure. Enjoy your journey! ð¡ï¸'
    ];
  }

  res.json({
    riskScore: finalScore,
    classification,
    recommendations
  });
});

// Post a new road issue
app.post('/api/report', (req: Request, res: Response) => {
  const { type, description, location, latitude, longitude, image } = req.body;

  if (!type || !description || !location) {
    return res.status(400).json({ error: 'Missing required fields (type, description, location)' });
  }

  const validTypes = ['pothole', 'broken-signal', 'road-damage', 'streetlight-out'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid issue type provided.' });
  }

  const authority = mockAuthorities[type as keyof typeof mockAuthorities];

  // Dynamically place new incidents in user proximity if no coordinates are input
  const defaultLat = 12.9716;
  const defaultLng = 77.5946;
  
  const finalLat = latitude ? parseFloat(latitude) : (defaultLat + (Math.random() - 0.5) * 0.012);
  const finalLng = longitude ? parseFloat(longitude) : (defaultLng + (Math.random() - 0.5) * 0.012);

  const newReport: RoadIssueReport = {
    id: `rep-${Date.now()}`,
    type,
    description,
    location,
    latitude: finalLat,
    longitude: finalLng,
    image,
    status: 'Reported',
    authority,
    createdAt: new Date().toISOString()
  };

  issueReports.unshift(newReport);
  res.status(201).json(newReport);
});

// Get all reported issues
app.get('/api/reports', (req: Request, res: Response) => {
  res.json(issueReports);
});

// ==========================================
// 4. CHATBOT AND ANIME CHARACTER ENGINE

// ==========================================
// 4. MULTILINGUAL DATABASE AND TRANSLATION ENGINE
// ==========================================
const MULTILINGUAL_DB: Record<string, Record<string, string>> = {
  english: {
    'chat_helmet': 'Raasta AI Guardian: Under Section 129 of the Motor Vehicles Act, helmets are mandatory. Fine: ₹1,000 + 3-month license suspension.',
    'chat_fine': 'Raasta AI Guardian: Penalties: Speeding: ₹2,000; Drunk Driving: ₹10,000; Red Light: ₹5,000; Phone: ₹5,000; Seatbelt: ₹1,000.',
    'chat_hospital': 'Raasta AI Guardian: Nearest Emergency Trauma Centers: 1. City General Hospital (1.2 km); 2. Metro Accident Ward (3.4 km). Dial SOS!',
    'chat_pothole': 'Raasta AI Guardian: Open RoadWatch, select hazard type, lock GPS coordinates and click submit to report.',
    'chat_accident': 'Raasta AI Guardian: First Aid: 1. Apply pressure to bleeding. 2. Chest compressions for CPR. 3. Do not move neck. Dial SOS!',
    'chat_sign': 'Raasta AI Guardian: Signs: Regulatory (Red circles), Warning (Yellow triangles), Informatory (Blue rectangles).',
    'chat_route': 'Raasta AI Guardian: Safest Corridor Route Alpha recommended. Reduces accident probability by 63%.',
    'chat_document': 'Raasta AI Guardian: Mandatory: 1. License; 2. RC; 3. Insurance; 4. PUC.',
    'chat_default': 'Raasta AI Guardian: Ask me about state road laws, fine calculators, first-aid, road signs, or vehicle compliance. Drive safe!',
    'risk_safe': 'Parameters are within stable baseline conditions. Drive responsibly.',
    'risk_warning': 'Caution advised. Minor visibility degradation or road roughness detected. Maintain safe distance rules.',
    'risk_critical': 'High risk detected. Overspeeding or distraction flags combined with adverse environmental factors reduce driver feedback loops. Wear helmet/seatbelt, reduce speed immediately, and eliminate phone use.',
    'rw_summary': 'Local safety sensor flagged a {type} at {location}.',
    'rw_advice': 'Exercise extreme caution when approaching this zone. Reduce speed by 30%.',
    'city_nagpur': 'Traffic flow is steady. Safe transit corridors active on Wardha Road.',
    'city_mumbai': 'Moderate waterlogging near Sion circle. Alternative routes mapped.',
    'city_delhi': 'Air/Visibility values degraded. Use fog lamps on Ring Road Bypass.',
    'city_chennai': 'Safe transit verified. Speeds stable at 50 km/h average.',
    'city_bangalore': 'Avoid Outer Ring Road near Silk Board. Route C offers 22 mins bypass advantage.',
    'city_pune': 'Speeds stable on Katraj bypass. Mind lane merging directions.',
    'city_hyderabad': 'Speeds stable at 80 km/h on ORR. Maintain distance checks.',
    'city_ahmedabad': 'SG highway traffic flowing smoothly. Avoid rapid lane weaving.',
    'city_kolkata': 'Tram corridors active. Slow down near lane intersections.',
    'city_jaipur': 'Heavy tourist vehicles near historic gates. Watch pedestrian margins.',
    'city_default': 'Follow basic compliance regulations. Fasten safety belts.'
  },
  hindi: {
    'chat_helmet': 'रास्ता एआई गार्डियन: मोटर वाहन अधिनियम की धारा 129 के तहत, हेलमेट अनिवार्य है। जुर्माना: ₹1,000 + 3 महीने का लाइसेंस निलंबन।',
    'chat_fine': 'रास्ता एआई गार्डियन: दंड: गति सीमा उल्लंघन: ₹2,000; शराब पीकर गाड़ी चलाना: ₹10,000; सिग्नल कूदना: ₹5,000; फोन का उपयोग: ₹5,000; सीटबेल्ट न पहनना: ₹1,000।',
    'chat_hospital': 'रास्ता एआई गार्डियन: निकटतम आपातकालीन आघात केंद्र: 1. सिटी जनरल अस्पताल (1.2 किमी, डायल 102); 2. मेट्रो दुर्घटना वार्ड (3.4 किमी, डायल 102)।',
    'chat_pothole': 'रास्ता एआई गार्डियन: रोडवॉच पर जाएं, खतरे का प्रकार चुनें, जीपीएस निर्देशांक लॉक करें और ट्रैकिंग टिकट उत्पन्न करने के लिए सबमिट पर क्लिक करें।',
    'chat_accident': 'रास्ता एआई गार्डियन: प्राथमिक चिकित्सा: 1. रक्तस्राव: मजबूत दबाव डालें। 2. सीपीआर: छाती के केंद्र को दबाएं (100 बीपीएम)। 3. गर्दन: रीढ़ को न हिलाएं। एसओएस डायल करें!',
    'chat_sign': 'रास्ता एआई गार्डियन: संकेत: नियामक (लाल वृत्त - उदा. गति सीमा), चेतावनी (पीले त्रिकोण - उदा. स्पीड बम्प), सूचनात्मक (नीले आयत)।',
    'chat_route': 'रास्ता एआई गार्डियन: सबसे सुरक्षित कॉरिडोर रूट अल्फा अनुशंसित है। यह समग्र दुर्घटना संभावना को 63% कम करता है।',
    'chat_document': 'रास्ता एआई गार्डियन: अनिवार्य दस्तावेज: 1. ड्राइविंग लाइसेंस (DL); 2. पंजीकरण प्रमाणपत्र (RC); 3. बीमा; 4. प्रदूषण नियंत्रण प्रमाणपत्र (PUC)।',
    'chat_default': 'रास्ता एआई गार्डियन: स्वागत है! मुझसे राज्य सड़क कानूनों, जुर्माना कैलकुलेटर, प्राथमिक चिकित्सा, सड़क संकेतों या वाहन अनुपालन के बारे में पूछें। सुरक्षित ड्राइव करें!',
    'risk_safe': 'पैरामीटर स्थिर बेसलाइन स्थितियों के भीतर हैं। जिम्मेदारी से ड्राइव करें।',
    'risk_warning': 'सावधानी बरतने की सलाह दी जाती है। मामूली दृश्यता में गिरावट या सड़क की खुरदरापन का पता चला। सुरक्षित दूरी के नियमों का पालन करें।',
    'risk_critical': 'उच्च जोखिम का पता चला। अत्यधिक गति या ध्यान भटकने के संकेत प्रतिकूल पर्यावरणीय कारकों के साथ मिलकर ड्राइवर फीडबैक लूप को कम करते हैं। हेलमेट/सीटबेल्ट पहनें, तुरंत गति कम करें और फोन का उपयोग बंद करें।',
    'rw_summary': 'स्थानीय सुरक्षा सेंसर ने {location} पर एक {type} को चिह्नित किया है।',
    'rw_advice': 'इस क्षेत्र के पास पहुँचते समय अत्यधिक सावधानी बरतें। गति 30% कम करें।',
    'city_nagpur': 'यातायात प्रवाह स्थिर है। वर्धा रोड पर सुरक्षित पारगमन गलियारा सक्रिय है।',
    'city_mumbai': 'सायन सर्कल के पास मध्यम जलभराव। वैकल्पिक मार्ग मानचित्रित किए गए हैं।',
    'city_delhi': 'वायु/दृश्यता मान खराब हो गए हैं। रिंग रोड बाईपास पर फॉग लैंप का उपयोग करें।',
    'city_chennai': 'सुरक्षित पारगमन सत्यापित। गति 50 किमी/घंटा औसत पर स्थिर।',
    'city_bangalore': 'सिल्क बोर्ड के पास आउटर रिंग रोड से बचें। रूट सी 22 मिनट का बाईपास लाभ प्रदान करता है।',
    'city_pune': 'कात्रज बाईपास पर गति स्थिर। लेन विलय दिशाओं का ध्यान रखें।',
    'city_hyderabad': 'ओआरआर पर 80 किमी/घंटा की गति स्थिर। दूरी की जांच बनाए रखें।',
    'city_ahmedabad': 'एसजी हाईवे पर यातायात सुचारू रूप से चल रहा है। तेजी से लेन बदलने से बचें।',
    'city_kolkata': 'ट्राम गलियारे सक्रिय हैं। लेन चौराहों के पास गति धीमी करें।',
    'city_jaipur': 'ऐतिहासिक द्वारों के पास भारी पर्यटक वाहन। पैदल चलने वालों के मार्जिन का ध्यान रखें।',
    'city_default': 'बुनियादी अनुपालन नियमों का पालन करें। सुरक्षा बेल्ट बांधें।'
  },
  marathi: {
    'chat_helmet': 'रास्ता एआय गार्डियन: मोटार वाहन कायद्याच्या कलम १२९ नुसार हेल्मेट अनिवार्य आहे. दंड: ₹१,००० + ३ महिने परवाना निलंबन.',
    'chat_fine': 'रास्ता एआय गार्डियन: दंड: ओव्हरस्पीडिंग: ₹२,०००; मद्यपान करून वाहन चालवणे: ₹१०,०००; लाल दिवा उल्लंघन: ₹५,०००; फोन वापर: ₹५,०००; सीटबेल्ट नाही: ₹१,०००.',
    'chat_hospital': 'रास्ता एआय गार्डियन: जवळचे आपत्कालीन ट्रॉमा केंद्र: १. सिटी जनरल हॉस्पिटल (१.२ किमी, डायल १०२); २. मेट्रो अपघात वॉर्ड (३.४ किमी, डायल १०२).',
    'chat_pothole': 'रास्ता एआय गार्डियन: रोडवॉच वर जा, धोका निवडा, जीपीएस लॉक करा आणि सबमिट दाबा.',
    'chat_accident': 'रास्ता एआय गार्डियन: प्रथमोपचार: १. रक्तस्त्राव: दाब द्या. २. सीपीआर: छाती दाबा (१०० bpm). ३. मान हलवू नका. एसओएस डायल करा!',
    'chat_sign': 'रास्ता एआय गार्डियन: चिन्हे: नियामक (लाल वर्तुळ - उदा. वेग मर्यादा), चेतावणी (पिवळा त्रिकोण - उदा. गतीरोधक), माहितीपूर्ण (निळा आयत).',
    'chat_route': 'रास्ता एआय गार्डियन: सर्वात सुरक्षित मार्ग अल्फा शिफारसित आहे. अपघाताची शक्यता ६३% ने कमी होते.',
    'chat_document': 'रास्ता एआय गार्डियन: आवश्यक कागदपत्रे: १. लायसन्स (DL); २. नोंदणी प्रमाणपत्र (RC); ३. विमा; ४. पीयूसी.',
    'chat_default': 'रास्ता एआय गार्डियन: स्वागत आहे! वाहतूक नियम, दंड, प्रथमोपचार किंवा कागदपत्रांबद्दल विचारा. सुरक्षित प्रवास करा!',
    'risk_safe': 'पॅरामीटर्स स्थिर पातळीवर आहेत. जबाबदारीने वाहन चालवा.',
    'risk_warning': 'सावधगिरी बाळगा. कमी दृश्यता किंवा खराब रस्ता आढळला आहे. अंतर ठेवा.',
    'risk_critical': 'उच्च धोका आढळला. अतिवेग किंवा लक्ष विचलित होणे यामुळे धोका वाढला आहे. हेल्मेट/सीटबेल्ट वापरा आणि वेग कमी करा.',
    'rw_summary': 'स्थानिक सुरक्षा प्रणालीने {location} येथे {type} नोंदवला आहे.',
    'rw_advice': 'या भागातून जाताना काळजी घ्या. वेग ३०% कमी करा.',
    'city_nagpur': 'वाहतूक सुरळीत आहे. वर्धा रोडवरील मार्ग सुरक्षित आहे.',
    'city_mumbai': 'सायन सर्कलजवळ मध्यम पाणी साचले आहे. पर्यायी मार्ग वापरा.',
    'city_delhi': 'धुके वाढले आहे. रिंग रोड बायपासवर फॉग लॅम्प वापरा.',
    'city_chennai': 'मार्ग सुरक्षित आहे. सरासरी वेग ५० किमी/तास ठेवा.',
    'city_bangalore': 'सिल्क बोर्डजवळ बाह्य वळण रस्ता टाळा. मार्ग सी वापरा.',
    'city_pune': 'कात्रज बायपासवर वेग स्थिर. लेन शिस्त पाळा.',
    'city_hyderabad': 'ओआरआर वर वेग स्थिर. सुरक्षित अंतर ठेवा.',
    'city_ahmedabad': 'एसजी हायवे वाहतूक सुरळीत आहे. अचानक लेन बदलू नका.',
    'city_kolkata': 'ट्राम मार्ग सक्रिय. चौकाजवळ वेग कमी करा.',
    'city_jaipur': 'पर्यटक वाहनांची गर्दी आहे. पादचाऱ्यांकडे लक्ष द्या.',
    'city_default': 'वाहतूक नियमांचे पालन करा. सीटबेल्ट लावा.'
  },
  tamil: {
    'chat_helmet': 'ராஸ்தா AI கார்டியன்: மோட்டார் வாகனச் சட்டம் பிரிவு 129 இன் படி, ஹெல்மெட் கட்டாயம். அபராதம்: ₹1,000 + 3 மாத உரிமம் இடைநீக்கம்.',
    'chat_fine': 'ராஸ்தா AI கார்டியன்: அபராதங்கள்: அதிவேகம்: ₹2,000; மது அருந்தி ஓட்டுதல்: ₹10,000; சிக்னல் தாண்டுதல்: ₹5,000; போன்: ₹5,000; சீட்பெல்ட் இல்லை: ₹1,000.',
    'chat_hospital': 'ராஸ்தா AI கார்டியன்: அருகிலுள்ள அவசர சிகிச்சை மையங்கள்: 1. சிட்டி ஜெனரல் மருத்துவமனை (1.2 கி.மீ, டயல் 102); 2. मेट्रो விபத்து வார்டு (3.4 கி.மீ, டயல் 102).',
    'chat_pothole': 'ராஸ்தா AI கார்டியன்: ரோட்வாட்ச் பகுதிக்குச் சென்று, ஆபத்து வகையைத் தேர்ந்தெடுத்து, ஜிபிஎஸ் குறியீடுகளைப் பூட்டி, சமர்ப்பிக்கவும்.',
    'chat_accident': 'ராஸ்தா AI கார்டியன்: முதலுதவி: 1. இரத்தப்போக்கு: அழுத்தம் கொடுக்கவும். 2. சிபிஆர்: மார்பின் மையத்தை அழுத்தவும் (100 bpm). 3. கழுத்து: நகர்த்த வேண்டாம். SOS அழைக்கவும்!',
    'chat_sign': 'ராஸ்தா AI கார்டியன்: சாலைக் குறியீடுகள்: ஒழுங்குமுறை (சிவப்பு வட்டம்), எச்சரிக்கை (மஞ்சள் முக்கோணம்), தகவல் (நீல செவ்வகம்).',
    'chat_route': 'ராஸ்தா AI கார்டியன்: பாதுகாப்பான பாதை ஆல்பா பரிந்துரைக்கப்படுகிறது. இது விபத்து ஆபத்தை 63% குறைக்கிறது.',
    'chat_document': 'ராஸ்தா AI கார்டியன்: தேவையான ஆவணங்கள்: 1. ஓட்டுநர் உரிமம் (DL); 2. பதிவுச் சான்றிதழ் (RC); 3. காப்பீடு; 4. மாசுச் சான்றிதழ் (PUC).',
    'chat_default': 'ராஸ்தா AI கார்டியன்: நல்வரவு! சாலை விதிகள், அபராதம், முதலுதவி, சாலை அறிகுறிகள் பற்றி கேட்கவும். பாதுகாப்பான பயணம்!',
    'risk_safe': 'அளவீடுகள் நிலையான வரம்பிற்குள் உள்ளன. பாதுகாப்பாக ஓட்டவும்.',
    'risk_warning': 'எச்சரிக்கை தேவை. குறைந்த தெரிவுநிலை அல்லது கரடுமுரடான சாலை கண்டறியப்பட்டுள்ளது. இடைவெளி விடவும்.',
    'risk_critical': 'அதிவேகம் அல்லது கவனச்சிதறல் காரணமாக அதிக ஆபத்து உள்ளது. ஹெல்மெட்/சீட்பெல்ட் அணிந்து, வேகத்தை உடனடியாகக் குறைக்கவும்.',
    'rw_summary': 'உள்ளூர் பாதுகாப்பு சென்சார் {location} இல் {type} ஐக் கண்டறிந்துள்ளது.',
    'rw_advice': 'இப்பகுதிக்கு அருகில் செல்லும்போது மிகுந்த எச்சரிக்கையுடன் இருக்கவும். வேகத்தை 30% குறைக்கவும்.',
    'city_nagpur': 'போக்குவரத்து சீராக உள்ளது. வர்தா சாலையில் போக்குவரத்து தடையின்றி இயங்குகிறது.',
    'city_mumbai': 'சைன் சந்திப்பு அருகே மிதமான வெள்ளம். மாற்று வழிகள் வரைபடமாக்கப்பட்டுள்ளன.',
    'city_delhi': 'காற்றின் தரம் குறைந்துள்ளது. ரிங் ரோடு பைபாஸில் பனி விளக்குகளைப் பயன்படுத்தவும்.',
    'city_chennai': 'பாதுகாப்பான போக்குவரத்து உறுதி செய்யப்பட்டது. சராசரி வேகம் 50 கிமீ/மணி.',
    'city_bangalore': 'சில்க் போர்டு அருகே வெளிவட்ட சாலையைத் தவிர்க்கவும். வழித்தடம் சி 22 நிமிடம் மிச்சப்படுத்தும்.',
    'city_pune': 'கத்ராஜ் பைபாஸில் வேகம் சீராக உள்ளது. லேன் மாறும் போது கவனம் செலுத்தவும்.',
    'city_hyderabad': 'ஓஆர்ஆரில் வேகம் சீராக உள்ளது. பாதுகாப்பான தூரத்தை பராமரிக்கவும்.',
    'city_ahmedabad': 'எஸ்જી நெடுஞ்சாலையில் போக்குவரத்து சீராக உள்ளது. திடீரென லேன் மாற வேண்டாம்.',
    'city_kolkata': 'டிராம் பாதைகள் செயல்பாட்டில் உள்ளன. சந்திப்புகளில் வேகத்தைக் குறைக்கவும்.',
    'city_jaipur': 'வரலாற்று நுழைவாயில்கள் அருகே சுற்றுலா வாகனங்கள் அதிகம். பாதசாரிகளை கவனிக்கவும்.',
    'city_default': 'அடிப்படை விதிகளைப் பின்பற்றவும். சீட்பெல்ட் அணியவும்.'
  },
  telugu: {
    'chat_helmet': 'రాస్తా AI గార్డియన్: మోటార్ వాహనాల చట్టం సెక్షన్ 129 ప్రకారం హెల్మెట్ తప్పనిసరి. జరిమానా: ₹1,000 + 3 నెలల లైసెన్స్ రద్దు.',
    'chat_fine': 'రాస్తా AI గార్డియన్: జరిమానాలు: అతివేగం: ₹2,000; మద్యం సేవించి డ్రైవింగ్: ₹10,000; సిగ్నల్ జంప్: ₹5,000; ఫోన్ వాడకం: ₹5,000; సీట్ బెల్ట్ లేకపోవడం: ₹1,000.',
    'chat_hospital': 'రాస్తా AI గార్డియన్: సమీప అత్యవసర కేంద్రాలు: 1. సిటీ జనరల్ హాస్పిటల్ (1.2 కిమీ, డయల్ 102); 2. మెట్రో యాక్సిడెంట్ వార్డ్ (3.4 కిమీ, డయల్ 102).',
    'chat_pothole': 'రాస్తా AI గార్డియన్: రోడ్‌వాచ్ కి వెళ్లి, ప్రమాదం రకాన్ని ఎంచుకుని, జీపీఎస్ లొకేషన్ లాక్ చేసి సమర్పించండి.',
    'chat_accident': 'రాస్తా AI గార్డియన్: ప్రథమ చికిత్స: 1. రక్తస్రావం: గట్టిగా నొక్కండి. 2. సీపీఆర్: ఛాతీ మధ్యలో నొక్కండి. 3. మెడ: కదల్చకండి. SOS కి కాల్ చేయండి!',
    'chat_sign': 'రాస్తా AI గార్డియన్: సంకేతాలు: నియంత్రణ (ఎరుపు వృత్తం), హెచ్చరిక (పసుపు త్రిభుజం), సమాచారం (నీలి దీర్ఘచతురస్రం).',
    'chat_route': 'రాస్తా AI గార్డియన్: అత్యంత సురక్షితమైన మార్గం ఆల్ఫా సిఫార్సు చేయబడింది. ఇది ప్రమాదాల తీవ్రతను 63% తగ్గిస్తుంది.',
    'chat_document': 'రాస్తా AI గార్డియన్: తప్పనిసరి పత్రాలు: 1. డ్రైవింగ్ లైసెన్స్ (DL); 2. రిజిస్ట్రేషన్ సర్టిఫికేట్ (RC); 3. ఇన్సూరెన్స్; 4. పొల్యూషన్ సర్టిఫికేట్ (PUC).',
    'chat_default': 'రాస్తా AI గార్డియన్: స్వాగతం! రహదారి నియమాలు, జరిమానాలు, ప్రథమ చికిత్స లేదా పత్రాల గురించి అడగండి. సురక్షిత ప్రయాణం!',
    'risk_safe': 'పారామితులు సాధారణ స్థితిలో ఉన్నాయి. బాధ్యతాయుతంగా డ్రైవ్ చేయండి.',
    'risk_warning': 'జాగ్రత్త అవసరం. తక్కువ కాంతి లేదా రోడ్డు సరిగా లేదు. సురక్షిత దూరం పాటించండి.',
    'risk_critical': 'అధిక ప్రమాదం ఉంది. అతివేగం లేదా నిర్లక్ష్యం వల్ల ప్రమాదం పెరిగింది. హెల్మెట్/సీట్ బెల్ట్ ధరించి వేగం తగ్గించండి.',
    'rw_summary': 'స్థానిక భద్రతా సెన్సార్ {location} వద్ద {type} ను గుర్తించింది.',
    'rw_advice': 'ఈ ప్రాంతానికి చేరుకునేటప్పుడు చాలా జాగ్రత్తగా ఉండండి. వేగాన్ని 30% తగ్గించండి.',
    'city_nagpur': 'ట్రాఫిక్ సాధారణంగా ఉంది. వార్ధా రోడ్డు మార్గం సురక్షితం.',
    'city_mumbai': 'సైన్ సర్కిల్ వద్ద మోస్తరు నీరు నిలిచింది. ప్రత్యామ్నాయ మార్గాలు ఉన్నాయి.',
    'city_delhi': 'గాలి నాణ్యత తగ్గింది. రింగ్ రోడ్డు బైపాస్ వద్ద ఫాగ్ లైట్లు వాడండి.',
    'city_chennai': 'సురక్షిత ప్రయాణం ధృవీకరించబడింది. సగటు వేగం గంటకు 50 కి.మీ.',
    'city_bangalore': 'సిల్క్ బోర్డు వద్ద ఔటర్ రింగ్ రోడ్ ని నివారించండి. మార్గం సి సమయం ఆదా చేస్తుంది.',
    'city_pune': 'కత్రాజ్ బైపాస్ వద్ద వేగం సాధారణంగా ఉంది. లేన్ మారేటప్పుడు జాగ్రత్త.',
    'city_hyderabad': 'ఓఆర్ఆర్ పై వేగం స్థిరంగా ఉంది. సురక్షిత దూరం పాటించండి.',
    'city_ahmedabad': 'ఎస్జీ హైవే పై ట్రాఫిక్ సాఫీగా సాగుతోంది. సడన్ లేన్ మార్పులు వద్దు.',
    'city_kolkata': 'ట్రామ్ కారిడార్లు యాక్టివ్‌గా ఉన్నాయి. కూడళ్ల వద్ద వేగం తగ్గించండి.',
    'city_jaipur': 'చారిత్రక గేట్ల వద్ద పర్యాటక వాహనాల రద్దీ ఉంది. పాదచారులను గమనించండి.',
    'city_default': 'రహదారి నియమాలు పాటించండి. సీట్ బెల్ట్ ధరించండి.'
  },
  kannada: {
    'chat_helmet': 'ರಾಸ್ತಾ AI ಗಾರ್ಡಿಯನ್: ಮೋಟಾರು ವಾಹನ ಕಾಯ್ದೆ ಸೆಕ್ಷನ್ 129 ರ ಪ್ರಕಾರ ಹೆಲ್ಮೆಟ್ ಕಡ್ಡಾಯ. ದಂಡ: ₹1,000 + 3 ತಿಂಗಳು ಲೈಸೆನ್ಸ್ ಅಮಾನತು.',
    'chat_fine': 'ರಾಸ್ತಾ AI ಗಾರ್ಡಿಯನ್: ದಂಡಗಳು: ಅತಿವೇಗ: ₹2,000; ಮದ್ಯಪಾನ ಮಾಡಿ ಚಾಲನೆ: ₹10,000; ಸಿಗ್ನಲ್ ಜಂಪ್: ₹5,000; ಮೊಬೈಲ್ ಬಳಕೆ: ₹5,000; ಸೀಟ್‌ಬೆಲ್ಟ್ ಇಲ್ಲದಿರುವುದು: ₹1,000.',
    'chat_hospital': 'ರಾಸ್ತಾ AI ಗಾರ್ಡಿಯನ್: ಹತ್ತಿರದ ತುರ್ತು ಚಿಕಿತ್ಸಾ ಕೇಂದ್ರಗಳು: 1. ಸಿಟಿ ಜನರಲ್ ಆಸ್ಪತ್ರೆ (1.2 ಕಿಮೀ, ಡಯಲ್ 102); 2. ಮೆಟ್ರೋ ಅಪಘಾತ ವಾರ್ಡ್ (3.4 ಕಿಮೀ, ಡಯಲ್ 102).',
    'chat_pothole': 'ರಾಸ್ತಾ AI ಗಾರ್ಡಿಯನ್: ರೋಡ್‌ವಾಚ್‌ಗೆ ಹೋಗಿ, ಅಪಾಯದ ಪ್ರಕಾರವನ್ನು ಆರಿಸಿ, ಜಿಪಿಎಸ್ ಲಾಕ್ ಮಾಡಿ ಮತ್ತು ಸಲ್ಲಿಸಿ.',
    'chat_accident': 'ರಾಸ್ತಾ AI ಗಾರ್ಡಿಯನ್: ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ: 1. ರಕ್ತಸ್ರಾವ: ಗಟ್ಟಿಯಾಗಿ ಒತ್ತಿ ಹಿಡಿಯಿರಿ. 2. ಸಿಪಿಆರ್: ಎದೆಯ ಮಧ್ಯಭಾಗವನ್ನು ಒತ್ತಿ. 3. ಕುತ್ತಿಗೆ: ಅಲ್ಲಾಡಿಸಬೇಡಿ. SOS ಗೆ ಕರೆ ಮಾಡಿ!',
    'chat_sign': 'ರಾಸ್ತಾ AI ಗಾರ್ಡಿಯನ್: ಚಿಹ್ನೆಗಳು: ನಿಯಂತ್ರಕ (ಕೆಂಪು ವೃತ್ತ), ಎಚ್ಚರಿಕೆ (ಹಳದಿ ತ್ರಿಕೋನ), ಮಾಹಿತಿ (ನೀಲಿ ಆಯತ).',
    'chat_route': 'ರಾಸ್ತಾ AI ಗಾರ್ಡಿಯನ್: ಸುರಕ್ಷಿತ ಮಾರ್ಗ ಆಲ್ಫಾ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ. ಇದು ಅಪಘಾತದ ಸಾಧ್ಯತೆಯನ್ನು 63% ರಷ್ಟು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.',
    'chat_document': 'ರಾಸ್ತಾ AI ಗಾರ್ಡಿಯನ್: ಕಡ್ಡಾಯ ದಾಖಲೆಗಳು: 1. ಚಾಲನಾ ಪರವಾನಗಿ (DL); 2. ನೋಂದಣಿ ಪತ್ರ (RC); 3. ವಿಮೆ; 4. ಮಾಲಿನ್ಯ ಪ್ರಮಾಣಪತ್ರ (PUC).',
    'chat_default': 'ರಾಸ್ತಾ AI ಗಾರ್ಡಿಯನ್: ಸ್ವಾಗತ! ಸಂಚಾರ ನಿಯಮಗಳು, ದಂಡಗಳು, ಪ್ರಥമ ಚಿಕಿತ್ಸೆ ಅಥವಾ ದಾಖಲೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ. ಸುರಕ್ಷಿತ ಪ್ರಯಾಣ!',
    'risk_safe': 'ನಿಯತಾಂಕಗಳು ಸ್ಥಿರವಾಗಿವೆ. ಜವಾಬ್ದಾರಿಯುತವಾಗಿ ಚಾಲನೆ ಮಾಡಿ.',
    'risk_warning': 'ಎಚ್ಚರಿಕೆ ಅಗತ್ಯ. ಕಡಿಮೆ ಗೋಚರತೆ ಅಥವಾ ರಸ್ತೆ ಸರಿ ಇಲ್ಲದಿರುವುದು ಕಂಡುಬಂದಿದೆ. ಸುರಕ್ಷಿತ ಅಂತರ ಕಾಯ್ದುಕೊಳ್ಳಿ.',
    'risk_critical': 'ಹೆಚ್ಚಿನ ಅಪಾಯವಿದೆ. ಅತಿವೇಗ ಅಥವಾ ಗಮನಹರಿಸದಿರುವುದು ಅಪಾಯವನ್ನು ಹೆಚ್ಚಿಸಿದೆ. ಹೆಲ್ಮೆಟ್/ಸೀಟ್‌ಬೆಲ್ಟ್ ಧರಿಸಿ ವೇಗವನ್ನು ತಗ್ಗಿಸಿ.',
    'rw_summary': 'ಸ್ಥಳೀಯ ಸುರಕ್ಷತಾ ಸೆನ್ಸಾರ್ {location} ನಲ್ಲಿ {type} ಅನ್ನು ಪತ್ತೆ ಮಾಡಿದೆ.',
    'rw_advice': 'ಈ ಪ್ರದೇಶವನ್ನು ಪ್ರವೇಶಿಸುವಾಗ ಹೆಚ್ಚಿನ ಜಾಗರೂಕತೆ ವಹಿಸಿ. ವೇಗವನ್ನು 30% ಕಡಿಮೆ ಮಾಡಿ.',
    'city_nagpur': 'ಸಂಚಾರ ಸುಗಮವಾಗಿದೆ. ವಾರ್ಧಾ ರಸ್ತೆ ಮಾರ್ಗ ಸುರಕ್ಷಿತವಾಗಿದೆ.',
    'city_mumbai': 'ಸಯನ್ ವೃತ್ತದ ಬಳಿ ಸಾಧಾರಣ ನೀರು ನಿಂತಿದೆ. ಪರ್ಯಾಯ ಮಾರ್ಗ ಬಳಸಬಹುದು.',
    'city_delhi': 'ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಕಡಿಮೆಯಾಗಿದೆ. ರಿಂಗ್ ರೋಡ್ ಬೈಪಾಸ್ ಬಳಿ ಫಾಗ್ ಲೈಟ್ ಬಳಸಿ.',
    'city_chennai': 'ಸುರಕ್ಷಿತ ಪ್ರಯಾಣ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ಸರಾಸರಿ ವೇಗ ಗಂಟೆಗೆ 50 ಕಿ.ಮೀ.',
    'city_bangalore': 'ಸಿಲ್ಕ್ ಬೋರ್ಡ್ ಬಳಿ ಹೊರವರ್ತುಲ ರಸ್ತೆ ತಪ್ಪಿಸಿ. ಮಾರ್ಗ ಸಿ ಸಮಯ ಉಳಿಸುತ್ತದೆ.',
    'city_pune': 'ಕಾಟ್ರಾಜ್ ಬೈಪಾಸ್ ವೇಗ ಸ್ಥಿರವಾಗಿದೆ. ಲೇನ್ ಬದಲಾಯಿಸುವಾಗ ಎಚ್ಚರ ಇರಲಿ.',
    'city_hyderabad': 'ಓಆರ್‌ಆರ್‌ನಲ್ಲಿ ವೇಗ ಸ್ಥಿರವಾಗಿದೆ. ಸುರಕ್ಷಿತ ಅಂತರ ಕಾಯ್ದುಕೊಳ್ಳಿ.',
    'city_ahmedabad': 'ಎಸ್ಜಿ ಹೆದ್ದಾರಿಯಲ್ಲಿ ಸಂಚಾರ ಸುಗಮವಾಗಿದೆ. ಲೇನ್ ಬದಲಾಯಿಸುವಾಗ ಎಚ್ಚರ ಇರಲಿ.',
    'city_kolkata': 'ಟ್ರಾಮ್ ಮಾರ್ಗಗಳು ಸಕ್ರಿಯವಾಗಿವೆ. ಕೂಡು ರಸ್ತೆಗಳ ಬಳಿ ವೇಗ ಕಡಿಮೆ ಮಾಡಿ.',
    'city_jaipur': 'ಐತಿಹಾಸಿಕ ಗೇಟ್‌ಗಳ ಬಳಿ ಪ್ರವಾಸಿ ವಾಹನಗಳ ದಟ್ಟಣೆ ಇದೆ. ಪಾದಚಾರಿಗಳ ಬಗ್ಗೆ ಗಮನವಿರಲಿ.',
    'city_default': 'ಸಂಚಾರ ನಿಯಮ ಪಾಲಿಸಿ. ಸೀಟ್‌ಬెಲ್ಟ್ ಧರಿಸಿ.'
  },
  gujarati: {
    'chat_helmet': 'રાસ્તા AI ગાર્ડિયન: મોટર વાહન અધિનિયમની કલમ ૧૨૯ હેઠળ હેલ્મેટ ફરજિયાત છે. દંડ: ₹૧,૦૦૦ + ૩ મહિના માટે લાઇસન્સ સસ્પેન્શન.',
    'chat_fine': 'રાસ્તા AI ગાર્ડિયન: દંડ: અતિશય ઝડપ: ₹૨,૦૦૦; દારૂ પીને ડ્રાઇવિંગ: ₹૧૦,૦૦૦; સિગ્નલ તોડવું: ₹૫,૦૦૦; ફોન વપરાશ: ₹૫,૦૦૦; સીટબેલ્ટ નહીં: ₹૧,૦૦૦.',
    'chat_hospital': 'રાસ્તા AI ગાર્ડિયન: નજીકના ઇમરજન્સી સેન્ટર: ૧. સિટી જનરલ હોસ્પિટલ (૧.૨ કિમી, ડાયલ ૧૦૨); ૨. મેટ્રો અકસ્માત વોર્ડ (૩.૪ કિમી, ડાયલ ૧૦૨).',
    'chat_pothole': 'રાસ્તા AI ગાર્ડિયન: રોડવોચ પર જાઓ, જોખમ પસંદ કરો, જીપીએસ લોક કરો અને સબમિટ કરો.',
    'chat_accident': 'રાસ્તા AI ગાર્ડિયન: પ્રાથમિક સારવાર: ૧. રક્તસ્ત્રાવ: દબાણ આપો. ૨. સીપીઆર: છાતી દબાવો (૧૦૦ bpm). ૩. ગરદન: હલાવશો નહીં. SOS ડાયલ કરો!',
    'chat_sign': 'રાસ્તા AI ગાર્ડિયન: ચિહ્નો: નિયમનકારી (લાલ વર્તુળ), ચેતવણી (પીળો ત્રિકોણ), માહિતીપ્રદ (વાદળી લંબચોરસ).',
    'chat_route': 'રાસ્તા AI ગાર્ડિયન: સૌથી સુરક્ષિત માર્ગ આલ્ફાની ભલામણ કરવામાં આવે છે. તે અકસ્માતની શક્યતા ૬૩% ઘટાડે છે.',
    'chat_document': 'રાસ્તા AI ગાર્ડિયન: ફરજિયાત દસ્તાવેજો: ૧. ડ્રાઇવિંગ લાઇસન્સ (DL); ૨. રજીસ્ટ્રેશન સર્ટિફિકેટ (RC); ૩. વીમો; ૪. પીયુસી.',
    'chat_default': 'રાસ્તા AI ગાર્ડિયન: સ્વાગત છે! ટ્રાફિક નિયમો, દંડ, પ્રાથમિક સારવાર અથવા દસ્તાવેજો વિશે પૂછો. સુરક્ષિત પ્રવાસ!',
    'risk_safe': 'પેરામીટર્સ સામાન્ય છે. જવાબદારીપૂર્વક વાહન ચલાવો.',
    'risk_warning': 'સાવચેતી જરૂરી છે. ઓછી દૃશ્યતા અથવા ખરાબ રસ્તો જોવા મળ્યો છે. સુરક્ષિત અંતર રાખો.',
    'risk_critical': 'મોટું જોખમ છે. અતિ ઝડપ અથવા બેદરકારીથી જોખમ વધ્યું છે. હેલ્મેટ/સીટબેલ્ટ પહેરો અને ઝડપ ઓછી કરો.',
    'rw_summary': 'સ્થાનિક સુરક્ષા સેન્સરે {location} પર {type} જોખમ ઓળખ્યું છે.',
    'rw_advice': 'આ વિસ્તારમાં ડ્રાઇવિંગ કરતી વખતે સાવચેતી રાખો. ઝડપ ૩૦% ઓછી કરો.',
    'city_nagpur': 'ટ્રાફિક પ્રવાહ સામાન્ય છે. વર્ધા રોડ પર ટ્રાફિક સુગમ છે.',
    'city_mumbai': 'સાયન સર્કલ પાસે પાણી ભરાયું છે. વૈકલ્પિક માર્ગનો ઉપયોગ કરો.',
    'city_delhi': 'ધુમ્મસ વધ્યું છે. રિંગ રોડ બાયપાસ પર ફોગ લેમ્પ ચાલુ કરો.',
    'city_chennai': 'માર્ગ સુરક્ષિત છે. સરેરાશ ઝડપ ૫૦ કિમી/કલાક રાખો.',
    'city_bangalore': 'સિલ્ક બોર્ડ પાસે આઉટર રિંગ રોડ ટાળો. માર્ગ સી ૨૨ મિનિટ બચાવશે.',
    'city_pune': 'કાતરાજ બાયપાસ પર સ્પીડ સામાન્ય છે. લેન શિસ્ત જાળવો.',
    'city_hyderabad': 'ઓઆરઆર પર સ્પીડ સ્થિર છે. સુરક્ષિત અંતર રાખો.',
    'city_ahmedabad': 'એસજી હાઇવે પર ટ્રાફિક સરળ છે. અચાનક લેન બદલશો નહીં.',
    'city_kolkata': 'ટ્રામ કાળજીપૂર્વક ક્રોસ કરો. ચાર રસ્તા પાસે ઝડપ ધીમી કરો.',
    'city_jaipur': 'પર્યટક વાહનોની દબાણ છે. રાહદારીઓનું ધ્યાન રાખો.',
    'city_default': 'ટ્રાફિક નિયમોનું પાલન કરો. સીટબેલ્ટ બાંધો.'
  },
  bengali: {
    'chat_helmet': 'রাস্তা AI গার্ডিয়ান: মোটর যানবাহন আইনের ১২৯ ধারা অনুযায়ী হেলমেট বাধ্যতামূলক। জরিমানা: ₹১,০০০ + ৩ মাসের লাইসেন্স বাতিল।',
    'chat_fine': 'রাস্তা AI গার্ডিয়ান: জরিমানা: অতিরিক্ত গতি: ₹২,০০০; মদ্যপ অবস্থায় গাড়ি চালানো: ₹১০,০০০; সিগন্যাল অমান্য: ₹৫,০০০; ফোনের ব্যবহার: ₹৫,০০০; সিটবেল্ট না পরা: ₹১,০০০।',
    'chat_hospital': 'রাস্তা AI গার্ডিয়ান: নিকটতম জরুরি চিকিৎসা কেন্দ্র: ১. সিটি জেনারেল হাসপাতাল (১.২ কিমি, ডায়াল ১০২); ২. মেট্রো অ্যাক্সিডেন্ট ওয়ার্ড (৩.৪ কিমি, ডায়াল ১০২)।',
    'chat_pothole': 'রাস্তা AI গার্ডিয়ান: রোডওয়াচ-এ যান, বিপদের ধরন নির্বাচন করুন, জিপিএস স্থানাঙ্ক লক করুন এবং সাবমিট করুন।',
    'chat_accident': 'রাস্তা AI গার্ডিয়ান: প্রাথমিক চিকিৎসা: ১. রক্তপাত: শক্ত করে চেপে ধরুন। ২. সিপিআর: বুকের মাঝখানে চাপ দিন (১০০ bpm)। ৩. ঘাড়: নাড়াবেন না। SOS কল করুন!',
    'chat_sign': 'রাস্তা AI গার্ডিয়ান: ট্রাফিক চিহ্ন: নিয়ন্ত্রণকারী (লাল বৃত্ত), সতর্কীকরণ (হলুদ ত্রিভুজ), তথ্যমূলক (নীল আয়তক্ষেত্র)।',
    'chat_route': 'রাস্তা AI গার্ডিয়ান: সবচেয়ে নিরাপদ রুট আলফা সুপারিশ করা হচ্ছে। এটি দুর্ঘটনার সম্ভাবনা ৬৩% কমিয়ে দেয়।',
    'chat_document': 'রাস্তা AI গার্ডিয়ান: বাধ্যতামূলক নথি: ১. ড্রাইভিং লাইসেন্স (DL); ২. রেজিস্ট্রেশন সার্টিফিকেট (RC); ৩. ইনসুরেন্স; ৪. পিইউসি সার্টিফিকেট।',
    'chat_default': 'রাস্তা AI গার্ডিয়ান: স্বাগত! ট্রাফিক নিয়ম, জরিমানা, প্রাথমিক চিকিৎসা বা নথিপত্র সম্পর্কে জিজ্ঞাসা করুন। নিরাপদ ভ্রমণ করুন!',
    'risk_safe': 'প্যারামিটার স্বাভাবিক সীমার মধ্যে আছে। দায়িত্বের সাথে গাড়ি চালান।',
    'risk_warning': 'সতর্কতা প্রয়োজন। কম দৃশ্যমানতা বা খারাপ রাস্তা সনাক্ত করা হয়েছে। নিরাপদ দূরত্ব বজায় রাখুন।',
    'risk_critical': 'উচ্চ ঝুঁকি সনাক্ত হয়েছে। গতি কমান এবং অবিলম্বে হেলমেট বা সিটবেল্ট পরিধান করুন।',
    'rw_summary': 'স্থানীয় নিরাপত্তা সেন্সর {location} এ {type} সনাক্ত করেছে।',
    'rw_advice': 'এই এলাকায় যাওয়ার সময় চরম সতর্কতা অবলম্বন করুন। গতি ৩০% হ্রাস করুন।',
    'city_nagpur': 'যানবাহন চলাচল স্বাভাবিক। ওয়ার্ধা রোডের নিরাপত্তা নিশ্চিত করা হয়েছে।',
    'city_mumbai': 'সায়ন সার্কেলের কাছে মাঝারি জল জমেছে। বিকল্প রুট ব্যবহার করুন।',
    'city_delhi': 'কুয়াশার কারণে দৃশ্যমানতা কমেছে। রিং রোড বাইপাসে ফগ ল্যাম্প ব্যবহার করুন।',
    'city_chennai': 'নিরাপদ যাতায়াত নিশ্চিত। গড় গতি ঘণ্টায় ৫০ কিমি।',
    'city_bangalore': 'সিল্ক বোর্ডের কাছে আউটার রিং রোড এড়িয়ে চলুন। রুট সি ব্যবহার করলে ২২ মিনিট বাঁচবে।',
    'city_pune': 'কাতরাজ বাইপাসে গতি স্বাভাবিক। লেন পরিবর্তনের সময় সতর্ক থাকুন।',
    'city_hyderabad': 'ওআরআর-এ গতি স্বাভাবিক। নিরাপদ দূরত্ব বজায় রাখুন।',
    'city_ahmedabad': 'এসজি হাইওয়েতে যান চলাচল স্বাভাবিক। হঠাৎ লেন পরিবর্তন করবেন না।',
    'city_kolkata': 'ট্রাম লাইনে গাড়ি সাবধানে চালান। ক্রসিংয়ের কাছে গতি কমান।',
    'city_jaipur': 'পর্যটকবাহী যানবাহনের ভিড় রয়েছে। পথচারীদের প্রতি লক্ষ্য রাখুন।',
    'city_default': 'ট্রাফিক নিয়ম মেনে চলুন। সিটবেল্ট বাঁধুন।'
  },
  punjabi: {
    'chat_helmet': 'ਰਾਸਤਾ AI ਗਾਰਡੀਅਨ: ਮੋਟਰ ਵਾਹਨ ਐਕਟ ਦੀ ਧਾਰਾ 129 ਤਹਿਤ ਹੈਲਮੇਟ ਲਾਜ਼ਮੀ ਹੈ। ਜੁਰਮਾਨਾ: ₹1,000 + 3 ਮਹੀਨੇ ਦਾ ਲਾਇਸੈਂਸ ਮੁਅੱਤਲ।',
    'chat_fine': 'ਰਾਸਤਾ AI ਗਾਰਡੀਅਨ: ਜੁਰਮਾਨੇ: ਤੇਜ਼ ਰਫ਼ਤਾਰ: ₹2,000; ਸ਼ਰਾਬ ਪੀ ਕੇ ਗੱਡੀ ਚਲਾਉਣਾ: ₹10,000; ਸਿਗਨਲ ਤੋੜਨਾ: ₹5,000; ਫੋਨ ਦੀ ਵਰਤੋਂ: ₹5,000; ਸੀਟਬੈਲਟ ਨਾ ਲਾਉਣਾ: ₹1,000।',
    'chat_hospital': 'ਰਾਸਤਾ AI ਗਾਰਡੀਅਨ: ਨਜ਼ਦੀਕੀ ਐਮਰਜੈਂਸੀ ਟਰਾਮਾ ਸੈਂਟਰ: 1. ਸਿਟੀ ਜਨਰਲ ਹਸਪਤਾਲ (1.2 ਕਿਲੋਮੀਟਰ, ਡਾਇਲ 102); 2. ਮੈਟਰੋ ਐਕਸੀਡੈਂਟ ਵਾਰਡ (3.4 ਕਿਲੋਮੀਟਰ, ਡਾਇਲ 102)।',
    'chat_pothole': 'ਰਾਸਤਾ AI ਗਾਰਡੀਅਨ: ਰੋਡਵਾਚ ਤੇ ਜਾਓ, ਖਤਰੇ ਦੀ ਕਿਸਮ ਚੁਣੋ, ਜੀਪੀਐਸ ਲੋਕੇਸ਼ਨ ਲਾਕ ਕਰੋ ਅਤੇ ਸਬਮਿਟ ਕਰੋ।',
    'chat_accident': 'ਰਾਸਤਾ AI ਗਾਰਡੀਅਨ: ਮੁਢਲੀ ਸਹਾਇਤਾ: 1. ਖੂਨ ਵਹਿਣਾ: ਜ਼ੋਰ ਨਾਲ ਦਬਾਓ। 2. ਸੀਪੀਆਰ: ਛਾਤੀ ਦੇ ਵਿਚਕਾਰ ਦਬਾਓ (100 bpm)। 3. ਗਰਦਨ: ਹਿਲਾਓ ਨਾ। SOS ਡਾਇਲ ਕਰੋ!',
    'chat_sign': 'ਰਾਸਤਾ AI ਗਾਰਡੀਅਨ: ਟ੍ਰੈਫਿਕ ਨਿਸ਼ਾਨ: ਨਿਯਮਿਤ (ਲਾਲ ਚੱਕਰ), ਚੇਤਾਵਨੀ (ਪੀਲਾ ਤਿਕੋਣ), ਜਾਣਕਾਰੀ (ਨੀਲਾ ਚੌਰਸ)।',
    'chat_route': 'ਰਾਸਤਾ AI ਗਾਰਡੀਅਨ: ਸਭ ਤੋਂ ਸੁਰੱਖਿਅਤ ਰੂਟ ਅਲਫ਼ਾ ਦੀ ਸਿਫਾਰਸ਼ ਕੀਤੀ ਜਾਂਦੀ ਹੈ। ਇਹ ਹਾਦਸੇ ਦੀ ਸੰਭਾਵਨਾ ਨੂੰ 63% ਘਟਾਉਂਦਾ ਹੈ।',
    'chat_document': 'ਰਾਸਤਾ AI ਗਾਰਡੀਅਨ: ਲਾਜ਼ਮੀ ਦਸਤਾਵੇਜ਼: 1. ਡਰਾਈਵਿੰਗ ਲਾਇਸੈਂਸ (DL); 2. ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਸਰਟੀਫਿਕੇਟ (RC); 3. ਬੀਮਾ; 4. ਪ੍ਰਦੂਸ਼ਣ ਸਰਟੀਫਿਕੇਟ (PUC)।',
    'chat_default': 'ਰਾਸਤਾ AI ਗਾਰਡੀਅਨ: ਜੀ ਆਇਆਂ ਨੂੰ! ਟ੍ਰੈਫਿਕ ਨਿਯਮਾਂ, ਜੁਰਮਾਨੇ, ਮੁਢਲੀ ਸਹਾਇਤਾ ਜਾਂ ਦਸਤਾਵੇਜ਼ਾਂ ਬਾਰੇ ਪੁੱਛੋ। ਸੁਰੱਖਿਅਤ ਸਫ਼ਰ ਕਰੋ।',
    'risk_safe': 'ਪੈਰਾਮੀਟਰ ਆਮ ਹਨ। ਜ਼ਿੰਮੇਵਾਰੀ ਨਾਲ ਗੱਡੀ ਚਲਾਓ।',
    'risk_warning': 'ਸਾਵਧਾਨੀ ਵਰਤੋ। ਘੱਟ ਦਿਖਣਯੋगਤਾ ਜਾਂ ਖਰਾਬ ਸੜਕ ਦਾ ਪਤਾ ਲੱਗਾ ਹੈ। ਸੁਰੱਖਿਅਤ ਦੂਰੀ ਬਣਾ ਕੇ ਰੱਖੋ।',
    'risk_critical': 'ਉੱਚ ਖਤਰਾ ਹੈ। ਤੇਜ਼ ਰਫ਼ਤਾਰ ਕਾਰਨ ਖਤਰਾ ਵਧਿਆ ਹੈ। ਹੈਲਮੇਟ/ਸੀਟਬੈਲਟ ਦੀ ਵਰਤੋਂ ਕਰੋ ਅਤੇ ਰਫ਼ਤਾਰ ਘਟਾਓ।',
    'rw_summary': 'ਸਥਾਨਕ ਸੁਰੱਖਿਆ ਸੈਂਸਰ ਨੇ {location} ਤੇ {type} ਦਾ ਪਤਾ ਲਗਾਇਆ ਹੈ।',
    'rw_advice': 'ਇਸ ਖੇਤਰ ਵਿੱਚੋਂ ਲੰਘਣ ਵੇਲੇ ਬਹੁਤ ਸਾਵਧਾਨੀ ਵਰਤੋ। ਰਫ਼ਤਾਰ 30% ਘਟਾਓ।',
    'city_nagpur': 'ਟ੍ਰੈਫਿਕ ਆਮ ਵਾਂਗ ਚੱਲ ਰਿਹਾ ਹੈ। ਵਰਧਾ ਰੋਡ ਰੂਟ ਸੁਰੱਖਿਅਤ ਹੈ।',
    'city_mumbai': 'ਸਾਇਨ ਸਰਕਲ ਨੇੜੇ ਪਾਣੀ ਭਰਿਆ ਹੋਇਆ ਹੈ। ਬਦਲਵੇਂ ਰੂਟ ਦੀ ਵਰਤੋਂ ਕਰੋ।',
    'city_delhi': 'ਧੁੰਦ ਕਾਰਨ ਦਿਖਣਯੋਗਤਾ ਘੱਟ ਹੈ। ਰਿੰਗ ਰੋਡ ਬਾਈਪਾਸ ਤੇ ਫਾਗ ਲਾਈਟਾਂ ਚਲਾਓ।',
    'city_chennai': 'ਸੁਰੱਖਿਅਤ ਸਫ਼ਰ ਦੀ ਪੁਸ਼ਟੀ ਕੀਤੀ ਗਈ ਹੈ। ਔਸਤ ਰਫ਼ਤਾਰ 50 ਕਿਲੋਮੀਟਰ ਪ੍ਰਤੀ ਘੰਟਾ ਹੈ।',
    'city_bangalore': 'ਸਿਲਕ ਬੋਰਡ ਨੇੜੇ ਆਊਟਰ ਰਿੰਗ ਰੋਡ ਤੋਂ ਬਚੋ। ਰੂਟ ਸੀ ਦੀ ਵਰਤੋਂ ਕਰੋ।',
    'city_pune': 'ਕਾਤਰਜ ਬਾਈਪਾਸ ਤੇ ਰਫ਼ਤਾਰ ਆਮ ਹੈ। ਲੇਨ ਅਨੁਸ਼ਾਸਨ ਬਣਾਈ ਰੱਖੋ।',
    'city_hyderabad': 'ਓਆਰਆਰ ਤੇ ਰਫ਼ਤਾਰ ਸਥਿਰ ਹੈ। ਸੁਰੱਖਿਅਤ ਦੂਰੀ ਰੱਖੋ।',
    'city_ahmedabad': 'ਐਸਜੀ ਹਾਈਵੇ ਤੇ ਟ੍ਰੈਫਿਕ ਆਸਾਨੀ ਨਾਲ ਚੱਲ ਰਿਹਾ ਹੈ। ਅਚਾਨਕ ਲੇਨ ਨਾ ਬਦਲੋ।',
    'city_kolkata': 'ਟਰਾਮ ਟਰੈਕਾਂ ਕੋਲ ਧਿਆਨ ਨਾਲ ਚਲਾਓ। ਕਰਾਸਿੰਗਾਂ ਨੇੜੇ ਰਫ਼ਤਾਰ ਘਟਾਓ।',
    'city_jaipur': 'ਚਾਰਿਤ੍ਰਕ ਗੇਟਾਂ ਕੋਲ ਸੈਲਾਨੀਆਂ ਦੀ ਭੀੜ ਹੈ। ਪੈਦਲ ਚੱਲਣ ਵਾਲਿਆਂ ਦਾ ਧਿਆਨ ਰੱਖੋ।',
    'city_default': 'ਟ੍ਰੈਫਿਕ ਨਿਯਮਾਂ ਦੀ ਪਾਲਣਾ ਕਰੋ। ਸੀਟਬੈਲਟ ਲਗਾਓ।'
  },
  malayalam: {
    'chat_helmet': 'രാസ്ത AI ഗാർഡിയൻ: മോട്ടോർ വാഹന നിയമം സെക്ഷൻ 129 പ്രകാരം ഹെൽമെറ്റ് നിർബന്ധമാണ്. പിഴ: ₹1,000 + 3 മാസത്തേക്ക് ലൈസൻസ് റദ്ദാക്കൽ.',
    'chat_fine': 'രാസ്ത AI ഗാർഡിയൻ: പിഴകൾ: അമിതവേഗത: ₹2,000; മദ്യപിച്ചുള്ള ഡ്രൈവിംഗ്: ₹10,000; സിഗ്നൽ ലംഘനം: ₹5,000; ഫോൺ ഉപയോഗം: ₹5,000; സീറ്റ് ബെൽറ്റ് ഇല്ലെങ്കിൽ: ₹1,000.',
    'chat_hospital': 'രാസ്ത AI ഗാർഡിയൻ: അടുത്തുള്ള അത്യാഹിത കേന്ദ്രങ്ങൾ: 1. സിറ്റി ജനറൽ ഹോസ്പിറ്റൽ (1.2 കിലോമീറ്റർ, ഡയൽ 102); 2. മെട്രോ ആക്സിഡന്റ് വാർഡ് (3.4 കിലോമീറ്റർ, ഡയൽ 102).',
    'chat_pothole': 'രാസ്ത AI ഗാർഡിയൻ: റോഡ്‌വാച്ചിൽ പോയി, അപകടനില തിരഞ്ഞെടുക്കുക, ജിപിഎസ് ലൊക്കേഷൻ ലോക്ക് ചെയ്ത് സമർപ്പിക്കുക.',
    'chat_accident': 'രാസ്ത AI ഗാർഡിയൻ: പ്രഥമശുശ്രൂഷ: 1. രക്തസ്രാവം: അമർത്തിപ്പിടിക്കുക. 2. സിപിആർ: നെഞ്ചിന്റെ മദ്യഭാഗത്ത് അമർത്തുക (100 bpm). 3. കഴുത്ത്: ചലിപ്പിക്കരുത്. SOS വിളിക്കുക!',
    'chat_sign': 'രാസ്ത AI ഗാർഡിയൻ: ചിഹ്നങ്ങൾ: നിയന്ത്രണം (ചുവന്ന വൃത്തം), മുന്നറിയിപ്പ് (മഞ്ഞ ത്രികോണം), വിവരണം (നീല ചതുരം).',
    'chat_route': 'രാസ്ത AI ഗാർഡിയൻ: ഏറ്റവും സുരക്ഷിതമായ റൂട്ട് ആൽഫ ശുപാർശ ചെയ്യുന്നു. ഇത് അപകടസാധ്യത 63% കുറയ്ക്കുന്നു.',
    'chat_document': 'രാസ്ത AI ഗാർഡിയൻ: നിർബന്ധിത രേഖകൾ: 1. ഡ്രൈവിംഗ് ലൈസൻസ് (DL); 2. രജിസ്ട്രേഷൻ സർട്ടിഫിക്കറ്റ് (RC); 3. ഇൻഷുറൻസ്; 4. പിഒസി സർട്ടിഫിക്കറ്റ്.',
    'chat_default': 'രാസ്ത AI ഗാർഡിയൻ: സ്വാഗതം! ട്രാഫിക് നിയമങ്ങൾ, പിഴകൾ, പ്രഥമശുശ്രൂഷ അല്ലെങ്കിൽ രേഖകളെക്കുറിച്ച് ചോദിക്കുക. സുരക്ഷിത യാത്ര!',
    'risk_safe': 'പാരാമീറ്ററുകൾ സാധാരണ നിലയിലാണ്. ഉത്തരവാദിത്തത്തോടെ ഡ്രൈവ് ചെയ്യുക.',
    'risk_warning': 'ജാഗ്രത പാലിക്കുക. കുറഞ്ഞ കാഴ്ച അല്ലെങ്കിൽ കേടുവന്ന റോഡ് കണ്ടെത്തുന്നു. സുരക്ഷിതമായ അകലം പാലിക്കുക.',
    'risk_critical': 'അപകടസാധ്യത കൂടുതലാണ്. അമിത വേഗത ഒഴിവാക്കുക. ഹെൽമെറ്റ്/സീറ്റ് ബെൽറ്റ് ധരിച്ച് വേഗത കുറയ്ക്കുക.',
    'rw_summary': 'പ്രാദേശിക സുരക്ഷാ സെൻസർ {location} ൽ {type} കണ്ടെത്തിയിരിക്കുന്നു.',
    'rw_advice': 'ഈ പ്രദേശത്തേക്ക് അടുക്കുമ്പോൾ അതീവ ജാഗ്രത പാലിക്കുക. വേഗത 30% കുറയ്ക്കുക.',
    'city_nagpur': 'ഗതാഗതം സാധാരണ നിലയിലാണ്. വാർധ റോഡ് വഴിയുള്ള യാത്ര സുരക്ഷിതമാണ്.',
    'city_mumbai': 'സയൺ സർക്കിളിന് സമീപം ചെറിയ വെള്ളക്കെട്ട്. ബദൽ വഴികൾ ലഭ്യമാണ്.',
    'city_delhi': 'പുകമഞ്ഞ് കാഴ്ച പരിധി കുറിച്ചിരിക്കുന്നു. റിംഗ് റോഡ് ബൈപാസിൽ ഫോഗ് ലാമ്പുകൾ ഉപയോഗിക്കുക.',
    'city_chennai': 'സുരക്ഷിതമായ യാത്ര ഉറപ്പാക്കി. ശരാശരി വേഗം മണിക്കൂറിൽ 50 കി.മീ.',
    'city_bangalore': 'സിൽക്ക് ബോർഡിന് സമീപമുള്ള ഔട്ടർ റിംഗ് റോഡ് ഒഴിവാക്കുക. റൂട്ട് സി സമയം ലാഭിക്കും.',
    'city_pune': 'കത്രാജ് ബൈപാസിൽ വേഗത സാധാരണ നിലയിലാണ്. ലെയ്ൻ നിയമങ്ങൾ പാലിക്കുക.',
    'city_hyderabad': 'ഒആർആറിൽ വേഗത സാധാരണ നിലയിലാണ്. സുരക്ഷിതമായ അകലം പാലിക്കുക.',
    'city_ahmedabad': 'എസ്ജി ഹൈവേയിലെ ഗതാഗതം സുഗമമാണ്. പെട്ടെന്ന് ലെയ്ൻ മാറരുത്.',
    'city_kolkata': 'ട്രാം പാതകളിൽ ഡ്രൈവിംഗ് ശ്രദ്ധിക്കുക. ജംഗ്ഷനുകളിൽ വേഗത കുറയ്ക്കുക.',
    'city_jaipur': 'ചരിത്ര കവാടങ്ങൾക്ക് സമീപം ടൂറിസ്റ്റ് വാഹനങ്ങളുടെ തിരക്ക്. കാൽനടയാത്രക്കാരെ ശ്രദ്ധിക്കുക.',
    'city_default': 'ട്രാഫിക് നിയമങ്ങൾ പാലിക്കുക. സീറ്റ് ബെൽറ്റ് ധരിക്കുക.'
  }
};

function getTranslation(key: string, language: string, type: string = '', location: string = ''): string {
  const lang = (language || 'English').toLowerCase();
  const db = MULTILINGUAL_DB[lang] || MULTILINGUAL_DB['english'];
  let text = db[key] || MULTILINGUAL_DB['english'][key] || '';
  if (type) text = text.replace(/{type}/g, type);
  if (location) text = text.replace(/{location}/g, location);
  return text;
}

// 4. CHATBOT AND ANIME CHARACTER ENGINE
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, isOffline, history, language } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message payload is missing.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const msgLower = message.toLowerCase();
  const langKey = (language || 'English').toLowerCase();

  let matchedKey = 'default';
  if (msgLower.includes('helmet')) matchedKey = 'helmet';
  else if (msgLower.includes('fine') || msgLower.includes('penalty')) matchedKey = 'fine';
  else if (msgLower.includes('hospital') || msgLower.includes('trauma') || msgLower.includes('ambulance')) matchedKey = 'hospital';
  else if (msgLower.includes('pothole') || msgLower.includes('report') || msgLower.includes('damaged signal')) matchedKey = 'pothole';
  else if (msgLower.includes('accident') || msgLower.includes('first aid') || msgLower.includes('cpr') || msgLower.includes('bleed')) matchedKey = 'accident';
  else if (msgLower.includes('sign') || msgLower.includes('road sign')) matchedKey = 'sign';
  else if (msgLower.includes('route') || msgLower.includes('navigation')) matchedKey = 'route';
  else if (msgLower.includes('document') || msgLower.includes('license') || msgLower.includes('insurance')) matchedKey = 'document';

  const fallbackText = getTranslation('chat_' + matchedKey, language);

  // 2. Query Gemini AI if Online and API Key is available
  if (!isOffline && apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const systemPrompt = `You are "Raasta AI Guardian", the centralized safety engine of RaastaSense road safety platform.
Provide professional, legally accurate, and highly reassuring road safety answers. 
Explain laws, speed limits, trauma routing, and accident response. 
Format your responses with clean markdown and list layouts where appropriate. 
If the user's question matches the current context, answer contextually. Limit response to 3-4 structured sentences. Always include relevant road safety emoji.
CRITICAL: You MUST respond in the requested language: \${language || 'English'}. Translate all rules, directions, and values naturally into \${language || 'English'}.`;

      const prompt = `System Instruction: \${systemPrompt}\n\nUser Question: \${message}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return res.json({
        character: 'Raasta AI Guardian',
        text: text.trim(),
        avatarState: msgLower.includes('sos') || msgLower.includes('accident') ? 'alert' : 'neutral'
      });
    } catch (err) {
      console.error('Gemini API Error, falling back to local:', err);
    }
  }

  // Return fallback if offline or API key missing
  res.json({
    character: 'Raasta AI Guardian',
    text: fallbackText,
    avatarState: msgLower.includes('sos') || msgLower.includes('accident') ? 'alert' : 'neutral'
  });
});

// NEW: ROADWATCH SCAN DIAGNOSTICS & AUTHORITY ROUTING
app.post('/api/roadwatch/analyze', async (req: Request, res: Response) => {
  const { type, description, location, latitude, longitude, image, isOffline, language } = req.body;

  if (!type || !description) {
    return res.status(400).json({ error: 'Missing type or description.' });
  }

  // Generate deterministic details
  const trackingId = `RW-2026-\${Math.floor(100000 + Math.random() * 900000)}`;
  
  let authority = 'Municipal Corporation';
  let priority: 'Immediate' | 'High' | 'Medium' | 'Low' = 'Medium';
  let expectedResolution = '3 Days';

  const typeLower = type.toLowerCase();
  if (typeLower.includes('accident') || typeLower.includes('crash')) {
    authority = 'Emergency Services & Highway Police';
    priority = 'Immediate';
    expectedResolution = '4 Hours';
  } else if (typeLower.includes('signal') || typeLower.includes('broken signal')) {
    authority = 'Traffic Control Department';
    priority = 'High';
    expectedResolution = '24 Hours';
  } else if (typeLower.includes('streetlight') || typeLower.includes('light')) {
    authority = 'Metro Electricity Board';
    priority = 'Medium';
    expectedResolution = '24 Hours';
  } else if (typeLower.includes('waterlogging') || typeLower.includes('flood')) {
    authority = 'Municipal Corporation (Drainage Division)';
    priority = 'High';
    expectedResolution = '12 Hours';
  } else if (typeLower.includes('pothole')) {
    authority = 'Public Works Department (PWD)';
    priority = 'Medium';
    expectedResolution = '2 Days';
  } else if (typeLower.includes('crack')) {
    authority = 'Public Works Department (PWD)';
    priority = 'Low';
    expectedResolution = '5 Days';
  } else if (typeLower.includes('obstruction') || typeLower.includes('debris')) {
    authority = 'Municipal Corporation (MC)';
    priority = 'High';
    expectedResolution = '12 Hours';
  } else if (typeLower.includes('garbage')) {
    authority = 'Municipal Corporation (Sanitation)';
    priority = 'Low';
    expectedResolution = '24 Hours';
  } else if (typeLower.includes('construction') || typeLower.includes('negligence')) {
    authority = 'Public Works Department (PWD)';
    priority = 'Medium';
    expectedResolution = '3 Days';
  } else {
    authority = 'Municipal Corporation';
    priority = 'Medium';
    expectedResolution = '3 Days';
  }

  let summary = getTranslation('rw_summary', language, type, location || 'unspecified location');
  let actionAdvice = getTranslation('rw_advice', language);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!isOffline && apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a municipal road safety AI router. Analyze this reported road hazard:
Type: \${type}
Description: \${description}
Location: \${location || 'Unknown'}

Provide a structured response in JSON format in the requested language: \${language || 'English'}.
Do not write markdown wrapping. Return strictly JSON:
{
  "summary": "1-sentence professional summary describing the hazard's impact in \${language || 'English'}",
  "actionAdvice": "1-sentence warning guidelines for driving safety in \${language || 'English'}"
}`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text);
      if (parsed.summary) summary = parsed.summary;
      if (parsed.actionAdvice) actionAdvice = parsed.actionAdvice;
    } catch (e) {
      console.error('Gemini RoadWatch classification error, using local fallback:', e);
    }
  }

  res.json({
    trackingId,
    authority,
    priority,
    expectedResolution,
    summary,
    actionAdvice,
    status: 'Reported',
    createdAt: new Date().toISOString()
  });
});

// NEW: DETERMINISTIC ROAD RISK CALCULATOR WITH GEMINI EXPLANATION
app.post('/api/predict-risk', async (req: Request, res: Response) => {
  const { 
    speed, weather, roadCondition, timeOfDay, visibility, 
    laneDiscipline, seatbeltStatus, phoneUsage, fatigue, isOffline, language 
  } = req.body;

  let baseRisk = 10;
  
  // Telemetry weights
  if (speed > 100) baseRisk += 35;
  else if (speed > 75) baseRisk += 20;
  else if (speed > 50) baseRisk += 8;

  if (weather === 'Rainy') baseRisk += 15;
  else if (weather === 'Foggy') baseRisk += 22;

  if (roadCondition === 'Severe Potholes') baseRisk += 18;
  else if (roadCondition === 'Wet Surface') baseRisk += 8;

  if (timeOfDay === 'Night') baseRisk += 10;
  if (visibility === 'Low') baseRisk += 15;
  else if (visibility === 'Medium') baseRisk += 5;

  if (phoneUsage) baseRisk += 25;
  if (fatigue) baseRisk += 22;
  if (seatbeltStatus === 'Unbuckled') baseRisk += 15;
  if (laneDiscipline === 'Erratic') baseRisk += 20;
  else if (laneDiscipline === 'Drifting') baseRisk += 8;

  const score = Math.min(100, Math.max(0, baseRisk));
  
  let category: 'Safe' | 'Warning' | 'High Risk' | 'Critical' = 'Safe';
  if (score > 85) category = 'Critical';
  else if (score > 67) category = 'High Risk';
  else if (score > 33) category = 'Warning';

  let explanation = getTranslation('risk_' + category.toLowerCase().replace(' ', '_'), language);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!isOffline && apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Analyze these simulator metrics and write a professional 2-sentence road risk explanation in the requested language: \${language || 'English'}:
- Risk Score: \${score}/100
- Risk Category: \${category}
- Current Speed: \${speed} km/h
- Environment: Weather=\${weather}, Time=\${timeOfDay}, RoadCondition=\${roadCondition}, Visibility=\${visibility}
- Driver State: Phone=\${phoneUsage}, Fatigue=\${fatigue}, Seatbelt=\${seatbeltStatus}, LaneDiscipline=\${laneDiscipline}

Keep explanation highly realistic, objective, and command-center professional.`;

      const result = await model.generateContent(prompt);
      explanation = result.response.text().trim();
    } catch (e) {
      console.error('Gemini Risk Prediction error, fallback used:', e);
    }
  }

  res.json({
    riskScore: score,
    riskCategory: category,
    explanation
  });
});

// NEW: ROAD SAFETY INDEX DYNAMIC CITY METRICS
app.post('/api/road-safety-index', async (req: Request, res: Response) => {
  const { city, isOffline, language } = req.body;

  if (!city) {
    return res.status(400).json({ error: 'Missing city name.' });
  }

  // Predefined deterministic indices for major Indian cities
  const cityDataMap: Record<string, { score: number, traffic: string, weather: string, roads: string, readiness: string, advice: string }> = {
    'nagpur': {
      score: 82,
      traffic: 'Moderate',
      weather: 'Optimal (Clear)',
      roads: 'Good (Asphalt)',
      readiness: 'High (3 Trauma hubs, 12 Ambulances active)',
      advice: 'Traffic flow is steady. Safe transit corridors active on Wardha Road.'
    },
    'mumbai': {
      score: 64,
      traffic: 'Heavy Congestion',
      weather: 'Precipitation Warning',
      roads: 'Pothole hazards on Eastern Express Highway',
      readiness: 'Excellent (18 Hospitals active)',
      advice: 'Moderate waterlogging near Sion circle. Alternative routes mapped.'
    },
    'delhi': {
      score: 59,
      traffic: 'Heavy Flow',
      weather: 'Low Haze/Smog',
      roads: 'Good',
      readiness: 'High (National emergency routing active)',
      advice: 'Air/Visibility values degraded. Use fog lamps on Ring Road Bypass.'
    },
    'chennai': {
      score: 75,
      traffic: 'Moderate',
      weather: 'Clear Skies',
      roads: 'Fair',
      readiness: 'Good (IIT Madras zone priority SOS dispatch active)',
      advice: 'Safe transit verified. Speeds stable at 50 km/h average.'
    },
    'bangalore': {
      score: 68,
      traffic: 'Severe congestion (Outer Ring Road)',
      weather: 'Slight drizzle',
      roads: 'Severe pothole clusters in local lanes',
      readiness: 'Moderate (Hospital networks saturated)',
      advice: 'Avoid Outer Ring Road near Silk Board. Route C offers 22 mins bypass advantage.'
    },
    'pune': {
      score: 79,
      traffic: 'Moderate',
      weather: 'Optimal (Clear)',
      roads: 'Fair (Asphalt)',
      readiness: 'High (5 Trauma hubs active)',
      advice: 'Speeds stable on Katraj bypass. Mind lane merging directions.'
    },
    'hyderabad': {
      score: 77,
      traffic: 'Moderate',
      weather: 'Warm/Clear',
      roads: 'Good (Excellent Expressways)',
      readiness: 'High (8 Trauma centers active)',
      advice: 'Speeds stable at 80 km/h on ORR. Maintain distance checks.'
    },
    'ahmedabad': {
      score: 80,
      traffic: 'Low-Moderate (SG Highway)',
      weather: 'Optimal (Clear)',
      roads: 'Good (Asphalt)',
      readiness: 'Good (4 Trauma centers active)',
      advice: 'SG highway traffic flowing smoothly. Avoid rapid lane weaving.'
    },
    'kolkata': {
      score: 62,
      traffic: 'Heavy Congestion (Howrah area)',
      weather: 'Humid/Clear',
      roads: 'Fair (Occasional tram track crossings)',
      readiness: 'Moderate (6 Hospitals active)',
      advice: 'Tram corridors active. Slow down near lane intersections.'
    },
    'jaipur': {
      score: 74,
      traffic: 'Moderate (Walled City Area)',
      weather: 'Warm/Clear',
      roads: 'Fair',
      readiness: 'Good (3 trauma stations active)',
      advice: 'Heavy tourist vehicles near historic gates. Watch pedestrian margins.'
    }
  };

  const key = city.toLowerCase();
  const data = cityDataMap[key] || {
    score: 72,
    traffic: 'Moderate',
    weather: 'Clear',
    roads: 'Fair',
    readiness: 'Standard emergency coverage',
    advice: 'Follow basic compliance regulations. Fasten safety belts.'
  };

  let geminiAdvice = getTranslation('city_' + (cityDataMap[key] ? key : 'default'), language);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!isOffline && apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Provide a concise, professional 1-sentence traffic safety advice for the city of \${city} with these current parameters in the requested language: \${language || 'English'}:
- Traffic Risk: \${data.traffic}
- Weather: \${data.weather}
- Road Condition: \${data.roads}
- Emergency Readiness: \${data.readiness}

Explain briefly which route is recommended.`;

      const result = await model.generateContent(prompt);
      geminiAdvice = result.response.text().trim();
    } catch (e) {
      console.error('Gemini City Index error, fallback used:', e);
    }
  }

  res.json({
    city,
    safetyScore: data.score,
    trafficRisk: data.traffic,
    weatherRisk: data.weather,
    roadCondition: data.roads,
    emergencyReadiness: data.readiness,
    recommendation: geminiAdvice
  });
});
app.get('/api/metrics', async (req: Request, res: Response) => {
  try {
    CloudLogger.info('HTTP GET request received on /api/metrics');
    const stats = await AnalyticsService.getSystemMetrics();
    res.json(stats);
  } catch (e) {
    CloudLogger.error('Failed to resolve system metrics endpoint', e);
    res.status(500).json({ error: 'Failed to retrieve observability telemetry metrics' });
  }
});

// Route analytics logger callback
app.post('/api/analytics/route', async (req: Request, res: Response) => {
  try {
    const { source, destination, selectedRoute, safetyIndex } = req.body;
    CloudLogger.info('Received safe route logging request', { source, destination, selectedRoute, safetyIndex });
    await AnalyticsService.logRouteSelection(source, destination, selectedRoute, safetyIndex);
    await AnalyticsService.incrementMetricCounter('route_requests');
    res.json({ success: true });
  } catch (e) {
    CloudLogger.error('Failed to log safe route request event', e);
    res.status(500).json({ success: false });
  }
});

// Incident watch / Emergency alert logger callback
app.post('/api/analytics/event', async (req: Request, res: Response) => {
  try {
    const { eventType } = req.body;
    CloudLogger.info(`Logging system event: ${eventType}`);
    if (eventType === 'sos_alert') {
      await AnalyticsService.incrementMetricCounter('emergency_requests');
    } else if (eventType === 'report_filed') {
      await AnalyticsService.incrementMetricCounter('alerts_generated');
    }
    res.json({ success: true });
  } catch (e) {
    CloudLogger.error('Failed to log system event callback', e);
    res.status(500).json({ success: false });
  }
});

// ==========================================
// 5. PRODUCTION INTEGRATED FRONTEND SERVING
// ==========================================
// Self-healing check: serve the compiled React SPA if the build is present on disk,
// OR if explicitly declared as production environment.
const shouldServeFrontend = NODE_ENV === 'production' || fs.existsSync(path.join(frontendDistPath, 'index.html'));

if (shouldServeFrontend) {
  console.log(`[Self-Healing] Serving static production assets from: ${frontendDistPath}`);
  
  // Serve Vite React build static files
  app.use(express.static(frontendDistPath));

  // Catch-all route to serve index.html for SPA router (fallback for client-side routing)
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Simple welcome endpoint for dev mode
  app.get('/', (req: Request, res: Response) => {
    res.send('RaastaSense Express API is running in Development mode! (Build frontend to enable dashboard)');
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`RaastaSense backend active on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`========================================`);
});
