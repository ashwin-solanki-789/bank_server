import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { createHandler } from "graphql-http/lib/use/express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import cors from "cors";
import session, { SessionOptions } from "express-session";
import helmet from "helmet";
import { schema } from "./schema";
import { resolvers } from "./resolver";
import expressPlayground from "graphql-playground-middleware-express";
import { decodeToken } from "./utils/token";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

declare module "express-session" {
  interface SessionData {
    user: UserObj | null;
  }
}

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(express.json());

const sessionOption: SessionOptions = {
  secret: process.env.COOKIE_SECRET as string,
  name: "sid",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 60 * 60 * 1000,
    sameSite: process.env.ENVIRONMENT === "production" ? "none" : "lax",
  },
};
app.use(session(sessionOption));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});

app.get("/", function (_: Request, res: Response) {
  res.send(`
    <h1>Welcome to the GraphQL Server</h1>
    <p>Playground: <a href="/playground">/playground</a></p>
    <p>GraphQL Endpoint: <a href="/graphql">/graphql</a></p>
  `);
});

app.get("/playground", expressPlayground({ endpoint: "/graphql" }));

function initialiseSession(req: Request, _res: Response, next: NextFunction) {
  if (!req.session.user) {
    req.session.user = null;
  }
  next();
}

app.all(
  "/graphql",
  initialiseSession,
  async function (req: Request, res: Response, next: NextFunction) {
    const handler = createHandler({
      schema: executableSchema,
      context: { req: req },
    });
    handler(req, res, next);
  }
);

app
  .listen(PORT, () => {
    console.log("Server running at PORT:", PORT);
  })
  .on("error", (error) => {
    throw new Error(error.message);
  });
