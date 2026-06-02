import { useEffect, useRef } from "react";
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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter = userCoords
      ? [userCoords.lat, userCoords.lng]
      : [12.9716, 77.5946];

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: initialCenter as L.LatLngExpression,
      zoom: 14,
      zoomControl: false, // will add in custom spot
      attributionControl: false,
    });

    // Add CartoDB Dark Matter tile layer (super clean dark map)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 20,
      },
    ).addTo(map);

    // Custom Zoom controls
    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);

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

    // Pan to user coords
    mapRef.current.setView(
      [userCoords.lat, userCoords.lng] as L.LatLngExpression,
      mapRef.current.getZoom(),
    );

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
        {
          icon: userIcon,
        },
      )
        .addTo(mapRef.current)
        .bindPopup(
          `
          <div class="p-2 text-slate-100 font-sans text-xs bg-slate-900 border border-slate-800 rounded-lg">
            <span class="font-extrabold text-sky-400 block">⭐ YOU ARE HERE</span>
            <span>Coordinates: ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}</span>
          </div>
        `,
          { closeButton: false },
        );
    }
  }, [userCoords]);

  // Redraw Layers on roads, incidents, heatmap or activeLayer changes
  useEffect(() => {
    const map = mapRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    // Clear existing overlay features
    layersGroup.clearLayers();

    // 1. Render road polylines if NOT standard mode (standard has simple paths, traffic has glowing statuses)
    if (activeLayer === "traffic" || activeLayer === "standard") {
      roads.forEach((road) => {
        const pathCoords = road.coordinates.map(
          (c) => [c[0], c[1]] as L.LatLngExpression,
        );

        let strokeColor = "#10b981"; // smooth Green
        let strokeOpacity = 0.7;
        let strokeWidth = 3;
        let isCongested = false;

        if (road.status === "heavy") {
          strokeColor = "#f43f5e"; // Red
          strokeOpacity = 0.95;
          strokeWidth = 6;
          isCongested = true;
        } else if (road.status === "moderate") {
          strokeColor = "#f59e0b"; // Orange
          strokeOpacity = 0.85;
          strokeWidth = 4.5;
        }

        // Draw basic corridor lines
        const polyline = L.polyline(pathCoords, {
          color: strokeColor,
          weight: strokeWidth,
          opacity: strokeOpacity,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(layersGroup);

        // Bind interactive popup describing traffic congestion parameters
        polyline.bindPopup(`
          <div class="p-2.5 font-sans text-xs text-slate-200">
            <span class="font-extrabold uppercase block text-slate-100">${road.name}</span>
            <div class="flex items-center space-x-1.5 mt-1">
              <span class="w-2 h-2 rounded-full" style="background-color: ${strokeColor}"></span>
              <span class="font-bold font-mono text-[10px] capitalize">${road.status} Flow</span>
            </div>
            ${isCongested ? '<span class="text-[9px] text-rose-400 font-extrabold mt-1 block">⚠️ HIGH COLLISION HAZARD ZONE</span>' : ""}
          </div>
        `);
      });
    }

    // 2. Render Incident icons
    incidents.forEach((inc) => {
      let iconHtml = "⚠️";
      let iconColorClass = "bg-amber-600 border-amber-400";
      let shadowGlowClass = "shadow-[0_0_10px_#f59e0b]";

      if (inc.type === "accident") {
        iconHtml = "🚨";
        iconColorClass = "bg-rose-600 border-rose-450";
        shadowGlowClass = "shadow-[0_0_15px_#f43f5e]";
      } else if (inc.type === "police") {
        iconHtml = "👮";
        iconColorClass = "bg-sky-600 border-sky-450";
        shadowGlowClass = "shadow-[0_0_10px_#0ea5e9]";
      } else if (inc.type === "streetlight-out") {
        iconHtml = "🌙";
        iconColorClass = "bg-slate-700 border-slate-500";
        shadowGlowClass = "shadow-[0_0_5px_rgba(255,255,255,0.2)]";
      }

      const customDivIcon = L.divIcon({
        className: `custom-incident-${inc.id}`,
        html: `
          <div class="relative flex items-center justify-center">
            ${inc.pulse ? `<div class="absolute w-8 h-8 rounded-full animate-ping opacity-55" style="background-color: ${inc.type === "accident" ? "#f43f5e" : "#0ea5e9"}"></div>` : ""}
            <div class="relative w-7 h-7 rounded-xl border flex items-center justify-center text-white text-xs font-extrabold ${iconColorClass} ${shadowGlowClass}">
              ${iconHtml}
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker([inc.latitude, inc.longitude] as L.LatLngExpression, {
        icon: customDivIcon,
      }).addTo(layersGroup).bindPopup(`
          <div class="p-2.5 font-sans text-xs text-slate-100">
            <div class="flex items-center space-x-1.5 mb-1.5">
              <span class="px-1.5 py-0.5 text-[8px] uppercase tracking-wider rounded font-black ${
                inc.type === "accident"
                  ? "bg-rose-500/25 text-rose-400 border border-rose-500/20"
                  : inc.type === "police"
                    ? "bg-sky-500/25 text-sky-400 border border-sky-500/20"
                    : "bg-amber-500/25 text-amber-400 border border-amber-500/20"
              }">
                ${inc.type.replace("-", " ")}
              </span>
              <span class="text-[9px] text-slate-450">${inc.location}</span>
            </div>
            <p class="font-medium text-slate-300 leading-relaxed mb-1.5">${inc.description}</p>
            <span class="text-[9px] text-slate-500 font-semibold block border-t border-slate-800/80 pt-1.5">
              Source: ${inc.reportedBy || "System Alert"}
            </span>
          </div>
        `);
    });

    // 3. Render Thermal Heatmap layer
    if (activeLayer === "heatmap") {
      heatmap.forEach((point) => {
        L.circle([point.latitude, point.longitude], {
          radius: 120, // 120 meters radii
          fillColor: "#f43f5e",
          fillOpacity: point.intensity * 0.45,
          stroke: false,
        }).addTo(layersGroup);
      });
    } else {
      // Draw standard risk hotspots on other layers
      heatmap.slice(0, 3).forEach((point) => {
        L.circle([point.latitude, point.longitude], {
          radius: 100,
          fillColor: "#f43f5e",
          fillOpacity: 0.18,
          color: "#f43f5e",
          weight: 1.5,
          dashArray: "3, 4",
        }).addTo(layersGroup).bindPopup(`
          <div class="p-1 font-sans text-[10px] text-slate-200">
            <span class="text-rose-450 font-black block">🚨 AI DETECTED ACCIDENT HOTSPOT</span>
            <span>Accident probability: ${(point.intensity * 100).toFixed(0)}%</span>
          </div>
        `);
      });
    }

    // 4. Render Emergency SOS Location Marker
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
          <span>Coordinates: ${sosCoords.lat.toFixed(4)}, ${sosCoords.lng.toFixed(4)}</span>
        </div>
      `, { closeButton: false }).openPopup();
    }

    // 5. Render Selected Safe Route if present (Neon glowing double path overlay)
    if (selectedRoute && selectedRoute.length > 0) {
      const routeCoords = selectedRoute.map(
        (c) => [c[0], c[1]] as L.LatLngExpression,
      );

      // Outer neon violet aura polyline
      L.polyline(routeCoords, {
        color: "#c084fc",
        weight: 8,
        opacity: 0.5,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layersGroup);

      // Inner high-visibility cyan core polyline
      L.polyline(routeCoords, {
        color: "#22d3ee",
        weight: 4.5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
        className: "animated-route-line",
      } as any).addTo(layersGroup);

      // Add start/end beacons on route boundaries
      const startPoint = routeCoords[0];
      const endPoint = routeCoords[routeCoords.length - 1];

      const greenPulseIcon = L.divIcon({
        className: "route-start-beacon",
        html: `<div class="relative w-4 h-4 rounded-full bg-emerald-500 border border-white animate-pulse shadow-[0_0_8px_#10b981]"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const purplePulseIcon = L.divIcon({
        className: "route-end-beacon",
        html: `<div class="relative w-4 h-4 rounded-full bg-purple-500 border border-white animate-pulse shadow-[0_0_8px_#a855f7]"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.marker(startPoint, { icon: greenPulseIcon })
        .addTo(layersGroup)
        .bindPopup("Route Start");
      L.marker(endPoint, { icon: purplePulseIcon })
        .addTo(layersGroup)
        .bindPopup("Route End / Destination");
    }

    // Force redraw layout sizes
    setTimeout(() => map.invalidateSize(), 150);
  }, [roads, incidents, heatmap, activeLayer, selectedRoute, sosActive, sosCoords]);

  // Recenter Helper
  const handleRecenter = () => {
    if (mapRef.current && userCoords) {
      mapRef.current.setView(
        [userCoords.lat, userCoords.lng] as L.LatLngExpression,
        15,
      );
    }
  };

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden border border-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Map Element Container */}
      <div ref={mapContainerRef} className="w-full h-full bg-[#080c16]" />

      {/* Cyberpunk Map UI Controls Header */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Layer Toggler Buttons */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-1 flex items-center space-x-1 shadow-2xl">
          <button
            onClick={() => setActiveLayer("standard")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition duration-150 ${
              activeLayer === "standard"
                ? "bg-indigo-500 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Standard</span>
          </button>

          <button
            onClick={() => setActiveLayer("traffic")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition duration-150 ${
              activeLayer === "traffic"
                ? "bg-indigo-500 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Traffic</span>
          </button>

          <button
            onClick={() => setActiveLayer("heatmap")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition duration-150 ${
              activeLayer === "heatmap"
                ? "bg-indigo-500 text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>
        </div>
      </div>

      {/* Dynamic Floating Compass Recenter HUD */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <button
          onClick={handleRecenter}
          className="p-3 bg-slate-900/95 border border-slate-800 rounded-2xl hover:border-sky-500/40 text-slate-300 hover:text-sky-400 hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl flex items-center justify-center group"
          title="Recenter Radar"
        >
          <Compass className="w-5 h-5 group-hover:rotate-45 transition duration-500" />
        </button>
      </div>

      {/* Helper Marquee */}
      <div className="absolute bottom-4 right-16 z-[1000] hidden md:block">
        <div className="px-3 py-1 bg-slate-900/90 backdrop-blur-sm border border-slate-850 rounded-lg text-[9px] font-mono text-slate-500 tracking-wider">
          🖱️ Click map anywhere to pick coordinates for issue reports
        </div>
      </div>
    </div>
  );
}
