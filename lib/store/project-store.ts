import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Dataset,
  DashboardConfig,
  AuthConfig,
} from "@/lib/dashlink/types";
import type { DashWidget, GridItem } from "@/lib/dashlink/builder-types";
import { configToWidgets } from "@/lib/dashlink/builder-types";
import { DEMO_SALES_DATA } from "@/lib/dashlink/dummy-data";
import { DEFAULT_THEME_ID } from "@/lib/dashlink/themes";

export interface Project {
  id: string;
  name: string;
  apiUrl: string;
  /** Authentication config for this project's API */
  authConfig: AuthConfig;
  /** Dot-notation path into the JSON response that holds the data array ("\ = root) */
  dataPath: string;
  createdAt: string;
  /** Schema config derived from the API data */
  config: DashboardConfig | null;
  /** Dashboard widgets for the builder */
  widgets: DashWidget[];
  /** Grid positions */
  layout: GridItem[];
  /** Data for rendering charts */
  data: Dataset;
  /** Theme ID for the dashboard */
  theme: string;
}

interface ProjectState {
  projects: Project[];
  // Actions
  createProject: (name: string) => string;
  /** Create a fully-configured project (wizard flow) */
  createProjectFull: (
    name: string,
    apiUrl: string,
    auth: AuthConfig,
    dataPath: string,
    widgets: DashWidget[],
    layout: GridItem[],
    data: Dataset,
  ) => string;
  deleteProject: (id: string) => void;
  updateName: (id: string, name: string) => void;
  updateApiUrl: (id: string, apiUrl: string) => void;
  updateAuth: (id: string, auth: AuthConfig) => void;
  updateDataPath: (id: string, dataPath: string) => void;
  /** Populate widgets + layout from generated config */
  applyConfig: (id: string, config: DashboardConfig, data: Dataset) => void;
  /** Persist layout changes from the drag-and-drop grid */
  saveLayout: (id: string, layout: GridItem[]) => void;
  /** Reorder both widgets and layout arrays after drag-and-drop */
  reorderWidgets: (
    id: string,
    widgets: DashWidget[],
    layout: GridItem[],
  ) => void;
  /** Update a single widget's height after resize */
  resizeWidget: (id: string, widgetId: string, height: number) => void;
  addWidget: (id: string, widget: DashWidget, gridItem: GridItem) => void;
  removeWidget: (projectId: string, widgetId: string) => void;
  /** Update a widget's field config in-place */
  updateWidget: (
    projectId: string,
    widgetId: string,
    patch: Partial<DashWidget>,
  ) => void;
  /** Change the dashboard theme */
  updateTheme: (id: string, themeId: string) => void;
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
              authConfig: { type: "none" },
              dataPath: "",
              createdAt: new Date().toISOString(),
              config: null,
              widgets: [],
              layout: [],
              data: [],
              theme: DEFAULT_THEME_ID,
            },
            ...s.projects,
          ],
        }));
        return id;
      },

      createProjectFull(name, apiUrl, auth, dataPath, widgets, layout, data) {
        const id = uid();
        set((s) => ({
          projects: [
            {
              id,
              name: name || `Dashboard ${new Date().toLocaleDateString()}`,
              apiUrl,
              authConfig: auth,
              dataPath,
              createdAt: new Date().toISOString(),
              config: null,
              widgets,
              layout,
              data,
              theme: DEFAULT_THEME_ID,
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

      updateAuth(id, auth) {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, authConfig: auth } : p,
          ),
        }));
      },

      updateDataPath(id, dataPath) {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, dataPath } : p,
          ),
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

      updateWidget(projectId, widgetId, patch) {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  widgets: p.widgets.map((w) =>
                    w.id === widgetId ? ({ ...w, ...patch } as DashWidget) : w,
                  ),
                }
              : p,
          ),
        }));
      },

      updateTheme(id, themeId) {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, theme: themeId } : p,
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
