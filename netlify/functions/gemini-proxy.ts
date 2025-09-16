import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // This proxy is deprecated. The frontend now calls the Gemini API directly.
  // This function is kept minimal to resolve build errors caused by missing dependencies in the old code.
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Proxy is deprecated and no longer in use." }),
  };
};

export { handler };
