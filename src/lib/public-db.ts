import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const PUBLIC_DATA_TAG = "public-data";

// Compatible with this project's caching model: cacheComponents is disabled.
// Only public readers import this client; sessions and backoffice stay uncached.
const reads = new Set(["findMany", "findUnique", "findFirst", "count", "groupBy", "aggregate"]);

export const publicDb = db.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!reads.has(operation)) {
          throw new Error("Public database client only supports read operations.");
        }
        const getResult = unstable_cache(
          async () => JSON.stringify(await query(args), function (key, value) {
            // Preserve Date values, including on cache hits.
            const original = this[key];
            return original instanceof Date ? { __publicDate: original.toISOString() } : value;
          }),
          ["public-query-v1", model, operation, JSON.stringify(args)],
          { revalidate: 60, tags: [PUBLIC_DATA_TAG] },
        );
        return JSON.parse(await getResult(), (_key, value) =>
          value && typeof value === "object" && "__publicDate" in value
            ? new Date(value.__publicDate)
            : value,
        );
      },
    },
  },
});
