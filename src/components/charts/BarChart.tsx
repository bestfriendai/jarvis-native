/**
 * Generic BarChart Component
 * Reusable bar chart using react-native-chart-kit
 */

import React from 'react';
import { View, Dimensions } from 'react-native';
import { BarChart as RNBarChart } from 'react-native-chart-kit';
import { useTheme } from '../../hooks/useTheme';
import { BaseChart } from './BaseChart';
import { getChartDescription, ChartDataPoint } from '../../utils/chartAccessibility';

export interface BarChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity?: number) => string;
  }>;
}

interface BarChartProps {
  data: BarChartData;
  width?: number;
  height?: number;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  showValues?: boolean;
  yAxisSuffix?: string;
  yAxisLabel?: string;
  fromZero?: boolean;
  title?: string;
  accessibilityLabel?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width = Dimensions.get('window').width - 40,
  height = 220,
  isLoading = false,
  error = null,
  emptyMessage = 'No data to display',
  showValues = true,
  yAxisSuffix = '',
  yAxisLabel = '',
  fromZero = true,
  title = 'Bar Chart',
  accessibilityLabel,
}) => {
  const { colors } = useTheme();

  const isEmpty = !data.labels.length || !data.datasets.length || data.datasets[0].data.length === 0;

  // Generate accessibility description
  const chartDataPoints: ChartDataPoint[] = data.labels.map((label, index) => ({
    label,
    value: data.datasets[0]?.data[index] || 0,
  }));

  const description = accessibilityLabel || getChartDescription(chartDataPoints, {
    title,
    type: 'bar',
    unit: yAxisSuffix,
  });

  return (
    <BaseChart
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      height={height}
    >
      <View
        accessible={true}
        accessibilityLabel={description}
        accessibilityRole="image"
        accessibilityHint="Double tap to view data table"
      >
        <RNBarChart
          data={data}
          width={width}
          height={height}
          yAxisLabel={yAxisLabel}
          yAxisSuffix={yAxisSuffix}
          fromZero={fromZero}
          showValuesOnTopOfBars={showValues}
          chartConfig={{
            backgroundColor: colors.background.secondary,
            backgroundGradientFrom: colors.background.secondary,
            backgroundGradientTo: colors.background.secondary,
            decimalPlaces: 0,
            color: () => colors.primary.main,
            labelColor: () => colors.text.tertiary,
            style: {
              borderRadius: 16,
            },
            propsForLabels: {
              fontSize: 10,
            },
            propsForBackgroundLines: {
              stroke: colors.border.subtle,
              strokeWidth: 1,
              strokeDasharray: '0',
            },
          }}
          style={{
            borderRadius: 16,
          }}
        />
      </View>
    </BaseChart>
  );
};

export default BarChart;
