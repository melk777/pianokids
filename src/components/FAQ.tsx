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
      "Sim, você precisará de um piano real ou teclado musical físico. A grande vantagem é que o Pianify não exige cabos! Usamos o microfone do seu dispositivo para 'ouvir' e dar feedback instantâneo, seja em um piano acústico ou teclado digital.",
  },
  {
    icon: <CreditCard className="w-4 h-4" />,
    question: "Como funciona a assinatura Pianify Pro?",
    answer:
      "Oferecemos planos Mensal e Anual. Com o Pianify Pro, você tem acesso ilimitado a todas as músicas, prática livre e suporte prioritário. O aprendizado é gamificado para todas as idades, garantindo evolução constante.",
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    question: "O método funciona para adultos também?",
    answer:
      "Com certeza! Embora o visual seja divertido e colorido, a metodologia de reconhecimento de notas e progressão é extremamente eficaz para adultos que buscam um aprendizado prático, direto e sem a pressão das aulas tradicionais.",
  },
  {
    icon: <Zap className="w-4 h-4" />,
    question: "Quais são os requisitos técnicos?",
    answer:
      "O Pianify funciona em qualquer navegador moderno (Chrome, Edge, Safari e Firefox). Basta permitir o acesso ao microfone quando solicitado e você estará pronto para tocar.",
  },
  {
    icon: <Zap className="w-4 h-4" />,
    question: "Já tenho uma base musical. O Pianify é para mim?",
    answer:
      "Sim! Nossa biblioteca de músicas abrange níveis que vão do básico ao avançado. Se você já toca, o Pianify ajudará você a aprimorar sua leitura de partituras e precisão rítmica de uma forma muito mais dinâmica.",
  },
];

export default function FAQ() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
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
