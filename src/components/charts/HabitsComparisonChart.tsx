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

  return (
    <ChartCard
      title="Habit Comparison"
      subtitle="30-day completion rates"
      onAction={onViewDetails}
      actionLabel={onViewDetails ? 'Details' : undefined}
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
            <View style={styles.legend}>
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
          </>
        )}
      </BaseChart>
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
});

export default HabitsComparisonChart;
