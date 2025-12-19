/**
 * WeeklyCompletionChart Component
 * Compact bar chart showing habit completion for last 7 days
 * Designed to be embedded in habit cards
 */

import React, { useState, useEffect } from 'react';
import { View, Dimensions, StyleSheet, Text } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { BaseChart } from './BaseChart';
import { baseChartConfig } from '../../utils/charts/chartConfig';
import { getWeeklyCompletionData, WeeklyCompletionData } from '../../utils/charts/habitCharts';
import { colors } from '../../theme';
import { getChartDescription, getChartDataTable } from '../../utils/chartAccessibility';

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

  // Generate accessibility description
  const chartDataPoints = data?.labels.map((label, index) => ({
    label: label as string,
    value: data.datasets[0].data[index] as number,
  })) || [];

  const completedDays = chartDataPoints.filter(p => p.value > 0).length;
  const accessibilityDescription = data
    ? `Weekly completion chart. ${completedDays} out of 7 days completed. ${getChartDescription(chartDataPoints, {
        title: 'Last 7 days',
        type: 'bar',
        unit: ' completions',
      })}`
    : 'No weekly completion data available';

  const dataTable = data ? getChartDataTable(chartDataPoints, { unit: ' completions' }) : '';

  return (
    <View
      accessible={true}
      accessibilityLabel={accessibilityDescription}
      accessibilityRole="image"
    >
      <BaseChart
        isLoading={isLoading}
        error={error}
        isEmpty={isEmpty}
        emptyMessage="No activity yet"
        height={chartHeight}
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
  );
};

const styles = StyleSheet.create({
  chart: {
    marginVertical: 4,
    borderRadius: 8,
  },
  hiddenText: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});

export default WeeklyCompletionChart;
