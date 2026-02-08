# LumenRoute AI

**Built for UGAHacks 11** | *Theme: Magic*

## About The Project

LumenRoute AI transforms existing city infrastructure into an intelligent safety network. We built this platform during UGAHacks 11 to address two critical issues for Georgia commuters: traffic safety and environmental impact.

By leveraging Google Gemini 1.5, we analyze live feeds from over 50 GDOT traffic cameras in real-time. This allows us to detect hazards like flooding, accidents, and debris faster than traditional reporting methods. We combine this visual data with environmental metrics to offer drivers "Eco-Routes"—paths optimized not just for speed, but for lower carbon emissions and higher safety scores.

### Key Features

- **Guardian Dashboard**: Real-time monitoring of Atlanta's traffic network. The system automatically flags hazards using computer vision on live camera feeds.
- **Eco-Route Planner**: Intelligent routing algorithm that factors in CO2 emissions, air quality, and active hazard data to suggest safer alternatives.
- **Scout Mode**: A community reporting tool where users can submit infrastructure issues (like potholes or broken chargers). Submissions are verified instantly by Gemini Vision to filter spam.
- **Multimodal Analysis**: The core engine integrates visual data from cameras, text reports from users, and sensor data (weather/AQI) to make complex routing decisions.

## Team Members

- [Name] - [Role]
- [Name] - [Role]
- [Name] - [Role]
- [Name] - [Role]

## Tech Stack

We prioritized performance and real-time capabilities for this build.

### Frontend
- **React + Vite**: For a responsive, client-side application.
- **TypeScript**: Ensuring type safety across complex data structures.
- **Leaflet**: Lightweight mapping library for rendering routes and camera clusters.
- **Tailwind CSS**: Rapid UI development with a consistent design system.

### Backend
- **Bun**: Chosen for its high-performance runtime and built-in tooling.
- **Hono**: A lightweight web framework optimized for edge deployment.
- **Google Generative AI SDK**: Powering both the vision analysis (Gemini 1.5 Flash) and reasoning engine (Gemini Pro).

### Deployment
- **Docker**: Containerized both services for consistent environments.
- **Nginx**: Handles reverse proxying and SPA routing.
- **DigitalOcean**: Cloud hosting for the live demo.

## Challenges & Solutions

### Real-Time Data Synchronization
Integrating GDOT's ArcGIS MapServer presented a challenge due to the sheer volume of data and rate limits. Querying the full dataset frequently would cause latency.
**Solution**: We implemented a diffing strategy in our backend. The server polls the API at set intervals but only processes and broadcasts updates for cameras whose status has changed, significantly reducing overhead.

### Validating User Reports
Crowdsourced data is valuable but prone to noise. We needed a way to verify reports without manual moderation during the hackathon.
**Solution**: We used Gemini Vision as an automated moderator. When a user uploads a photo of a "pothole," the AI analyzes the image context. If it doesn't match the report category, the submission is automatically rejected.

### Docker Networking for SPA
Configuring Nginx to serve a React Single Page Application while proxying API requests to a separate backend container was initially problematic for deep linking.
**Solution**: We wrote a custom Nginx configuration that routes `/api` traffic to the backend container while using `try_files` to direct all other requests to `index.html`, ensuring the frontend router handles navigation correctly.

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js (v18+) if running locally

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/lumenroute-ai.git
    cd lumenroute-ai
    ```

2.  Configure environment variables:
    Copy `.env.example` to `.env` and add your API keys (Google Maps, Gemini, etc.).
    ```bash
    cp .env.example .env
    ```

3.  Run with Docker Compose:
    ```bash
    docker-compose up --build
    ```

4.  Access the application:
    - Frontend: `http://localhost:80`
    - Backend: `http://localhost:3000`

## License

Distributed under the MIT License.

## Acknowledgments

- **UGAHacks** for hosting.
- **GDOT** for providing open access to traffic camera data.
- **Google** for the Gemini API.
- **DigitalOcean**, **State Farm**, and **Cox Automotive** for their support and resources.
