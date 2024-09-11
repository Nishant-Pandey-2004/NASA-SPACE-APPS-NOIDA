var map = L.map("map").setView([50, 8], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

var vegetationLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png');
var highwaysLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png');

const goToCoords = function(city) {
    var inurl  = "https://nominatim.openstreetmap.org/search?q=" + city + "&limit=1&format=json&addressdetails=1";
    $.when(ajax1()).done(function(data){
        map.flyTo([data[0]["lat"],data[0]["lon"]],12);
        addToHistory('Go to ' + city);
    });
    function ajax1() {
        return $.ajax({
            url: inurl,
            dataType: "json"
        });
    }
};

const toggleVegetation = function() {
    if (map.hasLayer(vegetationLayer)) {
        map.removeLayer(vegetationLayer);
        addToHistory('Hide vegetation');
    } else {
        map.addLayer(vegetationLayer);
        addToHistory('Show vegetation');
    }
};

const toggleHighways = function() {
    if (map.hasLayer(highwaysLayer)) {
        map.removeLayer(highwaysLayer);
        addToHistory('Hide highways');
    } else {
        map.addLayer(highwaysLayer);
        addToHistory('Show highways');
    }
};

const toggleSatellite = function() {
    var satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3']
    });
    if (map.hasLayer(satelliteLayer)) {
        map.removeLayer(satelliteLayer);
        addToHistory('Hide satellite');
    } else {
        map.addLayer(satelliteLayer);
        addToHistory('Show satellite');
    }
};

const toggleTerrain = function() {
    var terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png');
    if (map.hasLayer(terrainLayer)) {
        map.removeLayer(terrainLayer);
        addToHistory('Hide terrain');
    } else {
        map.addLayer(terrainLayer);
        addToHistory('Show terrain');
    }
};

const zoomIn = function() {
    map.zoomIn();
    addToHistory('Zoom in');
};

const zoomOut = function() {
    map.zoomOut();
    addToHistory('Zoom out');
};

const stoplistening = function() {
    annyang.abort();
    addToHistory('Stop listening');
};

let markersArray = [];
let routingControl = null;

const addMarker = function(city) {
    var markerUrl = "https://nominatim.openstreetmap.org/search?q=" + city + "&format=json&limit=1";
    $.ajax({
        url: markerUrl,
        dataType: "json",
        success: function(data) {
            var lat = data[0].lat;
            var lon = data[0].lon;
            var marker = L.marker([lat, lon]).addTo(map).bindPopup(city).openPopup();
            markersArray.push(marker); // Store marker in array
            addToHistory('Mark ' + city);
        }
    });
};

const removeMarker = function(city) {
    map.eachLayer(function(layer) {
        if (layer instanceof L.Marker && layer.getPopup().getContent() === city) {
            map.removeLayer(layer);
            addToHistory('Unmark ' + city);
        }
    });
    // Remove from markersArray as well
    markersArray = markersArray.filter(marker => marker.getPopup().getContent() !== city);
};

const calculateDistance = function() {
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
            styles: [{color: 'red', opacity: 0.6, weight: 4}]
        },
        createMarker: function() { return null; },
        routeWhileDragging: true,
        show: false,
        addWaypoints: false
    }).addTo(map);

    routingControl.on('routesfound', function(e) {
        var routes = e.routes;
        var summary = routes[0].summary;
        var distance = (summary.totalDistance / 1000).toFixed(2); // Convert to kilometers
        document.getElementById('distance').innerHTML = "Total distance: " + distance + " km";
        addToHistory('Calculate distance');
    });
};

const addToHistory = function(command) {
    var historyList = document.getElementById('history-list');
    var listItem = document.createElement('li');
    listItem.textContent = command;
    historyList.insertBefore(listItem, historyList.firstChild);
};

if (annyang) {
    const commands = {
        'hello': () => {
            alert('Hey there, try some commands!');
            addToHistory('Say hello');
        },
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
        'stop listening': stoplistening
    };
    annyang.addCommands(commands);
    annyang.start();
    SpeechKITT.annyang();
    SpeechKITT.setStylesheet('//cdnjs.cloudflare.com/ajax/libs/SpeechKITT/0.3.0/themes/flat-clouds.css');
    SpeechKITT.vroom();
}
