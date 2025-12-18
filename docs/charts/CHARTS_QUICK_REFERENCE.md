# Charts & Visualizations - Quick Reference

**Phase 1, Task 5 - Final Task Implementation Guide**

---

## Quick Overview

This document provides a quick reference for implementing charts across all screens.

---

## 1. High-Priority Charts (Sprint 1 & 2)

### Finance Screen

| Chart Type | Location | Data | Purpose | Priority |
|------------|----------|------|---------|----------|
| **Line Chart** | Overview tab, after metrics | Last 30 days transactions | Spending trends | HIGH |
| **Pie Chart** | Overview tab | Current month by category | Category breakdown | HIGH |
| **Progress Circles** | Budgets tab | Active budgets | Budget health | HIGH |
| **Bar Chart** | New "Trends" section | Last 6 months | Income vs Expenses | MEDIUM |

### Habits Screen

| Chart Type | Location | Data | Purpose | Priority |
|------------|----------|------|---------|----------|
| **Bar Chart** | Inside habit card (expanded) | Last 12 weeks | Weekly completion rate | HIGH |
| **Contribution Graph** | Heatmap modal (enhanced) | Last 12 weeks | GitHub-style activity | HIGH |
| **Horizontal Bar** | Top of screen | All habits (30 days) | Habit comparison | MEDIUM |

### Dashboard Screen

| Chart Type | Location | Data | Purpose | Priority |
|------------|----------|------|---------|----------|
| **Sparklines** | Inside MetricCards | Last 7 days | Micro trends | HIGH |
| **Stacked Area** | New section | Weekly combined | Overall progress | MEDIUM |

---

## 2. Component Structure

```
src/components/charts/
├── index.ts                 ← Export all
├── BaseChart.tsx            ← Loading/error wrapper
├── ChartCard.tsx            ← Card with title/action
├── LineChart.tsx            ← Trends over time
├── BarChart.tsx             ← Comparisons
├── PieChart.tsx             ← Category splits
├── ProgressChart.tsx        ← Circular progress
├── ContributionGraph.tsx    ← Heatmap
└── Sparkline.tsx            ← Mini line chart
```

---

## 3. Data Functions

```
src/utils/
├── financeCharts.ts
│   ├── getDailySpending(days)
│   ├── getCategoryBreakdown()
│   ├── getMonthlyComparison(months)
│   └── getBudgetProgressData()
│
├── habitCharts.ts
│   ├── getWeeklyCompletionRates(habitId, weeks)
│   ├── getHeatmapData(habitId, weeks)
│   └── compareHabits()
│
└── dashboardCharts.ts
    ├── getWeeklyTrends()
    └── getSparklineData(metric)
```

---

## 4. Implementation Sprints

### Sprint 1: Foundation (3-4 hours)
- [ ] Install `react-native-chart-kit` and `react-native-svg`
- [ ] Create base components (`BaseChart`, `ChartCard`)
- [ ] Create `financeCharts.ts` utils
- [ ] Add **one** working chart to Finance screen
- [ ] Test on iOS and Android

**Output**: Foundation ready for all charts

---

### Sprint 2: Finance Charts (2-3 hours)
- [ ] Spending trend line chart
- [ ] Category pie chart
- [ ] Budget progress circles
- [ ] Income vs expense bars
- [ ] Polish interactions

**Output**: Finance screen fully enhanced

---

### Sprint 3: Habits Charts (2-3 hours)
- [ ] Create `habitCharts.ts` utils
- [ ] Weekly completion bars in habit cards
- [ ] Enhanced heatmap modal
- [ ] Habits comparison chart

**Output**: Habits screen fully enhanced

---

### Sprint 4: Dashboard & Final (1-2 hours)
- [ ] Sparklines in metric cards
- [ ] Dashboard utils
- [ ] Cross-screen testing
- [ ] Performance optimization
- [ ] Documentation

**Output**: Complete chart system

---

## 5. Key Code Snippets

### Install Dependencies
```bash
npm install react-native-chart-kit react-native-svg
```

### Import Charts
```typescript
import { LineChart, BarChart, PieChart, ProgressChart, ContributionGraph } from 'react-native-chart-kit';
```

### Chart Config (Theme)
```typescript
export const CHART_CONFIG = {
  backgroundColor: colors.background.secondary,
  backgroundGradientFrom: colors.background.secondary,
  backgroundGradientTo: colors.background.secondary,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
  labelColor: (opacity = 1) => colors.text.secondary,
  style: { borderRadius: borderRadius.lg },
};
```

### Basic Line Chart Usage
```typescript
<ChartCard title="Spending Trend" subtitle="Last 30 days">
  <LineChart
    data={{
      labels: ['1/1', '1/7', '1/14', '1/21', '1/28'],
      datasets: [{ data: [100, 200, 150, 300, 250] }],
    }}
    width={Dimensions.get('window').width - 32}
    height={220}
    chartConfig={CHART_CONFIG}
    bezier
    style={styles.chart}
  />
</ChartCard>
```

### Basic Pie Chart Usage
```typescript
<PieChart
  data={[
    { name: 'Food', population: 500, color: '#4285F4', legendFontColor: '#7F7F7F' },
    { name: 'Transport', population: 300, color: '#10B981', legendFontColor: '#7F7F7F' },
  ]}
  width={Dimensions.get('window').width - 32}
  height={220}
  chartConfig={CHART_CONFIG}
  accessor="population"
  backgroundColor="transparent"
  paddingLeft="15"
/>
```

---

## 6. Color Palette

```typescript
export const CHART_COLORS = [
  '#4285F4',  // Primary blue
  '#10B981',  // Green
  '#F59E0B',  // Amber
  '#EF4444',  // Red
  '#9333EA',  // Purple
  '#EC4899',  // Pink
  '#14B8A6',  // Teal
  '#F97316',  // Orange
];
```

---

## 7. Testing Checklist

- [ ] Charts render correctly on iOS
- [ ] Charts render correctly on Android
- [ ] Loading states work
- [ ] Empty states work
- [ ] Error states work
- [ ] Touch interactions work
- [ ] Data updates trigger re-renders
- [ ] No performance issues (smooth scrolling)
- [ ] Responsive to screen sizes
- [ ] Accessibility labels present

---

## 8. Common Issues & Solutions

### Issue: Chart not rendering
**Solution**: Ensure data format matches expected structure, check console for errors

### Issue: Chart cuts off on edges
**Solution**: Adjust padding and width calculations

### Issue: Performance lag
**Solution**: Limit data points, use `useMemo` for data transformations

### Issue: Colors not matching theme
**Solution**: Use `chartConfig` with theme colors

---

## 9. Data Format Examples

### Line Chart Data
```typescript
{
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  datasets: [{
    data: [50, 75, 60, 90, 80],
    color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
    strokeWidth: 2,
  }],
}
```

### Bar Chart Data
```typescript
{
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    data: [500, 600, 450, 700, 650, 800],
  }],
}
```

### Pie Chart Data
```typescript
[
  {
    name: 'Category 1',
    population: 500,
    color: '#4285F4',
    legendFontColor: colors.text.secondary,
    legendFontSize: 12,
  },
  // ... more categories
]
```

### Progress Chart Data
```typescript
{
  labels: ['Budget 1', 'Budget 2', 'Budget 3'],
  data: [0.8, 0.6, 1.0], // 80%, 60%, 100%
}
```

---

## 10. File Checklist

Create these files in order:

### Components
- [ ] `src/components/charts/index.ts`
- [ ] `src/components/charts/BaseChart.tsx`
- [ ] `src/components/charts/ChartCard.tsx`
- [ ] `src/components/charts/ChartError.tsx`
- [ ] `src/components/charts/ChartEmpty.tsx`
- [ ] `src/components/charts/ChartSkeleton.tsx`

### Utils
- [ ] `src/utils/chartConfig.ts`
- [ ] `src/utils/financeCharts.ts`
- [ ] `src/utils/habitCharts.ts`
- [ ] `src/utils/dashboardCharts.ts`

### Enhanced Screens
- [ ] Update `src/screens/main/FinanceScreen.tsx`
- [ ] Update `src/screens/main/HabitsScreen.tsx`
- [ ] Update `src/screens/main/DashboardScreen.tsx`

---

## 11. Success Metrics

### Functional
- ✅ All 6 high-priority charts working
- ✅ Data aggregation functions tested
- ✅ Responsive design verified

### Performance
- ✅ Render time < 500ms per chart
- ✅ No frame drops during scroll
- ✅ Memory usage acceptable

### UX
- ✅ Charts are visually appealing
- ✅ Empty states are helpful
- ✅ Touch interactions smooth

---

## 12. Next Steps After Implementation

1. Take screenshots for documentation
2. Update README.md with chart examples
3. Create video demo
4. Write user guide for chart features
5. Plan Phase 2 enhancements

---

## Quick Links

- [Full Implementation Plan](./CHARTS_IMPLEMENTATION_PLAN.md)
- [react-native-chart-kit Docs](https://github.com/indiespirit/react-native-chart-kit)
- [Design Mockups](./mockups/) (if available)

---

**Last Updated**: 2025-12-14
**Status**: Ready for implementation
**Estimated Time**: 8-12 hours
