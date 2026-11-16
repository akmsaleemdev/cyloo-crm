/**
 * Server-only helpers for the QR WhatsApp login worker.
 *
 * Kept out of *.functions.ts so those files stay thin server-function
 * wrappers (module scope there must only hold imports + declarations).
 */

export interface QrWorkerPayload {
  worker_session_id?: string;
  qr?: string | null;
  status?: string;
  phone_number?: string;
  display_name?: string;
  device_platform?: string;
  error?: string;
  uptime?: number;
}

export type WorkerResult = {
  ok: boolean;
  status: number;
  data: QrWorkerPayload | null;
  available: boolean;
};

export async function callWorker(path: string, init: RequestInit = {}): Promise<WorkerResult> {
  const base = process.env.WA_QR_WORKER_URL;
  const token = process.env.WA_QR_WORKER_TOKEN;
  if (!base) {
    return { ok: false, status: 0, data: null, available: false };
  }
  try {
    const res = await fetch(new URL(path, base).toString(), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });
    const payload: unknown = await res.json().catch(() => null);
    const data =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as QrWorkerPayload)
        : null;
    return { ok: res.ok, status: res.status, data, available: true };
  } catch {
    return { ok: false, status: 0, data: null, available: true };
  }
}
