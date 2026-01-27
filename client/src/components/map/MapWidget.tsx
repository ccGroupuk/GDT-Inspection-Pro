import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink, MapPin, User, Navigation } from "lucide-react";
import type { Job, EmployeeLocation } from "@shared/schema";

// Fix for default marker icons in Leaflet with bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Custom icons
const jobIcon = new Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const staffIcon = new Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapWidgetProps {
    jobs?: Job[];
    staffLocations?: EmployeeLocation[];
    height?: string;
    center?: [number, number];
    zoom?: number;
}

export default function MapWidget({
    jobs = [],
    staffLocations = [],
    height = "400px",
    center = [51.4816, -3.1791], // Cardiff default
    zoom = 12
}: MapWidgetProps) {

    // Filter items with valid coordinates
    const validJobs = jobs.filter(j => j.latitude && j.longitude);
    const validStaff = staffLocations.filter(s => s.latitude && s.longitude);

    const openDirections = (lat: number, lng: number) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    return (
        <div className="w-full relative z-0" style={{ height }}>
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Job Markers */}
                {validJobs.map(job => (
                    <Marker
                        key={job.id}
                        position={[parseFloat(job.latitude as string), parseFloat(job.longitude as string)]}
                        icon={jobIcon}
                    >
                        <Popup>
                            <div className="p-1 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2 font-semibold">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span>{job.jobNumber}</span>
                                </div>
                                <p className="text-sm font-medium mb-1">{job.serviceType}</p>
                                <p className="text-xs text-muted-foreground mb-3">{job.jobAddress}</p>

                                <div className="flex gap-2">
                                    <Link href={`/jobs/${job.id}`}>
                                        <Button size="sm" variant="outline" className="w-full h-8 px-2 text-xs">
                                            View Job
                                        </Button>
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="w-full h-8 px-2 text-xs"
                                        onClick={() => openDirections(parseFloat(job.latitude as string), parseFloat(job.longitude as string))}
                                    >
                                        <Navigation className="h-3 w-3 mr-1" />
                                        Directions
                                    </Button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Staff Markers */}
                {validStaff.map(loc => (
                    <Marker
                        key={loc.id}
                        position={[parseFloat(loc.latitude as string), parseFloat(loc.longitude as string)]}
                        icon={staffIcon}
                    >
                        <Popup>
                            <div className="p-1 min-w-[180px]">
                                <div className="flex items-center gap-2 mb-2 font-semibold text-green-600">
                                    <User className="h-4 w-4" />
                                    <span>Staff Member</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Last seen: {new Date(loc.timestamp || "").toLocaleTimeString()}
                                </p>
                                <Button
                                    size="sm"
                                    className="w-full h-8 px-2 text-xs"
                                    onClick={() => openDirections(parseFloat(loc.latitude as string), parseFloat(loc.longitude as string))}
                                >
                                    <Navigation className="h-3 w-3 mr-1" />
                                    Directions
                                </Button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
