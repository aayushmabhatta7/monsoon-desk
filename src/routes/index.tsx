import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Monsoon Desk — India Weather & 5-Day Forecast" },
      {
        name: "description",
        content:
          "Live weather for Indian cities and any city worldwide: current conditions, next 24 hours and a 5-day forecast in English.",
      },
      {
        property: "og:title",
        content: "Monsoon Desk — India Weather & 5-Day Forecast",
      },
      {
        property: "og:description",
        content:
          "Quick picks for Delhi, Mumbai, Bengaluru and more, plus hourly and 5-day forecasts.",
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
      title="Monsoon Desk weather app"
      style={{ border: 0, width: "100%", height: "100vh", display: "block" }}
    />
  );
}
