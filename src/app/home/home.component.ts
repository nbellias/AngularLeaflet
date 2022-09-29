import { Component, HostListener, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from "@angular/common/http";
// declare variable
declare let L: any;
import '../../../node_modules/leaflet-velocity/dist/leaflet-velocity.js';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  mapStuff: any;
  map: any;
  layerControl: any;
  latlngs: any = [];
  msg: string = "";
  distance = 0.0;
  firstLatLng: any;
  secondLatLng: any;
  shipIcon: any;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.mapStuff = this.initMainMap();
    this.map = this.mapStuff.map;
    this.layerControl = this.mapStuff.layerControl;
    this.shipIcon = L.icon({
      iconUrl: 'assets/img/ship.png',
      iconSize: [38, 45], // size of the icon
      iconAnchor: [22, 44], // point of the icon which will correspond to marker's location
      popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });

  }

  initMainMap(): any {

    const OpenStreetMap = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    });

    const Esri_WorldImagery = L.tileLayer(
      "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, " +
          "AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
      }
    );

    const Esri_DarkGreyCanvas = L.tileLayer(
      "http://{s}.sm.mapstack.stamen.com/" +
      "(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/" +
      "{z}/{x}/{y}.png",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, " +
          "NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community"
      }
    );

    const baseLayers = {
      "OpenStreetMap": OpenStreetMap,
      Satellite: Esri_WorldImagery,
      "Grey Canvas": Esri_DarkGreyCanvas
    };

    const mainMap = L.map("map", {
      layers: [OpenStreetMap]
    });

    const layerControl = L.control.layers(baseLayers);
    layerControl.addTo(mainMap);
    //Athens-Peiraeus-Salamis-Aegina
    mainMap.setView([37.920106521749915, 23.669036146997126], 11);

    // Winds overlay
    this.http
      .get<any>("assets/datasources/wind-global.json")
      .subscribe(data => {
        const velocityLayer = L.velocityLayer({
          displayValues: true,
          displayOptions: {
            velocityType: "Global Wind",
            position: "bottomleft",
            emptyString: "No wind data"
          },
          data: data,
          maxVelocity: 15
        });

        layerControl.addOverlay(velocityLayer, "Wind - Global");

      });

    // Waters overlay
    this.http
      .get<any>("assets/datasources/water-gbr.json")
      .subscribe(data => {
        const velocityLayer = L.velocityLayer({
          displayValues: true,
          displayOptions: {
            velocityType: "Global Water",
            position: "bottomleft",
            emptyString: "No water data"
          },
          data: data,
          velocityScale: 0.1 // arbitrary default 0.005
        });

        layerControl.addOverlay(velocityLayer, "Sea currents - Global");

      });

    return {
      map: mainMap,
      layerControl: layerControl
    };
  }

  // We have to declare onMapClick as property
  // in order to use it in measureDistance in
  // this.map.on... and this.map.off...
  onMapClick = (e: any) => {
    /* popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map); */
    //console.log(this.map);
    const marker = L.marker([e.latlng.lat, e.latlng.lng], { icon: this.shipIcon }).addTo(this.map);
    this.latlngs.push([e.latlng.lat, e.latlng.lng]);
    const polyline = L.polyline(this.latlngs, { color: 'red' }).addTo(this.map);
    if (!this.firstLatLng)
      this.firstLatLng = e.latlng;
    this.secondLatLng = e.latlng;
    this.distance = this.map.distance(this.firstLatLng, this.secondLatLng);
    this.msg = this.distance.toString();//e.latlng.toString();
  }

  measureDistance(): void {
    console.log('Measuring distance');
    //console.log(this.map);
    if (this.latlngs.length === 0)
      this.map.on('click', this.onMapClick);
    else {
      this.map.off('click', this.onMapClick);
      this.clearMap();
    }

  }

  clearMap(): void {
    console.log("Clearing map...");
    this.latlngs = [];
    this.map.eachLayer((layer: any) => {
      const hasEmptyContrib = !(layer.getAttribution && layer.getAttribution());
      const hasNoContrib = !layer.getAttribution;
      if (hasEmptyContrib || hasNoContrib) {
        this.map.removeLayer(layer);
      }
    });
    this.firstLatLng = this.secondLatLng = undefined;
    this.distance = 0.0;
    this.msg = "";
  }

  resetShapes(): void {
    console.log("Resetting map...");
    this.latlngs = [];
    this.firstLatLng = this.secondLatLng = undefined;
    this.distance = 0.0;
    this.msg = "";
  }

}
