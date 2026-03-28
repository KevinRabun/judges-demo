// ─── Minimal type stubs (no AWS SDK dependency) ─────────────────────────────

interface S3Object {
  Key?: string;
  Size?: number;
}

interface ListObjectsResponse {
  Contents?: S3Object[];
  IsTruncated?: boolean;
  NextContinuationToken?: string;
}

interface S3Client {
  listObjectsV2(params: {
    Bucket: string;
    ContinuationToken?: string;
  }): { promise(): Promise<ListObjectsResponse> };
  getObject(params: {
    Bucket: string;
    Key: string;
  }): { promise(): Promise<{ Body?: Buffer }> };
}

declare const s3: S3Client;

interface LambdaEvent {
  bucket: string;
}

// ─── S3 batch processor — lists and processes all objects in a bucket ─────────
//
// Added in v2.1: nightly batch job to process uploaded files.
// Handles pagination via ContinuationToken.
// Status: Ready for merge
//
// In production, a bucket may contain millions of objects. This function:
// - Has no pagination limit — lists EVERYTHING
// - Processes objects one-at-a-time — O(n) API calls with network latency
// - Has no timeout or early exit condition
// - Has no error handling or retry logic
// - Has no concurrency control
// - Runs until Lambda times out (15 min) and restarts, burning money

export async function handler(event: LambdaEvent): Promise<{ statusCode: number; body: string }> {
  const allObjects: S3Object[] = [];
  let continuationToken: string | undefined;

  // ⚠️ Unbounded loop — no max iterations, no timeout check
  do {
    const response = await s3
      .listObjectsV2({
        Bucket: event.bucket,
        ContinuationToken: continuationToken,
      })
      .promise();

    if (response.Contents) {
      allObjects.push(...response.Contents);
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  // ⚠️ Sequential processing — one API call at a time
  const results: string[] = [];
  for (const obj of allObjects) {
    if (!obj.Key) continue;

    // ⚠️ No error handling — one failure kills the entire batch
    const data = await s3
      .getObject({ Bucket: event.bucket, Key: obj.Key })
      .promise();

    results.push(`Processed ${obj.Key}: ${data.Body?.length ?? 0} bytes`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: results.length }),
  };
}
