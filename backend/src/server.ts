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
    fineAmount: '₹5,000 / $100',
    explanation: 'Disregarding red traffic signals is a major cause of broadside collisions at intersections.',
    severity: 'High',
    characterAdvice: 'Traffic Sensei says: Red means STOP! Impatience costs lives. Wait for the green light, young motorist!',
    riskScore: 75
  },
  'overspeeding': {
    id: '2',
    type: 'Overspeeding',
    fineAmount: '₹2,000 / $150',
    explanation: 'Exceeding the speed limit dramatically reduces reaction time and increases stopping distance.',
    severity: 'High',
    characterAdvice: 'Traffic Sensei says: Speed limits are not suggestions! Control your speed, or gravity will control you.',
    riskScore: 60
  },
  'drunk-driving': {
    id: '3',
    type: 'Drunk Driving',
    fineAmount: '₹10,000 / $500 + License Suspension',
    explanation: 'Driving under the influence of alcohol severely impairs motor control, reflexes, and cognitive judgment.',
    severity: 'Critical',
    characterAdvice: 'Traffic Sensei says: Extremely dangerous! Never get behind the wheel after drinking. Call a cab, or let the Road Guardian guide you safely.',
    riskScore: 95
  },
  'no-helmet': {
    id: '4',
    type: 'No Helmet',
    fineAmount: '₹1,000 / $50',
    explanation: 'Riding a two-wheeler without a safety helmet increases the chance of fatal traumatic brain injuries by 300%.',
    severity: 'Medium',
    characterAdvice: 'Traffic Sensei says: Protect your brain! A certified helmet is your shield of honor. Don’t ride without it.',
    riskScore: 40
  },
  'no-seatbelt': {
    id: '5',
    type: 'No Seatbelt',
    fineAmount: '₹1,000 / $80',
    explanation: 'Failure to buckle seatbelts reduces vehicle safety cell effectiveness, leading to cabin ejection in crashes.',
    severity: 'Medium',
    characterAdvice: 'Traffic Sensei says: Click it or ticket! Seatbelts keep you anchored in your seat. Fasten it before starting.',
    riskScore: 35
  },
  'mobile-usage': {
    id: '6',
    type: 'Using Mobile Phone',
    fineAmount: '₹5,000 / $120',
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
      'Rescue Spirit says: High hydroplaning hazard. Keep active hazards and maintain a 50m vehicle gap. 🚑👼',
      'Traffic Sensei says: Class dismissed, pull over! Speeds are mathematically illegal under these factors. 🛑'
    ];
  } else if (finalScore >= 40) {
    classification = 'Risky';
    recommendations = [
      'MODERATE RISK: Surface friction and visibility are degraded.',
      'Road Guardian says: Shield up! Watch out for pothole spots and slow pedestrian zones. 🚧🛡️',
      'Traffic Sensei says: Ease off the accelerator! Stay disciplined on these tarmac bends. 🚦'
    ];
  } else {
    classification = 'Safe';
    recommendations = [
      'OPTIMAL DRIVE INDEX: Road variables are within safe levels.',
      'Traffic Sensei says: Excellent safety discipline. Keep wearing helmets and buckle up! 🚦🚗',
      'Road Guardian says: Paths ahead are quiet and secure. Enjoy your journey! 🛡️'
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
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, isOffline, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message payload is missing.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const msgLower = message.toLowerCase();
  let fallbackText = '';

  // 1. Core Deterministic safety rules engine answers for offline/resilience
  if (msgLower.includes('helmet')) {
    fallbackText = 'Raasta AI Guardian: Under Section 129 of the Motor Vehicles Act, helmets are legally mandatory across all Indian states. The fine for riding without a helmet is ₹1,000 and can include a 3-month license suspension. Always secure your strap! 🏍️🚦';
  } else if (msgLower.includes('fine') || msgLower.includes('penalty')) {
    fallbackText = 'Raasta AI Guardian: Standard statutory penalties in India: Overspeeding: ₹2,000 (LMV); Drunk Driving: ₹10,000 and/or up to 6 months jail; Jump Signal: ₹5,000; Mobile Phone use: ₹5,000; No seatbelt: ₹1,000. Fines double for repeat violations. ⚖️🛑';
  } else if (msgLower.includes('hospital') || msgLower.includes('trauma') || msgLower.includes('ambulance')) {
    fallbackText = 'Raasta AI Guardian: Emergency Action: Immediate nearest resources: 1. City General Hospital & Trauma Care (1.2 km, Dial 102); 2. Metro Accident & Critical Ward (3.4 km, Dial 102); 3. Raasta Rescue Mobile Unit (Immediate dispatch). Keep calm, help is on the way! 🚑🏥';
  } else if (msgLower.includes('pothole') || msgLower.includes('report') || msgLower.includes('damaged signal')) {
    fallbackText = 'Raasta AI Guardian: To file a report, select the RoadWatch AI tab, pick the category, specify coordinates or lock current location, write details, and click Submit. Our system automatically generates a Tracking ID and routes to the correct authority (PWD/Municipal Corp) in real time. 🚧📱';
  } else if (msgLower.includes('accident') || msgLower.includes('first aid') || msgLower.includes('cpr') || msgLower.includes('bleed')) {
    fallbackText = 'Raasta AI Guardian: First Aid Guidelines: 1. BLEEDING: Apply direct firm pressure with clean cloth. 2. CPR: Push hard & fast in center of chest (100-120 bpm) to "Staying Alive" rhythm. 3. TRAUMA: Do not move neck/spine unless high fire risk. 4. Dial SOS immediately. 💖👼';
  } else if (msgLower.includes('sign') || msgLower.includes('road sign')) {
    fallbackText = 'Raasta AI Guardian: Traffic Signs are categorized into: 1. REGULATORY (Red circles - e.g. Stop, Speed Limit. Mandated by law); 2. WARNING (Yellow triangles - e.g. Speed Bump, Sharp Bend. Safety awareness); 3. INFORMATORY (Blue rectangles - e.g. Hospital, Parking). 🗺️🚦';
  } else if (msgLower.includes('route') || msgLower.includes('navigation')) {
    fallbackText = 'Raasta AI Guardian: Safest Corridor Route Alpha is currently recommended. It reduces overall accident probability by 63% and bypasses 2 waterlogged sections on Tech corridor. Brakes checked! 🚗🛡️';
  } else if (msgLower.includes('document') || msgLower.includes('license') || msgLower.includes('insurance')) {
    fallbackText = 'Raasta AI Guardian: Every motor vehicle operator on Indian roads must hold: 1. Valid Driving License (DL); 2. Vehicle Registration Certificate (RC); 3. Active third-party/comprehensive Insurance; 4. Pollution Under Control (PUC) certificate. Fines apply up to ₹5,000 for missing docs. 📄💳';
  } else {
    fallbackText = 'Raasta AI Guardian: Welcome to RaastaSense road safety cockpit! Ask me about state laws, fine calculations, first-aid tips, accident responses, road signs, or vehicle compliance checklists. Drive safe! 🛡️🚦';
  }

  // 2. Query Gemini AI if Online and API Key is available
  if (!isOffline && apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const systemPrompt = `You are "Raasta AI Guardian", the centralized safety engine of RaastaSense road safety platform.
Provide professional, legally accurate, and highly reassuring road safety answers. 
Explain laws, speed limits, trauma routing, and accident response. 
Format your responses with clean markdown and list layouts where appropriate. 
If the user's question matches the current context, answer contextually. Limit response to 3-4 structured sentences. Always include relevant road safety emoji.`;

      const prompt = `System Instruction: ${systemPrompt}\n\nUser Question: ${message}`;
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
  const { type, description, location, latitude, longitude, image, isOffline } = req.body;

  if (!type || !description) {
    return res.status(400).json({ error: 'Missing type or description.' });
  }

  // Generate deterministic details
  const trackingId = `RW-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  
  let authority = 'Municipal Corporation';
  let priority: 'Immediate' | 'High' | 'Medium' | 'Low' = 'Medium';
  let expectedResolution = '3 Days';

  const typeLower = type.toLowerCase();
  if (typeLower.includes('accident') || typeLower.includes('collision')) {
    authority = 'Emergency Services & Traffic Police';
    priority = 'Immediate';
    expectedResolution = '4 Hours';
  } else if (typeLower.includes('signal') || typeLower.includes('light')) {
    authority = 'Traffic Control Department';
    priority = 'High';
    expectedResolution = '24 Hours';
  } else if (typeLower.includes('waterlogging') || typeLower.includes('flooding')) {
    authority = 'Municipal Corporation (Drainage Division)';
    priority = 'High';
    expectedResolution = '12 Hours';
  } else if (typeLower.includes('pothole') || typeLower.includes('broken')) {
    authority = 'Public Works Department (PWD)';
    priority = 'Medium';
    expectedResolution = '2 Days';
  } else if (typeLower.includes('highway') || typeLower.includes('expressway')) {
    authority = 'National Highway Authority (NHAI)';
    priority = 'Medium';
    expectedResolution = '3 Days';
  }

  let summary = `Local safety sensor flagged a ${type} at ${location || 'unspecified location'}.`;
  let actionAdvice = 'Exercise extreme caution when approaching this zone. Reduce speed by 30%.';

  const apiKey = process.env.GEMINI_API_KEY;
  if (!isOffline && apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a municipal road safety AI router. Analyze this reported road hazard:
Type: ${type}
Description: ${description}
Location: ${location || 'Unknown'}

Provide a structured response in JSON format. Do not write markdown wrapping. Return strictly JSON:
{
  "summary": "1-sentence professional summary describing the hazard's impact",
  "actionAdvice": "1-sentence warning guidelines for driving safety"
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
    laneDiscipline, seatbeltStatus, phoneUsage, fatigue, isOffline 
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

  let explanation = `Parameters are within stable baseline conditions. Drive responsibly.`;
  if (category === 'Critical' || category === 'High Risk') {
    explanation = `High risk detected. Overspeeding or distraction flags combined with adverse environmental factors reduce driver feedback loops. Wear helmet/seatbelt, reduce speed immediately, and eliminate phone use.`;
  } else if (category === 'Warning') {
    explanation = `Caution advised. Minor visibility degradation or road roughness detected. Maintain safe distance rules.`;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!isOffline && apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Analyze these simulator metrics and write a professional 2-sentence road risk explanation:
- Risk Score: ${score}/100
- Risk Category: ${category}
- Current Speed: ${speed} km/h
- Environment: Weather=${weather}, Time=${timeOfDay}, RoadCondition=${roadCondition}, Visibility=${visibility}
- Driver State: Phone=${phoneUsage}, Fatigue=${fatigue}, Seatbelt=${seatbeltStatus}, LaneDiscipline=${laneDiscipline}

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
  const { city, isOffline } = req.body;

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

  let geminiAdvice = data.advice;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!isOffline && apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Provide a concise, professional 1-sentence traffic safety advice for the city of ${city} with these current parameters:
- Traffic Risk: ${data.traffic}
- Weather: ${data.weather}
- Road Condition: ${data.roads}
- Emergency Readiness: ${data.readiness}

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

// ==========================================
// 4.5 OBSERVABILITY METRICS & LOGGING
// ==========================================
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
