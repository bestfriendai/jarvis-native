import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { EventConflict } from '../../database/calendar';
import { formatEventTimeRange } from '../../database/calendar';

interface ConflictWarningProps {
  conflicts: EventConflict[];
  onViewConflict: (eventId: string) => void;
  onProceed: () => void;
  onCancel: () => void;
}

export function ConflictWarning({
  conflicts,
  onViewConflict,
  onProceed,
  onCancel,
}: ConflictWarningProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="alert-circle" size={48} color="#EF5350" />
        <Text style={styles.title}>Schedule Conflict Detected</Text>
        <Text style={styles.subtitle}>
          This event overlaps with {conflicts.length} existing event{conflicts.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Conflicts List */}
      <ScrollView style={styles.conflictsList}>
        {conflicts.map(({ event, overlapMinutes, overlapStart, overlapEnd }) => (
          <TouchableOpacity
            key={event.id}
            style={styles.conflictCard}
            onPress={() => onViewConflict(event.id)}
            activeOpacity={0.7}
          >
            <View style={styles.conflictHeader}>
              <View style={styles.conflictTitleRow}>
                <Icon name="calendar-alert" size={20} color="#EF5350" />
                <Text style={styles.conflictTitle} numberOfLines={1}>
                  {event.title}
                </Text>
              </View>
              <View style={styles.overlapBadge}>
                <Text style={styles.overlapText}>
                  {overlapMinutes}min overlap
                </Text>
              </View>
            </View>

            <View style={styles.conflictDetails}>
              <View style={styles.detailRow}>
                <Icon name="clock-outline" size={14} color="#666" />
                <Text style={styles.detailText}>
                  {formatEventTimeRange(event.startTime, event.endTime)}
                </Text>
              </View>

              {event.location && (
                <View style={styles.detailRow}>
                  <Icon name="map-marker" size={14} color="#666" />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              )}

              <View style={styles.overlapTimeRow}>
                <Icon name="alert-octagon" size={12} color="#FF9800" />
                <Text style={styles.overlapTimeText}>
                  Overlap: {formatEventTimeRange(overlapStart, overlapEnd)}
                </Text>
              </View>
            </View>

            <View style={styles.viewDetailsRow}>
              <Text style={styles.viewDetailsText}>Tap to view details</Text>
              <Icon name="chevron-right" size={16} color="#4A90E2" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.proceedButton]}
          onPress={onProceed}
        >
          <Text style={styles.proceedButtonText}>Create Anyway</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF3F3',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF5350',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  conflictsList: {
    flex: 1,
    padding: 16,
  },
  conflictCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conflictTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  overlapBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  overlapText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9800',
  },
  conflictDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  overlapTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#FFF8E1',
    padding: 6,
    borderRadius: 4,
  },
  overlapTimeText: {
    fontSize: 12,
    color: '#F57C00',
    marginLeft: 6,
    fontWeight: '500',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#4A90E2',
    marginRight: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  proceedButton: {
    backgroundColor: '#EF5350',
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
