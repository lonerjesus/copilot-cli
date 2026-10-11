/**
 * Move an item to the slot immediately after the current item without changing
 * which item is current. Pure helper so queue semantics can be regression-tested.
 */
export type QueueEntry = { id: string };

export function queueItemNext<T extends QueueEntry>(
  queue: T[],
  currentIndex: number,
  item: T,
): { queue: T[]; currentIndex: number } {
  const current = queue[currentIndex];

  // "Play Next" on the current item is a no-op, not a move to the end.
  if (current?.id === item.id) {
    return { queue, currentIndex };
  }

  const withoutItem = queue.filter((entry) => entry.id !== item.id);
  if (!current) {
    const insertionIndex = Math.min(Math.max(currentIndex + 1, 0), withoutItem.length);
    const reordered = [
      ...withoutItem.slice(0, insertionIndex),
      item,
      ...withoutItem.slice(insertionIndex),
    ];
    return {
      queue: reordered,
      currentIndex: Math.max(0, reordered.findIndex((entry) => entry.id === item.id)),
    };
  }

  const preservedIndex = withoutItem.findIndex((entry) => entry.id === current.id);
  const insertionIndex = preservedIndex + 1;
  const reordered = [
    ...withoutItem.slice(0, insertionIndex),
    item,
    ...withoutItem.slice(insertionIndex),
  ];

  return {
    queue: reordered,
    currentIndex: reordered.findIndex((entry) => entry.id === current.id),
  };
}
