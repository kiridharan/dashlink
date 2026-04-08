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
import KpiWidgetCard from "./widgets/KpiWidgetCard";
import LineWidgetChart from "./widgets/LineWidgetChart";
import BarWidgetChart from "./widgets/BarWidgetChart";
import TableWidgetView from "./widgets/TableWidgetView";

// ---- Span → Tailwind col-span class map ----
const SPAN_CLASS: Record<number, string> = {
  3:  "col-span-3  sm:col-span-3",
  4:  "col-span-4  sm:col-span-4",
  6:  "col-span-6  sm:col-span-6",
  12: "col-span-12 sm:col-span-12",
};
function spanClass(span: number): string {
  return SPAN_CLASS[span] ?? "col-span-6";
}

// ---- Widget content resolver ----
function WidgetContent({ widget, data }: { widget: DashWidget; data: Dataset }) {
  switch (widget.type) {
    case "kpi":   return <KpiWidgetCard widget={widget} data={data} />;
    case "line":  return <LineWidgetChart widget={widget} data={data} />;
    case "bar":   return <BarWidgetChart widget={widget} data={data} />;
    case "table": return <TableWidgetView widget={widget} data={data} />;
  }
}

// ---- Single sortable + resizable widget tile ----
interface TileProps {
  widget: DashWidget;
  gridItem: GridItem;
  data: Dataset;
  onRemove: (id: string) => void;
  onResize: (id: string, height: number) => void;
  isDragging?: boolean;
}

function SortableTile({ widget, gridItem, data, onRemove, onResize, isDragging }: TileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: widget.id });

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
          top: false, left: false, right: false,
          topLeft: false, topRight: false,
          bottomLeft: false, bottomRight: false,
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
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow group-hover:shadow-md">
          {/* Drag handle bar */}
          <div
            {...attributes}
            {...listeners}
            className="flex cursor-grab items-center justify-between border-b border-zinc-100 px-3 py-2 active:cursor-grabbing"
          >
            <div className="flex items-center gap-2 select-none">
              {/* 6-dot drag icon */}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-zinc-300">
                <circle cx="2.5" cy="2.5" r="1"/><circle cx="6" cy="2.5" r="1"/><circle cx="9.5" cy="2.5" r="1"/>
                <circle cx="2.5" cy="6"   r="1"/><circle cx="6" cy="6"   r="1"/><circle cx="9.5" cy="6"   r="1"/>
                <circle cx="2.5" cy="9.5" r="1"/><circle cx="6" cy="9.5" r="1"/><circle cx="9.5" cy="9.5" r="1"/>
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                {widget.type}
              </span>
            </div>
            {/* Resize indicator */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-300">{gridItem.height}px</span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onRemove(widget.id)}
                className="rounded p-0.5 text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
                aria-label="Remove widget"
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
  onReorder: (widgets: DashWidget[], layout: GridItem[]) => void;
  onRemoveWidget: (id: string) => void;
  onResizeWidget: (id: string, height: number) => void;
}

export default function GridCanvas({
  widgets,
  layout,
  data,
  onReorder,
  onRemoveWidget,
  onResizeWidget,
}: CanvasProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (widgets.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white">
        <div className="text-center">
          <div className="mb-3 text-3xl">📊</div>
          <p className="text-sm font-medium text-zinc-500">Paste a URL above and hit Generate</p>
          <p className="mt-1 text-xs text-zinc-400">or add widgets from the palette →</p>
        </div>
      </div>
    );
  }

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;
  const activeItem   = activeId ? layout.find((l) => l.i === activeId) : null;

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
    const newLayout  = arrayMove(layout, oldIdx, newIdx);
    onReorder(newWidgets, newLayout);
  }

  return (
    <>
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
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
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
                  onRemove={onRemoveWidget}
                  onResize={onResizeWidget}
                />
              );
            })}
          </div>
        </SortableContext>

        {/* Drag overlay — ghost of the dragged tile */}
        <DragOverlay>
          {activeWidget && activeItem ? (
            <div
              style={{ height: activeItem.height }}
              className="rounded-xl border border-zinc-300 bg-white/70 shadow-xl backdrop-blur"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
