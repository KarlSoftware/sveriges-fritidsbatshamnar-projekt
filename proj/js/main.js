(function () {
    'use strict';


    // Add shared header and footer as a toolbar.
    $( "[data-role='header'], [data-role='footer']" ).toolbar();

    // Add shared panel as a panel.
    $("#menu").panel().enhanceWithin();


    /**
    * Add eventhandler for the navigate back event.
    */
    $('[data-swiperight="back"]').on("swiperight", function() {
        window.history.back();
        return false;
    });


    /**
     * Update the harbour map using Leaflet map, openstreetmap.
     */
     var calls = 0;
    window.updateHarbourMap = function() {
        calls += 1;
        var totalHarbour = document.getElementById("total_harbour");

        totalHarbour.innerHTML = harbour.length;

        if (calls <= 1) {
            // Initialize Leaflet map with coordinates set to Sweden-ish.
            var mymap = L.map( 'harbourMap', {
                center: [64, 15],
                minZoom: 2,
                zoom: 3
            });

            // Use openstreetmap for tiling the map.
            L.tileLayer( 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                subdomains: ['a','b','c']
            }).addTo( mymap );

            // Use custom icons for markers.
            var myIcon = L.icon({
            iconUrl: 'js/../img/pin24.png',
            iconRetinaUrl: 'js/../img/pin48.png',
            iconSize: [29, 24],
            iconAnchor: [9, 21],
            popupAnchor: [0, -14]
            });

            // Make clusters of markers to speed up the map. Without this the app crashes.
            var markerClusters = L.markerClusterGroup();

            for ( var i = 0; i < harbour.length; i += 1 )
            {
                if (harbour[i].Latitud && harbour[i].Longitud) {
                    var service = "";

                    harbour[i].Serviceanlaggningar.forEach(function(item) {
                        service += item.Namn + "<br>";
                    });

                    var popup = harbour[i].Hamn +
                                '<br/><b>Latitud:</b> ' + harbour[i].Latitud +
                                '<br/><b>Longitud:</b> ' + harbour[i].Longitud +
                                '<br/><b>Serviceanläggningar:</b><br>' + service;

                    var m = L.marker( [harbour[i].Latitud, harbour[i].Longitud], { icon: myIcon } )
                                    .bindPopup( popup );

                    markerClusters.addLayer(m);
                }
            }
            mymap.addLayer(markerClusters);


            // Leaflet needs to know the size of the element it is embedded in when initializing.
            setTimeout(function() {
                mymap.invalidateSize();
            }, 0);


            // Locate the user using Leaflet Geolocation.
            mymap.locate({ setView: true, maxZoom: 10 });

            // Finding location: Success!
            function onLocationFound(e) {
                var radius = e.accuracy / 2;

                L.marker(e.latlng, { icon: myIcon }).addTo(mymap)
                    .bindPopup("Du är här någonstans.").openPopup();

                L.circle(e.latlng, radius).addTo(mymap);
            }
            mymap.on('locationfound', onLocationFound);

            // Finding location: Fail!
            function onLocationError(e) {
                console.log(e.message);
            }
            mymap.on('locationerror', onLocationError);
        }
    };



    /**
     * Cache the JSON objekt.
     */
    var harbour = null;
    $(document).on('pagebeforeshow', '#harbour-map', function(/* event, data */){

        if (harbour !== null) {
            console.log('harbour already set. Gets harbour from cache.');
            window.updateHarbourMap();
            return;
        }

        $.ajax({
            url: "./harbour.json",
            dataType: "json",

            success: function (data) {
                console.log('setting harbour.');
                harbour = data;
                window.updateHarbourMap();
            },

            error: function (/* request, error */) {
                console.log('Network error has occurred please try again!');
            }
        });
    });



    /**
     * Get JSON, if not already available and update harbour list,
     * before loading page.
     */
    $(document).on('pagebeforeshow', '#harbour-list', function(/* event, data */){

        if (harbour !== null) {
            console.log('harbour already set. Gets harbour from cache.');
            window.updateHarbourList();
            return;
        }

        $.ajax({
            url: "./harbour.json",
            dataType: "json",

            success: function (data) {
                console.log('setting harbour.');
                harbour = data;
                window.updateHarbourList();
            },

            error: function (/* request, error */) {
                console.log('Network error has occurred please try again!');
            }
        });
    });



    /**
     * Update harbour list with harbours for each county.
     */
    var totalHarbourArr = [];
    var countyName = [0];
    var countyHarbours = [];
    window.updateHarbourList = function() {
        var list = document.getElementById("harbour-listview");
        var html = "";
        var html2 = "";
        var county, theHarbour, harbourCount = 0, rowId = 0;

        harbour.forEach(function(row) {
            if (county === row.Kommun && theHarbour !== row.Hamn) {
                harbourCount += 1;
                theHarbour = row.Hamn;

                html2 += "<h3>" + row.Hamn + "</h3>";

                if (row.Latitud && row.Longitud) {
                    html2 += "<b>Latitud: </b>" + row.Latitud + "<br><b>Longitud: </b>" + row.Longitud + "<br><br>";
                }

                html2 += "<b>Serviceanläggningar:</b><br>";

                row.Serviceanlaggningar.forEach(function(service) {
                    html2 += service.Namn + "<br>";
                });

                if (row.Meddelanden) {
                    html2 += "<br><b>Meddelanden:</b><br>";
                    row.Meddelanden.forEach(function(message) {
                        html2 += "<i>Datum: </i>" + message.Datum + "<br><i>Meddelande: </i>" + message.Meddelande + "<br><br>";
                    });
                }

                html2 += "________________________________";

            } else if (county !== row.Kommun) {
                totalHarbourArr.push(harbourCount);
                countyName.push(row.Kommun);
                countyHarbours.push(html2);

                html2 = "________________________________";
                html2 += "<h3>" + row.Hamn + "</h3>";

                html += "<li><a href='#harbour-list-" + rowId + "'>" + row.Kommun + "</a>";
                if (row.Latitud && row.Longitud) {
                    html2 += "<b>Latitud: </b>" + row.Latitud + "<br><b>Longitud: </b>" + row.Longitud + "<br><br>";
                }

                html2 += "<b>Serviceanläggningar:</b><br>";

                row.Serviceanlaggningar.forEach(function(service) {
                    html2 += service.Namn + "<br>";
                });

                if (row.Meddelanden) {
                    html2 += "<br><b>Meddelanden:</b><br>";
                    row.Meddelanden.forEach(function(message) {
                        html2 += "<i>Datum: </i>" + message.Datum + "<br><i>Meddelande: </i>" + message.Meddelande + "<br><br>";
                    });
                }

                html2 += "________________________________";

                county = row.Kommun;
                harbourCount = 1;
                rowId += 1;
            }
        });

        totalHarbourArr.push(harbourCount);
        countyHarbours.push(html2);

        list.innerHTML = html;

        $('#harbour-listview').listview('refresh');
    };



    /**
     * Display subpage, expect that JSON is already loaded.
     */
    var harbourSubPageId = null;

    $(document).on('pagebeforeshow', '#harbour-page', function() {
        console.log(harbourSubPageId);

       window.updateHarbourSubPage(harbourSubPageId);

    });


    /**
     * Update subpage with details from specified county.
     */
    window.updateHarbourSubPage = function(pageId) {
        var element = document.getElementById("harbour-subpage");
        var html = "Specified page id not found.";

        if (harbourSubPageId === pageId) {
            html = "<h1>" + countyName[parseInt(pageId)+1] + "</h1><h2>Antal fritidsbåtshamnar: " + totalHarbourArr[parseInt(pageId)+1] + "</h2>";
            html += countyHarbours[parseInt(pageId)+1];
        }

        element.innerHTML = html;
    };


    /**
     * Intercept change of page and implement routing.
     */
    $("body").on( "pagecontainerbeforechange", function( event, ui ) {
        var to = ui.toPage;
        var from = ui.options.fromPage;

        // If not a valid pageid
        if (typeof to  === 'string') {
            var url = $.mobile.path.parseUrl(to);
            var toSubPage;

            to = url.hash || '#' + url.pathname.substring(1);

            if (from) {
                from = '#' + from.attr('id');
            }

            var length = "#harbour-list-".length;
            toSubPage = to.substring(0, length);

            if (from === '#harbour-list' && toSubPage === '#harbour-list-') {
                event.preventDefault();
                event.stopPropagation();

                harbourSubPageId = to.substring(length);
                console.log("Subpageid = " + harbourSubPageId);
                $(":mobile-pagecontainer").pagecontainer("change", "#harbour-page", { foo: "Hello World!" });
            }
        }
    });
})();
