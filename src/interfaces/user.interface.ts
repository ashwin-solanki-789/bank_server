export interface RegisterInput {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  tax_id: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
