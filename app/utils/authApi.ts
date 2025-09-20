// utils/authApi.ts
export async function apiPost(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch (e) {
    // not json
  }

  if (!res.ok) {
    // throw a helpful object
    throw {
      status: res.status,
      body: json ?? { message: "Request failed" },
    };
  }
  return json;
}