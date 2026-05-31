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
// ==========================================
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message payload is missing.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Let's decide which character is best suited to answer based on keywords
  let recommendedCharacter = 'Traffic Sensei';
  let characterAvatarState = 'happy';
  const msgLower = message.toLowerCase();

  if (
    msgLower.includes('emergency') || 
    msgLower.includes('hospital') || 
    msgLower.includes('police') || 
    msgLower.includes('sos') || 
    msgLower.includes('accident') || 
    msgLower.includes('help') ||
    msgLower.includes('first aid') ||
    msgLower.includes('cpr') ||
    msgLower.includes('breathing')
  ) {
    recommendedCharacter = 'Rescue Spirit';
  } else if (
    msgLower.includes('report') || 
    msgLower.includes('road') || 
    msgLower.includes('pothole') || 
    msgLower.includes('signal') || 
    msgLower.includes('damage') || 
    msgLower.includes('broken') ||
    msgLower.includes('streetlight')
  ) {
    recommendedCharacter = 'Road Guardian';
  }

  // Determine avatar expression depending on message tone
  if (msgLower.includes('crash') || msgLower.includes('danger') || msgLower.includes('hurt') || msgLower.includes('critical')) {
    characterAvatarState = 'alert';
  } else if (msgLower.includes('sorry') || msgLower.includes('fine') || msgLower.includes('broke') || msgLower.includes('bad')) {
    characterAvatarState = 'sad';
  } else if (msgLower.includes('thank') || msgLower.includes('awesome') || msgLower.includes('good') || msgLower.includes('great')) {
    characterAvatarState = 'happy';
  } else {
    characterAvatarState = 'neutral';
  }

  // 1) Use Google Gemini API if key is present
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Create a contextual system instruction depending on the character
      let systemPrompt = '';
      if (recommendedCharacter === 'Traffic Sensei') {
        systemPrompt = `You are "Traffic Sensei", a wise, discipline-focused, and friendly anime instructor for RaastaSense.
You use traffic light themes, speak with teacher terms (like "class", "young driver", "learner"), and explain rules and fines strictly but with humor.
Keep responses concise, fun, and highly formatted. Inject emoji: 🚦, 🚗, 🛑. Keep responses under 3-4 sentences.`;
      } else if (recommendedCharacter === 'Road Guardian') {
        systemPrompt = `You are "Road Guardian", a strong, protective, and brave anime knight that watches over city roads for RaastaSense.
You speak like a valiant protector (e.g., "I will guard the streets!", "Safety is our shield!", "Report the danger!").
Encourage users to report issues like potholes and broken signals.
Keep responses concise, brave, and under 3-4 sentences. Inject emoji: 🛡️, 🚧, ⚔️.`;
      } else {
        systemPrompt = `You are "Rescue Spirit", a gentle, comforting, and helpful anime guardian angel for RaastaSense.
Your duty is to keep people calm, instruct them in emergency protocols (first-aid, breathing, finding hospitals), and guide them through stress.
Always sound warm, caring, reassuring, and highly helpful.
Keep responses concise, extremely reassuring, and under 3-4 sentences. Inject emoji: 🚑, 💖, 👼.`;
      }

      const prompt = `System Instruction: ${systemPrompt}\n\nUser Question: ${message}`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return res.json({
        character: recommendedCharacter,
        text: text.trim(),
        avatarState: characterAvatarState
      });
    } catch (err) {
      console.error('Gemini API Error, falling back to local:', err);
      // Fall through to local fallback
    }
  }

  // 2) Deterministic Local Fallback (No AI required)
  let fallbackText = '';
  
  if (recommendedCharacter === 'Traffic Sensei') {
    if (msgLower.includes('fine') || msgLower.includes('cost') || msgLower.includes('amount')) {
      fallbackText = 'Traffic Sensei says: Ah, interested in penalties, are we? Drive carefully! Standard fines range from ₹1,000 for not wearing helmets or seatbelts, up to ₹10,000 for dangerous offences like Drunk Driving. Check our Rule Guide page to learn them all! 🚦';
    } else if (msgLower.includes('speed')) {
      fallbackText = 'Traffic Sensei says: Speed limits are calculations of safety, not high scores! Exceeding the speed limit results in a ₹2,000 fine and massive risk. Slow down! 🚗🛑';
    } else if (msgLower.includes('helmet') || msgLower.includes('bike')) {
      fallbackText = 'Traffic Sensei says: Young rider, your head is precious! Helmets reduce risk of severe injury by 300%. The law mandates it, and so do I! Protect your skull. 🛡️🏍️';
    } else {
      fallbackText = 'Traffic Sensei says: Hello! I am your DriveLegal instructor. Ask me about road fines, safety gear, or traffic laws, and I shall educate you! Remember, discipline is the key to safe streets. 🚦📚';
    }
  } else if (recommendedCharacter === 'Road Guardian') {
    if (msgLower.includes('report') || msgLower.includes('how to')) {
      fallbackText = 'Road Guardian says: Fear not, citizen! Reporting is simple. Go to the RoadWatch tab, choose the issue type (like a Pothole or Broken Signal), write the description, and hit report! I will immediately alert the authorities. 🚧🛡️';
    } else if (msgLower.includes('pothole') || msgLower.includes('damage')) {
      fallbackText = 'Road Guardian says: A pothole is a wound on our streets! Report it in our RoadWatch panel and I shall coordinate with the Municipal Works Dept to get it patched up! Safe travels! 🚧';
    } else {
      fallbackText = 'Road Guardian says: Stand tall! I am the Road Guardian, watching over these tarmac pathways. If you see cracks, craters, or broken signals, report them immediately. Safety is our shield! 🛡️⚔️';
    }
  } else {
    // Rescue Spirit
    if (msgLower.includes('hospital') || msgLower.includes('near')) {
      fallbackText = 'Rescue Spirit says: Deep breath, friend! Near hospitals and emergency services are listed under the RoadSOS tab. City General is at Sector 4 and Metro Trauma is at Sector 9. Let me know if you need numbers! 🚑💖';
    } else if (msgLower.includes('cpr') || msgLower.includes('first aid') || msgLower.includes('help')) {
      fallbackText = 'Rescue Spirit says: Calm down, I am here. For CPR, push hard and fast in the center of the chest at 100-120 beats per minute. Call 102 immediately! I am sending positive healing light your way. 👼💖';
    } else {
      fallbackText = 'Rescue Spirit says: Gently now... I am the Rescue Spirit, here to soothe your stress. If there is a medical issue or collision, open the RoadSOS tab for direct dial buttons. You are not alone! 👼🚑';
    }
  }

  res.json({
    character: recommendedCharacter,
    text: fallbackText,
    avatarState: characterAvatarState
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
