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
import send from "koa-send";
import path from "path";
import serve from "koa-static";

const app = new Koa();
const router = new Router();

const port = process.env.PORT || 4000;

app.keys = [process.env.COOKIE_SECRET as string];

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
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

app.use(async (ctx, next) => {
  if (ctx.method === "OPTIONS") {
    ctx.status = 204;
  } else {
    await next();
  }
});

router.get("/server", (ctx) => {
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
  koaPlayground({
    endpoint: "/graphql",
    subscriptionEndpoint: "/graphql",
  })
);

router.all("/graphql", async (ctx, next) => {
  const handler = createHandler({
    schema: executableSchema,
    context: { req: ctx.req, session: ctx.session },
  });
  return handler(ctx, next);
});

app.use(router.routes()).use(router.allowedMethods());

const staticPath = path.join(__dirname, "..", "dist");
app.use(serve(staticPath));
app.use(async (ctx) => {
  if (
    ctx.method === "GET" &&
    ctx.status === 404 &&
    !ctx.path.startsWith("/graphql")
  ) {
    await send(ctx, "index.html", { root: staticPath });
  }
});

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
