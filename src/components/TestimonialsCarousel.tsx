"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    name: "Ana Clara, mãe da Sofia (7 anos)",
    avatar: "S",
    avatarGradient: "from-cyan to-cyan/60",
    quote:
      "Minha filha aprendeu sua primeira música em 3 dias com o PianoKids! Ela pede para praticar todo dia depois da escola.",
    rating: 5,
  },
  {
    name: "Rafael Costa, pai do Pedro (9 anos)",
    avatar: "P",
    avatarGradient: "from-magenta to-magenta/60",
    quote:
      "O Pedro sempre teve dificuldade de se concentrar, mas o formato de jogo do PianoKids prendeu a atenção dele. Recomendo demais!",
    rating: 5,
  },
  {
    name: "Mariana Souza, mãe da Luna (6 anos)",
    avatar: "L",
    avatarGradient: "from-emerald-400 to-emerald-400/60",
    quote:
      "A Luna conecta o teclado MIDI e fica praticando por horas. Nunca vi ela tão animada com algo educativo. Vale cada centavo.",
    rating: 5,
  },
  {
    name: "Carlos Mendes, pai do Bernardo (10 anos)",
    avatar: "B",
    avatarGradient: "from-amber-400 to-amber-400/60",
    quote:
      "Meu filho já sabia um pouco de piano, mas com o PianoKids ele evoluiu muito rápido. O sistema de estrelas e progressão é genial.",
    rating: 5,
  },
];

export default function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = (dir: number) => {
    setDirection(dir);
    setCurrent((prev) => (prev + dir + testimonials.length) % testimonials.length);
  };

  // Show 1 on mobile, up to 3 visible but we animate through them one-at-a-time
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const t = testimonials[current];

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            O que dizem nossos{" "}
            <span className="bg-gradient-to-r from-cyan to-magenta bg-clip-text text-transparent">
              pequenos pianistas
            </span>
          </h2>
          <p className="text-white/40 max-w-lg mx-auto">
            e seus pais ❤️
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          {/* Card area */}
          <div className="overflow-hidden rounded-2xl min-h-[280px] flex items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) paginate(1);
                  else if (info.offset.x > 80) paginate(-1);
                }}
                className="w-full max-w-2xl mx-auto cursor-grab active:cursor-grabbing"
              >
                <div className="glass rounded-2xl p-8 md:p-10 border border-white/[0.06]">
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-6">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-lg md:text-xl text-white/80 leading-relaxed mb-8 font-light">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/90">
                        {t.name}
                      </p>
                      <p className="text-xs text-white/40">
                        Família PianoKids
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => paginate(-1)}
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > current ? 1 : -1);
                    setCurrent(i);
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-6 h-2 bg-cyan"
                      : "w-2 h-2 bg-white/15 hover:bg-white/30"
                  }`}
                  aria-label={`Depoimento ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => paginate(1)}
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
