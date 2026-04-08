"use client";

import { useState, useEffect, useCallback } from "react";

export type PlanType = "free" | "monthly" | "yearly" | "special_access" | "admin_granted" | "trial" | "past_due";

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  pdf_url: string | null;
}

export interface SubscriptionData {
  status: string;
  planType: PlanType;
  hasAccess: boolean;
  customerId: string | null;
  interval: string | null;
  currentPeriodStart?: string;
  currentPeriodEnd: string | null;
  subscriptionStart?: string;
  cancelAtPeriodEnd?: boolean;
  amount?: number;
  currency?: string;
  invoices?: Invoice[];
  isPro: boolean;
  loading: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData>({
    status: "inactive",
    planType: "free",
    hasAccess: false,
    customerId: null,
    interval: null,
    currentPeriodEnd: null,
    isPro: false,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    try {
      setSubscription(prev => ({ ...prev, loading: true }));
      const res = await fetch("/api/auth/stripe-check");
      if (!res.ok) throw new Error("Falha ao verificar assinatura");
      
      const data = await res.json();
      setSubscription({
        ...data,
        loading: false,
      });
    } catch (err) {
      console.error("Error checking subscription:", err);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return {
    ...subscription,
    refresh: checkSubscription,
  };
}
