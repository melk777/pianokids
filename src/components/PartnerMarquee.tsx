const partners = [
  "Stripe",
  "GitHub",
  "Visa",
  "Mastercard",
  "Pix",
  "Google Cloud",
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
                  key={`${partner}-${index}`}
                  className="shrink-0 px-4 text-xs font-medium tracking-wide text-white/30 transition-colors duration-300 hover:text-white/70"
                  title={partner}
                >
                  {partner}
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
