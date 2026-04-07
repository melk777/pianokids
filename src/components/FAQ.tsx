"use client";

import { motion } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Keyboard, CreditCard, ShieldCheck, Headphones, Zap } from "lucide-react";

const faqs = [
  {
    icon: <Keyboard className="w-4 h-4" />,
    question: "Preciso de um teclado físico?",
    answer:
      "Sim, seu filho precisará de um piano real ou teclado musical físico. A diferença é que agora não é necessário nenhum cabo! O PianoKids usa o microfone do seu dispositivo (celular, tablet ou computador) para 'ouvir' as notas sendo tocadas e dar o feedback instantâneo. Isso permite usar qualquer instrumento, desde um piano acústico até um teclado eletrônico simples.",
  },
  {
    icon: <CreditCard className="w-4 h-4" />,
    question: "Como funciona a assinatura?",
    answer:
      "Oferecemos planos Mensal (R$ 29,90/mês) e Anual (R$ 239,90/ano, equivalente a 2 meses grátis). Com a assinatura, você tem acesso ilimitado a todas as músicas, prática livre, acompanhamento de progresso e suporte prioritário. Você pode cancelar a qualquer momento pelo painel de gerenciamento da assinatura, sem multa ou complicação.",
  },
  {
    icon: <ShieldCheck className="w-4 h-4" />,
    question: "É seguro para crianças?",
    answer:
      "Absolutamente! O PianoKids foi projetado pensando na segurança infantil. Não exibimos anúncios, não coletamos dados pessoais das crianças e todo o conteúdo é curado e apropriado para todas as idades. O pagamento é feito apenas pelo responsável, e o ambiente da plataforma é 100% focado na educação musical.",
  },
  {
    icon: <Zap className="w-4 h-4" />,
    question: "Quais navegadores são compatíveis?",
    answer:
      "O PianoKids funciona em qualquer navegador moderno (Chrome, Edge, Safari e Firefox) que suporte acesso ao microfone. Recomendamos manter seu navegador atualizado para a melhor precisão no reconhecimento das notas.",
  },
  {
    icon: <Zap className="w-4 h-4" />,
    question: "Meu filho já sabe um pouco de piano. O PianoKids ainda vale?",
    answer:
      "Com certeza! Temos músicas de diferentes níveis de dificuldade — de iniciante a avançado. O sistema de progressão se adapta e as músicas exclusivas do plano Pro são desafiadoras o suficiente para manter pianistas intermediários engajados. Além disso, o modo de prática livre permite tocar qualquer coisa sem restrições.",
  },
];

export default function FAQ() {
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
        </motion.div>
      </div>
    </section>
  );
}
