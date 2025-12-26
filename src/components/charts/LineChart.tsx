/**
 * LineChart Component - Victory Native Implementation
 *
 * IMPROVEMENT: Migrated from deprecated react-native-chart-kit to Victory Native
 * - Better maintenance and support
 * - More customization options
 * - Better TypeScript support
 */

import React, { useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { Circle, useFont } from '@shopify/react-native-skia';
import { useTheme } from '../../hooks/useTheme';
import { BaseChart } from './BaseChart';
import { getChartDescription, ChartDataPoint as AccessibilityDataPoint } from '../../utils/chartAccessibility';

// Use a system font or bundle a font file
const FONT_SIZE = 10;

export interface LineChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity?: number) => string;
    strokeWidth?: number;
  }>;
  legend?: string[];
}

interface LineChartProps {
  data: LineChartData;
  width?: number;
  height?: number;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  showDots?: boolean;
  bezier?: boolean;
  yAxisSuffix?: string;
  yAxisLabel?: string;
  fromZero?: boolean;
  fillShadowGradient?: boolean;
  title?: string;
  accessibilityLabel?: string;
}

// Transform data for Victory Native format
function transformData(data: LineChartData): Array<{ x: number; y: number; label: string }> {
  if (!data.labels.length || !data.datasets.length || !data.datasets[0]?.data.length) {
    return [];
  }

  return data.labels.map((label, index) => ({
    x: index,
    y: data.datasets[0].data[index] ?? 0,
    label,
  }));
}

// Active point indicator component
function ActivePointIndicator({ x, y, color }: { x: number; y: number; color: string }) {
  return <Circle cx={x} cy={y} r={6} color={color} />;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = Dimensions.get('window').width - 40,
  height = 220,
  isLoading = false,
  error = null,
  emptyMessage = 'No data to display',
  showDots = true,
  bezier = false,
  yAxisSuffix = '',
  yAxisLabel = '',
  fromZero = true,
  title = 'Line Chart',
  accessibilityLabel,
}) => {
  const { colors } = useTheme();
  const { state, isActive } = useChartPressState({ x: 0, y: { y: 0 } });

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
      type: 'line',
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
        accessibilityHint="Double tap to view trend details and data table"
        style={{ width, height }}
      >
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['y']}
          domain={{ y: yDomain }}
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
              <Line
                points={points.y}
                color={colors.primary.main}
                strokeWidth={2}
                curveType={bezier ? 'natural' : 'linear'}
                animate={{ type: 'timing', duration: 300 }}
              />
              {showDots &&
                points.y
                  .filter((point) => point.y !== undefined)
                  .map((point, index) => (
                    <Circle
                      key={index}
                      cx={point.x}
                      cy={point.y as number}
                      r={4}
                      color={colors.primary.main}
                    />
                  ))}
              {isActive && (
                <ActivePointIndicator
                  x={state.x.position.value}
                  y={state.y.y.position.value}
                  color={colors.accent.cyan}
                />
              )}
            </>
          )}
        </CartesianChart>
      </View>
    </BaseChart>
  );
};

export default LineChart;
