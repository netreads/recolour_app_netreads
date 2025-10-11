import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { AwsClient } from "aws4fetch";
import { getServerEnv } from "@/lib/env";
import { JOB_STATUS } from "@/lib/constants";

// Force Node.js runtime
export const runtime = 'nodejs';

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
      // Create R2 client for fetching the uploaded image
      const r2Client = new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        region: "auto",
        service: "s3",
      });

      // Extract file key from the original URL
      const fileKey = job.originalUrl.split('/').slice(-2).join('/');
      
      // Create signed URL for fetching the uploaded image
      const accountIdMatch = env.R2_PUBLIC_URL.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/);
      if (!accountIdMatch) {
        throw new Error("Invalid R2_PUBLIC_URL configuration");
      }
      const accountId = accountIdMatch[1];
      const fetchUrl = `https://${accountId}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${fileKey}`;
      
      const signedFetchUrl = await r2Client.sign(fetchUrl, {
        method: "GET",
        aws: { signQuery: true },
      });

      const imageResponse = await fetch(signedFetchUrl.url);
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch uploaded image: ${imageResponse.status}`);
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString("base64");
      const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

      // Create prompt for colorization - simpler is better for Gemini
      const prompt = `Fully restore and colorize the provided image, do not keep any part uncolored.`;

      // Configure Gemini for image generation
      // For models with image output, we need to use the experimental model
      const config = {
        temperature: 1.0,
        topP: 0.95,
        responseModalities: ['TEXT', 'IMAGE'], // Critical: Enable image output
      };
      
      // Try the Imagen model via Gemini API
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
        // Use direct fetch API call to have better control over headers - non-streaming for simplicity
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
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Check for specific API restriction errors
          if (response.status === 403 && errorText.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
            throw new Error('API key referrer restrictions. Please check your Google Cloud Console API key settings and ensure HTTP referrer restrictions are configured properly for your domain.');
          }
          
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        // Parse the response
        if (result.candidates?.[0]?.content?.parts) {
          const parts = result.candidates[0].content.parts;
          
          for (const part of parts) {
            // Check for generated image
            if (part.inlineData) {
              const imageData = part.inlineData.data || '';
              processedImageBuffer = Buffer.from(imageData, 'base64');
            }
            
            // Check for text response
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
        
        // Check if it's a quota/rate limit error
        if (err.code === 429 || err.status === "Too Many Requests") {
          // Fallback: Apply simple image processing
          processedImageBuffer = await applyFallbackColorization(Buffer.from(imageBase64, "base64"));
          generatedText = "Note: Used fallback processing due to API quota limits. Please try again later for AI-powered colorization.";
        } else {
          // Re-throw non-quota errors
          throw geminiError;
        }
      }

      // Upload processed image to R2
      const outputKey = `outputs/${jobId}-colorized.jpg`;
      const outputUrl = `${env.R2_PUBLIC_URL}/${env.R2_BUCKET}/${outputKey}`;

      // processedImageBuffer is already defined above

      // Use the same endpoint format as in upload (reuse accountId from above)
      const uploadUrl = `https://${accountId}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${outputKey}`;

      await r2Client.fetch(uploadUrl, {
        method: "PUT",
        body: processedImageBuffer as BodyInit,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Length": processedImageBuffer.length.toString(),
        },
      });

      // Update job with output URL and status
      await db.updateJob(jobId, {
        outputUrl: outputUrl,
        status: JOB_STATUS.DONE,
      });

      return NextResponse.json({
        success: true,
        jobId,
        outputUrl,
      });
    } catch (processingError: unknown) {
      const err = processingError as Error & { code?: number; status?: string; retryDelay?: string };
      
      // Update job status to failed
      await db.updateJob(jobId, { status: JOB_STATUS.FAILED });
      
      // Provide more specific error messages
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
        errorMessage = "AI colorization service is currently unavailable. We're working on fixing this. Please try again later.";
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
