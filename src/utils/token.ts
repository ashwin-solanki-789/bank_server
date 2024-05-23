import jwt, { JwtPayload } from "jsonwebtoken";

interface jwtDateObj extends UserObj {
  iat: number;
  exp: number;
}

export function generateToken(
  name: string,
  id: string,
  tax_id: string
): string {
  const token = jwt.sign(
    {
      id,
      name,
      tax_id,
    },
    process.env.JWT_SECRET_TOKEN as string,
    { expiresIn: "1h" }
  );

  return token;
}

export function decodeToken(token: string): UserObj | null {
  if (!token) {
    return null;
  }
  const user = jwt.verify(
    token,
    process.env.JWT_SECRET_TOKEN as string
  ) as JwtPayload & jwtDateObj;

  if (Date.now() >= user.iat * 1000 && Date.now() <= user.exp * 1000) {
    return user;
  }
  return null;
}
