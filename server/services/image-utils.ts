import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import https from 'https';
import sharp from 'sharp';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function downloadImage(url: string): Promise<string> {
  const filename = `menu-item-${Date.now()}.jpg`;
  const filepath = path.join(uploadDir, filename);

  return new Promise((resolve, reject) => {
    https.get(url, async (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      // Create a buffer from the response
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      
      response.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          
          // Compress and optimize the image using sharp
          await sharp(buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true }) // Resize if larger than 800x800
            .jpeg({ quality: 80, progressive: true }) // Convert to JPEG with 80% quality
            .toFile(filepath);
            
          resolve(`/uploads/${filename}`);
        } catch (err) {
          fs.unlink(filepath, () => {});
          reject(err);
        }
      });

      response.on('error', (err) => {
        reject(err);
      });
    }).on('error', reject);
  });
}

// New function to compress an existing image
export async function compressImage(inputPath: string, quality: number = 80): Promise<string> {
  const parsedPath = path.parse(inputPath);
  const outputFilename = `${parsedPath.name}-compressed${parsedPath.ext}`;
  const outputPath = path.join(uploadDir, outputFilename);
  
  await sharp(inputPath)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, progressive: true })
    .toFile(outputPath);
    
  return `/uploads/${outputFilename}`;
}

// New function to process uploaded image buffer
export async function processImageBuffer(buffer: Buffer, filename: string): Promise<string> {
  const outputFilename = `menu-item-${Date.now()}${path.extname(filename)}`;
  const outputPath = path.join(uploadDir, outputFilename);
  
  await sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true })
    .toFile(outputPath);
    
  return `/uploads/${outputFilename}`;
}
