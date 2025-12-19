/**
 * MonthlyComparisonChart Component
 * Bar chart comparing income vs expenses over months
 */

import React, { useState, useEffect } from 'react';
import { View, Dimensions, StyleSheet, Text } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { BaseChart } from './BaseChart';
import { ChartCard } from './ChartCard';
import { baseChartConfig } from '../../utils/charts/chartConfig';
import { getMonthlyComparisonData, MonthlyComparisonData } from '../../utils/charts/financeCharts';
import { colors, typography, spacing } from '../../theme';
import { getMonthlyComparisonDescription, getChartDataTable } from '../../utils/chartAccessibility';

interface MonthlyComparisonChartProps {
  months?: number;
  onViewDetails?: () => void;
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  months = 6,
  onViewDetails,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MonthlyComparisonData | null>(null);

  useEffect(() => {
    loadData();
  }, [months]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const chartData = await getMonthlyComparisonData(months);
      setData(chartData);
    } catch (err) {
      console.error('Error loading monthly comparison:', err);
      setError('Failed to load comparison data');
    } finally {
      setIsLoading(false);
    }
  };

  const screenWidth = Dimensions.get('window').width;

  const isEmpty = !data || data.datasets.every((ds) => ds.data.every((v) => v === 0));

  // Generate accessibility description
  const monthlyData = data?.labels.map((label, index) => ({
    month: label as string,
    income: (data.datasets[0]?.data[index] as number) || 0,
    expenses: (data.datasets[1]?.data[index] as number) || 0,
  })) || [];

  const accessibilityDescription = data
    ? getMonthlyComparisonDescription(monthlyData)
    : 'No monthly comparison data available';

  // Generate data table
  const incomePoints = monthlyData.map(m => ({ label: `${m.month} Income`, value: m.income }));
  const expensePoints = monthlyData.map(m => ({ label: `${m.month} Expenses`, value: m.expenses }));
  const allPoints = [...incomePoints, ...expensePoints];
  const dataTable = data ? getChartDataTable(allPoints, { unit: '$' }) : '';

  return (
    <ChartCard
      title="Income vs Expenses"
      subtitle={`Last ${months} months`}
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
          emptyMessage="No financial data yet"
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
                  }}
                  yAxisLabel="$"
                  yAxisSuffix="k"
                  fromZero
                  showBarTops={false}
                  withInnerLines
                  style={styles.chart}
                  verticalLabelRotation={0}
                />
              </View>
              <View
                style={styles.legend}
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                {data.legend.map((label, index) => (
                  <View key={label} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        {
                          backgroundColor:
                            index === 0 ? colors.success : colors.error,
                        },
                      ]}
                    />
                    <Text style={styles.legendText}>{label}</Text>
                  </View>
                ))}
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
    gap: spacing.lg,
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

export default MonthlyComparisonChart;
