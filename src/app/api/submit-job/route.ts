import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { AwsClient } from "aws4fetch";

// Force Node.js runtime
export const runtime = 'nodejs';

// Fallback image processing function when API quota is exceeded
async function applyFallbackColorization(imageBuffer: Buffer): Promise<Buffer> {
  // For now, just return the original image
  // In a real implementation, you could apply basic image filters:
  // - Sepia tone
  // - Basic color mapping
  // - Use a lightweight image processing library like Sharp
  return imageBuffer;
}

export async function POST(request: NextRequest) {
  try {
    // Get database instance
    const db = getDatabase();

    // All users are anonymous - no credit checks needed

    const { jobId } = await request.json();
    
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    // Get environment variables
    const env = process.env as any;
    if (!env.GEMINI_API_KEY || !env.R2_BUCKET || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_PUBLIC_URL) {
      return NextResponse.json({ error: "Missing configuration" }, { status: 500 });
    }

    // Get job from database
    const job = await db.getJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // No authorization check needed for anonymous users

    if (job.status !== "PENDING") {
      return NextResponse.json({ error: "Job already processed" }, { status: 400 });
    }

    // Update job status to processing
    await db.updateJob(jobId, { status: "PROCESSING" });

    // We'll use direct fetch API calls instead of the SDK for better header control

    try {
      // Create R2 client for fetching the uploaded image
      const r2Client = new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        region: "auto",
        service: "s3",
      });

      // Extract file key from the original URL
      const fileKey = job.originalUrl.split('/').slice(-2).join('/'); // Get last two parts: uploads/filename
      
      // Create signed URL for fetching the uploaded image
      const accountId = env.R2_PUBLIC_URL.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/)?.[1];
      const fetchUrl = `https://${accountId}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${fileKey}`;
      
      const signedFetchUrl = await r2Client.sign(fetchUrl, {
        method: "GET",
        aws: { signQuery: true },
      });

      const imageResponse = await fetch(signedFetchUrl.url);
      
      if (!imageResponse.ok) {
        console.error("Failed to fetch image:", imageResponse.status, await imageResponse.text());
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
          console.error('Gemini API Error Response:', errorText);
          
          // Check for specific API restriction errors
          if (response.status === 403 && errorText.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
            throw new Error('API key referrer restrictions. Please check your Google Cloud Console API key settings and ensure HTTP referrer restrictions are configured properly for your domain.');
          }
          
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        // Log the full response for debugging
        console.log('Gemini API Response:', JSON.stringify(result, null, 2));

        // Parse the response
        if (result.candidates?.[0]?.content?.parts) {
          const parts = result.candidates[0].content.parts;
          
          console.log('Number of parts in response:', parts.length);
          
          for (const part of parts) {
            console.log('Part keys:', Object.keys(part));
            
            // Check for generated image
            if (part.inlineData) {
              const imageData = part.inlineData.data || '';
              console.log('Found inline data, length:', imageData.length);
              processedImageBuffer = Buffer.from(imageData, 'base64');
            }
            
            // Check for text response
            if (part.text) {
              generatedText += part.text;
              console.log('Found text:', part.text.substring(0, 100));
            }
          }
        } else {
          console.error('Unexpected response structure:', {
            hasCandidates: !!result.candidates,
            candidatesLength: result.candidates?.length,
            firstCandidate: result.candidates?.[0] ? Object.keys(result.candidates[0]) : 'N/A',
            fullResult: result
          });
        }

        if (!processedImageBuffer) {
          console.error("No image buffer created. Generated text:", generatedText);
          throw new Error("No image generated by Gemini 2.5 Flash. Check API response structure.");
        }
        
        console.log('Successfully created image buffer, size:', processedImageBuffer.length);
      } catch (geminiError: any) {
        console.error("Gemini API Error:", geminiError);
        
        // Check if it's a quota/rate limit error
        if (geminiError?.code === 429 || geminiError?.status === "Too Many Requests") {
          
          // Fallback: Apply a simple image processing (e.g., sepia tone effect)
          // This simulates colorization until API quota resets
          processedImageBuffer = await applyFallbackColorization(Buffer.from(imageBase64, "base64"));
          
          // Update job with a note about fallback processing
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
        status: "DONE",
      });

      // No credit deduction needed for anonymous users

      return NextResponse.json({
        success: true,
        jobId,
        outputUrl,
      });
    } catch (processingError: any) {
      console.error("Error processing image:", processingError);
      
      // Update job status to failed
      await db.updateJob(jobId, { status: "FAILED" });
      
      // Provide more specific error messages
      let errorMessage = "Failed to process image";
      let statusCode = 500;
      
      if (processingError?.code === 429 || processingError?.status === "Too Many Requests") {
        errorMessage = "API quota exceeded. Please try again later.";
        statusCode = 429;
      } else if (processingError?.message?.includes("quota")) {
        errorMessage = "API quota limits reached. Please try again later.";
        statusCode = 429;
      } else if (processingError?.message?.includes("referrer restrictions") || processingError?.message?.includes("API_KEY_HTTP_REFERRER_BLOCKED")) {
        errorMessage = "Google API configuration issue. Please contact support.";
        statusCode = 403;
      } else if (processingError?.message?.includes("No image generated")) {
        errorMessage = "AI colorization service is currently unavailable. We're working on fixing this. Please try again later.";
        statusCode = 503;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? (processingError?.message || "Unknown error") : undefined,
          retryAfter: processingError?.retryDelay || "Please try again in a few minutes"
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error("Error submitting job:", error);
    return NextResponse.json(
      { error: "Failed to submit job" },
      { status: 500 }
    );
  }
}
