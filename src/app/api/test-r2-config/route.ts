import { NextRequest, NextResponse } from "next/server";
import { AwsClient } from "aws4fetch";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get environment variables
    const env = process.env as Record<string, string | undefined>;
    
    // Check if all required R2 environment variables are present
    const requiredEnvVars = ['R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_URL'];
    const missingVars = requiredEnvVars.filter(varName => !env[varName]);
    
    if (missingVars.length > 0) {
      return NextResponse.json({ 
        error: "Missing R2 configuration",
        missingVariables: missingVars,
        availableVars: Object.keys(env).filter(key => key.startsWith('R2_'))
      }, { status: 500 });
    }

    // Create AWS client for R2
    const r2Client = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      region: "auto",
      service: "s3",
    });

    // Generate a test presigned URL
    const bucketName = env.R2_BUCKET!.replace('.r2.cloudflarestorage.com', '');
    const testKey = `test/test-file-${Date.now()}.txt`;
    
    try {
      const presignedUrl = await r2Client.sign(
        `https://${bucketName}.r2.cloudflarestorage.com/${testKey}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "text/plain",
          },
          aws: { signQuery: true },
        }
      );

      return NextResponse.json({
        success: true,
        message: "R2 configuration appears to be correct",
        config: {
          bucketName,
          region: "auto",
          publicUrl: env.R2_PUBLIC_URL,
        },
        testPresignedUrl: presignedUrl.url,
        note: "This is a test URL - do not use for actual uploads"
      });
    } catch (signError) {
      return NextResponse.json({ 
        error: "Failed to generate presigned URL",
        details: signError instanceof Error ? signError.message : "Unknown error",
        config: {
          bucketName,
          hasAccessKey: !!env.R2_ACCESS_KEY_ID,
          hasSecretKey: !!env.R2_SECRET_ACCESS_KEY,
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error testing R2 config:", error);
    return NextResponse.json(
      { 
        error: "Failed to test R2 configuration",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
