# LumenRoute AI - 5 Minute Demo Script
**Targeting:** Cox Automotive (Sustainability/Georgia), State Farm (Community Impact), Google Gemini (Best Use)

## 0:00 - 0:45 | The Problem & The Hook
*(Camera on Speaker)*
"Hi everyone. We all know Atlanta traffic is legendary—but it's not just about the delays. It's about safety and our environmental footprint. Every day, commuters face hazards like flooding, potholes, and debris, while idling cars contribute massively to Georgia's carbon emissions.

We asked: **What if we could use the existing infrastructure to make our roads safer *and* greener?**

Introducing **LumenRoute AI**. We've built a smart commute intelligence platform from scratch that leverages Multimodal AI to transform Georgia's Department of Transportation (GDOT) cameras into a real-time Guardian network."

## 0:45 - 2:00 | Feature 1: Guardian Dashboard (The "Magic")
*(Screen Share: Navigate to Guardian Tab)*
"Let's start with the **Guardian Dashboard**. This isn't just a map; it's a live nervous system of Atlanta's roads.

We are pulling feeds from over 50 real GDOT traffic cameras. But we don't just display them. We pass these images through **Google Gemini 1.5 Flash**.

*(Click on a camera with a hazard status)*
Look at this. Gemini analyzes the visual data in real-time to detect specific hazards. Here, it's identified [mention a hazard from your mock data, e.g., 'Heavy Rain' or 'High Congestion']. It assigns a severity score and logs it instantly.

This directly addresses the **Cox Automotive** challenge by using AI to optimize transport flow and safety locally in Georgia. We're proactively identifying risks before they cause accidents, turning passive monitoring into active protection."

## 2:00 - 3:00 | Feature 2: Route Planner (Sustainability)
*(Navigate to Routes Tab)*
"Now, how does this help the driver? That's where our **Route Planner** comes in.

*(Type in 'Georgia Tech' to 'Piedmont Park')*
Most GPS apps just give you the fastest route. LumenRoute calculates the **Eco-Impact**.

We combine real-time traffic data, weather patterns from OpenWeatherMap, and current Air Quality Index (AQI) to generate routes that might be slightly slower but significantly greener.

*(Point to the result card)*
See here—LumenRoute suggests this alternative path. It avoids the congestion we saw earlier, reducing idle time and cutting CO2 emissions by [X]%. This puts sustainability directly in the hands of the driver.

Notice the **Safety Score** as well. This generated route has actively steered us away from the hazard we just saw on the Guardian dashboard. It's a holistic approach to routing: Safety + Sustainability + Speed."

## 3:00 - 4:15 | Feature 3: Scout Mode (Community & State Farm)
*(Navigate to Scout Tab)*
"Safety is a community effort, which brings us to **Scout Mode**—our solution for the **State Farm Good Neighbor Challenge**.

Citizens often see problems before cameras do. A broken EV charger, a deep pothole, or a blocked bike lane. But traditional reporting creates a moderation bottleneck.

*(Demonstrate 'Reporting' a specific issue)*
A user snaps a photo and submits a report. But how do we prevent spam? **Gemini Vision** again.

The system automatically verifies the image. If I upload a picture of a pothole, Gemini confirms it, categorizes the severity, and only *then* adds it to the public hazard map. This is safety through connectivity, empowering every citizen to be a 'Good Neighbor' without overloading city resources."

## 4:15 - 4:45 | The Tech Stack (Google Gemini)
*(Show a code snippet or architecture diagram briefly if available, or just stay on landing page)*
"Under the hood, we built this completely from scratch using React, Bun, and Hono.

We used **Google Gemini** not just as a chatbot, but as a multimodal reasoning engine. It's handling:
1.  **Computer Vision** for GDOT cameras.
2.  **Verification** for citizen reports.
3.  **Complex Reasoning** to weigh safety vs. speed vs. emissions in our routing algorithm.
4.  **Real-time adaptation** to changing weather and traffic conditions.

## 4:45 - 5:15 | Conclusion
"LumenRoute AI turns passive infrastructure into active intelligence. We're helping Georgia drivers avoid accidents, reducing local carbon emissions, and empowering communities to fix their own neighborhoods.

This isn't just about getting from point A to point B. It's about how we get there together—safer, cleaner, and smarter.

We're LumenRoute AI, illuminating the road ahead. Thank you."
