/**
 * BarChart Component - Victory Native Implementation
 *
 * IMPROVEMENT: Migrated from deprecated react-native-chart-kit to Victory Native
 * - Better maintenance and support
 * - More customization options
 * - Better TypeScript support
 */

import React, { useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import { CartesianChart, Bar, useChartPressState } from 'victory-native';
import { Text as SkiaText, useFont } from '@shopify/react-native-skia';
import { useTheme } from '../../hooks/useTheme';
import { BaseChart } from './BaseChart';
import { getChartDescription, ChartDataPoint as AccessibilityDataPoint } from '../../utils/chartAccessibility';

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

// Transform data for Victory Native format
function transformData(data: BarChartData): Array<{ x: number; y: number; label: string }> {
  if (!data.labels.length || !data.datasets.length || !data.datasets[0]?.data.length) {
    return [];
  }

  return data.labels.map((label, index) => ({
    x: index,
    y: data.datasets[0].data[index] ?? 0,
    label,
  }));
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
  const { state } = useChartPressState({ x: 0, y: { y: 0 } });

  const chartData = useMemo(() => transformData(data), [data]);
  const isEmpty = chartData.length === 0;

  // Generate accessibility description
  const chartDataPoints: AccessibilityDataPoint[] = data.labels.map((label, index) => ({
    label,
    value: data.datasets[0]?.data[index] || 0,
  }));

  const description =
    accessibilityLabel ||
    getChartDescription(chartDataPoints, {
      title,
      type: 'bar',
      unit: yAxisSuffix,
    });

  // Calculate domain
  const yValues = chartData.map((d) => d.y);
  const minY = fromZero ? 0 : Math.min(...yValues);
  const maxY = Math.max(...yValues, 1);
  const yDomain: [number, number] = [minY, maxY * 1.1]; // 10% padding

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
        style={{ width, height }}
      >
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['y']}
          domain={{ y: yDomain }}
          domainPadding={{ left: 20, right: 20 }}
          axisOptions={{
            formatXLabel: (value) => {
              const index = Math.round(value);
              return data.labels[index] || '';
            },
            formatYLabel: (value) => `${yAxisLabel}${Math.round(value)}${yAxisSuffix}`,
            labelColor: colors.text.tertiary,
            lineColor: colors.border.subtle,
          }}
          chartPressState={state}
        >
          {({ points, chartBounds }) => (
            <>
              <Bar
                points={points.y}
                chartBounds={chartBounds}
                color={colors.primary.main}
                roundedCorners={{ topLeft: 4, topRight: 4 }}
                animate={{ type: 'timing', duration: 300 }}
              />
            </>
          )}
        </CartesianChart>
      </View>
    </BaseChart>
  );
};

export default BarChart;
