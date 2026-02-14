'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

/** Sections that live on the home page and scroll into view */
const HOME_SECTIONS = ['gold', 'silver', 'exchange', 'calculator'] as const;
type HomeSection = (typeof HOME_SECTIONS)[number];

// ---------------------------------------------------------------------------
// SVG Icons (hand-crafted 24×24, no icon library)
// ---------------------------------------------------------------------------

const ACTIVE = '#D4AF37';
const MUTED = '#8A8A8E';

function GoldIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE : MUTED;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 17h16l-2-6H6L4 17Z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" fill={active ? ACTIVE : 'none'} />
      <path d="M6 11h12l-1.5-4h-9L6 11Z" stroke={c} strokeWidth="1.5" strokeLinejoin="round" fill={active ? '#B8962E' : 'none'} />
    </svg>
  );
}

function SilverIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE : MUTED;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke={c} strokeWidth="1.5" fill={active ? 'rgba(212,175,55,0.2)' : 'none'} />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill={c}>Ag</text>
    </svg>
  );
}

function ExchangeIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE : MUTED;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 10l-3 3 3 3" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 13h13" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 14l3-3-3-3" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 11H7" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CalcIcon({ active }: { active: boolean }) {
  const c = active ? ACTIVE : MUTED;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={c} strokeWidth="1.5" />
      <rect x="7" y="6" width="10" height="4" rx="1" stroke={c} strokeWidth="1" fill={active ? 'rgba(212,175,55,0.2)' : 'none'} />
      <circle cx="8.5" cy="14" r="1" fill={c} />
      <circle cx="12" cy="14" r="1" fill={c} />
      <circle cx="15.5" cy="14" r="1" fill={c} />
      <circle cx="8.5" cy="17.5" r="1" fill={c} />
      <circle cx="12" cy="17.5" r="1" fill={c} />
      <circle cx="15.5" cy="17.5" r="1" fill={c} />
    </svg>
  );
}

const ICON_MAP: Record<HomeSection, React.ComponentType<{ active: boolean }>> = {
  gold: GoldIcon,
  silver: SilverIcon,
  exchange: ExchangeIcon,
  calculator: CalcIcon,
};

const LABEL_KEYS: Record<HomeSection, string> = {
  gold: 'mobileNav.gold',
  silver: 'mobileNav.silver',
  exchange: 'mobileNav.exchange',
  calculator: 'mobileNav.calc',
};

export function MobileBottomNav() {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<HomeSection>('gold');
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;

  // Track visible section via IntersectionObserver (home page only)
  useEffect(() => {
    if (!isHomePage) return;

    const sectionElements = HOME_SECTIONS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id as HomeSection);
          }
        }
      },
      { rootMargin: '-30% 0px -65% 0px' },
    );

    for (const el of sectionElements) observer.observe(el);
    return () => observer.disconnect();
  }, [isHomePage]);

  const handleSectionClick = useCallback(
    (section: HomeSection) => {
      setActiveTab(section);
      isScrollingRef.current = true;

      if (isHomePage) {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = `/${locale}#${section}`;
        return;
      }

      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
    },
    [isHomePage, locale],
  );

  return (
    <nav
      className="fixed bottom-0 start-0 end-0 z-50 lg:hidden print:hidden"
      role="tablist"
      aria-label="Main navigation"
    >
      {/* Frosted glass backdrop — extends below for iOS safe area */}
      <div className="absolute inset-0 -bottom-[34px] bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-[rgba(212,175,55,0.15)]" />

      <div
        className="relative flex items-stretch justify-around"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        {HOME_SECTIONS.map((section) => {
          const Icon = ICON_MAP[section];
          const isActive = activeTab === section;

          return (
            <button
              key={section}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSectionClick(section)}
              className="relative flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1 transition-colors"
            >
              {isActive && <span className="absolute top-0 inset-x-2 h-0.5 rounded-full bg-[#D4AF37]" />}
              <Icon active={isActive} />
              <span className={`text-[10px] leading-tight font-medium ${isActive ? 'text-[#D4AF37]' : 'text-[#8A8A8E]'}`}>
                {t(LABEL_KEYS[section])}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
