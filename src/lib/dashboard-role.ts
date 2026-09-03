export type DashboardRole = string | null | undefined;

export function isStudentDashboardRole(role: DashboardRole): boolean {
  return role === "student";
}

export function getDashboardLabel(role: DashboardRole): string {
  if (role === "admin") return "Painel Administrativo";
  if (role === "teacher") return "Painel do Parceiro";
  return "Painel do Aluno";
}

export function shouldShowPlanLink(
  role: DashboardRole,
  isAuthenticated: boolean,
): boolean {
  return !isAuthenticated || isStudentDashboardRole(role);
}

export function getDashboardDescription(
  role: DashboardRole,
  hasMultipleTrophies: boolean,
): string {
  if (role === "admin") {
    return "Acompanhe operação, crescimento, repasses e prontidão do Pianify.";
  }

  if (role === "teacher") {
    return "Acompanhe seus alunos, comissões e solicitações de saque.";
  }

  return hasMultipleTrophies
    ? "Você está indo muito bem! Continue praticando para ganhar mais troféus."
    : "Seu primeiro troféu de boas-vindas já está na sua estante! Vamos tocar?";
}
