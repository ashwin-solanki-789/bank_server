import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { RequestContext, createHandler } from "graphql-http/lib/use/express";
import { schema } from "./schema";
import { resolvers } from "./resolver";
import { makeExecutableSchema } from "@graphql-tools/schema";
import cors from "cors";
import session from "express-session";
import helmet from "helmet";

const { ruruHTML } = require("ruru/server");

dotenv.config();

const app = express();

const PORT = process.env.PORT;

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.COOKIE_SECRET as string,
    name: "sid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.ENVIRONMENT === "production",
      httpOnly: true,
      sameSite: process.env.ENVIRONMENT === "production" ? "none" : "lax",
    },
  })
);
// function sessionHandler(req: Request, res: Response, next: NextFunction) {
//   if (!req.session.user) {
//     let user = {};
//     req.session.user = user;
//   }
//   next();
// }
// app.use("/", sessionHandler);

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});

app.get("/", function (req: Request, res: Response) {
  // res.writeHead(200, { "Content-Type": "text/html" });
  req.session.user = { id: "Aa" };
  return res.end(ruruHTML({ endpoint: "/graphql" }));
});

app.all(
  "/graphql",
  createHandler({
    schema: executableSchema,
    context: function (req: any) {
      // req.session.user = {};
      return req;
    },
  })
);

app
  .listen(PORT, () => {
    console.log("Server running at PORT: ", PORT);
  })
  .on("error", (error) => {
    // gracefully handle error
    throw new Error(error.message);
  });
