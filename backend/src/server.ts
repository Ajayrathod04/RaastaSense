import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Static asset path resolution for production serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// If transpiled to dist/server.js, the frontend build is located in ../../frontend/dist
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

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

  const newReport: RoadIssueReport = {
    id: `rep-${Date.now()}`,
    type,
    description,
    location,
    latitude: latitude ? parseFloat(latitude) : undefined,
    longitude: longitude ? parseFloat(longitude) : undefined,
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
// 5. PRODUCTION INTEGRATED FRONTEND SERVING
// ==========================================
if (NODE_ENV === 'production') {
  console.log(`Serving static production assets from: ${frontendDistPath}`);
  
  // Serve Vite React build static files
  app.use(express.static(frontendDistPath));

  // Catch-all route to serve index.html for SPA router
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Simple welcome endpoint for dev mode
  app.get('/', (req: Request, res: Response) => {
    res.send('RaastaSense Express API is running in Development mode!');
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`RaastaSense backend active on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`========================================`);
});
