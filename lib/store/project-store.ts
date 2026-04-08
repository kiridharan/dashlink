import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Dataset, DashboardConfig } from "@/lib/dashlink/types";
import type { DashWidget, GridItem } from "@/lib/dashlink/builder-types";
import { configToWidgets } from "@/lib/dashlink/builder-types";
import { DEMO_SALES_DATA } from "@/lib/dashlink/dummy-data";

export interface Project {
  id: string;
  name: string;
  apiUrl: string;
  createdAt: string;
  /** Schema config derived from the API data */
  config: DashboardConfig | null;
  /** Dashboard widgets for the builder */
  widgets: DashWidget[];
  /** Grid positions */
  layout: GridItem[];
  /** Data for rendering charts (demo data while backend is pending) */
  data: Dataset;
}

interface ProjectState {
  projects: Project[];
  // Actions
  createProject: (name: string) => string;
  deleteProject: (id: string) => void;
  updateName: (id: string, name: string) => void;
  updateApiUrl: (id: string, apiUrl: string) => void;
  /** Populate widgets + layout from generated config */
  applyConfig: (id: string, config: DashboardConfig, data: Dataset) => void;
  /** Persist layout changes from the drag-and-drop grid */
  saveLayout: (id: string, layout: GridItem[]) => void;
  /** Reorder both widgets and layout arrays after drag-and-drop */
  reorderWidgets: (id: string, widgets: DashWidget[], layout: GridItem[]) => void;
  /** Update a single widget's height after resize */
  resizeWidget: (id: string, widgetId: string, height: number) => void;
  addWidget: (id: string, widget: DashWidget, gridItem: GridItem) => void;
  removeWidget: (projectId: string, widgetId: string) => void;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],

      createProject(name) {
        const id = uid();
        set((s) => ({
          projects: [
            {
              id,
              name: name || `Dashboard ${new Date().toLocaleDateString()}`,
              apiUrl: "",
              createdAt: new Date().toISOString(),
              config: null,
              widgets: [],
              layout: [],
              data: [],
            },
            ...s.projects,
          ],
        }));
        return id;
      },

      deleteProject(id) {
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
      },

      updateName(id, name) {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)),
        }));
      },

      updateApiUrl(id, apiUrl) {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, apiUrl } : p)),
        }));
      },

      applyConfig(id, config, data) {
        const { widgets, layout } = configToWidgets(config);
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  config,
                  widgets,
                  layout,
                  // Use provided data or fall back to demo
                  data: data.length > 0 ? data : DEMO_SALES_DATA,
                }
              : p,
          ),
        }));
      },

      saveLayout(id, layout) {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, layout } : p)),
        }));
      },

      reorderWidgets(id, widgets, layout) {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, widgets, layout } : p,
          ),
        }));
      },

      resizeWidget(id, widgetId, height) {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  layout: p.layout.map((l) =>
                    l.i === widgetId ? { ...l, height } : l,
                  ),
                }
              : p,
          ),
        }));
      },

      addWidget(id, widget, gridItem) {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  widgets: [...p.widgets, widget],
                  layout: [...p.layout, gridItem],
                }
              : p,
          ),
        }));
      },

      removeWidget(projectId, widgetId) {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  widgets: p.widgets.filter((w) => w.id !== widgetId),
                  layout: p.layout.filter((l) => l.i !== widgetId),
                }
              : p,
          ),
        }));
      },
    }),
    {
      name: "dashlink-projects",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return localStorage;
      }),
    },
  ),
);
