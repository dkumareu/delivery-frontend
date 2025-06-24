import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { GOOGLE_MAPS_API_KEY } from "../config/map";

interface GoogleMapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  address?: string;
}

const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
  address,
}) => {
  const [searchAddress, setSearchAddress] = useState(address || "");
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState({
    lat: latitude || 52.52, // Default to Berlin
    lng: longitude || 13.405,
  });
  const [markerPosition, setMarkerPosition] = useState({
    lat: latitude || 52.52,
    lng: longitude || 13.405,
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);

  const apiKey = GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter({ lat: latitude, lng: longitude });
      setMarkerPosition({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  // Check if Google Maps API is ready
  useEffect(() => {
    const checkApiReady = () => {
      if (
        window.google &&
        window.google.maps &&
        window.google.maps.MapTypeId &&
        window.google.maps.marker
      ) {
        setApiReady(true);
      } else {
        setTimeout(checkApiReady, 100);
      }
    };
    checkApiReady();
  }, []);

  // Initialize map when API is ready
  useEffect(() => {
    if (apiReady && mapRef.current && !map) {
      initializeMap();
    }
  }, [apiReady, map]);

  const initializeMap = useCallback(() => {
    if (
      !window.google ||
      !window.google.maps ||
      !apiKey ||
      !mapRef.current ||
      map
    )
      return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      center: markerPosition,
      zoom: 15,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapId: "DEMO_MAP_ID", // Required for Advanced Markers
    });

    // Create AdvancedMarkerElement instead of deprecated Marker
    const newMarker = new window.google.maps.marker.AdvancedMarkerElement({
      position: markerPosition,
      map: newMap,
      title: "Customer Location",
      gmpDraggable: true, // Enable dragging for AdvancedMarkerElement
    });

    // Add click listener to map
    newMap.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setMarkerPosition({ lat, lng });
        setMapCenter({ lat, lng });
        newMarker.position = event.latLng; // Update position for AdvancedMarkerElement
        onLocationChange(lat, lng);
      }
    });

    // Add drag listener to marker
    newMarker.addListener("dragend", (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setMarkerPosition({ lat, lng });
        setMapCenter({ lat, lng });
        onLocationChange(lat, lng);
      }
    });

    setMap(newMap);
    setMarker(newMarker);
  }, [apiKey, markerPosition, onLocationChange, map]);

  // Update marker position when map center changes
  useEffect(() => {
    if (map && marker) {
      marker.position = mapCenter; // Update position for AdvancedMarkerElement
    }
  }, [mapCenter, map, marker]);

  const geocodeAddress = useCallback(
    async (address: string) => {
      if (!apiKey || !address.trim() || !window.google) return;

      setLoading(true);
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            const newLat = location.lat();
            const newLng = location.lng();

            setMapCenter({ lat: newLat, lng: newLng });
            setMarkerPosition({ lat: newLat, lng: newLng });

            if (map) {
              map.setCenter(location);
              map.setZoom(15);
            }

            if (marker) {
              marker.position = location; // Update position for AdvancedMarkerElement
            }

            onLocationChange(newLat, newLng);
          }
          setLoading(false);
        });
      } catch (error) {
        console.error("Error geocoding address:", error);
        setLoading(false);
      }
    },
    [apiKey, map, marker, onLocationChange]
  );

  const handleSearch = useCallback(() => {
    geocodeAddress(searchAddress);
  }, [searchAddress, geocodeAddress]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  if (!apiKey) {
    return (
      <Paper sx={{ p: 2, textAlign: "center" }}>
        <Typography color="error">
          Google Maps API key not configured. Please set it in
          src/config/map.ts.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          label="Search Address"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter address to search..."
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading || !searchAddress.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
        >
          Search
        </Button>
      </Box>

      <Paper sx={{ height: 400, position: "relative", overflow: "hidden" }}>
        <div
          ref={mapRef}
          style={{
            height: "100%",
            width: "100%",
          }}
        />
        {!apiReady && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
        <TextField
          label="Latitude"
          type="number"
          value={markerPosition.lat.toFixed(6)}
          onChange={(e) => {
            const lat = parseFloat(e.target.value);
            if (!isNaN(lat)) {
              setMarkerPosition((prev) => ({ ...prev, lat }));
              onLocationChange(lat, markerPosition.lng);
              if (marker) {
                const newPosition = new window.google.maps.LatLng(
                  lat,
                  markerPosition.lng
                );
                marker.position = newPosition; // Update position for AdvancedMarkerElement
              }
            }
          }}
          inputProps={{ step: 0.000001 }}
          size="small"
        />
        <TextField
          label="Longitude"
          type="number"
          value={markerPosition.lng.toFixed(6)}
          onChange={(e) => {
            const lng = parseFloat(e.target.value);
            if (!isNaN(lng)) {
              setMarkerPosition((prev) => ({ ...prev, lng }));
              onLocationChange(markerPosition.lat, lng);
              if (marker) {
                const newPosition = new window.google.maps.LatLng(
                  markerPosition.lat,
                  lng
                );
                marker.position = newPosition; // Update position for AdvancedMarkerElement
              }
            }
          }}
          inputProps={{ step: 0.000001 }}
          size="small"
        />
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: "block" }}
      >
        Click on the map to set location, drag the marker, or search for an
        address above
      </Typography>
    </Box>
  );
};

// Add Google Maps types to window object
declare global {
  interface Window {
    google: typeof google;
  }
}

export default GoogleMapPicker;
