export function readAdminJson(response: Response) {
  // Session revocation must not depend on an error body's encoding or completion.
  return response.status === 401 ? Promise.resolve({}) : response.json();
}
export async function adminRequest<T>(
  url: string,
  read: (response: Response) => Promise<T>,
  init: RequestInit = {},
) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Batas waktu permintaan admin tercapai. Coba lagi."));
      controller.abort();
    }, 15_000);
  });
  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
          credentials: "include",
          cache: "no-store",
        });
        return { response, data: await read(response) };
      })(),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
  }
}
