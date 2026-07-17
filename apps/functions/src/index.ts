import { onRequest } from "firebase-functions/v2/https";

export const health = onRequest((_request, response) => {
  response.json({ service: "smart-home-functions", status: "ok" });
});
