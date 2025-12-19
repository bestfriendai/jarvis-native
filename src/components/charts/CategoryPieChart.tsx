/**
 * CategoryPieChart Component
 * Pie chart showing spending breakdown by category
 */

import React, { useState, useEffect } from 'react';
import { View, Dimensions, StyleSheet, Text } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { BaseChart } from './BaseChart';
import { ChartCard } from './ChartCard';
import { baseChartConfig } from '../../utils/charts/chartConfig';
import { getCategoryBreakdownData, CategoryBreakdownData } from '../../utils/charts/financeCharts';
import { colors, typography, spacing } from '../../theme';
import { getChartDescription, getChartDataTable } from '../../utils/chartAccessibility';

interface CategoryPieChartProps {
  month?: string;
  onViewDetails?: () => void;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  month,
  onViewDetails,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CategoryBreakdownData | null>(null);

  useEffect(() => {
    loadData();
  }, [month]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const chartData = await getCategoryBreakdownData(month);
      setData(chartData);
    } catch (err) {
      console.error('Error loading category breakdown:', err);
      setError('Failed to load category data');
    } finally {
      setIsLoading(false);
    }
  };

  const screenWidth = Dimensions.get('window').width;

  const isEmpty = !data;

  // Format data for PieChart
  const pieData = data
    ? data.labels.map((label, index) => ({
        name: label,
        population: data.data[index],
        color: data.colors[index],
        legendFontColor: colors.text.secondary,
        legendFontSize: 12,
      }))
    : [];

  // Generate accessibility description
  const chartDataPoints = data?.labels.map((label, index) => ({
    label: label,
    value: data.data[index],
  })) || [];

  const total = chartDataPoints.reduce((sum, point) => sum + point.value, 0);
  const accessibilityDescription = data
    ? getChartDescription(chartDataPoints, {
        title: 'Category breakdown',
        type: 'pie',
        unit: '$',
      })
    : 'No category data available';

  const dataTable = data ? getChartDataTable(chartDataPoints, { unit: '$' }) : '';

  return (
    <ChartCard
      title="Category Breakdown"
      subtitle="This month"
      onAction={onViewDetails}
      actionLabel={onViewDetails ? 'Details' : undefined}
    >
      <View
        accessible={true}
        accessibilityLabel={accessibilityDescription}
        accessibilityRole="image"
        accessibilityHint="Double tap for detailed view"
      >
        <BaseChart
          isLoading={isLoading}
          error={error}
          isEmpty={isEmpty}
          emptyMessage="No spending data yet"
          height={260}
        >
          {data && (
            <>
              <View
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                <PieChart
                  data={pieData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={baseChartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  hasLegend={false}
                  style={styles.chart}
                />
              </View>
              <View
                style={styles.legend}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                {data.labels.map((label, index) => (
                  <View key={label} style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: data.colors[index] }]}
                    />
                    <Text style={styles.legendText}>
                      {label} (${data.data[index].toFixed(0)})
                    </Text>
                  </View>
                ))}
              </View>

              {/* Hidden text alternative for screen readers */}
              <Text
                style={styles.hiddenText}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                {dataTable}
              </Text>
            </>
          )}
        </BaseChart>
      </View>
    </ChartCard>
  );
};

const styles = StyleSheet.create({
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legend: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
  hiddenText: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});

export default CategoryPieChart;
