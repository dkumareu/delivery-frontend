declare global {
  interface Window {
    google: {
      maps: {
        Map: any;
        Marker: any;
        Polyline: any;
        InfoWindow: any;
        LatLng: any;
        MapTypeId: any;
        SymbolPath: any;
        TravelMode: any;
        DirectionsStatus: any;
        DirectionsService: any;
        DirectionsRenderer: any;
        DirectionsRequest: any;
        DirectionsResult: any;
        DirectionsRoute: any;
        DirectionsLeg: any;
        DirectionsWaypoint: any;
        // Routes API types
        RoutesService: any;
        RoutesRenderer: any;
        RouteRequest: any;
        RouteResponse: any;
        Route: any;
        RouteLeg: any;
        RouteStep: any;
        RouteSegment: any;
        RoutePolyline: any;
      };
    };
  }
}

export {};
