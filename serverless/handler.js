// Bridges Lambda / API Gateway events to the Next.js request handler.
// Used by `serverless offline` (npm run sls:offline) and by a real AWS
// deployment if you ever push this with `serverless deploy`.
//
// Local dev still goes through `npm run dev` (Next.js dev server on :3000).
// This file is the parity path so the same code can run on Lambda.

const path = require("path");
const serverless = require("serverless-http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, dir: path.join(__dirname, "..") });
const nextHandler = app.getRequestHandler();

let ready;
function prepare() {
  if (!ready) ready = app.prepare();
  return ready;
}

const wrapped = serverless(async (req, res) => {
  await prepare();
  return nextHandler(req, res);
});

exports.handler = wrapped;
