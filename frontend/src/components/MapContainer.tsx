import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers, Eye, Compass, ShieldAlert } from "lucide-react";

interface MapRoad {
  name: string;
  status: "heavy" | "moderate" | "smooth";
  coordinates: number[][]; // [lat, lng][]
}

interface MapIncident {
  id: string;
  type: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  severity: string;
  pulse?: boolean;
  reportedBy?: string;
}

interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
}

interface MapContainerProps {
  userCoords: { lat: number; lng: number } | null;
  roads: MapRoad[];
  incidents: MapIncident[];
  heatmap: HeatmapPoint[];
  onMapClick?: (lat: number, lng: number) => void;
  activeLayer: "standard" | "traffic" | "heatmap";
  setActiveLayer: (layer: "standard" | "traffic" | "heatmap") => void;
  selectedRoute?: number[][];
  sosActive?: boolean;
  sosCoords?: { lat: number; lng: number } | null;
}

const MOCK_EMERGENCY_NODES = [
  { name: "City General Hospital & Trauma Care", lat: 12.9925, lng: 80.2356, type: "hospital", phone: "102" },
  { name: "Metro Accident & Critical Ward", lat: 12.9860, lng: 80.2315, type: "hospital", phone: "102" },
  { name: "Central Highway Police Headquarters", lat: 12.9945, lng: 80.2320, type: "police", phone: "100" },
  { name: "Sector 5 Traffic Control Hub", lat: 12.9890, lng: 80.2395, type: "police", phone: "103" },
  { name: "Raasta Rescue Ambulance Station B", lat: 12.9910, lng: 80.2370, type: "ambulance", phone: "102" }
];

export default function MapContainer({
  userCoords,
  roads,
  incidents,
  heatmap,
  onMapClick,
  activeLayer,
  setActiveLayer,
  selectedRoute,
  sosActive = false,
  sosCoords = null,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const lastCenteredCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Digital Twin Command Center Layer Visibility States
  const [layers, setLayers] = useState({
    traffic: true,
    hotspots: true,
    reports: true,
    roadQuality: true,
    hospital: true,
    police: true,
    safeRoute: true,
    riskPrediction: true
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter = userCoords
      ? [userCoords.lat, userCoords.lng]
      : [21.1458, 79.0882];

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: initialCenter as L.LatLngExpression,
      zoom: 15,
      zoomControl: false, 
      attributionControl: false,
    });

    // Add CartoDB Dark Matter tile layer
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 20 }
    ).addTo(map);

    // Custom Zoom controls
    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    layersGroupRef.current = L.layerGroup().addTo(map);

    // Map click registration
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update center when userCoords changes
  useEffect(() => {
    if (!mapRef.current || !userCoords) return;

    const hasChanged = !lastCenteredCoordsRef.current ||
      lastCenteredCoordsRef.current.lat !== userCoords.lat ||
      lastCenteredCoordsRef.current.lng !== userCoords.lng;

    if (hasChanged) {
      // Pan to user coords
      mapRef.current.setView(
        [userCoords.lat, userCoords.lng] as L.LatLngExpression,
        mapRef.current.getZoom(),
      );
      lastCenteredCoordsRef.current = { lat: userCoords.lat, lng: userCoords.lng };
    }

    // Update or create User Pulse Marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([
        userCoords.lat,
        userCoords.lng,
      ] as L.LatLngExpression);
    } else {
      const userIcon = L.divIcon({
        className: "custom-user-marker",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 bg-sky-500 rounded-full animate-ping opacity-60"></div>
            <div class="relative w-4 h-4 bg-sky-400 border-2 border-white rounded-full shadow-[0_0_10px_#38bdf8]"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      userMarkerRef.current = L.marker(
        [userCoords.lat, userCoords.lng] as L.LatLngExpression,
        { icon: userIcon }
      )
        .addTo(mapRef.current)
        .bindPopup(
          `
          <div class="p-2 text-slate-100 font-sans text-xs bg-slate-900 border border-slate-800 rounded-lg">
            <span class="font-extrabold text-sky-400 block">⭐ ACTIVE VEHICLE NODE</span>
            <span>Lat: ${userCoords.lat.toFixed(5)}<br/>Lng: ${userCoords.lng.toFixed(5)}</span>
          </div>
        `,
          { closeButton: false }
        );
    }
  }, [userCoords]);

  // Redraw Layers when data, active theme, or visibilities change
  useEffect(() => {
    const map = mapRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    // Clear existing layers
    layersGroup.clearLayers();

    // 1. Draw Road Layers (Traffic / Road Quality)
    if (layers.traffic || layers.roadQuality) {
      roads.forEach((road) => {
        const pathCoords = road.coordinates.map(
          (c) => [c[0], c[1]] as L.LatLngExpression
        );

        let strokeColor = "#10b981"; // smooth flow (green)
        let strokeWidth = 4;
        let strokeDash = "";

        if (layers.roadQuality && road.name.includes("Corridor")) {
          // Color code poor road quality
          strokeColor = "#f43f5e"; // poor (red)
          strokeDash = "5, 5";
          strokeWidth = 5;
        } else if (layers.traffic) {
          if (road.status === "heavy") {
            strokeColor = "#f43f5e"; // red
            strokeWidth = 6;
          } else if (road.status === "moderate") {
            strokeColor = "#f59e0b"; // amber
            strokeWidth = 5;
          }
        }

        const polyline = L.polyline(pathCoords, {
          color: strokeColor,
          weight: strokeWidth,
          opacity: 0.8,
          dashArray: strokeDash,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(layersGroup);

        polyline.bindPopup(`
          <div class="p-2 font-sans text-xs text-slate-200">
            <span class="font-black text-slate-100 block uppercase">${road.name}</span>
            <div class="flex items-center space-x-1.5 mt-1">
              <span class="w-2 h-2 rounded-full" style="background-color: ${strokeColor}"></span>
              <span class="font-bold text-[10px] capitalize">${layers.roadQuality && road.name.includes("Corridor") ? "Poor Quality Asphalt" : road.status + " traffic"}</span>
            </div>
          </div>
        `);
      });
    }

    // 2. Draw Citizen Reports
    if (layers.reports) {
      incidents.forEach((inc) => {
        let iconHtml = "⚠️";
        let iconColorClass = "bg-amber-600 border-amber-400";
        let shadowGlowClass = "shadow-[0_0_10px_#f59e0b]";

        if (inc.type === "accident") {
          iconHtml = "🚨";
          iconColorClass = "bg-rose-600 border-rose-400";
          shadowGlowClass = "shadow-[0_0_12px_#f43f5e]";
        } else if (inc.type === "police") {
          iconHtml = "👮";
          iconColorClass = "bg-sky-600 border-sky-400";
          shadowGlowClass = "shadow-[0_0_10px_#0ea5e9]";
        } else if (inc.type === "streetlight") {
          iconHtml = "🌙";
          iconColorClass = "bg-slate-700 border-slate-500";
          shadowGlowClass = "shadow-[0_0_5px_#94a3b8]";
        }

        const customDivIcon = L.divIcon({
          className: `custom-incident-${inc.id}`,
          html: `
            <div class="relative flex items-center justify-center">
              ${inc.pulse ? `<div class="absolute w-8 h-8 rounded-full animate-ping opacity-40 bg-amber-500"></div>` : ""}
              <div class="relative w-6.5 h-6.5 rounded-lg border flex items-center justify-center text-white text-xs font-black ${iconColorClass} ${shadowGlowClass}">
                ${iconHtml}
              </div>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        L.marker([inc.latitude, inc.longitude] as L.LatLngExpression, {
          icon: customDivIcon,
        }).addTo(layersGroup).bindPopup(`
          <div class="p-2.5 font-sans text-xs text-slate-100">
            <span class="px-1.5 py-0.5 text-[8px] uppercase tracking-wider rounded font-black bg-slate-800 text-slate-300 border border-slate-700 block w-max mb-1.5">
              ${inc.type.toUpperCase()}
            </span>
            <p class="font-bold text-slate-200 mb-1">${inc.description}</p>
            <p class="text-[10px] text-slate-400">Location: ${inc.location}</p>
            <span class="text-[9px] text-slate-500 block border-t border-slate-800 pt-1.5 mt-1.5">
              Reported by: ${inc.reportedBy || "Citizen Core"}
            </span>
          </div>
        `);
      });
    }

    // 3. Draw Accident Hotspots
    if (layers.hotspots) {
      heatmap.forEach((point) => {
        L.circle([point.latitude, point.longitude], {
          radius: 110,
          fillColor: "#ef4444",
          fillOpacity: point.intensity * 0.35,
          color: "#ef4444",
          weight: 1.5,
          dashArray: "3, 5",
        }).addTo(layersGroup).bindPopup(`
          <div class="p-1.5 text-[10px] font-sans text-slate-200">
            <span class="text-rose-400 font-extrabold block">🚨 ACCIDENT HOTSPOT ZONE</span>
            <span>Historical probability: ${(point.intensity * 100).toFixed(0)}% risk index</span>
          </div>
        `);
      });
    }

    // 4. Draw Emergency Networks
    if (layers.hospital || layers.police) {
      MOCK_EMERGENCY_NODES.forEach((node, idx) => {
        if (node.type === "hospital" && !layers.hospital) return;
        if (node.type === "police" && !layers.police) return;
        if (node.type === "ambulance" && !layers.hospital && !layers.police) return;

        let iconHtml = "🏥";
        let colorClass = "bg-rose-500 border-rose-350 shadow-[0_0_10px_#f43f5e]";
        if (node.type === "police") {
          iconHtml = "👮";
          colorClass = "bg-blue-600 border-blue-450 shadow-[0_0_10px_#2563eb]";
        } else if (node.type === "ambulance") {
          iconHtml = "🚑";
          colorClass = "bg-emerald-600 border-emerald-400 shadow-[0_0_10px_#10b981]";
        }

        const markerIcon = L.divIcon({
          className: `emergency-node-${idx}`,
          html: `
            <div class="w-6 h-6 rounded-full border flex items-center justify-center text-[10px] text-white font-black ${colorClass}">
              ${iconHtml}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        L.marker([node.lat, node.lng] as L.LatLngExpression, { icon: markerIcon })
          .addTo(layersGroup)
          .bindPopup(`
            <div class="p-2 text-xs font-sans text-slate-250">
              <span class="font-black text-slate-100 block">${node.name}</span>
              <span class="text-[9px] px-1 py-0.5 bg-slate-800 text-slate-300 rounded font-bold capitalize mr-2">${node.type} node</span>
              <span class="text-[10px] text-sky-400 font-mono">Dial: ${node.phone}</span>
            </div>
          `);
      });
    }

    // 5. Draw Risk Predictions
    if (layers.riskPrediction) {
      // Draw dynamic caution zones around predicted hotspots
      L.circle([12.9950, 80.2375], {
        radius: 160,
        fillColor: "#f59e0b",
        fillOpacity: 0.12,
        color: "#f59e0b",
        weight: 1.5,
        dashArray: "6, 6"
      }).addTo(layersGroup).bindPopup(`
        <div class="p-2 text-xs font-sans text-slate-200">
          <span class="font-extrabold text-amber-500 block">⚠️ DYNAMIC CAUTION ZONE</span>
          <span>Risk model predicts high friction loss. Rain expected. Reduce speed limit.</span>
        </div>
      `);
    }

    // 6. Draw Safe Routes (with moving dash animation)
    if (layers.safeRoute && selectedRoute && selectedRoute.length > 0) {
      const routeCoords = selectedRoute.map(
        (c) => [c[0], c[1]] as L.LatLngExpression
      );

      // Neon purple outer aura
      L.polyline(routeCoords, {
        color: "#a855f7",
        weight: 8,
        opacity: 0.35,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layersGroup);

      // Neon cyan inner core with css class for moving dashes
      L.polyline(routeCoords, {
        color: "#22d3ee",
        weight: 4,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
        className: "animated-route-line"
      } as any).addTo(layersGroup);

      // Start & End markers
      const startPoint = routeCoords[0];
      const endPoint = routeCoords[routeCoords.length - 1];

      const startIcon = L.divIcon({
        className: "start-marker",
        html: `<div class="w-3 h-3 rounded-full bg-emerald-500 border border-white animate-pulse shadow-[0_0_8px_#10b981]"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const endIcon = L.divIcon({
        className: "end-marker",
        html: `<div class="w-3 h-3 rounded-full bg-purple-500 border border-white animate-pulse shadow-[0_0_8px_#a855f7]"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      L.marker(startPoint, { icon: startIcon }).addTo(layersGroup).bindPopup("Route Origin");
      L.marker(endPoint, { icon: endIcon }).addTo(layersGroup).bindPopup("Route Destination");
    }

    // 7. Draw SOS Incident Beacons
    if (sosActive && sosCoords) {
      const sosIcon = L.divIcon({
        className: "emergency-sos-marker",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 bg-red-600 rounded-full animate-ping opacity-60"></div>
            <div class="relative w-8 h-8 bg-red-500 border-2 border-white rounded-xl shadow-[0_0_15px_#f43f5e] flex items-center justify-center text-white text-xs font-black">
              🚨
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([sosCoords.lat, sosCoords.lng] as L.LatLngExpression, {
        icon: sosIcon,
      }).addTo(layersGroup).bindPopup(`
        <div class="p-2 text-rose-400 bg-slate-900 border border-red-500/30 rounded-lg text-xs font-sans">
          <span class="font-extrabold block">🚨 EMERGENCY SOS ACTIVATED</span>
          <span>Lat: ${sosCoords.lat.toFixed(5)}<br/>Lng: ${sosCoords.lng.toFixed(5)}</span>
        </div>
      `, { closeButton: false }).openPopup();
    }

    // Recalculate sizes
    setTimeout(() => map.invalidateSize(), 150);
  }, [roads, incidents, heatmap, activeLayer, selectedRoute, sosActive, sosCoords, layers]);

  // Recenter Helper
  const handleRecenter = () => {
    if (mapRef.current && userCoords) {
      mapRef.current.setView(
        [userCoords.lat, userCoords.lng] as L.LatLngExpression,
        15,
      );
      lastCenteredCoordsRef.current = { lat: userCoords.lat, lng: userCoords.lng };
    }
  };

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden border border-slate-900 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Map Element Container */}
      <div ref={mapContainerRef} className="w-full h-full bg-[#080c16]" />

      {/* Cyberpunk Map UI Controls Header */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-2 pr-4">
        {/* Layer Toggler Buttons */}
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-900 p-1 rounded-2xl flex items-center space-x-1 shadow-2xl">
          <button
            onClick={() => setActiveLayer("standard")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition duration-150 ${
              activeLayer === "standard"
                ? "bg-sky-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Standard</span>
          </button>

          <button
            onClick={() => setActiveLayer("traffic")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition duration-150 ${
              activeLayer === "traffic"
                ? "bg-sky-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Traffic</span>
          </button>

          <button
            onClick={() => setActiveLayer("heatmap")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition duration-150 ${
              activeLayer === "heatmap"
                ? "bg-sky-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>
        </div>

        {/* Floating Command Panel Layer Toggler */}
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-900 px-3 py-2 rounded-2xl flex flex-wrap gap-2 items-center shadow-2xl">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-1">Command Overlays:</span>
          
          <label className="flex items-center space-x-1 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-white transition">
            <input 
              type="checkbox" 
              checked={layers.traffic}
              onChange={() => setLayers(prev => ({ ...prev, traffic: !prev.traffic }))}
              className="rounded accent-sky-500 bg-slate-900 border-slate-800 focus:ring-0 cursor-pointer"
            />
            <span>Traffic</span>
          </label>

          <label className="flex items-center space-x-1 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-white transition">
            <input 
              type="checkbox" 
              checked={layers.hotspots}
              onChange={() => setLayers(prev => ({ ...prev, hotspots: !prev.hotspots }))}
              className="rounded accent-sky-500 bg-slate-900 border-slate-800 focus:ring-0 cursor-pointer"
            />
            <span>Hotspots</span>
          </label>

          <label className="flex items-center space-x-1 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-white transition">
            <input 
              type="checkbox" 
              checked={layers.reports}
              onChange={() => setLayers(prev => ({ ...prev, reports: !prev.reports }))}
              className="rounded accent-sky-500 bg-slate-900 border-slate-800 focus:ring-0 cursor-pointer"
            />
            <span>Reports</span>
          </label>

          <label className="flex items-center space-x-1 text-[10px] font-bold text-slate-405 cursor-pointer hover:text-white transition">
            <input 
              type="checkbox" 
              checked={layers.roadQuality}
              onChange={() => setLayers(prev => ({ ...prev, roadQuality: !prev.roadQuality }))}
              className="rounded accent-sky-500 bg-slate-900 border-slate-800 focus:ring-0 cursor-pointer"
            />
            <span>Road Quality</span>
          </label>

          <label className="flex items-center space-x-1 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-white transition">
            <input 
              type="checkbox" 
              checked={layers.hospital}
              onChange={() => setLayers(prev => ({ ...prev, hospital: !prev.hospital }))}
              className="rounded accent-sky-500 bg-slate-900 border-slate-800 focus:ring-0 cursor-pointer"
            />
            <span>Hospital</span>
          </label>

          <label className="flex items-center space-x-1 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-white transition">
            <input 
              type="checkbox" 
              checked={layers.police}
              onChange={() => setLayers(prev => ({ ...prev, police: !prev.police }))}
              className="rounded accent-sky-500 bg-slate-900 border-slate-800 focus:ring-0 cursor-pointer"
            />
            <span>Police</span>
          </label>

          <label className="flex items-center space-x-1 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-white transition">
            <input 
              type="checkbox" 
              checked={layers.safeRoute}
              onChange={() => setLayers(prev => ({ ...prev, safeRoute: !prev.safeRoute }))}
              className="rounded accent-sky-500 bg-slate-900 border-slate-800 focus:ring-0 cursor-pointer"
            />
            <span>Safe Corridor</span>
          </label>

          <label className="flex items-center space-x-1 text-[10px] font-bold text-slate-400 cursor-pointer hover:text-white transition">
            <input 
              type="checkbox" 
              checked={layers.riskPrediction}
              onChange={() => setLayers(prev => ({ ...prev, riskPrediction: !prev.riskPrediction }))}
              className="rounded accent-sky-500 bg-slate-900 border-slate-800 focus:ring-0 cursor-pointer"
            />
            <span>Risk Pred.</span>
          </label>
        </div>
      </div>

      {/* Dynamic Floating Compass Recenter HUD */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <button
          onClick={handleRecenter}
          className="p-3 bg-slate-950/95 border border-slate-900 rounded-2xl hover:border-sky-500/40 text-slate-355 hover:text-sky-400 hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl flex items-center justify-center group"
          title="Recenter Map Focus"
        >
          <Compass className="w-4 h-4 group-hover:rotate-45 transition duration-500" />
        </button>
      </div>

      {/* Helper Marquee */}
      <div className="absolute bottom-4 right-4 z-[1000] hidden md:block">
        <div className="px-3 py-1.5 bg-slate-950/95 border border-slate-900 rounded-xl text-[9px] font-mono text-slate-500 tracking-wider">
          🖱️ Click map anywhere to pick coordinates for RoadWatch reporting
        </div>
      </div>
    </div>
  );
}
