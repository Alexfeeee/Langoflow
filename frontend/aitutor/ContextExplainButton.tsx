import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';

interface ContextExplainButtonProps {
  word: string;
  fullSentence: string;
  apiBaseUrl: string;
  onExplainSuccess?: (explanation: string) => void;
  onExplainError?: (error: Error) => void;
}

export const ContextExplainButton: React.FC<ContextExplainButtonProps> = ({
  word,
  fullSentence,
  apiBaseUrl,
  onExplainSuccess,
  onExplainError,
}) => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleExplain = async () => {
    setLoading(true);
    setExplanation(null);

    try {
      const response = await fetch(`${apiBaseUrl}/ai/context-explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word,
          fullSentence,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to explain context');
      }

      const data = await response.json();
      setExplanation(data.explanation);
      setModalVisible(true);
      onExplainSuccess?.(data.explanation);
    } catch (error) {
      console.error('Context explain error:', error);
      onExplainError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.explainButton, loading && styles.buttonLoading]}
        onPress={handleExplain}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.buttonIcon}>🔍</Text>
            <Text style={styles.buttonText}>Explain "{word}"</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Explanation Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔍 Context Detective</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.wordHighlight}>
              <Text style={styles.highlightLabel}>Word:</Text>
              <Text style={styles.highlightWord}>{word}</Text>
            </View>

            <View style={styles.sentenceBox}>
              <Text style={styles.sentenceLabel}>In this sentence:</Text>
              <Text style={styles.sentenceText}>"{fullSentence}"</Text>
            </View>

            {explanation && (
              <View style={styles.explanationBox}>
                <Text style={styles.explanationText}>{explanation}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  explainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  buttonLoading: {
    backgroundColor: '#93C5FD',
  },
  buttonIcon: {
    fontSize: 16,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  wordHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  highlightLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  highlightWord: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  sentenceBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  sentenceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  sentenceText: {
    fontSize: 14,
    color: '#1F2937',
    fontStyle: 'italic',
  },
  explanationBox: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  explanationText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  doneButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
