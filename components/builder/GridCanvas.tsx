"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Resizable } from "re-resizable";

import type { DashWidget, GridItem } from "@/lib/dashlink/builder-types";
import type { Dataset } from "@/lib/dashlink/types";
import { ThemeProvider } from "@/lib/dashlink/theme-context";
import { getTheme } from "@/lib/dashlink/themes";
import KpiWidgetCard from "./widgets/KpiWidgetCard";
import LineWidgetChart from "./widgets/LineWidgetChart";
import BarWidgetChart from "./widgets/BarWidgetChart";
import TableWidgetView from "./widgets/TableWidgetView";
import PieWidgetChart from "./widgets/PieWidgetChart";
import WidgetConfigPanel from "./WidgetConfigPanel";

// ---- Span → Tailwind col-span class map ----
const SPAN_CLASS: Record<number, string> = {
  3: "col-span-3  sm:col-span-3",
  4: "col-span-4  sm:col-span-4",
  6: "col-span-6  sm:col-span-6",
  12: "col-span-12 sm:col-span-12",
};
function spanClass(span: number): string {
  return SPAN_CLASS[span] ?? "col-span-6";
}

// ---- Widget content resolver ----
function WidgetContent({
  widget,
  data,
}: {
  widget: DashWidget;
  data: Dataset;
}) {
  switch (widget.type) {
    case "kpi":
      return <KpiWidgetCard widget={widget} data={data} />;
    case "line":
      return <LineWidgetChart widget={widget} data={data} />;
    case "bar":
      return <BarWidgetChart widget={widget} data={data} />;
    case "pie":
      return <PieWidgetChart widget={widget} data={data} />;
    case "table":
      return <TableWidgetView widget={widget} data={data} />;
  }
}

// ---- Single sortable + resizable widget tile ----
interface TileProps {
  widget: DashWidget;
  gridItem: GridItem;
  data: Dataset;
  cardBg: string;
  cardBorderColor: string;
  dragHandleBorderColor: string;
  cardRadius: number;
  cardShadow: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onResize: (id: string, height: number) => void;
}

function SortableTile({
  widget,
  gridItem,
  data,
  cardBg,
  cardBorderColor,
  dragHandleBorderColor,
  cardRadius,
  cardShadow,
  isSelected,
  onSelect,
  onRemove,
  onResize,
}: TileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: widget.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.35 : 1,
    zIndex: isSortableDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${spanClass(gridItem.span)} group`}
    >
      <Resizable
        size={{ width: "100%", height: gridItem.height }}
        minHeight={100}
        maxHeight={700}
        enable={{
          bottom: true,
          top: false,
          left: false,
          right: false,
          topLeft: false,
          topRight: false,
          bottomLeft: false,
          bottomRight: false,
        }}
        onResizeStop={(_e, _dir, _ref, d) => {
          onResize(widget.id, gridItem.height + d.height);
        }}
        handleStyles={{
          bottom: {
            bottom: 0,
            height: 6,
            cursor: "row-resize",
          },
        }}
        handleClasses={{ bottom: "resize-handle-bottom" }}
      >
        <div
          className="flex h-full flex-col overflow-hidden border shadow-sm transition-shadow group-hover:shadow-md"
          style={{
            background: cardBg,
            borderColor: isSelected ? "#3b82f6" : cardBorderColor,
            borderRadius: cardRadius,
            boxShadow: isSelected
              ? "0 0 0 2px rgba(59,130,246,0.3)"
              : cardShadow,
          }}
        >
          {/* Drag handle bar */}
          <div
            {...attributes}
            {...listeners}
            className="flex cursor-grab items-center justify-between border-b px-3 py-2 active:cursor-grabbing"
            style={{ borderColor: dragHandleBorderColor }}
          >
            <div className="flex items-center gap-2 select-none">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
                className="text-zinc-300"
              >
                <circle cx="2.5" cy="2.5" r="1" />
                <circle cx="6" cy="2.5" r="1" />
                <circle cx="9.5" cy="2.5" r="1" />
                <circle cx="2.5" cy="6" r="1" />
                <circle cx="6" cy="6" r="1" />
                <circle cx="9.5" cy="6" r="1" />
                <circle cx="2.5" cy="9.5" r="1" />
                <circle cx="6" cy="9.5" r="1" />
                <circle cx="9.5" cy="9.5" r="1" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                {widget.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-300">
                {gridItem.height}px
              </span>
              {widget.type !== "table" && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onSelect(widget.id)}
                  aria-label="Configure widget"
                  className={`rounded p-0.5 text-xs transition ${
                    isSelected
                      ? "text-blue-500"
                      : "text-zinc-300 opacity-0 group-hover:opacity-100"
                  } hover:bg-zinc-100`}
                  title="Configure widget"
                >
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              )}
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onRemove(widget.id)}
                className="rounded p-0.5 text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
                aria-label="Remove widget"
              >
                <svg
                  width="12"
                  height="12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          {/* Widget content */}
          <div className="flex-1 overflow-hidden">
            <WidgetContent widget={widget} data={data} />
          </div>
        </div>
      </Resizable>
    </div>
  );
}

// ---- Main Canvas ----
export interface CanvasProps {
  widgets: DashWidget[];
  layout: GridItem[];
  data: Dataset;
  themeId?: string;
  onReorder: (widgets: DashWidget[], layout: GridItem[]) => void;
  onRemoveWidget: (id: string) => void;
  onResizeWidget: (id: string, height: number) => void;
  onUpdateWidget: (widgetId: string, patch: Partial<DashWidget>) => void;
}

export default function GridCanvas({
  widgets,
  layout,
  data,
  themeId,
  onReorder,
  onRemoveWidget,
  onResizeWidget,
  onUpdateWidget,
}: CanvasProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const theme = getTheme(themeId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const selectedWidget = selectedWidgetId
    ? widgets.find((w) => w.id === selectedWidgetId)
    : null;

  const handleSelectWidget = (id: string) => {
    setSelectedWidgetId((prev) => (prev === id ? null : id));
  };

  if (widgets.length === 0) {
    return (
      <div
        className="flex h-full min-h-100 items-center justify-center rounded-2xl border-2 border-dashed"
        style={{ borderColor: theme.cardBorderColor, background: theme.cardBg }}
      >
        <div className="text-center">
          <div className="mb-3 text-3xl">📊</div>
          <p
            className="text-sm font-medium"
            style={{ color: theme.mutedColor }}
          >
            Add widgets from the fields panel
          </p>
          <p className="mt-1 text-xs" style={{ color: theme.axisTickColor }}>
            Use the sidebar on the left →
          </p>
        </div>
      </div>
    );
  }

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;
  const activeItem = activeId ? layout.find((l) => l.i === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = widgets.findIndex((w) => w.id === active.id);
    const newIdx = widgets.findIndex((w) => w.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const newWidgets = arrayMove(widgets, oldIdx, newIdx);
    const newLayout = arrayMove(layout, oldIdx, newIdx);
    onReorder(newWidgets, newLayout);
  }

  return (
    <ThemeProvider themeId={themeId}>
      <div className="flex gap-0">
        <div className="flex-1 min-w-0">
          <style>{`
          .resize-handle-bottom {
            background: transparent;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 2px;
          }
          .resize-handle-bottom::after {
            content: "";
            display: block;
            width: 32px;
            height: 3px;
            border-radius: 999px;
            background: #d4d4d8;
            opacity: 0;
            transition: opacity 0.15s;
          }
          .group:hover .resize-handle-bottom::after {
            opacity: 1;
          }
        `}</style>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={widgets.map((w) => w.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-12 gap-3">
                {widgets.map((widget) => {
                  const item = layout.find((l) => l.i === widget.id);
                  if (!item) return null;
                  return (
                    <SortableTile
                      key={widget.id}
                      widget={widget}
                      gridItem={item}
                      data={data}
                      cardBg={theme.cardBg}
                      cardBorderColor={theme.cardBorderColor}
                      dragHandleBorderColor={theme.dragHandleBorderColor}
                      cardRadius={theme.chart.cardRadius}
                      cardShadow={theme.chart.cardShadow}
                      isSelected={selectedWidgetId === widget.id}
                      onSelect={handleSelectWidget}
                      onRemove={onRemoveWidget}
                      onResize={onResizeWidget}
                    />
                  );
                })}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeWidget && activeItem ? (
                <div
                  style={{
                    height: activeItem.height,
                    borderColor: theme.cardBorderColor,
                    background: theme.cardBg,
                  }}
                  className="rounded-xl border shadow-xl backdrop-blur opacity-80"
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Right-side config panel */}
        {selectedWidget && (
          <WidgetConfigPanel
            widget={selectedWidget}
            data={data}
            onUpdate={(patch) => onUpdateWidget(selectedWidget.id, patch)}
            onClose={() => setSelectedWidgetId(null)}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
