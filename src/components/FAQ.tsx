"use client";

import { motion } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Keyboard, CreditCard, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const faqs = [
  {
    icon: <Keyboard className="w-4 h-4" />,
    question: "Preciso de um piano ou teclado físico?",
    answer:
      "Não para experimentar: você pode usar o teclado do computador ou as teclas na tela. Para praticar no próprio instrumento, use um teclado MIDI compatível ou autorize o microfone para reconhecimento de notas.",
  },
  {
    icon: <CreditCard className="w-4 h-4" />,
    question: "Posso cancelar quando quiser?",
    answer:
      "Sim. A assinatura e gerenciada pelo portal seguro do Stripe. Voce pode cancelar sem precisar falar com suporte, e o acesso continua ate o fim do periodo ja pago.",
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    question: "E se eu for totalmente iniciante?",
    answer:
      "O Pianify foi pensado para comecar simples: voce pode estudar uma mao por vez, usar musicas faceis e evoluir para duas maos quando estiver pronto.",
  },
  {
    icon: <CreditCard className="w-4 h-4" />,
    question: "Como funciona a assinatura Pianify Pro?",
    answer:
      "Oferecemos planos mensal e anual. Com o Pianify Pro, você tem acesso ao catálogo completo, prática livre e progresso salvo. Neste lançamento, o cadastro está disponível somente para maiores de 18 anos.",
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    question: "O método funciona para adultos também?",
    answer:
      "Sim. Neste lançamento, a experiência foi direcionada a adultos que buscam uma prática guiada, visual e progressiva no próprio ritmo.",
  },
  {
    icon: <Zap className="w-4 h-4" />,
    question: "Quais são os requisitos técnicos?",
    answer:
      "As páginas principais funcionam em navegadores modernos. Microfone e MIDI dependem do navegador e do aparelho; para MIDI, prefira Chrome ou Edge em computador e faça o teste de compatibilidade antes de assinar.",
  },
  {
    icon: <Zap className="w-4 h-4" />,
    question: "Já tenho uma base musical. O Pianify é para mim?",
    answer:
      "Sim. A biblioteca oferece arranjos do básico ao avançado, estudo por mãos, controle de velocidade e repetição de trechos para praticar coordenação e precisão.",
  },
];

export default function FAQ() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Radix interactivity is enabled only after hydration to keep SSR markup stable.
    setIsMounted(true);
  }, []);

  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Perguntas{" "}
            <span className="text-gradient font-black">frequentes</span>
          </h2>
          <p className="text-white/40 max-w-lg mx-auto">
            Tudo o que você precisa saber antes de começar.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {isMounted ? (
            <Accordion.Root type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <Accordion.Item
                  key={i}
                  value={`item-${i}`}
                  className="glass rounded-2xl border border-white/[0.06] overflow-hidden group data-[state=open]:border-cyan/20 transition-colors duration-300"
                >
                  <Accordion.Trigger className="w-full flex items-center gap-4 px-6 py-5 text-left group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] group-data-[state=open]:bg-cyan/10 flex items-center justify-center text-white/30 group-data-[state=open]:icon-gradient transition-all duration-300 shrink-0">
                      {faq.icon}
                    </div>
                    <span className="flex-1 text-[15px] font-medium text-white/80 group-data-[state=open]:text-white transition-colors">
                      {faq.question}
                    </span>
                    <ChevronDown className="w-4 h-4 text-white/25 group-data-[state=open]:icon-gradient transition-all duration-300 group-data-[state=open]:rotate-180 shrink-0" />
                  </Accordion.Trigger>

                  <Accordion.Content className="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                    <div className="px-6 pb-6 pt-0 pl-[72px]">
                      <p className="text-sm text-white/45 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="glass rounded-2xl border border-white/[0.06] overflow-hidden"
                >
                  <div className="flex items-center gap-4 px-6 py-5">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/30 shrink-0">
                      {faq.icon}
                    </div>
                    <span className="flex-1 text-[15px] font-medium text-white/80">
                      {faq.question}
                    </span>
                    <ChevronDown className="w-4 h-4 text-white/25 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
