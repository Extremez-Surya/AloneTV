/**
 * Audio Language Preferences
 * Manage user's preferred audio language across the site
 */

export type AudioLanguage =
  | 'English'
  | 'Hindi'
  | 'Tamil'
  | 'Telugu'
  | 'Kannada'
  | 'Malayalam'
  | 'Marathi'
  | 'Bengali'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Portuguese'
  | 'Italian'
  | 'Russian'
  | 'Japanese'
  | 'Korean'
  | 'Chinese'
  | 'Thai'
  | 'Vietnamese'
  | 'Indonesian';

const STORAGE_KEY = 'alonetv_audio_preference';
const DEFAULT_LANGUAGE: AudioLanguage = 'English';

/**
 * Get user's preferred audio language
 */
export function getPreferredAudioLanguage(): AudioLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as AudioLanguage) || DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Set user's preferred audio language
 */
export function setPreferredAudioLanguage(language: AudioLanguage): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch (error) {
    console.error('Failed to save audio preference:', error);
  }
}

/**
 * Detect system language preference
 */
export function detectSystemLanguage(): AudioLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const userLang = navigator.language?.toLowerCase() || '';
  
  // Map browser language codes to our audio languages
  const languageMap: Record<string, AudioLanguage> = {
    'hi': 'Hindi',
    'hi-in': 'Hindi',
    'ta': 'Tamil',
    'ta-in': 'Tamil',
    'te': 'Telugu',
    'te-in': 'Telugu',
    'kn': 'Kannada',
    'kn-in': 'Kannada',
    'ml': 'Malayalam',
    'ml-in': 'Malayalam',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'it': 'Italian',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'id': 'Indonesian',
  };

  // Check exact match first
  if (languageMap[userLang]) {
    return languageMap[userLang];
  }

  // Check prefix match (e.g., 'en-US' → 'en')
  const prefix = userLang.split('-')[0];
  return languageMap[prefix] || DEFAULT_LANGUAGE;
}

/**
 * Get available languages for a source
 */
export function filterLanguagesBySource(
  availableLanguages: string[],
  preferredLanguage: AudioLanguage
): AudioLanguage {
  if (availableLanguages.includes(preferredLanguage)) {
    return preferredLanguage;
  }
  // Fallback to English if available, otherwise first available
  if (availableLanguages.includes('English')) {
    return 'English' as AudioLanguage;
  }
  return (availableLanguages[0] as AudioLanguage) || DEFAULT_LANGUAGE;
}

/**
 * All supported audio languages for UI dropdowns
 */
export const SUPPORTED_LANGUAGES: AudioLanguage[] = [
  'English',
  'Hindi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Marathi',
  'Bengali',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Italian',
  'Russian',
  'Japanese',
  'Korean',
  'Chinese',
  'Thai',
  'Vietnamese',
  'Indonesian',
];
