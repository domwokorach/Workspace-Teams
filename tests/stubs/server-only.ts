// Stub for the "server-only" package under Vitest. Next.js's bundler
// replaces this import with a no-op when compiling for the server; outside
// that build, the real package unconditionally throws, so tests alias it
// here instead (see vitest.config.ts).
export {};
