export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKEND_BASE = "http://localhost:8081/api/v1";

const FORWARDED_HEADERS = ["cookie", "content-type", "accept", "authorization"];

async function proxyRequest(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  const backendPath = path.join("/");
  const searchParams = new URL(request.url).searchParams.toString();
  const backendUrl = `${BACKEND_BASE}/${backendPath}${searchParams ? `?${searchParams}` : ""}`;

  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const backendResponse = await fetch(backendUrl, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: "manual",
    cache: "no-store",
    // @ts-expect-error -- Node fetch supports duplex for streaming request bodies
    duplex: hasBody ? "half" : undefined,
  });

  const contentType = backendResponse.headers.get("content-type") ?? "";

  // SSE: pass through the streaming body directly
  if (contentType.includes("text/event-stream")) {
    const responseHeaders = new Headers();
    responseHeaders.set("content-type", "text/event-stream");
    responseHeaders.set("cache-control", "no-cache");
    responseHeaders.set("connection", "keep-alive");

    // Copy Set-Cookie headers for SSE responses too
    for (const cookie of backendResponse.headers.getSetCookie()) {
      responseHeaders.append("set-cookie", cookie);
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  }

  // Non-SSE: read body and build response with Set-Cookie headers preserved
  const responseHeaders = new Headers();
  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  // Explicitly copy each Set-Cookie header from the backend response
  for (const cookie of backendResponse.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }

  // 204 No Content — must not include a body
  if (backendResponse.status === 204) {
    return new Response(null, {
      status: 204,
      headers: responseHeaders,
    });
  }

  const body = await backendResponse.arrayBuffer();

  return new Response(body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
