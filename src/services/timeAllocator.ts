import { AIGeneratedWork } from '../types/worklog';
import { WorkItem } from '../types/worklog';

// Complexity weights for time allocation
const COMPLEXITY_WEIGHTS = {
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * Allocate time across work items based on complexity
 * Rounds to nearest 15 minutes for realistic time tracking
 */
export const allocateTime = (
  workItems: AIGeneratedWork[],
  totalHours: number
): WorkItem[] => {
  const totalMinutes = totalHours * 60;
  
  // Calculate total weight
  const totalWeight = workItems.reduce(
    (sum, item) => sum + COMPLEXITY_WEIGHTS[item.complexity],
    0
  );

  // Allocate time proportionally based on complexity
  let allocatedMinutes = 0;
  const workItemsWithTime: WorkItem[] = workItems.map((item, index) => {
    const weight = COMPLEXITY_WEIGHTS[item.complexity];
    const proportionalMinutes = (weight / totalWeight) * totalMinutes;
    
    // Round to nearest 15 minutes
    let roundedMinutes = Math.round(proportionalMinutes / 15) * 15;
    
    // Ensure minimum 15 minutes per item
    if (roundedMinutes < 15) {
      roundedMinutes = 15;
    }
    
    allocatedMinutes += roundedMinutes;
    
    return {
      id: `work-item-${index + 1}`,
      srNo: index + 1,
      description: item.description,
      timeSpent: roundedMinutes,
      complexity: item.complexity,
      category: item.category,
    };
  });

  // Adjust for rounding errors - add/subtract difference from largest item
  const difference = totalMinutes - allocatedMinutes;
  if (difference !== 0) {
    // Find the item with highest time allocation
    const maxIndex = workItemsWithTime.reduce(
      (maxIdx, item, idx, arr) => 
        item.timeSpent > arr[maxIdx].timeSpent ? idx : maxIdx,
      0
    );
    
    workItemsWithTime[maxIndex].timeSpent += difference;
    
    // Ensure it doesn't go below 15 minutes
    if (workItemsWithTime[maxIndex].timeSpent < 15) {
      // Redistribute from another item
      const secondMaxIndex = workItemsWithTime.reduce(
        (maxIdx, item, idx, arr) => 
          idx !== maxIndex && item.timeSpent > arr[maxIdx].timeSpent ? idx : maxIdx,
        maxIndex === 0 ? 1 : 0
      );
      
      const transfer = 15 - workItemsWithTime[maxIndex].timeSpent;
      workItemsWithTime[maxIndex].timeSpent = 15;
      workItemsWithTime[secondMaxIndex].timeSpent -= transfer;
    }
  }

  return workItemsWithTime;
};

/**
 * Recalculate time allocation when items are added/removed/edited
 * Preserves manually edited times where possible
 */
export const rebalanceTime = (
  items: WorkItem[],
  targetTotalMinutes: number
): WorkItem[] => {
  const currentTotal = items.reduce((sum, item) => sum + item.timeSpent, 0);
  const difference = targetTotalMinutes - currentTotal;

  if (difference === 0) {
    return items;
  }

  // If we need to add/remove time, distribute proportionally
  return items.map(item => {
    const proportion = item.timeSpent / currentTotal;
    const adjustment = Math.round(proportion * difference / 15) * 15;
    let newTime = item.timeSpent + adjustment;
    
    // Ensure minimum 15 minutes
    if (newTime < 15) {
      newTime = 15;
    }
    
    return {
      ...item,
      timeSpent: newTime,
    };
  });
};

/**
 * Validate that time allocation is reasonable
 */
export const validateTimeAllocation = (
  items: WorkItem[],
  expectedTotalHours: number
): { valid: boolean; message?: string } => {
  if (items.length === 0) {
    return { valid: false, message: 'No work items to validate' };
  }

  const totalMinutes = items.reduce((sum, item) => sum + item.timeSpent, 0);
  const totalHours = totalMinutes / 60;
  const expectedMinutes = expectedTotalHours * 60;

  // Check if total matches (allow 1 minute tolerance for rounding)
  if (Math.abs(totalMinutes - expectedMinutes) > 1) {
    return {
      valid: false,
      message: `Total time (${totalHours.toFixed(2)}h) doesn't match expected (${expectedTotalHours}h)`,
    };
  }

  // Check if any item has 0 or negative time
  const invalidItem = items.find(item => item.timeSpent <= 0);
  if (invalidItem) {
    return {
      valid: false,
      message: `Item "${invalidItem.description}" has invalid time allocation`,
    };
  }

  return { valid: true };
};
