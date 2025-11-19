# Image Upload Workflow Documentation

## Overview
This document describes the complete image upload workflow for Products and Companies, including presigned URL generation and file persistence.

## Architecture

### Components
1. **Image Upload Service** - Manages presigned URL generation
2. **Product Service** - Handles product creation with image metadata
3. **Company Service** - Handles company creation with image metadata
4. **S3/R2 Storage** - Cloud storage with presigned URL support

### Key Fix (November 2025)
- **Checksum Issue Resolved**: Added `ChecksumAlgorithm: 'NONE'` to prevent x-amz-checksum-crc32 mismatches on browser uploads
- **Root Cause**: AWS SDK was automatically calculating checksums for empty payloads, but actual files had different checksums

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND APPLICATION                      │
└─────────────────────────────────────────────────────────────────┘
         │
         ├─ STEP 1: User selects file(s)
         │
         ├─ STEP 2: Extract file metadata
         │  ├─ filename: "product.jpg"
         │  ├─ contentType: "image/jpeg"
         │  └─ size: 512000 bytes
         │
         ├─ STEP 3: POST /images/presign
         │  ├─ Request Type: 'product' | 'company'
         │  └─ Request Files: ImageMetaDto[]
         │
         │  ▼
┌──────────────────────────────────────┐
│  IMAGE UPLOAD SERVICE                │
│  ├─ Validate file counts & sizes    │
│  ├─ Generate presigned URLs         │
│  │  └─ ChecksumAlgorithm: 'NONE'   │
│  └─ Return URLs + public paths      │
└──────────────────────────────────────┘
         │
         ├─ STEP 4: Receive presigned URLs
         │  ├─ presignedUrl: "https://storage...?X-Amz-Signature=..."
         │  └─ publicUrl: "https://cdn.example.com/product/uuid_file.jpg"
         │
         ├─ STEP 5: PUT file to presignedUrl
         │  ├─ Method: PUT
         │  ├─ URL: presignedUrl
         │  ├─ Body: File content
         │  └─ Headers: { "Content-Type": contentType }
         │
         │  ▼
┌──────────────────────────────────────┐
│  S3/R2 STORAGE                       │
│  ├─ Validate signature               │
│  ├─ Store file                       │
│  └─ Return 200 OK                    │
└──────────────────────────────────────┘
         │
         ├─ STEP 6: Create product/company with imagesMeta
         │  (or imageMeta for company)
         │
         │  ▼
┌──────────────────────────────────────┐
│  PRODUCT/COMPANY SERVICE             │
│  ├─ Extract imagesMeta               │
│  ├─ Call Image Upload Service        │
│  │  └─ Get presigned URLs again      │
│  ├─ Extract publicUrl from response  │
│  ├─ Persist product/company with URL │
│  │  └─ Save to MongoDB               │
│  └─ Return created entity            │
└──────────────────────────────────────┘
         │
         ├─ STEP 7: Persist complete
         │
         ▼
┌──────────────────────────────────────┐
│  DATABASE                            │
│  ├─ Product { images: [publicUrl] }  │
│  └─ Company { image: publicUrl }     │
└──────────────────────────────────────┘
```

---

## Detailed Endpoint Flows

### 1. Product Image Upload

#### Step 1: Request Presigned URLs
```bash
POST /images/presign
Content-Type: application/json
Authorization: Bearer {token}

{
  "type": "product",
  "files": [
    {
      "filename": "cement-bag-large.jpg",
      "contentType": "image/jpeg",
      "size": 1048576
    },
    {
      "filename": "cement-bag-detail.jpg",
      "contentType": "image/jpeg",
      "size": 512000
    }
  ]
}
```

**Limits:**
- Max 5 images per request
- Max 10 MB per image
- Total max 50 MB per request

**Response:**
```json
{
  "items": [
    {
      "filename": "cement-bag-large.jpg",
      "contentType": "image/jpeg",
      "presignedUrl": "https://storage.example.com/product/uuid1_cement-bag-large.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=...&X-Amz-Date=20251119T113019Z&X-Amz-Expires=300&X-Amz-Signature=...&X-Amz-SignedHeaders=host&x-id=PutObject",
      "publicUrl": "https://cdn.example.com/product/uuid1_cement-bag-large.jpg"
    },
    {
      "filename": "cement-bag-detail.jpg",
      "contentType": "image/jpeg",
      "presignedUrl": "https://storage.example.com/product/uuid2_cement-bag-detail.jpg?X-Amz-Algorithm=...",
      "publicUrl": "https://cdn.example.com/product/uuid2_cement-bag-detail.jpg"
    }
  ]
}
```

#### Step 2: Upload Files
```bash
# For each presignedUrl:
PUT {presignedUrl}
Content-Type: image/jpeg

[binary file content]
```

**Important Notes:**
- ✅ No custom headers needed beyond Content-Type
- ✅ No authorization header needed (URL is pre-signed)
- ✅ ChecksumAlgorithm is NONE (no x-amz-checksum-crc32 issues)
- ⏱️ URL valid for 5 minutes only
- Status: 200 OK on success

#### Step 3: Create Product with Images
```bash
POST /products
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Premium Cement Type 2",
  "slug": "premium-cement-type-2",
  "sku": "CEM-PREM-T2-001",
  "basePrice": 2500000,
  "discount": 5,
  "stock": {
    "quantity": 1000
  },
  "imagesMeta": [
    {
      "filename": "cement-bag-large.jpg",
      "contentType": "image/jpeg",
      "size": 1048576
    },
    {
      "filename": "cement-bag-detail.jpg",
      "contentType": "image/jpeg",
      "size": 512000
    }
  ]
}
```

**What Service Does:**
1. Validates all required fields
2. Detects `imagesMeta` in request
3. Calls `/images/presign` internally with type='product'
4. Extracts `publicUrl` from presign response
5. Saves product with `images: [{ url: publicUrl }, ...]` 

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439013",
  "name": "Premium Cement Type 2",
  "images": [
    { "url": "https://cdn.example.com/product/uuid1_cement-bag-large.jpg" },
    { "url": "https://cdn.example.com/product/uuid2_cement-bag-detail.jpg" }
  ],
  "...": "other fields"
}
```

---

### 2. Company Image Upload

#### Step 1: Request Presigned URL (Single Image)
```bash
POST /images/presign
Content-Type: application/json
Authorization: Bearer {token}

{
  "type": "company",
  "files": [
    {
      "filename": "company-logo.png",
      "contentType": "image/png",
      "size": 256000
    }
  ]
}
```

**Limits:**
- Max 1 image per company
- Max 10 MB per image

**Response:**
```json
{
  "items": [
    {
      "filename": "company-logo.png",
      "contentType": "image/png",
      "presignedUrl": "https://storage.example.com/company/uuid_company-logo.png?X-Amz-Algorithm=...",
      "publicUrl": "https://cdn.example.com/company/uuid_company-logo.png"
    }
  ]
}
```

#### Step 2: Upload File
```bash
PUT {presignedUrl}
Content-Type: image/png

[binary file content]
```

#### Step 3: Create Company with Image
```bash
POST /companies
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Tech Innovations Inc.",
  "email": "info@techinnovations.com",
  "registrationNumber": "1234567890",
  "phone": "+982123456789",
  "address": "Tehran, Iran",
  "imageMeta": {
    "filename": "company-logo.png",
    "contentType": "image/png",
    "size": 256000
  }
}
```

**What Service Does:**
1. Validates all required fields
2. Detects `imageMeta` in request
3. Calls `/images/presign` internally with type='company'
4. Extracts `publicUrl` from presign response
5. Saves company with `image: publicUrl`

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "name": "Tech Innovations Inc.",
  "image": "https://cdn.example.com/company/uuid_company-logo.png",
  "...": "other fields"
}
```

---

## Error Handling

### Presign Endpoint Errors

| Error | Status | Description | Solution |
|-------|--------|-------------|----------|
| Invalid file size | 400 | File exceeds 10 MB | Compress file or split |
| Too many files | 400 | Product: >5, Company: >1 | Reduce file count |
| Invalid content type | 400 | Not a valid image type | Use jpg/png/webp/gif |
| Missing R2 config | 500 | R2 credentials not set | Check env vars |
| Presign generation failed | 500 | S3 API error | Check cloud storage status |

### Product/Company Creation Errors

| Scenario | Response | Fix |
|----------|----------|-----|
| imagesMeta provided but file not uploaded | 400/500 | Upload file to presignedUrl first |
| presigned URL expired (>5 min) | 403 | Request new presign URL |
| checksum mismatch (old code) | 403 | ✅ Fixed - use new code with NONE checksum |
| incorrect Content-Type header | 403 | Match contentType in presign request |

---

## Frontend Integration Example (TypeScript)

```typescript
// Step 1: Select files and get presigned URLs
async function getPresignedUrls(files: File[]): Promise<PresignItem[]> {
  const imageMeta = files.map(file => ({
    filename: file.name,
    contentType: file.type || 'image/jpeg',
    size: file.size,
  }));

  const response = await fetch('/api/images/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'product', // or 'company'
      files: imageMeta,
    }),
  });

  if (!response.ok) throw new Error('Failed to get presigned URLs');
  return response.json().then(r => r.items);
}

// Step 2: Upload files to presigned URLs
async function uploadFilesToPresignedUrls(
  files: File[],
  presignItems: PresignItem[]
): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const item = presignItems[i];

    const uploadResponse = await fetch(item.presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': item.contentType || file.type || 'image/jpeg',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed for ${file.name}`);
    }
  }
}

// Step 3: Create product with presigned image metadata
async function createProductWithImages(
  productData: any,
  files: File[]
): Promise<any> {
  // Get presigned URLs
  const presignItems = await getPresignedUrls(files);

  // Upload files
  await uploadFilesToPresignedUrls(files, presignItems);

  // Create product with image metadata
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...productData,
      imagesMeta: presignItems.map((item, idx) => ({
        filename: files[idx].name,
        contentType: files[idx].type || 'image/jpeg',
        size: files[idx].size,
      })),
    }),
  });

  if (!response.ok) throw new Error('Failed to create product');
  return response.json();
}
```

---

## Configuration

### Environment Variables

```bash
# Image Upload Limits
MAX_IMAGE_BYTES=10485760              # 10 MB (default)
PRESIGN_EXPIRES_SECONDS=300           # 5 minutes (default)
MAX_PRODUCT_IMAGES=5                  # (default)
MAX_COMPANY_IMAGES=1                  # (default)

# R2/S3 Configuration
R2_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
R2_ACCESS_KEY=xxxxxxxx
R2_SECRET_KEY=xxxxxxxx
R2_BUCKET=my-bucket
R2_PUBLIC_BASE_URL=https://cdn.example.com
```

### Constants (Defaults)

Location: `src/features/image-upload/constants/image-upload.constants.ts`

```typescript
export const DEFAULTS = {
  PRESIGN_EXPIRES_SECONDS: 300,        // 5 minutes
  MAX_IMAGE_BYTES: 10 * 1024 * 1024,   // 10 MB
  MAX_PRODUCT_IMAGES: 5,
  MAX_COMPANY_IMAGES: 1,
};
```

---

## Key Technical Details

### Checksum Algorithm (CRITICAL FIX)

**Problem (Before Fix):**
- AWS SDK automatically adds `x-amz-checksum-crc32=AAAAAA==` (checksum for empty payload)
- Browser uploads actual file with different checksum
- S3/Parspack validates and rejects with mismatch error

**Solution (Applied):**
```typescript
const command = new PutObjectCommand({
  Bucket: this.bucket,
  Key: key,
  ContentType: contentType,
  ChecksumAlgorithm: 'NONE' as any,  // Disable automatic checksum
});
```

**Result:**
- ✅ No `x-amz-checksum-*` parameters in presigned URL
- ✅ Browser can upload without checksum validation errors
- ✅ Files upload successfully

### Storage Path Format

```
{type}/{uuid}_{sanitized_filename}

Examples:
- product/550e8400-e29b-41d4-a716-446655440000_cement-bag.jpg
- company/f47ac10b-58cc-4372-a567-0e02b2c3d479_company-logo.png
```

### Public URL Construction

```
{publicBaseUrl}/{storage_path}

Example:
https://cdn.example.com/product/550e8400-e29b-41d4-a716-446655440000_cement-bag.jpg
```

---

## Testing Checklist

- [ ] Presign endpoint returns valid URLs
- [ ] presignedUrl allows PUT with file
- [ ] publicUrl is accessible after upload
- [ ] Multiple product images work (up to 5)
- [ ] Company single image works
- [ ] File size validation works (>10MB rejected)
- [ ] File count validation works (product >5 rejected)
- [ ] Expired presigned URLs (>5min) are rejected by S3
- [ ] Product/company created with correct image URLs
- [ ] Images persist in database correctly
- [ ] No checksum mismatch errors
- [ ] Swagger documentation is accurate

---

## References

- AWS S3 Presigned URLs: https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
- AWS SDK ChecksumAlgorithm: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/putobjectcommandoutput.html
- Cloudflare R2: https://developers.cloudflare.com/r2/
