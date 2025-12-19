/**
 * Chart Accessibility Utilities
 * Provides accessibility features for charts including descriptions and data tables
 */

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

export interface ChartAccessibilityOptions {
  title?: string;
  type?: 'line' | 'bar' | 'pie' | 'heatmap' | 'area';
  unit?: string;
  minValue?: number;
  maxValue?: number;
  average?: number;
}

/**
 * Generate a text description of chart data for screen readers
 */
export function getChartDescription(
  data: ChartDataPoint[],
  options: ChartAccessibilityOptions = {}
): string {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  const { title = 'Chart', type = 'line', unit = '' } = options;
  const values = data.map(d => d.value);

  const min = options.minValue ?? Math.min(...values);
  const max = options.maxValue ?? Math.max(...values);
  const avg = options.average ?? values.reduce((a, b) => a + b, 0) / values.length;

  const formatValue = (val: number) => {
    if (unit === '$' || unit === 'currency') {
      return `$${val.toFixed(2)}`;
    }
    return `${val}${unit}`;
  };

  let description = `${title}. ${type.charAt(0).toUpperCase() + type.slice(1)} chart with ${data.length} data points. `;

  if (type === 'pie') {
    description += `Total: ${formatValue(values.reduce((a, b) => a + b, 0))}. `;
    const topItems = data
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map(d => `${d.label}: ${formatValue(d.value)}`)
      .join(', ');
    description += `Top items: ${topItems}. `;
  } else {
    description += `Range from ${formatValue(min)} to ${formatValue(max)}. `;
    description += `Average: ${formatValue(avg)}. `;

    if (data.length >= 2) {
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const change = lastValue - firstValue;
      const percentChange = firstValue !== 0 ? ((change / firstValue) * 100).toFixed(1) : '0';

      if (change > 0) {
        description += `Trending upward by ${percentChange}%. `;
      } else if (change < 0) {
        description += `Trending downward by ${Math.abs(Number(percentChange))}%. `;
      } else {
        description += `Stable with no change. `;
      }
    }
  }

  return description.trim();
}

/**
 * Convert chart data to a formatted text table for screen readers
 */
export function getChartDataTable(
  data: ChartDataPoint[],
  options: ChartAccessibilityOptions = {}
): string {
  if (!data || data.length === 0) {
    return 'No data to display';
  }

  const { unit = '' } = options;

  const formatValue = (val: number) => {
    if (unit === '$' || unit === 'currency') {
      return `$${val.toFixed(2)}`;
    }
    return `${val}${unit}`;
  };

  let table = 'Data table:\n';

  data.forEach((point, index) => {
    const label = point.date || point.label || `Point ${index + 1}`;
    table += `${label}: ${formatValue(point.value)}\n`;
  });

  return table.trim();
}

/**
 * Announce chart data changes to screen readers
 */
export function announceChartData(
  description: string,
  accessibilityLabel?: string
): void {
  // React Native will handle the announcement via accessibilityLabel
  // This is a placeholder for any additional announcement logic
  if (__DEV__) {
    console.log('[Chart Accessibility]', accessibilityLabel || description);
  }
}

/**
 * Generate heatmap description for screen readers
 */
export function getHeatmapDescription(
  completions: string[],
  weeks: number,
  habitName?: string
): string {
  const total = completions.length;
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - weeks * 7);

  const totalDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const completionRate = totalDays > 0 ? ((total / totalDays) * 100).toFixed(1) : '0';

  let description = habitName
    ? `${habitName} completion heatmap. `
    : 'Habit completion heatmap. ';

  description += `Showing last ${weeks} weeks. `;
  description += `${total} completions out of ${totalDays} days. `;
  description += `Completion rate: ${completionRate}%. `;

  // Find longest streak
  const sortedDates = completions.sort();
  let longestStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0 ||
        new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime() === 86400000) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  if (longestStreak > 0) {
    description += `Longest streak: ${longestStreak} days.`;
  }

  return description.trim();
}

/**
 * Format spending trend for accessibility
 */
export function getSpendingTrendDescription(
  dailySpending: { date: string; amount: number }[],
  days: number
): string {
  if (!dailySpending || dailySpending.length === 0) {
    return `No spending data for the last ${days} days`;
  }

  const total = dailySpending.reduce((sum, day) => sum + day.amount, 0);
  const average = total / days;
  const max = Math.max(...dailySpending.map(d => d.amount));
  const maxDay = dailySpending.find(d => d.amount === max);

  let description = `Spending trend for last ${days} days. `;
  description += `Total spending: $${(total / 100).toFixed(2)}. `;
  description += `Daily average: $${(average / 100).toFixed(2)}. `;

  if (maxDay) {
    const date = new Date(maxDay.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    description += `Highest spending day: ${date} with $${(max / 100).toFixed(2)}.`;
  }

  return description.trim();
}

/**
 * Format category breakdown for accessibility
 */
export function getCategoryBreakdownDescription(
  categories: { category: string; amount: number; percentage: number }[]
): string {
  if (!categories || categories.length === 0) {
    return 'No category data available';
  }

  const total = categories.reduce((sum, cat) => sum + cat.amount, 0);

  let description = `Category breakdown. Total: $${(total / 100).toFixed(2)}. `;

  const topCategories = categories
    .slice(0, 5)
    .map(cat =>
      `${cat.category}: $${(cat.amount / 100).toFixed(2)} (${cat.percentage.toFixed(1)}%)`
    )
    .join(', ');

  description += `Top categories: ${topCategories}.`;

  return description.trim();
}

/**
 * Format monthly comparison for accessibility
 */
export function getMonthlyComparisonDescription(
  monthlyData: { month: string; income: number; expenses: number }[]
): string {
  if (!monthlyData || monthlyData.length === 0) {
    return 'No monthly comparison data available';
  }

  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

  let description = `Monthly comparison for ${monthlyData.length} months. `;
  description += `Current month: Income $${(currentMonth.income / 100).toFixed(2)}, `;
  description += `Expenses $${(currentMonth.expenses / 100).toFixed(2)}. `;

  if (previousMonth) {
    const incomeChange = currentMonth.income - previousMonth.income;
    const expensesChange = currentMonth.expenses - previousMonth.expenses;

    description += `Compared to previous month: `;
    description += `Income ${incomeChange >= 0 ? 'increased' : 'decreased'} by $${Math.abs(incomeChange / 100).toFixed(2)}, `;
    description += `Expenses ${expensesChange >= 0 ? 'increased' : 'decreased'} by $${Math.abs(expensesChange / 100).toFixed(2)}.`;
  }

  return description.trim();
}
