import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ToneType = 'formal' | 'casual' | 'poetic' | 'business';

interface ToneChip {
  type: ToneType;
  label: string;
  emoji: string;
  color: string;
}

interface PolishSentenceInputProps {
  apiBaseUrl: string;
  onPolishSuccess?: (originalText: string, polishedText: string, tone: ToneType) => void;
  onPolishError?: (error: Error) => void;
}

const TONE_CHIPS: ToneChip[] = [
  { type: 'formal', label: 'Formal', emoji: '👔', color: '#2563EB' },
  { type: 'casual', label: 'Casual', emoji: '😎', color: '#10B981' },
  { type: 'poetic', label: 'Poetic', emoji: '🌹', color: '#EC4899' },
  { type: 'business', label: 'Business', emoji: '💼', color: '#8B5CF6' },
];

export const PolishSentenceInput: React.FC<PolishSentenceInputProps> = ({
  apiBaseUrl,
  onPolishSuccess,
  onPolishError,
}) => {
  const [inputText, setInputText] = useState('');
  const [polishedText, setPolishedText] = useState('');
  
  // Independent state for each tone button
  const [loadingStates, setLoadingStates] = useState<Record<ToneType, boolean>>({
    formal: false,
    casual: false,
    poetic: false,
    business: false,
  });

  // Success animation values for each button
  const [successStates, setSuccessStates] = useState<Record<ToneType, boolean>>({
    formal: false,
    casual: false,
    poetic: false,
    business: false,
  });

  /**
   * Handle polish request for a specific tone
   */
  const handlePolishTone = async (tone: ToneType) => {
    if (!inputText.trim()) {
      return;
    }

    // Set loading state for this specific button
    setLoadingStates((prev) => ({ ...prev, [tone]: true }));
    setSuccessStates((prev) => ({ ...prev, [tone]: false }));

    try {
      const response = await fetch(`${apiBaseUrl}/ai/polish-tone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalSentence: inputText,
          targetTone: tone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to polish sentence');
      }

      const data = await response.json();
      
      // Animate the text replacement
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setPolishedText(data.polished);
      setInputText(data.polished);

      // Show success state
      setSuccessStates((prev) => ({ ...prev, [tone]: true }));

      // Call success callback
      onPolishSuccess?.(inputText, data.polished, tone);

      // Reset success state after 2 seconds
      setTimeout(() => {
        setSuccessStates((prev) => ({ ...prev, [tone]: false }));
      }, 2000);
    } catch (error) {
      console.error(`Polish tone error (${tone}):`, error);
      onPolishError?.(error as Error);
      
      // You could show an error state here
      // For now, we'll just log it
    } finally {
      setLoadingStates((prev) => ({ ...prev, [tone]: false }));
    }
  };

  /**
   * Render a single tone chip with independent state
   */
  const renderToneChip = (chip: ToneChip) => {
    const isLoading = loadingStates[chip.type];
    const isSuccess = successStates[chip.type];
    const isDisabled = inputText.trim().length < 5;

    return (
      <TouchableOpacity
        key={chip.type}
        style={[
          styles.toneChip,
          {
            backgroundColor: isSuccess
              ? '#10B981'
              : isLoading
              ? '#E5E7EB'
              : chip.color,
            opacity: isDisabled ? 0.5 : 1,
          },
        ]}
        onPress={() => handlePolishTone(chip.type)}
        disabled={isLoading || isDisabled}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.chipEmoji}>{chip.emoji}</Text>
            <Text style={styles.chipLabel}>
              {isSuccess ? '✓' : chip.label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Input Section */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Your Sentence</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Type a sentence to polish..."
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={(text) => {
            setInputText(text);
            setPolishedText('');
          }}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.helperText}>
          Minimum 5 characters required
        </Text>
      </View>

      {/* Tone Selection */}
      <View style={styles.toneSection}>
        <Text style={styles.label}>Choose Tone</Text>
        <View style={styles.toneChipsContainer}>
          {TONE_CHIPS.map((chip) => renderToneChip(chip))}
        </View>
      </View>

      {/* Result Preview */}
      {polishedText && (
        <View style={styles.resultSection}>
          <Text style={styles.label}>✨ Polished Result</Text>
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{polishedText}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  toneSection: {
    marginBottom: 24,
  },
  toneChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    justifyContent: 'center',
    gap: 6,
  },
  chipEmoji: {
    fontSize: 18,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultSection: {
    marginBottom: 16,
  },
  resultBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 16,
  },
  resultText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
});
