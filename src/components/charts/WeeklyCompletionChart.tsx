/**
 * WeeklyCompletionChart Component
 * Compact bar chart showing habit completion for last 7 days
 * Designed to be embedded in habit cards
 */

import React, { useState, useEffect } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { BaseChart } from './BaseChart';
import { baseChartConfig } from '../../utils/charts/chartConfig';
import { getWeeklyCompletionData, WeeklyCompletionData } from '../../utils/charts/habitCharts';
import { colors } from '../../theme';

interface WeeklyCompletionChartProps {
  habitId: string;
  compact?: boolean;
}

export const WeeklyCompletionChart: React.FC<WeeklyCompletionChartProps> = ({
  habitId,
  compact = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WeeklyCompletionData | null>(null);

  useEffect(() => {
    loadData();
  }, [habitId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const chartData = await getWeeklyCompletionData(habitId);
      setData(chartData);
    } catch (err) {
      console.error('Error loading weekly completion:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = compact ? screenWidth - 96 : screenWidth - 64;
  const chartHeight = compact ? 100 : 180;

  const isEmpty = !data || data.datasets[0].data.every((v) => v === 0);

  // Custom chart config for compact view
  const compactConfig = {
    ...baseChartConfig,
    color: (opacity = 1) => colors.primary.main,
    fillShadowGradientFrom: colors.primary.main,
    fillShadowGradientTo: colors.primary.main,
    decimalPlaces: 0,
    barPercentage: 0.7,
    propsForBackgroundLines: {
      strokeWidth: 0, // Hide grid lines in compact mode
    },
    propsForLabels: {
      fontSize: compact ? 10 : 12,
    },
  };

  return (
    <BaseChart
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No activity yet"
      height={chartHeight}
    >
      {data && (
        <BarChart
          data={{
            labels: data.labels,
            datasets: data.datasets,
          }}
          width={chartWidth}
          height={chartHeight}
          chartConfig={compactConfig}
          yAxisLabel=""
          yAxisSuffix=""
          fromZero
          showBarTops={false}
          withInnerLines={!compact}
          style={styles.chart}
          verticalLabelRotation={0}
        />
      )}
    </BaseChart>
  );
};

const styles = StyleSheet.create({
  chart: {
    marginVertical: 4,
    borderRadius: 8,
  },
});

export default WeeklyCompletionChart;
