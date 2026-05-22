import type { ReactNode } from 'react';

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  accent?: string;
  actions?: ReactNode;
  chips?: string[];
}

export default function PageIntro({
  eyebrow,
  title,
  description,
  accent = 'from-[#ff7b54] via-[#ff4d6d] to-[#f4d35e]',
  actions,
  chips = [],
}: PageIntroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent} opacity-60`} />
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-6 shadow-[0_30px_80px_-46px_rgba(0,0,0,0.98)] backdrop-blur-[28px] sm:px-7 sm:py-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,123,84,0.16),transparent_24%),radial-gradient(circle_at_85%_0%,rgba(79,124,255,0.12),transparent_22%)]" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/46">{eyebrow}</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black leading-[0.95] tracking-tight text-white sm:text-4xl lg:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
                {description}
              </p>
              {chips.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/74"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {actions ? <div className="relative shrink-0">{actions}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
