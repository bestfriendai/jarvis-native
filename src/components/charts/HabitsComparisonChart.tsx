/**
 * HabitsComparisonChart Component
 * Bar chart comparing completion rates across multiple habits
 */

import React, { useState, useEffect } from 'react';
import { View, Dimensions, StyleSheet, Text } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { BaseChart } from './BaseChart';
import { ChartCard } from './ChartCard';
import { baseChartConfig } from '../../utils/charts/chartConfig';
import { getHabitComparisonData, HabitComparisonData } from '../../utils/charts/habitCharts';
import { colors, typography, spacing } from '../../theme';
import { getChartDescription, getChartDataTable } from '../../utils/chartAccessibility';

interface HabitsComparisonChartProps {
  habitIds: string[];
  onViewDetails?: () => void;
}

export const HabitsComparisonChart: React.FC<HabitsComparisonChartProps> = ({
  habitIds,
  onViewDetails,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HabitComparisonData | null>(null);

  useEffect(() => {
    loadData();
  }, [habitIds]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const chartData = await getHabitComparisonData(habitIds);
      setData(chartData);
    } catch (err) {
      console.error('Error loading habit comparison:', err);
      setError('Failed to load comparison data');
    } finally {
      setIsLoading(false);
    }
  };

  const screenWidth = Dimensions.get('window').width;

  const isEmpty = !data || data.datasets[0].data.every((v) => v === 0);

  // Generate accessibility description
  const chartDataPoints = data?.labels.map((label, index) => ({
    label: label as string,
    value: data.datasets[0].data[index] as number,
  })) || [];

  const accessibilityDescription = data
    ? getChartDescription(chartDataPoints, {
        title: 'Habit comparison for last 30 days',
        type: 'bar',
        unit: '%',
      })
    : 'No habit comparison data available';

  const dataTable = data ? getChartDataTable(chartDataPoints, { unit: '%' }) : '';

  return (
    <ChartCard
      title="Habit Comparison"
      subtitle="30-day completion rates"
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
          emptyMessage="Select habits to compare"
          height={220}
        >
          {data && (
            <>
              <View
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                <BarChart
                  data={{
                    labels: data.labels,
                    datasets: data.datasets,
                  }}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={{
                    ...baseChartConfig,
                    decimalPlaces: 0,
                    color: (opacity = 1) => colors.primary.main,
                    fillShadowGradientFrom: colors.primary.main,
                    fillShadowGradientTo: colors.primary.main,
                  }}
                  yAxisLabel=""
                  yAxisSuffix="%"
                  fromZero
                  showBarTops={false}
                  withInnerLines
                  style={styles.chart}
                  verticalLabelRotation={data.labels.length > 3 ? 30 : 0}
                />
              </View>
              <View
                style={styles.legend}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: colors.primary.main },
                    ]}
                  />
                  <Text style={styles.legendText}>
                    Completion Rate (Last 30 days)
                  </Text>
                </View>
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
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  hiddenText: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});

export default HabitsComparisonChart;
