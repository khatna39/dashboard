mapboxgl.accessToken =
'pk.eyJ1Ijoia2hhdG5hMzkiLCJhIjoiY21sNXl0ZGNjMDg4YzNjb2F6djRqeWZ6dyJ9.LGvvVbi09f99mlpbidyXAQ';

let map = new mapboxgl.Map({
container: 'map', // container ID
style: 'mapbox://styles/mapbox/light-v10',
zoom: 5, // starting zoom
minZoom: 3,
center: [-98, 38] // starting center
});

let casesChart = null,
cases = {},
numCounties = 0;

const grades = [0, 1000, 5000, 10000, 20000, 100000],
colors = ['rgb(237,248,251)', 'rgb(204,236,230)', 'rgb(153,216,201)', 'rgb(102,194,164)', 'rgb(65,174,118)', 'rgb(35,139,69)'],
radii = [3, 5, 12, 15, 24, 33];

const legend = document.getElementById('legend');

let labels = ['<strong>Cases</strong>'],
vbreak;

for (var i = 0; i < grades.length; i++) {
vbreak = grades[i];
dot_radii = 2 * radii[i];
labels.push(
    '<p class="break"><i class="dot" style="background:' + colors[i] + '; width: ' + dot_radii +
    'px; height: ' +
    dot_radii + 'px; "></i> <span class="dot-label" style="top: ' + dot_radii / 2 + 'px;">' + vbreak +
    '</span></p>');

}

legend.innerHTML = labels.join('');



async function geojsonFetch() {

let response;
response = await fetch('assets/us-covid-2020-counts.json');
Covidcases = await response.json();



map.on('load', () => { //simplifying the function statement: arrow with brackets to define a function


    map.addSource('Covidcases', {
        type: 'geojson',
        data: Covidcases
    });


    map.addLayer({
            'id': 'Covidcases-point',
            'type': 'circle',
            'source': 'Covidcases',
            'minzoom': 5,
            'paint': {
                'circle-radius': {
                    'property': 'cases',
                    'stops': [
                        [grades[0], radii[0]],
                        [grades[1], radii[1]],
                        [grades[2], radii[2]],
                        [grades[3], radii[3]],
                        [grades[4], radii[4]],
                        [grades[5], radii[5]]
                    ]
                },
                'circle-color': {
                    'property': 'cases',
                    'stops': [
                        [grades[0], colors[0]],
                        [grades[1], colors[1]],
                        [grades[2], colors[2]],
                        [grades[3], colors[3]],
                        [grades[4], colors[4]],
                        [grades[5], colors[5]]
                    ]
                },
                'circle-stroke-color': 'white',
                'circle-stroke-width': 1,
                'circle-opacity': 0.6
            }
        },
        'waterway-label' // make the thematic layer above the waterway-label layer.
    );


    map.on('click', 'Covidcases-point', (event) => {
        new mapboxgl.Popup()
            .setLngLat(event.features[0].geometry.coordinates)
            .setHTML(`
                <strong>Cases:</strong> ${event.features[0].properties.cases}<br/>
                <strong>${event.features[0].properties.county}, ${event.features[0].properties.state}</strong>
            `)
            .addTo(map);
    });



        
    Cases = calCovidcases(Covidcases, map.getBounds());

    numCounties = Object.values(Cases).reduce((a, b) => a + b, 0);

    document.getElementById("cases-count").innerHTML = numCounties;

    x = Object.keys(Cases);
    x.unshift("cases")
    y = Object.values(Cases);
    y.unshift("#")


    casesChart = c3.generate({
        size: {
            height: 350,
            width: 460
        },
        data: {
            x: 'cases',
            columns: [x, y],
            type: 'bar', // make a bar chart.
            colors: {
                '#': (d) => {
                    return colors[d["x"]];
                }
            },
            onclick: function (
            d) { // update the map and sidebar once the bar is clicked.
                let floor = parseInt(x[1 + d["x"]]),
                    ceiling = floor + 1;

                map.setFilter('cases-point',
                    ['all',
                        ['>=', 'cases', floor],
                        ['<', 'cases', ceiling]
                    ]);
            }
        },
        axis: {
            x: { //magnitude
                type: 'category',
            },
            y: { //count
                tick: {
                    values: [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1100, 1200, 1300]
                }
            }
        },
        legend: {
            show: false
        },
        bindto: "#cases-chart" 
    });

});



//load data to the map as new layers.
//map.on('load', function loadingData() {
map.on('idle', () => { //simplifying the function statement: arrow with brackets to define a function

    Cases = calCovidcases(Covidcases, map.getBounds());
    numCounties = Object.values(Cases).reduce((a, b) => a + b, 0);
    document.getElementById("cases-count").innerHTML = numCounties;


    x = Object.keys(Cases);
    x.unshift("cases")
    y = Object.values(Cases);
    y.unshift("#")

    casesChart.load({
        columns: [x, y]
    });
});
}

geojsonFetch();

function calCovidcases(currentCases, currentMapBounds) {

let casesClasses = {
    0: 0,
    1000: 0,
    5000: 0,
    10000: 0,
    20000: 0,
    100000: 0
};
currentCases.features.forEach(function (d) { // d indicate a feature of currentEarthquakes
    if (currentMapBounds.contains(d.geometry.coordinates)) {
        
        const v = Number(d.properties.cases);
        if(!Number.isFinite(v)) return;

        let chosen = grades[0];
        for(let i = 0; i < grades.length; i++){
            if(v>= grades[i]) chosen = grades[i];
        }

        casesClasses[chosen] += 1;
    }

})
return casesClasses;
}

const reset = document.getElementById('reset');
reset.addEventListener('click', event => {

map.flyTo({
    zoom: 5,
    center: [-98, 38]
});
map.setFilter('cases-point', null)


});