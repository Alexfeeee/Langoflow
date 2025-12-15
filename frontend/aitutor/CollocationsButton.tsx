import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Animated,
} from 'react-native';

interface CollocationsButtonProps {
  word: string;
  apiBaseUrl: string;
  onLoadSuccess?: (collocations: string[]) => void;
  onLoadError?: (error: Error) => void;
}

export const CollocationsButton: React.FC<CollocationsButtonProps> = ({
  word,
  apiBaseUrl,
  onLoadSuccess,
  onLoadError,
}) => {
  const [loading, setLoading] = useState(false);
  const [collocations, setCollocations] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  const handleLoadCollocations = async () => {
    if (collocations.length > 0) {
      // Toggle expand/collapse if already loaded
      setExpanded(!expanded);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/ai/collocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load collocations');
      }

      const data = await response.json();
      setCollocations(data.collocations);
      setExpanded(true);
      onLoadSuccess?.(data.collocations);
    } catch (error) {
      console.error('Collocations error:', error);
      onLoadError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const renderCollocationItem = ({ item, index }: { item: string; index: number }) => (
    <Animated.View
      style={[
        styles.collocationItem,
        { backgroundColor: index % 2 === 0 ? '#F9FAFB' : '#FFFFFF' },
      ]}
    >
      <Text style={styles.collocationNumber}>{index + 1}.</Text>
      <Text style={styles.collocationText}>{item}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.architectButton,
          loading && styles.buttonLoading,
          expanded && styles.buttonExpanded,
        ]}
        onPress={handleLoadCollocations}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.buttonIcon}>🏗️</Text>
            <Text style={styles.buttonText}>
              {collocations.length > 0
                ? expanded
                  ? 'Hide Collocations'
                  : 'Show Collocations'
                : 'Build Collocations'}
            </Text>
            {collocations.length > 0 && (
              <Text style={styles.badge}>{collocations.length}</Text>
            )}
          </>
        )}
      </TouchableOpacity>

      {expanded && collocations.length > 0 && (
        <View style={styles.collocationsList}>
          <Text style={styles.listTitle}>
            Strong collocations with "{word}":
          </Text>
          <FlatList
            data={collocations}
            renderItem={renderCollocationItem}
            keyExtractor={(item, index) => `${item}-${index}`}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  architectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
  },
  buttonLoading: {
    backgroundColor: '#6EE7B7',
  },
  buttonExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  buttonIcon: {
    fontSize: 16,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  collocationsList: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#10B981',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 16,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  collocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  collocationNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginRight: 12,
    width: 24,
  },
  collocationText: {
    fontSize: 15,
    color: '#1F2937',
    flex: 1,
  },
});
