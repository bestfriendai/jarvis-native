/**
 * PieChart Component - Victory Native Implementation
 *
 * IMPROVEMENT: Migrated from deprecated react-native-chart-kit to Victory Native
 * - Better maintenance and support
 * - More customization options
 * - Better TypeScript support
 * - Hardware-accelerated via Skia
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PolarChart, Pie } from 'victory-native';
import { useTheme } from '../../hooks/useTheme';
import { BaseChart } from './BaseChart';
import { getChartDescription, ChartDataPoint } from '../../utils/chartAccessibility';
import { spacing, typography } from '../../theme';

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
  title?: string;
  accessibilityLabel?: string;
  innerRadius?: number | string; // For donut charts
}

// Transform data for Victory Native format
function transformData(
  data: PieChartDataItem[],
  colors: any
): Array<{ label: string; value: number; color: string }> {
  return data.map((item, index) => ({
    label: item.name,
    value: item.value,
    color: item.color || getDefaultColor(index, colors),
  }));
}

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

export const PieChart: React.FC<PieChartProps> = ({
  data,
  width = Dimensions.get('window').width - 40,
  height = 220,
  isLoading = false,
  error = null,
  emptyMessage = 'No data to display',
  showLegend = true,
  hasLegend = true,
  title = 'Pie Chart',
  accessibilityLabel,
  innerRadius,
}) => {
  const { colors } = useTheme();

  const isEmpty = !data.length || data.every((item) => item.value === 0);

  // Transform data for Victory Native
  const chartData = useMemo(() => transformData(data, colors), [data, colors]);

  // Calculate total for percentage display
  const total = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData]
  );

  // Generate accessibility description
  const chartDataPoints: ChartDataPoint[] = data.map((item) => ({
    label: item.name,
    value: item.value,
  }));

  const description =
    accessibilityLabel ||
    getChartDescription(chartDataPoints, {
      title,
      type: 'pie',
    });

  // Create styles with current theme colors
  const styles = createStyles(colors);

  // Calculate chart width (leave space for legend if showing)
  const chartWidth = showLegend && hasLegend ? width * 0.55 : width;
  const legendWidth = showLegend && hasLegend ? width * 0.45 : 0;

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
        accessibilityHint="Double tap to view distribution breakdown"
        style={styles.container}
      >
        {/* Pie Chart */}
        <View style={[styles.chartContainer, { width: chartWidth, height }]}>
          <PolarChart
            data={chartData}
            labelKey="label"
            valueKey="value"
            colorKey="color"
          >
            <Pie.Chart innerRadius={innerRadius}>
              {() => <Pie.Slice />}
            </Pie.Chart>
          </PolarChart>
        </View>

        {/* Legend */}
        {showLegend && hasLegend && (
          <View style={[styles.legendContainer, { width: legendWidth }]}>
            {chartData.map((item, index) => {
              const percent = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <View key={`legend-${index}`} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: item.color }]}
                  />
                  <View style={styles.legendTextContainer}>
                    <Text
                      style={[
                        styles.legendLabel,
                        {
                          color:
                            data[index]?.legendFontColor ||
                            colors.text.secondary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.legendValue}>
                      {item.value.toLocaleString()}{' '}
                      <Text style={styles.legendPercent}>
                        ({percent.toFixed(0)}%)
                      </Text>
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </BaseChart>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chartContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    legendContainer: {
      paddingLeft: spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: spacing.sm,
    },
    legendTextContainer: {
      flex: 1,
    },
    legendLabel: {
      fontSize: typography.size.xs,
      marginBottom: 2,
    },
    legendValue: {
      fontSize: typography.size.xs,
      fontWeight: typography.weight.semibold,
      color: colors.text.primary,
    },
    legendPercent: {
      fontSize: typography.size.xs,
      fontWeight: typography.weight.medium,
      color: colors.text.tertiary,
    },
  });

export default PieChart;
