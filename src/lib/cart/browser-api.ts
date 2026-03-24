export async function readJsonResponse<TPayload>(response: Response) {
  return (await response.json().catch(() => null)) as TPayload | null;
}

export async function postJson<TPayload>(
  url: string,
  body: Record<string, unknown>,
): Promise<{
  response: Response;
  payload: TPayload | null;
}> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return {
    response,
    payload: await readJsonResponse<TPayload>(response),
  };
}
