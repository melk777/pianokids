# 🎹 PianoKids

> Transforme o aprendizado de piano em um jogo. Conecte seu teclado MIDI e comece a tocar.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38bdf8?logo=tailwindcss)

---

## 🚀 Stack Técnica

| Tecnologia | Uso |
|---|---|
| **Next.js 14** (App Router) | Framework full-stack |
| **TypeScript** | Tipagem estática |
| **Tailwind CSS** | Estilização (dark mode, #000) |
| **Framer Motion** | Animações e transições |
| **WebMIDI API** | Conexão com teclados MIDI |
| **Stripe** | Pagamentos e assinaturas |

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/stripe/
│   │   ├── checkout/route.ts    # Criar sessão de checkout
│   │   ├── portal/route.ts      # Portal do cliente
│   │   └── webhook/route.ts     # Webhooks do Stripe
│   ├── dashboard/
│   │   ├── page.tsx             # Dashboard principal
│   │   ├── songs/page.tsx       # Seleção de músicas
│   │   ├── practice/page.tsx    # Prática livre
│   │   └── play/[songId]/page.tsx # Motor do jogo
│   ├── layout.tsx               # Layout raiz
│   ├── globals.css              # Estilos globais
│   └── page.tsx                 # Landing page
├── components/
│   ├── HeroAnimation.tsx        # Animação do hero
│   ├── Navbar.tsx               # Barra de navegação
│   ├── Piano.tsx                # Piano visual SVG
│   ├── PricingCard.tsx          # Card de preço
│   └── WaterfallGame.tsx        # Motor do jogo waterfall
├── hooks/
│   └── useMIDI.ts               # Hook WebMIDI
└── lib/
    ├── songs.ts                 # Dados das músicas
    └── stripe.ts                # Cliente Stripe
```

---

## ⚙️ Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (crie os produtos no dashboard do Stripe)
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
```

> **Como obter as chaves do Stripe:**
> 1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
> 2. Vá em **Developers > API keys** para obter as chaves
> 3. Crie produtos em **Products** e copie os Price IDs
> 4. Para webhook secret, veja a seção Webhooks abaixo

### 3. Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 🎹 Conectar Teclado MIDI

1. Conecte o teclado MIDI via **USB** ao computador
2. Abra o PianoKids no **Chrome** ou **Edge** (necessário para WebMIDI)
3. Clique em **"Conectar Teclado"** e permita o acesso
4. As notas aparecerão em tempo real no piano visual

> **Nota:** WebMIDI não é suportado no Firefox ou Safari. Use Chrome ou Edge.

---

## 💳 Stripe Webhooks (Local)

Para testar webhooks localmente, use o [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Encaminhar webhooks para localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copie o webhook signing secret (whsec_...) para .env.local
```

---

## 🎨 Design

- **Fundo:** Preto absoluto `#000`
- **Fonte:** Geist (sans + mono)
- **Acerto:** Cyan `#00EAFF`
- **Erro:** Magenta `#FF00E5`
- **Componentes:** Glassmorphism com blur + bordas translúcidas
- **Animações:** Framer Motion em todas as transições

---

## 📜 Licença

Projeto privado. Todos os direitos reservados.
