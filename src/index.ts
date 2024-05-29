import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
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
import { PubSub } from "graphql-subscriptions";

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

app.use(
  "/graphql",
  initialiseSession,
  async function (req: Request, res: Response, next: NextFunction) {
    const pubsub = new PubSub();
    const handler = createHandler({
      schema: executableSchema,
      context: { req, pubsub },
    });
    handler(req, res, next);
  }
);

const server = app
  .listen(PORT, () => {
    const wsServer = new WebSocketServer({
      server,
      // path: "/graphql",
    });
    console.log("Server running at PORT:", wsServer);
    useServer({ schema: executableSchema }, wsServer);
  })
  .on("error", (error) => {
    throw new Error(error.message);
  });
