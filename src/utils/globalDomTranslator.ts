/**
 * Global DOM Auto-Translation Engine
 * محرك ترجمة الويب الشامل والذاتي للموقع بالكامل
 * 
 * يراقب شجرة الصفحة بالكامل (DOM) ويقوم بترجمة أي نص عربي يظهر على الشاشة فوراً
 * إلى الإنجليزية أو الكردية السورانية، مع استعادة النصوص العربية الأصلية بدقة عند العودة للعربية.
 */

import { SupportedLanguage } from '../types';
import { initialSiteTexts, initialButtonTranslations } from '../data/initialData';
import { instantTranslateArabic } from './autoTranslator';

// Arabic Unicode regex range (covers standard Arabic, Arabic Presentation Forms, Persian/Kurdish variants)
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// WeakMap to preserve the exact original Arabic text of every DOM text node
const originalTextMap = new WeakMap<Node, string>();

// Fast in-memory cache for translated strings
const stringTranslationCache = new Map<string, { en: string; ku: string }>();

// Pre-fill cache from curated dictionaries for lightning speed
(function seedCache() {
  try {
    // 1. Initial Site Texts
    if (initialSiteTexts) {
      Object.values(initialSiteTexts).forEach((entry) => {
        if (entry && entry.ar) {
          const key = entry.ar.trim();
          if (key && !stringTranslationCache.has(key)) {
            stringTranslationCache.set(key, {
              en: entry.en || key,
              ku: entry.ku || key,
            });
          }
        }
      });
    }

    // 2. Initial Button Translations
    if (initialButtonTranslations) {
      Object.values(initialButtonTranslations).forEach((entry) => {
        if (entry && entry.ar) {
          const key = entry.ar.trim();
          if (key && !stringTranslationCache.has(key)) {
            stringTranslationCache.set(key, {
              en: entry.en || key,
              ku: entry.ku || key,
            });
          }
        }
      });
    }
  } catch {
    // Fail-safe
  }
})();

/**
 * Translates any Arabic string to the target language (English or Kurdish)
 */
export function translateArabicText(
  text: string,
  targetLang: SupportedLanguage
): string {
  if (!text || targetLang === 'ar') return text;
  if (!ARABIC_REGEX.test(text)) return text;

  // Extract leading and trailing whitespace or punctuation
  const match = text.match(/^(\s*[\d\s\-_.,،:;•*#|/\\()[\]{}'"«»<>]*)(.*?)(\s*[\d\s\-_.,،:;•*#|/\\()[\]{}'"«»<>]*)$/);
  const leading = match ? match[1] : '';
  const core = (match ? match[2] : text).trim();
  const trailing = match ? match[3] : '';

  if (!core || !ARABIC_REGEX.test(core)) {
    return text;
  }

  // Check cache
  let trans = stringTranslationCache.get(core);
  if (!trans) {
    // Use the comprehensive auto-translator engine
    trans = instantTranslateArabic(core);
    stringTranslationCache.set(core, trans);
  }

  const translatedCore = targetLang === 'en' ? trans.en : trans.ku;
  return `${leading}${translatedCore}${trailing}`;
}

// Active observer state
let mutationObserver: MutationObserver | null = null;
let currentActiveLanguage: SupportedLanguage = 'ar';
let isTranslating = false;
let rafId: number | null = null;

/**
 * Checks whether an element should be ignored from translation
 */
function shouldIgnoreElement(element: HTMLElement | null): boolean {
  if (!element) return true;
  const tag = element.tagName.toLowerCase();

  // Code, scripts, styles, media, and canvas
  if (['script', 'style', 'noscript', 'code', 'pre', 'svg', 'canvas', 'path'].includes(tag)) {
    return true;
  }

  // Explicitly marked elements
  if (element.hasAttribute('data-no-translate') || element.closest('[data-no-translate="true"]')) {
    return true;
  }

  // Never touch editable content or what users are actively typing
  if (tag === 'textarea' || element.isContentEditable) {
    return true;
  }

  return false;
}

/**
 * Translates or restores a single DOM Text node
 */
function processTextNode(node: Node, lang: SupportedLanguage) {
  const parent = node.parentElement;
  if (!parent || shouldIgnoreElement(parent)) return;

  const currentVal = node.nodeValue || '';

  if (lang === 'ar') {
    // Restore original Arabic text if present
    if (originalTextMap.has(node)) {
      const original = originalTextMap.get(node)!;
      if (currentVal !== original) {
        node.nodeValue = original;
      }
    }
  } else {
    // Target is English or Kurdish
    let original = originalTextMap.get(node);

    // If we haven't stored the original yet and the node contains Arabic:
    if (original === undefined) {
      if (ARABIC_REGEX.test(currentVal)) {
        original = currentVal;
        originalTextMap.set(node, original);
      } else {
        return;
      }
    }

    if (original && ARABIC_REGEX.test(original)) {
      const translated = translateArabicText(original, lang);
      if (node.nodeValue !== translated) {
        node.nodeValue = translated;
      }
    }
  }
}

/**
 * Translates or restores placeholders on input elements
 */
function processElementAttributes(el: HTMLElement, lang: SupportedLanguage) {
  if (shouldIgnoreElement(el)) return;

  // 1. Placeholder on inputs
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    const placeholder = el.placeholder;
    if (lang === 'ar') {
      const orig = el.getAttribute('data-orig-placeholder');
      if (orig !== null && el.placeholder !== orig) {
        el.placeholder = orig;
      }
    } else {
      if (!el.hasAttribute('data-orig-placeholder')) {
        if (ARABIC_REGEX.test(placeholder)) {
          el.setAttribute('data-orig-placeholder', placeholder);
        }
      }
      const orig = el.getAttribute('data-orig-placeholder');
      if (orig && ARABIC_REGEX.test(orig)) {
        const trans = translateArabicText(orig, lang);
        if (el.placeholder !== trans) {
          el.placeholder = trans;
        }
      }
    }
  }

  // 2. Title & Aria-Label attributes
  const title = el.getAttribute('title');
  if (title && ARABIC_REGEX.test(title)) {
    if (lang === 'ar') {
      const orig = el.getAttribute('data-orig-title');
      if (orig !== null) el.setAttribute('title', orig);
    } else {
      if (!el.hasAttribute('data-orig-title')) el.setAttribute('data-orig-title', title);
      const orig = el.getAttribute('data-orig-title') || title;
      el.setAttribute('title', translateArabicText(orig, lang));
    }
  }

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ARABIC_REGEX.test(ariaLabel)) {
    if (lang === 'ar') {
      const orig = el.getAttribute('data-orig-aria-label');
      if (orig !== null) el.setAttribute('aria-label', orig);
    } else {
      if (!el.hasAttribute('data-orig-aria-label')) el.setAttribute('data-orig-aria-label', ariaLabel);
      const orig = el.getAttribute('data-orig-aria-label') || ariaLabel;
      el.setAttribute('aria-label', translateArabicText(orig, lang));
    }
  }
}

/**
 * Traverses a subtree and translates all eligible nodes
 */
function scanAndTranslateRoot(root: Node, lang: SupportedLanguage) {
  if (typeof document === 'undefined' || !root) return;

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (shouldIgnoreElement(el)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
        if (node.nodeType === Node.TEXT_NODE) {
          const parent = node.parentElement;
          if (!parent || shouldIgnoreElement(parent)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    }
  );

  let currentNode: Node | null = walker.currentNode;
  while (currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      processTextNode(currentNode, lang);
    } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
      processElementAttributes(currentNode as HTMLElement, lang);
    }
    currentNode = walker.nextNode();
  }
}

/**
 * Batched execution to apply translation without overloading the browser
 */
function scheduleTranslationPass(lang: SupportedLanguage) {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }

  rafId = requestAnimationFrame(() => {
    rafId = null;
    if (typeof document === 'undefined' || !document.body) return;

    isTranslating = true;
    try {
      scanAndTranslateRoot(document.body, lang);
    } finally {
      isTranslating = false;
    }
  });
}

/**
 * Initializes and syncs the Global Page Auto-Translation Engine
 */
export function syncGlobalPageTranslation(lang: SupportedLanguage): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  currentActiveLanguage = lang;

  // Run immediate initial pass
  scheduleTranslationPass(lang);

  // Initialize MutationObserver if not active
  if (!mutationObserver && typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver((mutations) => {
      if (isTranslating) return;

      let hasRelevantChanges = false;
      for (const m of mutations) {
        if (m.type === 'characterData') {
          hasRelevantChanges = true;
          break;
        }
        if (m.type === 'childList' && (m.addedNodes.length > 0 || m.removedNodes.length > 0)) {
          hasRelevantChanges = true;
          break;
        }
      }

      if (hasRelevantChanges) {
        scheduleTranslationPass(currentActiveLanguage);
      }
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}
