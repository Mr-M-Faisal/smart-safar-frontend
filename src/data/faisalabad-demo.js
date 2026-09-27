// Illustrative local-only data. These routes and buses are not live schedules.
export const FAISALABAD_CENTER = [31.4181, 73.0776];

// Approximate demo map points for the prototype. They are not official bus-stop coordinates.
export const faisalabadDemoCoordinates = {
  "Ghanta Ghar": [31.4181, 73.0776],
  "Railway Station": [31.4218, 73.0802],
  "Allied Hospital": [31.4052, 73.0954],
  "Susan Road": [31.4021, 73.1112],
  "D Ground": [31.4073, 73.1124],
  GCUF: [31.4163, 73.0771],
  "Civil Hospital": [31.421, 73.0847],
  "Kohinoor City": [31.3922, 73.1088],
  "Jinnah Colony": [31.4251, 73.0815],
  "Peoples Colony": [31.4075, 73.099],
  "Millat Chowk": [31.4363, 73.1327],
  "DHQ Hospital": [31.4237, 73.0865],
  "University of Agriculture": [31.433, 73.0677],
  "Canal Road": [31.3818, 73.1006],
  "Samundri Road": [31.3879, 73.0755],
};

export const faisalabadDemoRoutes = [
  {
    _id: "demo-route-clocktower-dground",
    routeName: "Clock Tower – D Ground",
    startPoint: "Ghanta Ghar",
    endPoint: "D Ground",
    description: "A sample city-centre connection through familiar Faisalabad landmarks.",
    stops: ["Ghanta Ghar", "Railway Station", "Allied Hospital", "Susan Road", "D Ground"],
    buses: [
      { _id: "demo-bus-101", busNumber: "SS-101", status: "active", capacity: 40, availableSeats: 12, nextStop: "Allied Hospital", etaMinutes: 6, direction: "Outbound" },
      { _id: "demo-bus-102", busNumber: "SS-102", status: "active", capacity: 40, availableSeats: 21, nextStop: "Susan Road", etaMinutes: 11, direction: "Outbound" },
    ],
  },
  {
    _id: "demo-route-gcuf-susan",
    routeName: "GCUF – Susan Road",
    startPoint: "GCUF",
    endPoint: "Susan Road",
    description: "A sample university and neighbourhood route for the local prototype.",
    stops: ["GCUF", "Ghanta Ghar", "Civil Hospital", "Kohinoor City", "Susan Road"],
    buses: [
      { _id: "demo-bus-201", busNumber: "SS-201", status: "active", capacity: 36, availableSeats: 8, nextStop: "Kohinoor City", etaMinutes: 4, direction: "Outbound" },
      { _id: "demo-bus-202", busNumber: "SS-202", status: "idle", capacity: 36, availableSeats: 36, nextStop: "GCUF", etaMinutes: null, direction: "Outbound" },
    ],
  },
  {
    _id: "demo-route-railway-millat",
    routeName: "Railway Station – Millat Chowk",
    startPoint: "Railway Station",
    endPoint: "Millat Chowk",
    description: "A sample eastbound trip linking the station with Millat Chowk.",
    stops: ["Railway Station", "Ghanta Ghar", "Jinnah Colony", "Peoples Colony", "Millat Chowk"],
    buses: [
      { _id: "demo-bus-301", busNumber: "SS-301", status: "active", capacity: 40, availableSeats: 17, nextStop: "Jinnah Colony", etaMinutes: 9, direction: "Outbound" },
      { _id: "demo-bus-302", busNumber: "SS-302", status: "active", capacity: 40, availableSeats: 5, nextStop: "Peoples Colony", etaMinutes: 3, direction: "Return" },
    ],
  },
  {
    _id: "demo-route-clocktower-agri",
    routeName: "Ghanta Ghar – University of Agriculture",
    startPoint: "Ghanta Ghar",
    endPoint: "University of Agriculture",
    description: "A sample northbound route for students and visitors.",
    stops: ["Ghanta Ghar", "GCUF", "DHQ Hospital", "University of Agriculture"],
    buses: [
      { _id: "demo-bus-401", busNumber: "SS-401", status: "active", capacity: 32, availableSeats: 14, nextStop: "DHQ Hospital", etaMinutes: 7, direction: "Outbound" },
    ],
  },
  {
    _id: "demo-route-dground-samundri",
    routeName: "D Ground – Samundri Road",
    startPoint: "D Ground",
    endPoint: "Samundri Road",
    description: "A sample southbound connection across the city.",
    stops: ["D Ground", "Susan Road", "Kohinoor City", "Canal Road", "Samundri Road"],
    buses: [
      { _id: "demo-bus-501", busNumber: "SS-501", status: "active", capacity: 36, availableSeats: 19, nextStop: "Canal Road", etaMinutes: 8, direction: "Outbound" },
      { _id: "demo-bus-502", busNumber: "SS-502", status: "maintenance", capacity: 36, availableSeats: 0, nextStop: "D Ground", etaMinutes: null, direction: "Return" },
    ],
  },
];

export function demoStopsForRoute(route) {
  return (route?.stops || []).map((stopName, index) => ({
    _id: `${route._id}-stop-${index + 1}`,
    stopName,
    stopOrder: index + 1,
    latitude: faisalabadDemoCoordinates[stopName]?.[0] ?? FAISALABAD_CENTER[0],
    longitude: faisalabadDemoCoordinates[stopName]?.[1] ?? FAISALABAD_CENTER[1],
  }));
}
