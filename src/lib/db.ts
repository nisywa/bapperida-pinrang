import { PrismaClient, type Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function datasourceOptions(): Pick<Prisma.PrismaClientOptions, 'datasources'> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return {};
  const url = new URL(connectionString);
  if (url.hostname.endsWith('.pooler.supabase.com')) {
    // A pool of one serializes even Promise.all queries across concurrent pages.
    if (!url.searchParams.has('connection_limit') || url.searchParams.get('connection_limit') === '1') {
      url.searchParams.set('connection_limit', '3');
    }
    if (url.port === '6543') url.searchParams.set('pgbouncer', 'true');
  }
  return { datasources: { db: { url: url.toString() } } };
}

// Query logging only in development - production (Vercel) stays silent
// to avoid log overhead on every serverless invocation.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...datasourceOptions(),
    log:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
