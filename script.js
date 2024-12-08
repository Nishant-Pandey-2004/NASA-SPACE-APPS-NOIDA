var map = L.map("map").setView([21.82, 82.71], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// AQI (Air Quality Index) layer
var WAQI_URL = "https://tiles.waqi.info/tiles/usepa-aqi/{z}/{x}/{y}.png?token=f9a3aa393a0d9a30af06f258f0a2854e227670db"; // Replace with your actual token
var waqiLayer = L.tileLayer(WAQI_URL, {
    attribution: 'Air Quality Tiles &copy; <a href="http://waqi.info">waqi.info</a>'
})

var vegetationLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png');
var highwaysLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png');
let pollutionLayer = null;
let rainfallLayer = null;

// Functions for handling different map layers and controls
const goToCoords = function (city) {
    var inurl = "https://nominatim.openstreetmap.org/search?q=" + city + "&limit=1&format=json&addressdetails=1";
    $.when(ajax1()).done(function (data) {
        if (data.length > 0) {
            map.flyTo([data[0]["lat"], data[0]["lon"]], 12);
            addToHistory('Go to ' + city);
        } else {
            alert('City not found!');
        }
    });
    function ajax1() {
        return $.ajax({
            url: inurl,
            dataType: "json"
        });
    }
};

const toggleVegetation = function () {
    if (map.hasLayer(vegetationLayer)) {
        map.removeLayer(vegetationLayer);
        addToHistory('Hide vegetation');
    } else {
        map.addLayer(vegetationLayer);
        addToHistory('Show vegetation');
    }
};

const toggleHighways = function () {
    if (map.hasLayer(highwaysLayer)) {
        map.removeLayer(highwaysLayer);
        addToHistory('Hide highways');
    } else {
        map.addLayer(highwaysLayer);
        addToHistory('Show highways');
    }
};

const toggleSatellite = function () {
    var satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });
    if (map.hasLayer(satelliteLayer)) {
        map.removeLayer(satelliteLayer);
        addToHistory('Hide satellite');
    } else {
        map.addLayer(satelliteLayer);
        addToHistory('Show satellite');
    }
};

const toggleTerrain = function () {
    var terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png');
    if (map.hasLayer(terrainLayer)) {
        map.removeLayer(terrainLayer);
        addToHistory('Hide terrain');
    } else {
        map.addLayer(terrainLayer);
        addToHistory('Show terrain');
    }
};

const showPollutionMap = function () {
    // Check if pollutionLayer already exists
    if (pollutionLayer) {
        map.removeLayer(pollutionLayer); // Remove the previous layer if it exists
        pollutionLayer = null; // Reset the layer variable
    }

    // Create the pollution layer using the location
    pollutionLayer = L.tileLayer(WAQI_URL, {
        attribution: 'Air Quality Tiles &copy; <a href="http://waqi.info">waqi.info</a>',
        opacity: 0.7
    }).addTo(map);

    // Log the action in history
    addToHistory('Show pollution');
};

const showRainfallMap = function () {
    // Check if rainfallLayer already exists
    if (rainfallLayer) {
        map.removeLayer(rainfallLayer); // Remove the previous layer if it exists
        rainfallLayer = null; // Reset the layer variable
    }

    // Create the rainfall layer using the location
    rainfallLayer = L.tileLayer(WAQI_URL, {
        attribution: 'Air Quality Tiles &copy; <a href="http://waqi.info">waqi.info</a>',
        opacity: 0.7
    }).addTo(map);

    // Log the action in history
    addToHistory('Show rainfall');
};

const zoomIn = function () {
    map.zoomIn();
    addToHistory('Zoom in');
};

const zoomOut = function () {
    map.zoomOut();
    addToHistory('Zoom out');
};

const stoplistening = function () {
    annyang.abort();
    addToHistory('Stop listening');
};

let markersArray = [];
let routingControl = null;

const addMarker = function (city) {
    var markerUrl = "https://nominatim.openstreetmap.org/search?q=" + city + "&format=json&limit=1";
    $.ajax({
        url: markerUrl,
        dataType: "json",
        success: function (data) {
            if (data.length > 0) {
                var lat = data[0].lat;
                var lon = data[0].lon;
                var marker = L.marker([lat, lon]).addTo(map).bindPopup(city);
                markersArray.push(marker);
                addToHistory('Mark ' + city);
            } else {
                alert('City not found!');
            }
        }
    });
};

const removeMarker = function (city) {
    markersArray = markersArray.filter(marker => {
        if (marker.getPopup().getContent() === city) {
            map.removeLayer(marker);
            addToHistory('Unmark ' + city);
            return false;
        }
        return true;
    });
};

const calculateDistance = function () {
    if (markersArray.length < 2) {
        alert("You need at least two markers to calculate distance.");
        return;
    }

    if (routingControl !== null) {
        map.removeControl(routingControl);
    }

    var waypoints = markersArray.map(marker => marker.getLatLng());
    routingControl = L.Routing.control({
        waypoints: waypoints,
        lineOptions: {
            styles: [{ color: 'red', opacity: 0.6, weight: 4 }]
        },
        createMarker: function () { return null; },
        routeWhileDragging: true,
        show: false,
        addWaypoints: false
    }).addTo(map);

    routingControl.on('routesfound', function (e) {
        var routes = e.routes;
        var summary = routes[0].summary;
        var distance = (summary.totalDistance / 1000).toFixed(2); // Convert to kilometers
        document.getElementById('distance').innerHTML = "Total distance: " + distance + " km";
        addToHistory('Calculate distance');
    });
};

// AQI Widget Integration
const showAQIWidget = function(city) {
    goToCoords(city); // Navigate to the city first

    // After the navigation is successful, load the AQI data
    $.when(ajax1(city)).done(function() {
        const container = document.getElementById('city-aqi-container');
        container.innerHTML = ''; // Clear previous widget

        // Set CSS styles for positioning
        container.style.position = 'absolute';
        container.style.zIndex = '1000';
        container.style.position = 'fixed'; // Change to fixed for viewport centering
        container.style.top = '50%'; // Move down 50% of the viewport height
        container.style.left = '50%'; // Move right 50% of the viewport width
        container.style.transform = 'translate(-50%, -50%)'; // Center it perfectly
        container.style.color = 'black';

        // Load the AQI data
        _aqiFeed({
            container: "city-aqi-container",
            city: city.toLowerCase(),
            
            display: "%cityname AQI is %aqi<br><small>on %date</small>"
        });

        addToHistory('Show AQI widget of ' + city);
    }).fail(function() {
        alert('Unable to load AQI data for ' + city);
    });
};


// Helper function to get city coordinates
function ajax1(city) {
    var inurl = "https://nominatim.openstreetmap.org/search?q=" + city + "&limit=1&format=json&addressdetails=1";
    return $.ajax({
        url: inurl,
        dataType: "json"
    });
}

const closeAQIWidget = function() {
    document.getElementById('city-aqi-container').innerHTML = ''; // Clear the widget
    addToHistory('Close AQI widget');
};

// History Management
const addToHistory = function (action) {
    var historyList = document.getElementById("history-list");
    var listItem = document.createElement("li");
    listItem.textContent = action;
    historyList.appendChild(listItem);
};



// Searchbar Event Listener for Text Input - Handling All Commands
document.getElementById('search-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        const input = this.value.trim().toLowerCase();
        const command = input.split(' ');

        // Identify which command was entered
        if (input.startsWith('go to ')) {
            const city = input.replace('go to ', '');
            goToCoords(city);
        } else if (input === 'show vegetation') {
            toggleVegetation();
        } else if (input === 'show highways') {
            toggleHighways();
        } else if (input === 'show satellite') {
            toggleSatellite();
        } else if (input === 'show terrain') {
            toggleTerrain();
        } else if (input === 'zoom in') {
            zoomIn();
        } else if (input === 'zoom out') {
            zoomOut();
        } else if (input.startsWith('mark ')) {
            const city = input.replace('mark ', '');
            addMarker(city);
        } else if (input.startsWith('unmark ')) {
            const city = input.replace('unmark ', '');
            removeMarker(city);
        } else if (input === 'calculate distance') {
            calculateDistance();
        } else if (input === 'show pollution') {
            showPollutionMap();
        }else if (input.startsWith('show aqi of ')) {
            const city = input.replace('show aqi of ', '');
            showAQIWidget(city);
        } else if (input === 'close widget') {
            closeAQIWidget();}
            else if (input === 'show rainfall') {
                showRainfallMap();
            }
        else {
            alert("Command not recognized.");
        }


        // Clear input field after command is executed
        this.value = '';
    }
});

// Microphone Button to Activate Voice Command (One-time listening)
document.getElementById('mic-button').addEventListener('click', function () {
    if (annyang) {
        // Start listening, but listen for a single command only
        annyang.start({ autoRestart: false, continuous: false });

        // Automatically stop after the first recognition event
        annyang.addCallback('result', function () {
            annyang.abort();
        });
        alert("Listening for voice commands...");
    }
});

// Voice Command Setup (Annyang)
if (annyang) {
    const commands = {
        'go to *city': goToCoords,
        'show vegetation': toggleVegetation,
        'show highways': toggleHighways,
        'show satellite': toggleSatellite,
        'show terrain': toggleTerrain,
        'zoom in': zoomIn,
        'zoom out': zoomOut,
        'mark *city': addMarker,
        'unmark *city': removeMarker,
        'calculate distance': calculateDistance,
        'stop listening': stoplistening,
        'show pollution': showPollutionMap,
        'show aqi of *city': showAQIWidget,
        'close aqi': closeAQIWidget,
    };

    annyang.addCommands(commands);
    SpeechKITT.annyang();
    SpeechKITT.setStylesheet('//cdnjs.cloudflare.com/ajax/libs/SpeechKITT/0.3.0/themes/flat-clouds.css');
    SpeechKITT.vroom();
}