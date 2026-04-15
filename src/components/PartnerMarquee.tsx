const partners = [
  { label: "Stripe", color: "#635BFF" },
  { label: "Visa", color: "#1A1F71" },
  { label: "Mastercard", color: "#EB001B" },
  { label: "Pix", color: "#32BCAD" },
  { label: "Google Cloud", color: "#4285F4" },
] as const;

const doubledPartners = [...partners, ...partners];

export default function PartnerMarquee() {
  return (
    <section className="overflow-hidden px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="mb-10 text-center text-xs font-medium uppercase tracking-[0.2em] text-white/25">
          Tecnologia de confiança
        </p>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-black to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-black to-transparent" />

          <div className="overflow-hidden">
            <div className="partner-marquee-track flex w-max items-center gap-16">
              {doubledPartners.map((partner, index) => (
                <div
                  key={`${partner.label}-${index}`}
                  className="shrink-0 px-4 text-xs font-semibold tracking-wide transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ color: partner.color }}
                  title={partner.label}
                >
                  {partner.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .partner-marquee-track {
          animation: partner-marquee 28s linear infinite;
          will-change: transform;
        }

        @keyframes partner-marquee {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
    </section>
  );
}
