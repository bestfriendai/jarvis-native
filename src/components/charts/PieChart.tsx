/**
 * Generic PieChart Component
 * Reusable pie chart using react-native-chart-kit
 */

import React from 'react';
import { Dimensions } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';
import { useTheme } from '../../hooks/useTheme';
import { BaseChart } from './BaseChart';

export interface PieChartDataItem {
  name: string;
  value: number;
  color: string;
  legendFontColor?: string;
  legendFontSize?: number;
}

interface PieChartProps {
  data: PieChartDataItem[];
  width?: number;
  height?: number;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  showLegend?: boolean;
  accessor?: string;
  centerLabelComponent?: () => React.ReactElement;
  hasLegend?: boolean;
  paddingLeft?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  width = Dimensions.get('window').width - 40,
  height = 220,
  isLoading = false,
  error = null,
  emptyMessage = 'No data to display',
  showLegend = true,
  accessor = 'value',
  centerLabelComponent,
  hasLegend = true,
  paddingLeft = '15',
}) => {
  const { colors } = useTheme();

  const isEmpty = !data.length || data.every(item => item.value === 0);

  // Apply default colors if not provided
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || getDefaultColor(index, colors),
    legendFontColor: item.legendFontColor || colors.text.tertiary,
    legendFontSize: item.legendFontSize || 12,
  }));

  return (
    <BaseChart
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      height={height}
    >
      <RNPieChart
        data={chartData}
        width={width}
        height={height}
        chartConfig={{
          backgroundColor: colors.background.secondary,
          backgroundGradientFrom: colors.background.secondary,
          backgroundGradientTo: colors.background.secondary,
          color: (opacity = 1) => colors.primary.main,
          labelColor: (opacity = 1) => colors.text.tertiary,
          style: {
            borderRadius: 16,
          },
        }}
        accessor={accessor}
        backgroundColor="transparent"
        paddingLeft={paddingLeft}
        center={[0, 0]}
        hasLegend={hasLegend && showLegend}
        style={{
          borderRadius: 16,
        }}
      />
    </BaseChart>
  );
};

// Helper function to generate default colors
function getDefaultColor(index: number, colors: any): string {
  const palette = [
    colors.primary.main,
    '#F59E0B',
    '#EF4444',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#10B981',
    '#6366F1',
    '#F97316',
    '#14B8A6',
  ];
  return palette[index % palette.length];
}

export default PieChart;
