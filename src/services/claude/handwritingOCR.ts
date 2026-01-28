import { getClaudeClient } from './client';
import * as FileSystem from 'expo-file-system';
import { OCRResult } from '@/src/types';

export async function scanHandwrittenJournal(imageUri: string): Promise<OCRResult> {
  const startTime = Date.now();
  const client = await getClaudeClient();

  const base64Image = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const mediaType = imageUri.toLowerCase().includes('.png')
    ? 'image/png'
    : 'image/jpeg';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
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

  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse confidence from response
  const responseText = textContent.text;
  let text = responseText;
  let confidence = 0.8; // default medium-high

  const confidenceMatch = responseText.match(
    /---\s*Confidence:\s*(high|medium|low)/i
  );
  if (confidenceMatch) {
    text = responseText.substring(0, confidenceMatch.index).trim();
    const level = confidenceMatch[1].toLowerCase();
    confidence = level === 'high' ? 0.95 : level === 'medium' ? 0.75 : 0.5;
  }

  return {
    text,
    confidence,
    processingTimeMs: Date.now() - startTime,
    rawResponse: responseText,
  };
}
