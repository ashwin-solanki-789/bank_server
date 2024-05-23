export interface RegisterInput {
  firstname: string;
  password: string;
  tax_id: string;
}

export interface LoginInput {
  tax_id: string;
  password: string;
}
