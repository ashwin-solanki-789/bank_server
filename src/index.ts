import { createServer } from "http";
import Koa from "koa";
import Router from "koa-router";
import { makeExecutableSchema } from "@graphql-tools/schema";
import bodyParser from "koa-bodyparser";
import koaPlayground from "graphql-playground-middleware-koa";
import { createHandler } from "graphql-http/lib/use/koa";
import { schema } from "./schema";
import { resolvers } from "./resolver";
import session from "koa-session";
import cors from "@koa/cors";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";

const app = new Koa();
const router = new Router();

const port = process.env.PORT || 4000;

app.keys = [process.env.COOKIE_SECRET as string];

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});
app.use(cors());
app.use(
  session(
    {
      key: "bank-sid",
      maxAge: 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
      overwrite: true,
    },
    app
  )
);

router.get("/", (ctx) => {
  ctx.status = 200;
  ctx.body = `
    <h1>Welcome to the GraphQL Server</h1>
    <p>Playground: <a href="/playground">/playground</a></p>
    <p>GraphQL Endpoint: <a href="/graphql">/graphql</a></p>
    `;
});

router.get("/status", (ctx) => {
  ctx.status = 200;
  ctx.body = "running";
});

router.all(
  "/playground",
  koaPlayground({ endpoint: "/graphql", subscriptionEndpoint: "/graphql" })
);

router.all("/graphql", async (ctx, next) => {
  const handler = createHandler({
    schema: executableSchema,
    context: { req: ctx.req, session: ctx.session },
  });
  return handler(ctx, next);
});

app.use(router.routes()).use(router.allowedMethods());

(async () => {
  const server = createServer(app.callback());
  new SubscriptionServer(
    {
      execute,
      subscribe,
      schema: executableSchema,
    },
    {
      server,
      path: "/graphql",
    }
  );

  server.listen(port, () => {
    console.log(`🚀 Server is running on port http://localhost:${port}/`);
  });
})();
