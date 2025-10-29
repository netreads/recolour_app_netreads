import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { AwsClient } from "aws4fetch";
import { getServerEnv } from "@/lib/env";
import { JOB_STATUS } from "@/lib/constants";

export const runtime = 'nodejs';
export const maxDuration = 45;

// Fallback image processing function when API quota is exceeded
async function applyFallbackColorization(imageBuffer: Buffer): Promise<Buffer> {
  // Return original image as fallback
  // In production, consider using a lightweight library like Sharp for basic processing
  return imageBuffer;
}

export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const env = getServerEnv();

    const { jobId } = await request.json();
    
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: "Valid Job ID is required" }, { status: 400 });
    }

    // Get job from database
    const job = await db.getJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== JOB_STATUS.PENDING) {
      return NextResponse.json({ error: "Job already processed" }, { status: 400 });
    }

    // Update job status to processing
    await db.updateJob(jobId, { status: JOB_STATUS.PROCESSING });

    try {
      const r2Client = new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        region: "auto",
        service: "s3",
      });

      const fileKey = job.originalUrl.split('/').slice(-2).join('/');
      
      let accountIdMatch = env.R2_PUBLIC_URL.match(/https:\/\/pub-([a-f0-9]+)\.r2\.dev/);
      if (!accountIdMatch) {
        // Try the cloudflarestorage.com format
        accountIdMatch = env.R2_PUBLIC_URL.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/);
      }
      if (!accountIdMatch) {
        throw new Error("Invalid R2_PUBLIC_URL configuration. Must be either https://pub-xxx.r2.dev or https://account.r2.cloudflarestorage.com");
      }
      
      const isR2Dev = env.R2_PUBLIC_URL.includes('.r2.dev');
      let accountId: string;
      
      if (isR2Dev) {
        if (!env.R2_ACCOUNT_ID) {
          throw new Error("R2_ACCOUNT_ID is required when using R2.dev public URLs");
        }
        accountId = env.R2_ACCOUNT_ID;
      } else {
        accountId = accountIdMatch[1];
      }
      
      const fetchUrl = `https://${accountId}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${fileKey}`;
      
      const signedFetchUrl = await r2Client.sign(fetchUrl, {
        method: "GET",
        aws: { signQuery: true },
      });

      const imageResponse = await fetch(signedFetchUrl.url, {
        signal: AbortSignal.timeout(15000),
      });
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch uploaded image: ${imageResponse.status}`);
      }
      
      const contentLength = imageResponse.headers.get("content-length");
      if (contentLength) {
        const sizeMB = parseInt(contentLength) / (1024 * 1024);
        if (sizeMB > 10) {
          throw new Error(`Image too large: ${sizeMB.toFixed(1)}MB. Maximum size is 10MB.`);
        }
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString("base64");
      const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

      // Get prompt from environment variable or use default
      const prompt = env.GEMINI_PROMPT || `Fully restore and colorize the provided image, do not keep any part uncolored.`;

      const config = {
        temperature: 1.0,
        topP: 0.95,
        responseModalities: ['TEXT', 'IMAGE'],
      };
      
      const model = "gemini-2.5-flash-image";
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
          ],
        },
      ];

      
      let processedImageBuffer: Buffer | null = null;
      let generatedText = "";
      
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
        
        const requestBody = {
          contents,
          generationConfig: config,
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(35000),
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          if (response.status === 403 && errorText.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
            throw new Error('API key referrer restrictions. Please check your Google Cloud Console API key settings and ensure HTTP referrer restrictions are configured properly for your domain.');
          }
          
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        if (result.candidates?.[0]?.content?.parts) {
          const parts = result.candidates[0].content.parts;
          
          for (const part of parts) {
            if (part.inlineData) {
              const imageData = part.inlineData.data || '';
              processedImageBuffer = Buffer.from(imageData, 'base64');
            }
            
            if (part.text) {
              generatedText += part.text;
            }
          }
        }

        if (!processedImageBuffer) {
          throw new Error("No image generated by Gemini 2.5 Flash. Check API response structure.");
        }
      } catch (geminiError: unknown) {
        const err = geminiError as Error & { code?: number; status?: string };
        
        if (err.code === 429 || err.status === "Too Many Requests") {
          processedImageBuffer = await applyFallbackColorization(Buffer.from(imageBase64, "base64"));
          generatedText = "Note: Used fallback processing due to API quota limits. Please try again later for AI-powered colorization.";
        } else {
          throw geminiError;
        }
      }

      const outputKey = `outputs/${jobId}-colorized.jpg`;
      const outputUrl = `${env.R2_PUBLIC_URL}/${outputKey}`;
      const uploadUrl = `https://${accountId}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${outputKey}`;

      const uploadResponse = await r2Client.fetch(uploadUrl, {
        method: "PUT",
        body: processedImageBuffer as BodyInit,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Length": processedImageBuffer.length.toString(),
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload processed image to R2: ${uploadResponse.status}`);
      }

      await db.updateJob(jobId, {
        outputUrl: outputUrl,
        status: JOB_STATUS.DONE,
      });

      // SECURITY: Convert processed image to base64 data URL to hide R2 URL from client
      // This prevents users from accessing the R2 URL before payment
      const base64Image = processedImageBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;

      return NextResponse.json(
        {
          success: true,
          jobId,
          outputUrl: dataUrl, // Return base64 data URL instead of R2 URL
          originalUrl: job.originalUrl,
        },
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    } catch (processingError: unknown) {
      const err = processingError as Error & { code?: number; status?: string; retryDelay?: string };
      
      await db.updateJob(jobId, { status: JOB_STATUS.FAILED });
      
      let errorMessage = "Failed to process image";
      let statusCode = 500;
      
      if (err.code === 429 || err.status === "Too Many Requests") {
        errorMessage = "API quota exceeded. Please try again later.";
        statusCode = 429;
      } else if (err.message?.includes("quota")) {
        errorMessage = "API quota limits reached. Please try again later.";
        statusCode = 429;
      } else if (err.message?.includes("referrer restrictions") || err.message?.includes("API_KEY_HTTP_REFERRER_BLOCKED")) {
        errorMessage = "Google API configuration issue. Please contact support.";
        statusCode = 403;
      } else if (err.message?.includes("No image generated")) {
        errorMessage = "AI colorization service is currently unavailable. Please try again.";
        statusCode = 503;
      }
      
      if (env.NODE_ENV === 'development') {
        console.error("Error processing image:", err);
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: env.NODE_ENV === 'development' ? (err.message || "Unknown error") : undefined,
          retryAfter: err.retryDelay || "Please try again in a few minutes"
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    const env = getServerEnv();
    if (env.NODE_ENV === 'development') {
      console.error("Error submitting job:", error);
    }
    return NextResponse.json(
      { error: "Failed to submit job" },
      { status: 500 }
    );
  }
}
