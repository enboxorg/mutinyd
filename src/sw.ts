/// <reference lib="webworker" />
//@ts-expect-error - WorkBox disable dev logs
self.__WB_DISABLE_DEV_LOGS = true;
import { activatePolyfills } from "@enbox/browser";

import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare let self: ServiceWorkerGlobalScope;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

precacheAndRoute(self.__WB_MANIFEST);

cleanupOutdatedCaches();

let allowlist: RegExp[] | undefined;
if (import.meta.env.DEV) allowlist = [/^\/$/];

registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), { allowlist })
);

activatePolyfills({
  onCacheCheck() {
    return {
      ttl: 30000,
    };
  },
});
