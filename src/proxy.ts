import { clerkMiddleware } from "@clerk/nextjs/server";

// Bare middleware: it only makes auth state available. Each route handler checks auth itself.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files (including the Pyodide worker)
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|wasm|whl)).*)",
    "/(api|trpc)(.*)",
  ],
};
