# Examples: Presign + PUT (direct) and Multipart (server) uploads

This file contains copy-paste friendly examples to test the server and storage.

## 1) Get presigned URL (JSON request)

```bash
curl -s -X POST http://localhost:3000/images/presign \
  -H "Content-Type: application/json" \
  -d '{"type":"product","files":[{"filename":"product.jpg","contentType":"image/jpeg","size":512000}]}' | jq
```

Response example:

```json
{
  "items": [
    {
      "filename": "product.jpg",
      "contentType": "image/jpeg",
      "presignedUrl": "https://storage.example.com/product/uuid_product.jpg?X-Amz-Algorithm=...",
      "publicUrl": "https://cdn.example.com/product/uuid_product.jpg"
    }
  ]
}
```

## 2) PUT to presigned URL (curl - non-browser)

```bash
PRESIGNED_URL="<replace-with-presignedUrl>"
curl -v -X PUT "$PRESIGNED_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary @/path/to/product.jpg
```

- If this returns HTTP 200/201, the storage accepted the object.
- If this works but your browser fails, it's a CORS issue on storage.

## 3) Server-side multipart upload (fallback)

```bash
curl -v -X POST http://localhost:3000/images/upload \
  -F "type=product" \
  -F "files=@/path/to/product.jpg"
```

Response example:

```json
{
  "items": [
    {
      "filename": "product.jpg",
      "contentType": "image/jpeg",
      "publicUrl": "https://cdn.example.com/product/uuid_product.jpg",
      "presignedUrl": null
    }
  ]
}
```

## 4) Minimal browser code (presign -> PUT)

```js
// Use fetch in the browser
async function presignAndUpload(file) {
  // 1) ask backend for presign
  const meta = { filename: file.name, contentType: file.type, size: file.size };
  const resp = await fetch('/images/presign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'product', files: [meta] }) });
  const body = await resp.json();
  const item = body.items[0];
  if (!item) throw new Error('No presign item returned');
  if (item.presignedUrl) {
    // 2) PUT directly to storage
    const put = await fetch(item.presignedUrl, { method: 'PUT', headers: { 'Content-Type': item.contentType }, body: file });
    if (!put.ok) throw new Error('Upload failed');
    return item.publicUrl;
  } else {
    // Backend performed upload already
    return item.publicUrl;
  }
}
```

## 5) Notes
- Always use the same Content-Type when performing the PUT as the `contentType` used to request the presign.
- Prefer curl for initial tests to rule out browser CORS.
- If you see checksum mismatch errors, send the presigned URL to the backend logs and I'll expand the list of stripped query parameters.
