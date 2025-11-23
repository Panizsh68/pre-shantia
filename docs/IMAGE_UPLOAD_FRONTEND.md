# Image Upload — Frontend Examples, CORS and E2E

This document contains recommended frontend snippets for using the API, known gotchas, suggested storage CORS configs, and end-to-end verification steps.

## 1. Frontend flow: presign -> PUT

1. Request presigned URLs from backend:

```bash
curl -X POST http://localhost:3000/images/presign \
  -H "Content-Type: application/json" \
  -d '{"type":"product","files":[{"filename":"product.jpg","contentType":"image/jpeg","size":512000}]}'
```

Response: `{ items: [{ filename, contentType, presignedUrl|null, publicUrl }] }`.

2. Upload file from browser using `fetch` (preferred) or `XMLHttpRequest`.

Example (browser JS using fetch):

```js
async function uploadToPresign(presignedUrl, file, contentType) {
  // Use the same Content-Type the server used when creating presign
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });
  if (!res.ok) throw new Error('Upload failed: ' + res.statusText);
  return res;
}

// usage
const presignedUrl = '...'; // from backend
const fileInput = document.querySelector('input[type=file]');
const file = fileInput.files[0];
await uploadToPresign(presignedUrl, file, file.type);
```

Notes:
- Storage providers may require the `Content-Type` header exactly as used when requesting the presign. Use the same `contentType` value.
- If the browser shows `Failed to fetch` but `curl` works, it's most likely a CORS problem on the storage side. See CORS section below.

### curl (non-browser) test for presigned PUT

```bash
curl -v -X PUT "<PRESIGNED_URL>" \
  -H "Content-Type: image/jpeg" \
  --data-binary @/path/to/product.jpg
```

If this succeeds while the browser fails, adjust storage CORS.

## 2. Fallback: server-side multipart upload

If the browser cannot upload due to CORS or other restrictions, POST the file to the API which will forward to storage:

```bash
curl -v -X POST http://localhost:3000/images/upload \
  -F "type=product" \
  -F "files=@/path/to/product.jpg"
```

Response: `{ items: [{ filename, contentType, publicUrl, presignedUrl: null }] }`.

## 3. Recommended storage CORS examples

### AWS S3 example (XML)

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://your-frontend.example.com</AllowedOrigin>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <MaxAgeSeconds>3000</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>
```

### Cloudflare R2 / Parspack (JSON example)

Some S3-compatible providers accept a JSON style config via API. A typical policy:

```json
[
  {
    "AllowedOrigins": ["https://your-frontend.example.com"],
    "AllowedMethods": ["GET","HEAD","PUT","POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Notes:
- Ensure `PUT` and `POST` are allowed.
- Allow `Content-Type` header or use `AllowedHeaders: ["*"]`.
- If using multiple origins in development, explicitly list them or use `*` (not recommended for production).

## 4. Content-Type and request headers guidance

- When you request a presigned URL you provide a `contentType` used to sign the URL. When performing the `PUT`, include the same `Content-Type` header in the request.
- Avoid adding custom headers not allowed by storage CORS. If you must send custom headers, include them in the storage CORS `AllowedHeaders`.

## 5. E2E verification checklist

1. Start the app: `pnpm start` (or your normal startup command).
2. Call `/images/presign` and verify response contains `items[0].presignedUrl` and `items[0].publicUrl`.
3. Run the curl PUT test to the presigned URL. If it returns 200/201, storage accepted the upload.
4. If curl succeeded but browser fails: apply the storage CORS config above and retry from the browser.
5. If presigned URL is null or you prefer server upload, POST to `/images/upload` and verify returned `publicUrl` works in the browser.

## 6. Troubleshooting

- 403 or signature mismatch: re-check the `contentType` used when generating presign versus the header supplied in PUT.
- `Failed to fetch` in browser only: storage CORS is blocking the browser preflight or request. Confirm `AllowedMethods` includes `PUT` and `AllowedHeaders` includes `Content-Type`.
- Uploaded object missing or checksum mismatch: some S3-compatible providers add checksum query params; the backend strips known checksum params before returning the presigned URL. If you still see checksum problems, send a sample presigned URL and I'll expand the strip list.

---

If you want, I can add a small example client file under `examples/` in the repo implementing the presign + upload flow. Say the word and I'll add it.
