import { getClaudeClient } from './client';
import * as FileSystem from 'expo-file-system/legacy';
import { OCRResult } from '@/src/types';
import { AI_MODEL, AI_OCR_MAX_TOKENS, OCR_CONFIDENCE, withTimeout } from '@/src/utils/constants';

function getMediaType(uri: string): 'image/png' | 'image/jpeg' {
  return uri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
}

function parseConfidenceLevel(level: string): number {
  switch (level.toLowerCase()) {
    case 'high':
      return OCR_CONFIDENCE.HIGH;
    case 'medium':
      return OCR_CONFIDENCE.MEDIUM;
    case 'low':
      return OCR_CONFIDENCE.LOW;
    default:
      return OCR_CONFIDENCE.MEDIUM;
  }
}

export async function scanHandwrittenJournal(imageUri: string): Promise<OCRResult> {
  const startTime = Date.now();
  const client = await getClaudeClient();

  const base64Image = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64',
  });

  const apiCall = client.messages.create({
    model: AI_MODEL,
    max_tokens: AI_OCR_MAX_TOKENS,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: getMediaType(imageUri),
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: `This is a photo of a handwritten journal entry. Please transcribe the handwritten text as accurately as possible.

Instructions:
1. Preserve paragraph breaks and formatting where visible
2. If any words are unclear, make your best interpretation
3. Maintain the original tone and style of the writing
4. Do not add any commentary or corrections
5. If the image contains drawings or non-text elements, briefly note them in [brackets]

Return ONLY the transcribed text, nothing else. At the end, on a new line, add:
---
Confidence: [high/medium/low]`,
          },
        ],
      },
    ],
  });

  const response = await withTimeout(apiCall, 'Handwriting scan timed out. Please try again.');

  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const responseText = textContent.text;
  let text = responseText;
  let confidence = OCR_CONFIDENCE.MEDIUM;

  const confidenceMatch = responseText.match(/---\s*Confidence:\s*(high|medium|low)/i);
  if (confidenceMatch) {
    text = responseText.substring(0, confidenceMatch.index).trim();
    confidence = parseConfidenceLevel(confidenceMatch[1]);
  }

  return {
    text,
    confidence,
    processingTimeMs: Date.now() - startTime,
    rawResponse: responseText,
  };
}
