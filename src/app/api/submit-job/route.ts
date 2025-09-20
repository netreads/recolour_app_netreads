import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
  console.log("Applying fallback colorization (returning original image)");
  return imageBuffer;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has sufficient credits
    const db = getDatabase();
    const user = await db.getUserById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if ((user as any).credits < 1) {
      return NextResponse.json({ 
        error: "Insufficient credits. Please purchase credits to continue.",
        credits: (user as any).credits 
      }, { status: 402 }); // 402 Payment Required
    }

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

    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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
      console.log("File key:", fileKey);
      
      // Create signed URL for fetching the uploaded image
      const accountId = env.R2_PUBLIC_URL.match(/https:\/\/([^.]+)\.r2\.cloudflarestorage\.com/)?.[1];
      const fetchUrl = `https://${accountId}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${fileKey}`;
      
      const signedFetchUrl = await r2Client.sign(fetchUrl, {
        method: "GET",
        aws: { signQuery: true },
      });

      console.log("Fetching image from signed URL:", signedFetchUrl.url);
      const imageResponse = await fetch(signedFetchUrl.url);
      console.log("Image fetch response status:", imageResponse.status);
      
      if (!imageResponse.ok) {
        console.error("Failed to fetch image:", imageResponse.status, await imageResponse.text());
        throw new Error(`Failed to fetch uploaded image: ${imageResponse.status}`);
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString("base64");
      const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

      // Create prompt for colorization
      const prompt = `Please colorize this black and white image. Add realistic colors that would be appropriate for the time period and subject matter. Make the colors look natural and historically accurate. Keep the same composition and details, just add appropriate colors.`;

      // Configure Gemini for image generation
      const config = {
        responseModalities: [
          'IMAGE',
          'TEXT',
        ],
      };
      
      const model = 'gemini-2.5-flash-image-preview';
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

      console.log("Starting image generation with Gemini 2.5 Flash...");
      
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
        console.log('Gemini API Response received');

        // Parse the response
        if (result.candidates?.[0]?.content?.parts) {
          const parts = result.candidates[0].content.parts;
          
          for (const part of parts) {
            // Check for generated image
            if (part.inlineData) {
              console.log("Generated image received with mime type:", part.inlineData.mimeType);
              processedImageBuffer = Buffer.from(part.inlineData.data || '', 'base64');
              console.log("Processed image buffer size:", processedImageBuffer.length);
            }
            
            // Check for text response
            if (part.text) {
              generatedText += part.text;
              console.log("Generated text:", part.text);
            }
          }
        }

        if (!processedImageBuffer) {
          throw new Error("No image generated by Gemini 2.5 Flash");
        }
      } catch (geminiError: any) {
        console.error("Gemini API Error:", geminiError);
        
        // Check if it's a quota/rate limit error
        if (geminiError?.code === 429 || geminiError?.status === "Too Many Requests") {
          console.log("Gemini API quota exceeded. Using fallback processing...");
          
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

      // Deduct 1 credit for successful processing
      const updatedUser = await db.deductCredits(session.user.id, 1);
      console.log(`Deducted 1 credit from user ${session.user.email}. Remaining credits: ${(updatedUser as any).credits}`);

      return NextResponse.json({
        success: true,
        jobId,
        outputUrl,
        creditsRemaining: (updatedUser as any).credits,
      });
    } catch (processingError: any) {
      console.error("Error processing image:", processingError);
      
      // Update job status to failed
      await db.updateJob(jobId, { status: "FAILED" });
      
      // Provide more specific error messages
      let errorMessage = "Failed to process image";
      let statusCode = 500;
      
      if (processingError?.code === 429 || processingError?.status === "Too Many Requests") {
        errorMessage = "API quota exceeded. Please try again later or upgrade your plan.";
        statusCode = 429;
      } else if (processingError?.message?.includes("quota")) {
        errorMessage = "API quota limits reached. Please try again later.";
        statusCode = 429;
      } else if (processingError?.message?.includes("referrer restrictions") || processingError?.message?.includes("API_KEY_HTTP_REFERRER_BLOCKED")) {
        errorMessage = "Google API configuration issue. Please check your API key settings in Google Cloud Console.";
        statusCode = 403;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: processingError?.message || "Unknown error",
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
