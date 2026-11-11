"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: string };
delete markerIcon._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type MapPoint = {
  lat: number;
  lng: number;
};

export type MapAnswer = MapPoint & {
  name: string;
};

const answerIcon = L.icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="42" viewBox="0 0 28 42"><path fill="#059669" stroke="#ffffff" stroke-width="2" d="M14 1C7 1 2 6.2 2 13.2 2 22.5 14 41 14 41s12-18.5 12-27.8C26 6.2 21 1 14 1z"/><circle cx="14" cy="13" r="5" fill="#ffffff"/></svg>',
    ),
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  tooltipAnchor: [0, -36],
});

function FrameBoth({ guess, answer }: { guess: MapPoint; answer: MapPoint }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([guess.lat, guess.lng], [answer.lat, answer.lng]);
    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      map.setView([answer.lat, answer.lng], 10);
      return;
    }
    map.fitBounds(bounds.pad(0.45), { animate: true, maxZoom: 8 });
  }, [answer.lat, answer.lng, guess.lat, guess.lng, map]);

  return null;
}

function MapClickHandler({
  locked,
  onPick,
}: {
  locked: boolean;
  onPick: (point: MapPoint) => void;
}) {
  useMapEvents({
    click(event) {
      if (locked) return;
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

export default function InteractiveMap({
  locked = false,
  answer = null,
  onSelect,
}: {
  locked?: boolean;
  answer?: MapAnswer | null;
  onSelect: (point: MapPoint) => void;
}) {
  const [point, setPoint] = useState<MapPoint | null>(null);

  return (
    <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler
        locked={locked}
        onPick={(next) => {
          setPoint(next);
          onSelect(next);
        }}
      />
      {point && (
        <Marker position={[point.lat, point.lng]}>
          {answer && (
            <Tooltip permanent direction="top">
              Your pin
            </Tooltip>
          )}
        </Marker>
      )}
      {point && answer && (
        <>
          <FrameBoth guess={point} answer={answer} />
          <Polyline
            positions={[
              [point.lat, point.lng],
              [answer.lat, answer.lng],
            ]}
            pathOptions={{ color: "#B89B72", weight: 3, dashArray: "6 8" }}
          />
          <Marker position={[answer.lat, answer.lng]} icon={answerIcon}>
            <Tooltip permanent direction="top">
              {answer.name}
            </Tooltip>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}
