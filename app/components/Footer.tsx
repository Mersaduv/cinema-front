import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { RiTelegramFill } from "react-icons/ri";

const TEAL = "#2d615a";

const footerNavLinks = [
  { label: "درباره سینما", href: "https://ariyabod.af/", external: true },
  { label: "سوالات متداول", href: "https://ariyabod.af/", external: true },
  { label: "اپلیکیشن‌ها", href: "http://app.ariyabod.af", external: true },
  { label: "شرایط و قوانین", href: "https://ariyabod.af/", external: true },
  { label: "  پشتیبانی", href: "https://t.me/ariyabodisp", external: true },
];

const socialLinks = [
  {
    label: "فیسبوک",
    href: "https://www.facebook.com/ariyabodisp/",
    icon: FaFacebookF,
  },
  {
    label: "اینستاگرام",
    href: "https://www.instagram.com/ariyabodisp/",
    icon: FaInstagram,
  },
  {
    label: "تلگرام",
    href: "https://t.me/ariyabodisp",
    icon: RiTelegramFill,
  },
];

function FooterNavLink({
  label,
  href,
  external,
}: {
  label: string;
  href: string;
  external?: boolean;
}) {
  const className =
    "text-sm font-medium text-white/72 transition hover:text-[#f5c518] md:text-[15px]";

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function StoreBadge({
  href,
  ariaLabel,
  logoSrc,
  logoAlt,
  topLine,
  bottomLine,
  isGooglePlay = false,
}: {
  href: string;
  ariaLabel: string;
  logoSrc: string;
  logoAlt: string;
  topLine: string;
  bottomLine: string;
  isGooglePlay?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      dir="ltr"
      className="group inline-flex min-w-[148px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 transition hover:border-[#f5c518]/30 hover:bg-white/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center">
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={28}
          height={28}
          unoptimized
          loading="eager"
          className={`object-contain transition group-hover:scale-105 ${isGooglePlay ? "h-10 w-10" : "h-7 w-7"}`}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[10px] font-medium tracking-wide text-white/50">
          {topLine}
        </span>
        <span className="mt-1 text-[15px] font-semibold tracking-tight text-white">
          {bottomLine}
        </span>
      </span>
    </a>
  );
}

function AppStoreBadge() {
  return (
    <StoreBadge
      href="http://app.ariyabod.af"
      ariaLabel="دانلود از App Store"
      logoSrc="/images/store-apple.svg"
      logoAlt="Apple"
      topLine="Download on"
      bottomLine="App Store"
    />
  );
}

function GooglePlayBadge() {
  return (
    <StoreBadge
      href="http://app.ariyabod.af"
      ariaLabel="دانلود از Google Play"
      logoSrc="/images/google-play-1.png"
      logoAlt="Google Play"
      topLine="Download on"
      bottomLine="Google Play"
      isGooglePlay={true}
    />
  );
}

export default function Footer({ isTv = false }: { isTv?: boolean }) {
  if (isTv) {
    return null;
  }

  return <FooterContent />;
}

function FooterContent() {
  return (
    <footer
      dir="rtl"
      className="relative mt-auto border-t border-white/[0.06] bg-black text-white"
      aria-label="پاورقی سایت"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#2d615a,transparent)]"
        aria-hidden
      />

      <div className="mx-auto max-w-[1820px] px-4 py-10 md:px-7 md:py-12">
        <nav
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-b border-white/[0.06] pb-8 md:justify-between md:gap-x-6"
          aria-label="لینک‌های پاورقی"
        >
          {footerNavLinks.map((link) => (
            <FooterNavLink key={link.label} {...link} />
          ))}
        </nav>

        <div className="py-8 md:py-10">
          <div className="flex flex-col gap-5 rounded-[28px] border border-white/10 bg-[#11161c] p-5 md:flex-row md:items-center md:justify-between md:px-7 md:py-6">
            <a
              href="http://app.ariyabod.af"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-5 transition"
            >
              <Image
                src="/images/app_logo.png"
                alt="لوگوی اپلیکیشن آریابُد"
                width={48}
                height={48}
                unoptimized
                loading="eager"
                className="h-12 w-12 shrink-0 rounded-md bg-[#b3b9b7] object-contain p-1"
              />
              <span className="text-base font-bold text-white transition group-hover:text-[#f8d977] md:text-lg underline">
                دانلود اپلیکیشن{" "}
                <span className="text-[#428b7c]">آریابُد</span>
              </span>
            </a>

            <div className="flex flex-wrap items-center gap-3">
              <AppStoreBadge />
              <GooglePlayBadge />
            </div>
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-2 md:items-start md:gap-12">
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white md:text-2xl">
              یک دنیا فیلم و سریال
            </h2>
            <p className="max-w-xl text-sm leading-8 text-white/58 md:text-[15px]">
              به{" "}
              <Link
                href="/"
                className="font-semibold text-white/82 transition hover:text-[#f5c518]"
              >
                سینما
              </Link>{" "}
              خوش آمدید؛ جایی برای کشف دنیای سینما، از آثار کلاسیک تا جدیدترین
              فیلم‌ها و سریال‌ها. با پشتیبانی{" "}
              <a
                href="https://ariyabod.af/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold transition hover:text-[#f5c518]"
                style={{ color: TEAL }}
              >
                آریابُد
              </a>
              ، تجربه تماشای آنلاین را با سرعت و کیفیت بهتر داشته باشید.
            </p>
          </div>
          <div className="space-y-5 md:text-left">
            <p className="text-sm text-white/55 md:text-[15px]">
              سینما را در شبکه‌های اجتماعی دنبال کنید
            </p>
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#151a21] text-lg text-white/85 transition hover:bg-[#2d615a]/20 hover:text-[#f5c518]"
                >
                  <Icon aria-hidden />
                </a>
              ))}
            </div>
          </div>


        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-white/38">
          <p>© 2026 سینما — ارائه‌شده توسط آریابُد</p>
          <a
            href="https://ariyabod.af/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-[#f5c518]"
          >
            ariyabod.af
          </a>
        </div>
      </div>
    </footer>
  );
}
