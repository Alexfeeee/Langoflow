import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { PolishSentenceInput } from './PolishSentenceInput';
import { ContextExplainButton } from './ContextExplainButton';
import { CollocationsButton } from './CollocationsButton';
import { LogicCheckButton } from './LogicCheckButton';

const API_BASE_URL = 'http://localhost:3000'; // Change to your backend URL

export const AiToolsScreen: React.FC = () => {
  const [exampleSentence] = useState(
    'The rapid advancement of artificial intelligence has significantly transformed various industries.'
  );
  const [selectedWord] = useState('advancement');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🤖 AI Language Tools</Text>
          <Text style={styles.headerSubtitle}>
            Granular, on-demand AI assistance
          </Text>
        </View>

        {/* Section 1: Context Detective */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 🔍 Context Detective</Text>
          <Text style={styles.sectionDescription}>
            Select a word in a sentence to understand its specific meaning in
            context.
          </Text>

          <View style={styles.exampleBox}>
            <Text style={styles.exampleLabel}>Example Sentence:</Text>
            <Text style={styles.exampleText}>"{exampleSentence}"</Text>
          </View>

          <ContextExplainButton
            word={selectedWord}
            fullSentence={exampleSentence}
            apiBaseUrl={API_BASE_URL}
            onExplainSuccess={(explanation) => {
              console.log('Explanation:', explanation);
            }}
            onExplainError={(error) => {
              console.error('Error:', error);
            }}
          />
        </View>

        {/* Section 2: Collocation Architect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 🏗️ Collocation Architect</Text>
          <Text style={styles.sectionDescription}>
            Learn how to use words naturally with strong collocations.
          </Text>

          <CollocationsButton
            word="make"
            apiBaseUrl={API_BASE_URL}
            onLoadSuccess={(collocations) => {
              console.log('Collocations:', collocations);
            }}
            onLoadError={(error) => {
              console.error('Error:', error);
            }}
          />
        </View>

        {/* Section 3: Tone Stylist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. ✨ Tone Stylist</Text>
          <Text style={styles.sectionDescription}>
            Rewrite sentences to match different tones and registers.
          </Text>

          <PolishSentenceInput
            apiBaseUrl={API_BASE_URL}
            onPolishSuccess={(original, polished, tone) => {
              console.log('Polished:', { original, polished, tone });
            }}
            onPolishError={(error) => {
              console.error('Error:', error);
            }}
          />
        </View>

        {/* Section 4: Logic Surgeon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 🔬 Logic Surgeon</Text>
          <Text style={styles.sectionDescription}>
            Check for L1 interference and get native-like alternatives.
          </Text>

          <View style={styles.exampleBox}>
            <Text style={styles.exampleLabel}>Your Sentence:</Text>
            <Text style={styles.exampleText}>
              "This book, I have already read it."
            </Text>
          </View>

          <LogicCheckButton
            userSentence="This book, I have already read it."
            nativeLanguage="zh-CN"
            apiBaseUrl={API_BASE_URL}
            onCheckSuccess={(result) => {
              console.log('Logic check:', result);
            }}
            onCheckError={(error) => {
              console.error('Error:', error);
            }}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Each AI tool works independently - trigger only what you need!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  exampleBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  exampleLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    color: '#1F2937',
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 16,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
  },
});
