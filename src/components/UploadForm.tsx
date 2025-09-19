"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, Image as ImageIcon, RefreshCw } from "lucide-react";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      setProgress(25);

      // 1) Ask server for presigned URL + key
      const r1 = await fetch("/api/get-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!r1.ok) {
        console.error(await r1.text());
        throw new Error("Failed to get upload URL");
      }
      const { uploadUrl, key } = await r1.json();

      setProgress(50);

      // 2) Upload the image directly to R2 presigned URL
      const put = await fetch(uploadUrl, { 
        method: "PUT", 
        headers: { "Content-Type": file.type }, 
        body: file 
      });
      if (!put.ok) {
        console.error(await put.text());
        throw new Error("Upload failed");
      }

      setProgress(75);

      // 3) Submit job to be processed
      const prompt = "Recolor this photo into warm pastel vintage tones. Preserve faces and skin tones.";
      const r2 = await fetch("/api/submit-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, prompt }),
      });
      if (!r2.ok) {
        console.error(await r2.text());
        throw new Error("Failed to submit job");
      }
      const { jobId, creditsRemaining } = await r2.json();
      
      setProgress(100);

      // Emit credits update to refresh navbar immediately
      try {
        const event = new CustomEvent("credits:update", { detail: { credits: creditsRemaining } });
        window.dispatchEvent(event);
      } catch {}
      
      // Redirect to result page
      setTimeout(() => {
        window.location.href = `/recolor?jobId=${jobId}`;
      }, 500);
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center">
          <Upload className="mr-2 h-5 w-5" />
          Upload Your Photo
        </CardTitle>
        <CardDescription>
          Choose a black & white image to transform with AI colorization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select Image</Label>
            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              Supports JPG, PNG, and other common image formats
            </p>
          </div>

          {preview && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative w-full max-w-md mx-auto">
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-64 object-cover rounded-lg border shadow-sm"
                />
              </div>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Processing... {progress}%
              </Label>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <Button
            type="submit"
            disabled={!file || isUploading}
            size="lg"
            className="w-full"
          >
            {isUploading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Colorize Photo
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


