import { ActionsJson } from "./types";
import { ACTIONS_CORS_HEADERS } from "./const";

// Handle GET requests to provide action metadata
export const GET = async () => {
  const payload: ActionsJson = {
    rules: [
      {
        pathPattern: "/pay/*",
        apiPath: "/api/actions/pay/*",
      },
      {
        pathPattern: "/charity",
        apiPath: "/api/actions/charity",
      },
      {
        pathPattern: "/create",
        apiPath: "/api/actions/create",
      },
      {
        pathPattern: "/mint",
        apiPath: "/api/actions/mint",
      },
      {
        pathPattern: "/transfer-spl",
        apiPath: "/api/actions/transfer-spl",
      },
      {
        pathPattern: "/donate",
        apiPath: "/api/actions/donate",
      },
      {
        pathPattern: "/stake",
        apiPath: "/api/actions/stake",
      },
      {
        pathPattern: "/vote",
        apiPath: "/api/actions/vote",
      },
      {
        pathPattern: "/wallet",
        apiPath: "/api/actions/wallet",
      },
      {
        pathPattern: "/memo",
        apiPath: "/api/actions/memo",
      },
    ],
  };

  return new Response(JSON.stringify(payload), {
    headers: ACTIONS_CORS_HEADERS,
  });
};

// Handle OPTIONS requests to support CORS
export const OPTIONS = GET;
