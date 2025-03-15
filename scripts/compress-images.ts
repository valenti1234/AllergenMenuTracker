import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { glob } from 'glob';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const BACKUP_DIR = path.join(process.cwd(), 'uploads', 'originals');

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function compressImage(inputPath: string): Promise<void> {
  try {
    const filename = path.basename(inputPath);
    const backupPath = path.join(BACKUP_DIR, filename);
    const tempPath = path.join(UPLOADS_DIR, `temp-${filename}`);
    
    // Skip if already processed (backup exists)
    if (fs.existsSync(backupPath)) {
      console.log(`Skipping already processed image: ${filename}`);
      return;
    }
    
    // Get original file size
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size / 1024; // KB
    
    // Process image with sharp
    await sharp(inputPath)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toFile(tempPath);
    
    // Get new file size
    const newStats = fs.statSync(tempPath);
    const newSize = newStats.size / 1024; // KB
    const savingsPercent = ((originalSize - newSize) / originalSize * 100).toFixed(2);
    
    // Backup original file
    fs.copyFileSync(inputPath, backupPath);
    
    // Replace original with compressed version
    fs.unlinkSync(inputPath);
    fs.renameSync(tempPath, inputPath);
    
    console.log(`Compressed ${filename}: ${originalSize.toFixed(2)}KB → ${newSize.toFixed(2)}KB (${savingsPercent}% savings)`);
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error);
  }
}

async function compressAllImages(): Promise<void> {
  try {
    // Find all image files in uploads directory
    const imageFiles = await glob('**/*.{jpg,jpeg,png,gif,webp}', { 
      cwd: UPLOADS_DIR, 
      absolute: true,
      ignore: ['**/originals/**', '**/optimized/**', '**/temp-*'] 
    });
    
    console.log(`Found ${imageFiles.length} images to process`);
    
    // Process each image
    for (const imagePath of imageFiles) {
      await compressImage(imagePath);
    }
    
    console.log('Image compression complete!');
  } catch (error) {
    console.error('Error compressing images:', error);
  }
}

// Run the compression
compressAllImages(); 