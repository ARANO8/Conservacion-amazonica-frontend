export interface BudgetLine {
  id: string;
  code: string;
  name: string;
  category: string;
}

export interface FinancingSource {
  id: string;
  code: string;
  name: string;
}

export interface UserCatalog {
  id: string;
  name: string;
  position: string;
  area: string;
}
