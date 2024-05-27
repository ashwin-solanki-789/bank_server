import jwt, { JwtPayload } from "jsonwebtoken";

interface jwtDateObj extends UserObj {
  iat: number;
  exp: number;
}

export function generateToken(email: string, id: string): string {
  const token = jwt.sign(
    {
      id,
      email,
    },
    process.env.JWT_SECRET_TOKEN as string,
    { expiresIn: "1h" }
  );

  return token;
}

export function decodeToken(token: string): UserObj {
  const user = jwt.verify(
    token,
    process.env.JWT_SECRET_TOKEN as string
  ) as JwtPayload & jwtDateObj;

  if (Date.now() >= user.iat * 1000 && Date.now() <= user.exp * 1000) {
    return user;
  }
  throw new Error("Unauthorise User!");
}
