# GreenCommute ATL - Guardian Edition

A smart commute intelligence platform for safer, greener Georgia. Combines multimodal AI with real-time GDOT traffic camera feeds to provide hazard detection and eco-friendly route recommendations.

## Features

### Guardian Dashboard
- **Real-time GDOT camera monitoring** - 50+ live traffic cameras from Atlanta metro area
- **AI-powered hazard detection** - Automatic detection of floods, fires, crashes, debris, and more
- **Interactive map** - View camera locations and hazard status on an interactive map
- **Live camera feeds** - View real-time traffic camera images with refresh capability

### Route Planner
- **Intelligent routing** - AI-powered route recommendations based on current conditions
- **Eco-friendly options** - Compare fastest vs. eco-friendly routes with CO2 savings
- **Real-time hazard avoidance** - Routes automatically consider active traffic hazards
- **Environmental data** - Air quality index, weather conditions, and health advisories

### Scout Mode
- **Community reporting** - Report broken EV chargers, potholes, blocked bike lanes
- **AI verification** - Gemini Vision verifies submitted reports
- **Status tracking** - Track report status (pending, verified, resolved)

## Tech Stack

### Frontend (webapp/)
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- TanStack Query for data fetching
- Leaflet for maps

### Backend (backend/)
- Bun + Hono
- Real-time GDOT ArcGIS API integration
- Mock Gemini AI analysis (ready for real integration)

## API Endpoints

### Cameras
- `GET /api/cameras` - Get all monitored cameras with current status
- `GET /api/cameras/refresh` - Force refresh camera data from GDOT
- `GET /api/cameras/hazards/active` - Get only cameras with active hazards
- `GET /api/cameras/:camId` - Get single camera details
- `POST /api/cameras/:camId/analyze` - Trigger AI analysis on camera

### Routes
- `POST /api/routes/plan` - Plan a route with AI recommendations
  ```json
  {
    "origin": "Atlanta, GA",
    "destination": "Marietta, GA",
    "preferEco": true
  }
  ```

### Reports (Scout Mode)
- `GET /api/reports` - Get all community reports
- `POST /api/reports` - Create new report
- `GET /api/reports/:reportId` - Get report details
- `PATCH /api/reports/:reportId/resolve` - Mark report as resolved

## Data Sources

- **Traffic Cameras**: GDOT ArcGIS MapServer (https://rnhp.dot.ga.gov)
- **Camera Images**: Georgia Navigator C2C (http://navigator-c2c.dot.ga.gov/snapshots/)
- **Air Quality**: AirNow API (mock data for MVP)
- **Weather**: OpenWeatherMap (mock data for MVP)

## Hackathon Targets

- **MLH (Gemini)**: AI-powered hazard detection and route recommendations
- **Cox Automotive (Sustainability)**: EV charger reporting, eco-friendly routing
- **State Farm (Community Safety)**: Real-time hazard alerts, community reporting

## Running Locally

Frontend and backend servers run automatically via Vibecode.

- Frontend: http://localhost:8000
- Backend: http://localhost:3000
