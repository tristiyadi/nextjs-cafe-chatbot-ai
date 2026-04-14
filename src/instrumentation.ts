export async function register() {
  console.log("Registering instrumentation");
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic import dipakai agar tidak bentrok (safe execution)
    const { warmupModels } = await import("./lib/model-warmup");

    // Jalankan secara background agar tidak memblokir laju proses "npm run dev / start"
    warmupModels().catch(console.error);
  }
}
