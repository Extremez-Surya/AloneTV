'use client'

import { useState, useRef, useEffect } from 'react'
import type { AudioLanguage } from '@/lib/audioPreferences'

interface DubSelectorProps {
  availableLanguages: AudioLanguage[]
  currentLanguage: AudioLanguage
  onLanguageChange: (language: AudioLanguage) => void
}

const FLAG_EMOJI: Record<string, string> = {
  English: '\u{1F1EC}\u{1F1E7}',
  Hindi: '\u{1F1EE}\u{1F1F3}',
  Tamil: '\u{1F1EE}\u{1F1F3}',
  Telugu: '\u{1F1EE}\u{1F1F3}',
  Kannada: '\u{1F1EE}\u{1F1F3}',
  Malayalam: '\u{1F1EE}\u{1F1F3}',
  Marathi: '\u{1F1EE}\u{1F1F3}',
  Bengali: '\u{1F1E7}\u{1F1F4}',
  Spanish: '\u{1F1EA}\u{1F1F8}',
  French: '\u{1F1EB}\u{1F1F7}',
  German: '\u{1F1E9}\u{1F1EA}',
  Portuguese: '\u{1F1F5}\u{1F1F9}',
  Italian: '\u{1F1EE}\u{1F1F9}',
  Russian: '\u{1F1F7}\u{1F1FA}',
  Japanese: '\u{1F1EF}\u{1F1F5}',
  Korean: '\u{1F1F0}\u{1F1F7}',
  Chinese: '\u{1F1E8}\u{1F1F3}',
  Thai: '\u{1F1F9}\u{1F1ED}',
  Vietnamese: '\u{1F1FB}\u{1F1F3}',
  Indonesian: '\u{1F1EE}\u{1F1E9}',
}

export default function DubSelector({
  availableLanguages,
  currentLanguage,
  onLanguageChange,
}: DubSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (availableLanguages.length <= 1) return null

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
        title="Change audio language"
      >
        <span className="text-xs">{FLAG_EMOJI[currentLanguage] || ''}</span>
        <span>{currentLanguage}</span>
        <svg className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-zinc-900/95 backdrop-blur-xl border border-white/[0.06] rounded-xl p-1.5 min-w-[160px] shadow-2xl z-50 max-h-64 overflow-y-auto">
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                onLanguageChange(lang)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                lang === currentLanguage
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              <span className="text-sm">{FLAG_EMOJI[lang] || ''}</span>
              <span className="font-mono">{lang}</span>
              {lang === currentLanguage && (
                <svg className="w-3.5 h-3.5 ml-auto text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
