import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';

type NativeLanguage = 'zh-CN' | 'zh-TW' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'ar';

interface LogicCheckResult {
  isNativeLike: boolean;
  detectedL1Logic: string | null;
  explanation: string;
  betterAlternative: string;
}

interface LogicCheckButtonProps {
  userSentence: string;
  nativeLanguage: NativeLanguage;
  apiBaseUrl: string;
  onCheckSuccess?: (result: LogicCheckResult) => void;
  onCheckError?: (error: Error) => void;
}

export const LogicCheckButton: React.FC<LogicCheckButtonProps> = ({
  userSentence,
  nativeLanguage,
  apiBaseUrl,
  onCheckSuccess,
  onCheckError,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LogicCheckResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleCheckLogic = async () => {
    if (result && showResult) {
      setShowResult(!showResult);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${apiBaseUrl}/ai/logic-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userSentence,
          nativeLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check logic');
      }

      const data = await response.json();
      setResult(data);
      setShowResult(true);
      onCheckSuccess?.(data);
    } catch (error) {
      console.error('Logic check error:', error);
      onCheckError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.surgeonButton,
          loading && styles.buttonLoading,
          showResult && styles.buttonExpanded,
        ]}
        onPress={handleCheckLogic}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.buttonIcon}>🔬</Text>
            <Text style={styles.buttonText}>
              {result ? (showResult ? 'Hide Analysis' : 'Show Analysis') : 'Check for L1 Interference'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {showResult && result && (
        <View style={styles.resultContainer}>
          {/* Native-like Status */}
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: result.isNativeLike
                  ? '#D1FAE5'
                  : '#FEE2E2',
              },
            ]}
          >
            <Text
              style={[
                styles.statusIcon,
                { fontSize: 24 },
              ]}
            >
              {result.isNativeLike ? '✅' : '⚠️'}
            </Text>
            <Text
              style={[
                styles.statusText,
                {
                  color: result.isNativeLike ? '#065F46' : '#991B1B',
                },
              ]}
            >
              {result.isNativeLike
                ? 'Sounds Native-like!'
                : 'L1 Interference Detected'}
            </Text>
          </View>

          {/* Detected Pattern */}
          {result.detectedL1Logic && (
            <View style={styles.patternBox}>
              <Text style={styles.sectionLabel}>🔍 Detected Pattern:</Text>
              <Text style={styles.patternText}>{result.detectedL1Logic}</Text>
            </View>
          )}

          {/* Explanation */}
          <View style={styles.explanationBox}>
            <Text style={styles.sectionLabel}>📚 Explanation:</Text>
            <Text style={styles.explanationText}>{result.explanation}</Text>
          </View>

          {/* Better Alternative */}
          {!result.isNativeLike && (
            <View style={styles.alternativeBox}>
              <Text style={styles.sectionLabel}>✨ Better Alternative:</Text>
              <Text style={styles.alternativeText}>
                "{result.betterAlternative}"
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  surgeonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
  },
  buttonLoading: {
    backgroundColor: '#C4B5FD',
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
  resultContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  statusIcon: {
    fontSize: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  patternBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  patternText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  explanationBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  explanationText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  alternativeBox: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    padding: 12,
    borderRadius: 8,
  },
  alternativeText: {
    fontSize: 15,
    color: '#065F46',
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
