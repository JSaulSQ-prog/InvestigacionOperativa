// Crear el mapa
var map = L.map('map').setView([-16.503965, -68.129492], 13);

// Cargar el mapa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variables para los marcadores, control de rutas y botón de instrucciones
var startMarker, stopMarkers = [], endMarker;
var routingControl = null;
var instructionsVisible = true; // Estado de visibilidad de las instrucciones

// Función para actualizar los campos del formulario con los valores actuales de los marcadores
function updateFields() {
    if (startMarker) {
        var startLatLng = startMarker.getLatLng();
        document.getElementById('start').value = `${startLatLng.lat.toFixed(6)}, ${startLatLng.lng.toFixed(6)}`;
    }
    if (endMarker) {
        var endLatLng = endMarker.getLatLng();
        document.getElementById('end').value = `${endLatLng.lat.toFixed(6)}, ${endLatLng.lng.toFixed(6)}`;
    }
    if (stopMarkers.length > 0) {
        var stops = stopMarkers.map(marker => {
            var latlng = marker.getLatLng();
            return `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
        });
        document.getElementById('stops').value = stops.join('; ');
    }
}

// Manejar clics en el mapa para agregar puntos
map.on('click', function (e) {
    var latlng = e.latlng;

    if (!startMarker) {
        // Agregar marcador de inicio
        startMarker = L.marker(latlng, { draggable: true }).addTo(map).bindPopup('Punto de Inicio').openPopup();
        startMarker.on('dragend', updateFields); // Actualizar al mover el marcador
    } else if (!endMarker) {
        // Agregar marcador de destino
        endMarker = L.marker(latlng, { draggable: true }).addTo(map).bindPopup('Punto de Destino').openPopup();
        endMarker.on('dragend', updateFields); // Actualizar al mover el marcador
    } else {
        // Agregar marcador de parada intermedia
        var stopMarker = L.marker(latlng, { draggable: true })
    .addTo(map)
    .bindPopup(`Parada ${stopMarkers.length + 1}`);

        stopMarker.on('dragend', updateFields); // Actualizar al mover el marcador
        stopMarker.on('contextmenu', function () {
            // Eliminar marcador con clic derecho
            map.removeLayer(stopMarker);
            stopMarkers = stopMarkers.filter(marker => marker !== stopMarker);
            updateFields(); // Actualizar los campos
        });
        stopMarkers.push(stopMarker);
    }

    updateFields(); // Actualizar campos del formulario
});

// Función para calcular la ruta
function getRoute(start, stops, end) {
    // Limpiar rutas anteriores
    if (routingControl) {
        map.removeControl(routingControl);
    }

    // Crear nueva ruta
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(...start.split(',').map(Number)),
            ...stops.map(stop => L.latLng(...stop.split(',').map(Number))),
            L.latLng(...end.split(',').map(Number))
        ],
        routeWhileDragging: true,
        createMarker: function (i, waypoint, n) {
            // Usar marcadores existentes o crear nuevos
            if (i === 0) return startMarker;
            if (i === n - 1) return endMarker;
            return stopMarkers[i - 1];
        },
        language: 'es', // Mostrar las instrucciones en español
        showAlternatives: true,
        lineOptions: {
            styles: [{ color: 'blue', opacity: 0.6, weight: 6 }]
        },
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            language: 'es' // Idioma de las indicaciones
        }),
        collapsible: true // Permitir colapsar el panel de instrucciones
    }).addTo(map);

    // Añadir un botón para mostrar/ocultar instrucciones
    addToggleButton();
}

// Añadir botón para mostrar/ocultar instrucciones
function addToggleButton() {
    var toggleButton = document.getElementById('toggle-instructions');
    if (!toggleButton) {
        // Crear el botón si no existe
        toggleButton = document.createElement('button');
        toggleButton.id = 'toggle-instructions';
        toggleButton.className = 'btn btn-info mt-2';
        toggleButton.innerText = 'Ocultar Instrucciones';
        document.querySelector('.form-container').appendChild(toggleButton);

        toggleButton.addEventListener('click', function () {
            if (instructionsVisible) {
                document.querySelector('.leaflet-routing-container').style.display = 'none';
                toggleButton.innerText = 'Mostrar Instrucciones';
            } else {
                document.querySelector('.leaflet-routing-container').style.display = 'block';
                toggleButton.innerText = 'Ocultar Instrucciones';
            }
            instructionsVisible = !instructionsVisible;
        });
    }
}

// Manejar clic en "Calcular Ruta"
document.getElementById('submit').addEventListener('click', function () {
    var start = document.getElementById('start').value;
    var stops = document.getElementById('stops').value ? document.getElementById('stops').value.split(';').map(s => s.trim()) : [];
    var end = document.getElementById('end').value;

    if (!start || !end) {
        alert('Por favor, selecciona un punto de inicio y un destino.');
        return;
    }

    getRoute(start, stops, end);
});