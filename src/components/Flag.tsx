interface FlagProps {
  country: "it" | "gb";
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
  // GB
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

export function LanguageFlags({
  language,
  className,
  title,
}: {
  language: "it" | "en" | "both";
  className?: string;
  title?: string;
}) {
  const cls = className ?? "inline-block w-5 h-auto align-middle";
  if (language === "it") return <Flag country="it" className={cls} title={title} />;
  if (language === "en") return <Flag country="gb" className={cls} title={title} />;
  return (
    <span className="inline-flex items-center gap-1 align-middle" title={title}>
      <Flag country="it" className={cls} />
      <Flag country="gb" className={cls} />
    </span>
  );
}
