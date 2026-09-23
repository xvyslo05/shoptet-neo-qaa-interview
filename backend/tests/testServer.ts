import type { AddressInfo } from "node:net";

import type { Express } from "express";

export interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
}

export function startTestServer(app: Express): Promise<TestServer> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address() as AddressInfo;

      resolve({
        baseUrl: `http://localhost:${port}`,
        close: () =>
          new Promise((resolveClose, rejectClose) => {
            server.close((error) =>
              error ? rejectClose(error) : resolveClose(),
            );
          }),
      });
    });
  });
}
