import Image from "next/image";

/**
 * University of the Punjab crest, downloaded from the university's own
 * public site (pu.edu.pk/temp1/img/logo.png) — the same image the
 * university uses in its own site header. No separate official crest for
 * the College of Statistical & Actuarial Sciences was found to verify, so
 * this app uses the university crest plus a text wordmark for the college
 * name rather than inventing a department logo.
 */
const CREST_SRC = "/brand/pu-crest.png";
const CREST_NATIVE_WIDTH = 50;
const CREST_NATIVE_HEIGHT = 67;

type LogoProps = {
  size?: "sm" | "md" | "lg";
  /** Renders the two-line institutional wordmark next to the crest. */
  withWordmark?: boolean;
  /** "dark" for use on a dark/brand-colored background (e.g. the login page's brand panel). */
  tone?: "light" | "dark";
  className?: string;
};

const SIZES = {
  sm: { crest: 28, title: "text-sm", subtitle: "text-[10px]" },
  md: { crest: 36, title: "text-base", subtitle: "text-xs" },
  lg: { crest: 52, title: "text-xl", subtitle: "text-sm" },
} as const;

export function Logo({ size = "md", withWordmark = true, tone = "light", className = "" }: LogoProps) {
  const s = SIZES[size];
  const height = s.crest;
  const width = Math.round((CREST_NATIVE_WIDTH / CREST_NATIVE_HEIGHT) * height);
  const titleColor = tone === "dark" ? "text-white" : "text-slate-900";
  const subtitleColor = tone === "dark" ? "text-indigo-200" : "text-slate-500";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src={CREST_SRC}
        alt="University of the Punjab crest"
        width={width}
        height={height}
        priority
        className="shrink-0"
      />
      {withWordmark && (
        <div className="flex flex-col leading-tight">
          <span className={`font-semibold tracking-tight ${titleColor} ${s.title}`}>CSAS Connect</span>
          <span className={`${subtitleColor} ${s.subtitle}`}>College of Statistical &amp; Actuarial Sciences</span>
        </div>
      )}
    </div>
  );
}
