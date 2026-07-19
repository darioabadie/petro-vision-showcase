import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Plan = "free" | "pro";

type Ctx = {
  plan: Plan;
  setPlan: (p: Plan) => void;
  togglePlan: () => void;
  isPro: boolean;
};

const PlanContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "petrodata.demoPlan";

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<Plan>("free");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "pro" || saved === "free") setPlanState(saved);
    } catch {}
  }, []);

  const setPlan = (p: Plan) => {
    setPlanState(p);
    try {
      window.localStorage.setItem(STORAGE_KEY, p);
    } catch {}
  };

  const togglePlan = () => setPlan(plan === "pro" ? "free" : "pro");

  return (
    <PlanContext.Provider value={{ plan, setPlan, togglePlan, isPro: plan === "pro" }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used inside PlanProvider");
  return ctx;
}
