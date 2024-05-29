import { Request } from "express";
import { PubSub } from "graphql-subscriptions";

export interface RequestContext {
  req: Request;
  pubsub: PubSub;
}
