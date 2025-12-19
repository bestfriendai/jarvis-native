/**
 * SpendingTrendChart Component
 * Line chart showing daily spending over last 30 days
 */

import React, { useState, useEffect } from 'react';
import { View, Dimensions, StyleSheet, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { BaseChart } from './BaseChart';
import { ChartCard } from './ChartCard';
import { baseChartConfig, getChartDimensions } from '../../utils/charts/chartConfig';
import { getDailySpendingData, DailySpendingData } from '../../utils/charts/financeCharts';
import { getChartDescription, getChartDataTable } from '../../utils/chartAccessibility';

interface SpendingTrendChartProps {
  days?: number;
  onViewDetails?: () => void;
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  days = 30,
  onViewDetails,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DailySpendingData | null>(null);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const chartData = await getDailySpendingData(days);
      setData(chartData);
    } catch (err) {
      console.error('Error loading spending trend:', err);
      setError('Failed to load spending data');
    } finally {
      setIsLoading(false);
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const chartDimensions = getChartDimensions(screenWidth);

  const isEmpty = !data || data.datasets[0].data.every((v) => v === 0);

  // Generate accessibility description
  const chartDataPoints = data?.labels.map((label, index) => ({
    label: label as string,
    value: data.datasets[0].data[index] as number,
  })) || [];

  const accessibilityDescription = data
    ? getChartDescription(chartDataPoints, {
        title: `Spending trend for last ${days} days`,
        type: 'line',
        unit: '$',
      })
    : 'No spending data available';

  const dataTable = data ? getChartDataTable(chartDataPoints, { unit: '$' }) : '';

  return (
    <ChartCard
      title="Spending Trend"
      subtitle={`Last ${days} days`}
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
          height={chartDimensions.height}
        >
          {data && (
            <>
              <View
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                <LineChart
                  data={data}
                  width={chartDimensions.width}
                  height={chartDimensions.height}
                  chartConfig={baseChartConfig}
                  bezier
                  style={styles.chart}
                  withInnerLines
                  withOuterLines
                  withDots={days <= 14} // Show dots only for shorter periods
                  withShadow={false}
                  fromZero
                  segments={4}
                  yAxisLabel="$"
                  yAxisSuffix=""
                  yAxisInterval={1}
                  formatYLabel={(value) => {
                    const num = parseFloat(value);
                    if (num >= 1000) {
                      return `${(num / 1000).toFixed(1)}k`;
                    }
                    return num.toFixed(0);
                  }}
                  decorator={() => {
                    // Could add custom decorators here
                    return null;
                  }}
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
    </ChartCard>
  );
};

const styles = StyleSheet.create({
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  hiddenText: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});

export default SpendingTrendChart;
