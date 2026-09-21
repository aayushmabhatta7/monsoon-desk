import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Skycast — Live Weather & 5-Day Forecast" },
      {
        name: "description",
        content:
          "Search any city or use your location for current conditions, a 24-hour strip and a 5-day forecast.",
      },
      { property: "og:title", content: "Skycast — Live Weather & 5-Day Forecast" },
      {
        property: "og:description",
        content:
          "Current weather, hourly and 5-day forecast with dynamic day/night themes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/weather.html"
      title="Skycast weather app"
      style={{ border: 0, width: "100%", height: "100vh", display: "block" }}
    />
  );
}
