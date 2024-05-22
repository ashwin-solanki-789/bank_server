import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { createHandler } from "graphql-http/lib/use/express";
import { schema } from "./schema";
import { resolvers } from "./resolver";
import { makeExecutableSchema } from "@graphql-tools/schema";

const { ruruHTML } = require("ruru/server");

dotenv.config();

const app = express();

const PORT = process.env.PORT;

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});

app.get("/", function (req: Request, res: Response) {
  // res.writeHead(200, { "Content-Type": "text/html" });
  return res.end(ruruHTML({ endpoint: "/graphql" }));
});

app.all("/graphql", createHandler({ schema: executableSchema }));

app
  .listen(PORT, () => {
    console.log("Server running at PORT: ", PORT);
  })
  .on("error", (error) => {
    // gracefully handle error
    throw new Error(error.message);
  });
