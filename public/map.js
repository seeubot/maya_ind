// ─── BottleRush — Leaflet GPS Map ────────────────────────────────────────────
// Uses device GPS hardware (enableHighAccuracy: true), not network/IP location.
// Leaflet attribution header/footer hidden via CSS.

let map, marker, currentLat, currentLng;

function initMap(defaultLat = 17.4156, defaultLng = 78.4347) {
  const container = document.getElementById('map-container');
  if (!container || map) return;

  // Init Leaflet map
  map = L.map('map-container', {
    zoomControl: true,
    attributionControl: false, // hide attribution entirely
  }).setView([defaultLat, defaultLng], 14);

  // OSM tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  // Custom gold marker icon
  const icon = L.divIcon({
    html: `<div style="
      width:36px; height:36px; border-radius:50% 50% 50% 0;
      background:#c9973a; border:3px solid #fff;
      transform:rotate(-45deg); box-shadow:0 2px 12px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    className: '',
  });

  marker = L.marker([defaultLat, defaultLng], {
    draggable: true,
    icon,
  }).addTo(map);

  // On drag end — reverse geocode new position
  marker.on('dragend', async () => {
    const { lat, lng } = marker.getLatLng();
    currentLat = lat;
    currentLng = lng;
    await reverseGeocode(lat, lng);
  });

  // Request live GPS location
  requestGPS();
}

function requestGPS() {
  const btn = document.getElementById('gps-btn');
  if (btn) btn.textContent = '📡 Locating...';

  if (!navigator.geolocation) {
    showMapError('Geolocation not supported by your browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      currentLat = coords.latitude;
      currentLng = coords.longitude;

      map.setView([currentLat, currentLng], 16);
      marker.setLatLng([currentLat, currentLng]);

      if (btn) btn.textContent = '📍 My Location';

      await reverseGeocode(currentLat, currentLng);
    },
    (err) => {
      console.warn('GPS error:', err.message);
      if (btn) btn.textContent = '📍 My Location';
      showMapError('Could not get GPS location. Drag the pin to set your address.');
    },
    {
      enableHighAccuracy: true, // forces GPS chip, not cell tower / WiFi
      timeout: 12000,
      maximumAge: 0,            // always fresh, no cached position
    }
  );
}

async function reverseGeocode(lat, lng) {
  const field = document.getElementById('address-field');
  if (!field) return;

  field.value = 'Fetching address...';
  field.style.color = 'var(--text-muted)';

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    field.value = address;
    field.style.color = '';

    // Store coords for order submission
    field.dataset.lat = lat;
    field.dataset.lng = lng;
    field.dataset.formatted = address;
  } catch (err) {
    field.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    field.style.color = '';
    field.dataset.lat = lat;
    field.dataset.lng = lng;
  }
}

function showMapError(msg) {
  const container = document.getElementById('map-container');
  if (!container) return;
  const banner = document.createElement('div');
  banner.style.cssText = `
    position:absolute; bottom:12px; left:12px; right:12px; z-index:1000;
    background:rgba(192,57,43,0.9); color:#fff; border-radius:8px;
    padding:8px 12px; font-size:0.82rem; text-align:center;
  `;
  banner.textContent = msg;
  container.style.position = 'relative';
  container.appendChild(banner);
  setTimeout(() => banner.remove(), 5000);
}

// ─── Init on DOM ready ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('map-container')) {
    initMap();
    const gpsBtn = document.getElementById('gps-btn');
    if (gpsBtn) gpsBtn.addEventListener('click', requestGPS);
  }
});
