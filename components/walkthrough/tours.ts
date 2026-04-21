import type { TourStep } from "./WalkthroughTour";

export const DASHBOARD_TOUR_KEY = "dashlink:tour:dashboard:v1";
export const BUILDER_TOUR_KEY = "dashlink:tour:builder:v1";

export const dashboardTourSteps: TourStep[] = [
  {
    selector: null,
    title: "Welcome to DashLink 👋",
    body: "Turn any JSON API into a live dashboard in under a minute. Let's take a 30-second tour.",
  },
  {
    selector: "[data-tour='new-dashboard']",
    title: "Start with a new dashboard",
    body: "Paste an API URL — or upload a JSON file — and we'll detect fields and suggest widgets.",
    placement: "left",
  },
  {
    selector: "[data-tour='project-list']",
    title: "Your dashboards live here",
    body: "Each card auto-saves as you build. Click one to open the builder, share, embed, or set up alerts.",
    placement: "top",
  },
  {
    selector: "[data-tour='replay-tour']",
    title: "Replay anytime",
    body: "Need a refresher? Hit this button to restart the tour from the beginning.",
    placement: "bottom",
  },
];

export const builderTourSteps: TourStep[] = [
  {
    selector: "[data-tour='widget-palette']",
    title: "Add widgets from detected fields",
    body: "We auto-detected the fields in your API response. Pick a field, choose a widget type, and we'll drop it onto the canvas.",
    placement: "right",
  },
  {
    selector: "[data-tour='filters']",
    title: "Filter the whole dashboard",
    body: "Add field, search, or date filters and they apply across every widget instantly.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='save-state']",
    title: "Auto-save is on",
    body: "Changes are saved 600ms after you stop editing. Every save also creates a version you can restore.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='nav-history']",
    title: "Time-travel your dashboard",
    body: "View every prior version, diff what changed field by field, and restore in one click.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='nav-alerts']",
    title: "Get notified of changes",
    body: "Set thresholds on any KPI. We'll check on a schedule and ping a webhook or email when something moves.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='nav-embed']",
    title: "Embed anywhere",
    body: "Preview the embed iframe at any size, then copy a one-line snippet for your docs, blog, or app.",
    placement: "bottom",
  },
  {
    selector: "[data-tour='share']",
    title: "Share publicly",
    body: "Toggle the dashboard to public and grab a shareable link. Embeds & cron alerts require this too.",
    placement: "left",
  },
];
