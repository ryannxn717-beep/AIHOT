import { AsyncLocalStorage } from "node:async_hooks";

type ApiFetch = (input: string | Request, init?: RequestInit) => Promise<Response>;
const requests = new AsyncLocalStorage<ApiFetch>();

/** A service-binding HTTP client for this SSR request; ordinary Node uses its native fetch. */
export function withApiFetch<T>(fetcher: ApiFetch, run: () => T): T {
  return requests.run(fetcher, run);
}

export function fetchApi(input: string | Request, init?: RequestInit): Promise<Response> {
  return (requests.getStore() ?? fetch)(input, init);
}
