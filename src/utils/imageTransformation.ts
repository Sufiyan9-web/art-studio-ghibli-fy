
/**
 * Utility functions for image transformation and optimization
 */

// Constants
export const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";

// Optimize image by reducing size/quality before upload
export const optimizeImage = async (file: File, maxSize = 800): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      // Target dimensions - reduce to max size for efficiency
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxSize) {
          height = Math.round(height * (maxSize / width));
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round(width * (maxSize / height));
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to Blob with reduced quality
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }
          
          const optimizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          resolve(optimizedFile);
        },
        'image/jpeg',
        0.85  // Quality 0.85 is a good balance
      );
    };
    
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

// Transform image using Replicate API
export const transformToGhibli = async (
  imageFile: File, 
  apiKey: string,
  isOptimized: boolean = true
): Promise<string> => {
  try {
    // Optimize image if enabled
    const processedImage = isOptimized 
      ? await optimizeImage(imageFile, isOptimized ? 600 : 800)
      : imageFile;
    
    // Convert to base64
    const base64Image = await fileToBase64(processedImage);
    
    // Make the API request with proper headers and CORS mode
    const response = await fetch(REPLICATE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${apiKey}`,
      },
      mode: "cors",
      body: JSON.stringify({
        version: "ad59ca21177f9e217b9075e7300cf6e14f7e5b4505b478b3a1700d1ccd3d8517",
        input: {
          image: base64Image,
          prompt: "Studio Ghibli style, Hayao Miyazaki",
          negative_prompt: "bad quality, low quality",
          num_inference_steps: isOptimized ? 20 : 30
        }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.status}${errorData.detail ? ' - ' + errorData.detail : ''}`);
    }
    
    const prediction = await response.json();
    return prediction.id;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

// Poll for result with exponential backoff
export const pollForResult = async (id: string, apiKey: string): Promise<any> => {
  let result;
  let attempts = 0;
  let backoff = 2000; // Start with 2 seconds
  const maxBackoff = 15000; // Maximum 15 seconds between attempts
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${REPLICATE_API_URL}/${id}`, {
        method: "GET",
        headers: {
          "Authorization": `Token ${apiKey}`,
        },
        mode: "cors"
      });

      if (!response.ok) {
        throw new Error(`Failed to check prediction status: ${response.status}`);
      }

      result = await response.json();

      if (result.status === "succeeded" || result.status === "failed") {
        break;
      }

      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, backoff));
      backoff = Math.min(backoff * 1.5, maxBackoff);
      attempts++;
    } catch (error) {
      console.error("Polling error:", error);
      attempts++;
      // Don't throw here, just continue with next polling attempt
      await new Promise(resolve => setTimeout(resolve, backoff));
      backoff = Math.min(backoff * 1.5, maxBackoff);
    }
  }

  if (attempts >= maxAttempts) {
    throw new Error("Prediction timed out");
  }

  if (result.status === "failed") {
    throw new Error(result.error || "Transformation failed");
  }

  return result;
};
