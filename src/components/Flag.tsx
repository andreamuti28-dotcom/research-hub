interface FlagProps {
  country: "it" | "gb" | "es" | "de" | "cn" | "ru" | "sa" | "ar";
  className?: string;
  title?: string;
}

export function Flag({ country, className, title }: FlagProps) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 3 2",
    className,
    role: "img" as const,
    "aria-label": title,
  };

  if (country === "it") {
    return (
      <svg {...common}>
        {title && <title>{title}</title>}
        <rect width="1" height="2" x="0" fill="#009246" />
        <rect width="1" height="2" x="1" fill="#ffffff" />
        <rect width="1" height="2" x="2" fill="#ce2b37" />
      </svg>
    );
  }

  if (country === "gb") {
    return (
      <svg {...common} viewBox="0 0 60 30">
        {title && <title>{title}</title>}
        <clipPath id="gb-c">
          <path d="M0,0 v30 h60 v-30 z" />
        </clipPath>
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          clipPath="url(#gb-c)"
          stroke="#C8102E"
          strokeWidth="4"
        />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </svg>
    );
  }

  if (country === "es") {
    // Spain — simplified horizontal tricolour without coat of arms
    return (
      <svg {...common} viewBox="0 0 3 2">
        {title && <title>{title}</title>}
        <rect width="3" height="0.5" x="0" y="0" fill="#AA151B" />
        <rect width="3" height="1" x="0" y="0.5" fill="#F1BF00" />
        <rect width="3" height="0.5" x="0" y="1.5" fill="#AA151B" />
      </svg>
    );
  }

  if (country === "de") {
    return (
      <svg {...common} viewBox="0 0 3 2">
        {title && <title>{title}</title>}
        <rect width="3" height="0.667" x="0" y="0" fill="#000000" />
        <rect width="3" height="0.667" x="0" y="0.667" fill="#DD0000" />
        <rect width="3" height="0.666" x="0" y="1.333" fill="#FFCE00" />
      </svg>
    );
  }

  if (country === "cn") {
    return (
      <svg {...common} viewBox="0 0 3 2">
        {title && <title>{title}</title>}
        <rect width="3" height="2" fill="#DE2910" />
        <g fill="#FFDE00">
          <path d="M0.45,0.35 l0.12,0.37 l0.39,0 h-0.31 l0.12,-0.37 z" transform="scale(0.7) translate(0.2,0.1)" />
          <circle cx="0.75" cy="0.45" r="0.08" />
          <circle cx="0.95" cy="0.55" r="0.06" />
          <circle cx="0.95" cy="0.78" r="0.06" />
          <circle cx="0.75" cy="0.95" r="0.06" />
          <circle cx="0.55" cy="0.78" r="0.06" />
        </g>
      </svg>
    );
  }

  if (country === "ru") {
    return (
      <svg {...common} viewBox="0 0 3 2">
        {title && <title>{title}</title>}
        <rect width="3" height="0.667" x="0" y="0" fill="#ffffff" />
        <rect width="3" height="0.667" x="0" y="0.667" fill="#0039A6" />
        <rect width="3" height="0.666" x="0" y="1.333" fill="#D52B1E" />
      </svg>
    );
  }

  // Saudi Arabia / Arabic — green with white shahada stripe simplified as horizontal band
  return (
    <svg {...common} viewBox="0 0 3 2">
      {title && <title>{title}</title>}
      <rect width="3" height="2" fill="#006C35" />
      <rect width="3" height="0.25" x="0" y="0.55" fill="#ffffff" />
      <rect width="3" height="0.25" x="0" y="1.2" fill="#ffffff" />
    </svg>
  );
}

const LANG_TO_FLAG: Record<string, "it" | "gb" | "es" | "de" | "cn" | "ru" | "sa"> = {
  it: "it",
  en: "gb",
  es: "es",
  de: "de",
  zh: "cn",
  ru: "ru",
  ar: "sa",
};

export function LanguageFlags({
  language,
  className,
  title,
}: {
  language: "it" | "en" | "es" | "de" | "zh" | "ru" | "ar" | "both";
  className?: string;
  title?: string;
}) {
  const cls = className ?? "inline-block w-5 h-auto align-middle";
  if (language === "both") {
    return (
      <span className="inline-flex items-center gap-1 align-middle" title={title}>
        <Flag country="it" className={cls} />
        <Flag country="gb" className={cls} />
      </span>
    );
  }
  const country = LANG_TO_FLAG[language] ?? "it";
  return <Flag country={country} className={cls} title={title} />;
}
