import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize R2 client
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET() {
  const results: { supabase?: string; r2?: string; error?: string } = {};

  try {
    // 1. Test Supabase Connection (Query database tables or public schema)
    const { data, error: sbError } = await supabase
      .from("products") // Change to any table you have in your DB, or use a system query if empty
      .select("*")
      .limit(1);

    if (sbError) {
      results.supabase = `Connected, but table query returned an error (normal if table doesn't exist yet): ${sbError.message}`;
    } else {
      results.supabase = "SUCCESS! Connected to Supabase database.";
    }

    // 2. Test Cloudflare R2 Connection (Upload a tiny dummy text file)
    const testFileName = "test-connection.txt";
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        Key: testFileName,
        Body: "Hello from Untamed R2 setup!",
        ContentType: "text/plain",
      })
    );
    results.r2 = `SUCCESS! File uploaded to R2 bucket '${process.env.CLOUDFLARE_R2_BUCKET_NAME}'.`;

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    results.error = errorMessage;
  }

  return NextResponse.json(results);
}