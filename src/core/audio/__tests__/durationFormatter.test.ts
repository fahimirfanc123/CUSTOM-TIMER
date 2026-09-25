import { describe, it, expect } from 'vitest';
import { formatDurationSpeech } from '../durationFormatter';

describe('Duration Formatter for Voice Coach', () => {
  it('1. Formats 0 and sub-second values as 0 seconds', () => {
    expect(formatDurationSpeech(0)).toBe('0 seconds');
    expect(formatDurationSpeech(-5)).toBe('0 seconds');
  });

  it('2. Handles singular and plural seconds correctly', () => {
    expect(formatDurationSpeech(1)).toBe('1 second');
    expect(formatDurationSpeech(30)).toBe('30 seconds');
    expect(formatDurationSpeech(45)).toBe('45 seconds');
  });

  it('3. Handles exact minutes (singular and plural)', () => {
    expect(formatDurationSpeech(60)).toBe('1 minute');
    expect(formatDurationSpeech(120)).toBe('2 minutes');
    expect(formatDurationSpeech(180)).toBe('3 minutes');
  });

  it('4. Handles compound minutes and seconds (singular and plural)', () => {
    expect(formatDurationSpeech(61)).toBe('1 minute 1 second');
    expect(formatDurationSpeech(90)).toBe('1 minute 30 seconds');
    expect(formatDurationSpeech(121)).toBe('2 minutes 1 second');
    expect(formatDurationSpeech(150)).toBe('2 minutes 30 seconds');
  });
});
