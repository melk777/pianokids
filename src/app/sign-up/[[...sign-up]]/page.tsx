"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden p-6">
      {/* Background Subtle Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-magenta/10 via-transparent to-cyan/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-[440px] flex justify-center">
        <SignUp 
          appearance={{
            baseTheme: dark,
            elements: {
              card: "bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-[24px]",
              headerTitle: "text-2xl font-bold tracking-tight text-white",
              headerSubtitle: "text-white/50",
              socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-[14px] transition-all",
              socialButtonsBlockButtonText: "font-medium",
              dividerLine: "bg-white/10",
              dividerText: "text-white/40",
              formFieldLabel: "text-white/70",
              formFieldInput: "bg-[#111] border-white/10 text-white rounded-[12px] focus:ring-cyan focus:border-cyan transition-all",
              formButtonPrimary: "bg-white hover:bg-white/90 text-black font-semibold rounded-[14px] transition-all active:scale-[0.98]",
              footerActionText: "text-white/50",
              footerActionLink: "text-cyan hover:text-cyan/80",
            },
            variables: {
              colorPrimary: "#00eaff",
              colorText: "#ffffff",
              colorBackground: "transparent",
            }
          }}
        />
      </div>
    </main>
  );
}
