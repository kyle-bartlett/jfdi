'use client';

import { useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { QuickAdd } from '@/components/ops/QuickAdd';

interface KanbanCard {
  id: string;
}

interface KanbanBoardProps<T extends KanbanCard> {
  columns: string[];
  items: T[];
  getStatus: (item: T) => string;
  renderCard: (item: T, index: number) => React.ReactNode;
  onStatusChange: (id: string, newStatus: string) => void;
  onQuickAdd?: (title: string, status: string) => void;
  quickAddPlaceholder?: string;
  columnColors?: Record<string, string>;
}

export function KanbanBoard<T extends KanbanCard>({
  columns,
  items,
  getStatus,
  renderCard,
  onStatusChange,
  onQuickAdd,
  quickAddPlaceholder = 'Add item...',
  columnColors,
}: KanbanBoardProps<T>) {
  const getColumnItems = useCallback(
    (col: string) => items.filter((i) => getStatus(i) === col),
    [items, getStatus]
  );

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    onStatusChange(draggableId, newStatus);
  };

  const defaultColColors: Record<string, string> = {
    'Backlog': 'border-slate-500',
    'In Progress': 'border-blue-500',
    'Review': 'border-yellow-500',
    'Done': 'border-green-500',
    'Lead': 'border-slate-500',
    'Contacted': 'border-blue-500',
    'Responded': 'border-cyan-500',
    'Proposal': 'border-yellow-500',
    'Negotiating': 'border-orange-500',
    'Won': 'border-green-500',
    'Lost': 'border-red-500',
    'Queued': 'border-slate-500',
    'Running': 'border-blue-500',
    'Completed': 'border-green-500',
    'Failed': 'border-red-500',
  };

  const colors = columnColors || defaultColColors;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {columns.map((col) => {
          const colItems = getColumnItems(col);
          return (
            <div key={col} className="flex-shrink-0 w-72">
              <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${colors[col] || 'border-slate-600'}`}>
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{col}</h3>
                <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{colItems.length}</span>
              </div>
              <Droppable droppableId={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[200px] p-1 rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-slate-700/30' : ''}`}
                  >
                    {colItems.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transition-shadow ${snapshot.isDragging ? 'shadow-xl shadow-blue-500/10' : ''}`}
                          >
                            {renderCard(item, index)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              {onQuickAdd && (
                <div className="mt-2">
                  <QuickAdd placeholder={quickAddPlaceholder} onAdd={(title) => onQuickAdd(title, col)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
