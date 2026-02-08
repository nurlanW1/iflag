import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper function to convert filename to country name
function filenameToCountryName(filename: string): string {
  // Remove _flag.jpg or _flag.jpeg suffix
  let name = filename.replace(/_flag\.(jpg|jpeg)$/i, '');
  // Replace underscores with spaces
  name = name.replace(/_/g, ' ');
  // Capitalize first letter of each word
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export async function GET() {
  try {
    // Try multiple possible paths for flag_stock
    const possiblePaths = [
      path.join(process.cwd(), '../../flag_stock'),
      path.join(process.cwd(), '../../../flag_stock'),
      'D:\\flagim\\iflag\\flag_stock',
      path.join(process.cwd(), 'flag_stock'),
      path.join(process.cwd(), '..', 'flag_stock'),
      path.join(process.cwd(), '..', '..', 'flag_stock'),
    ];

    let flagStockPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        flagStockPath = possiblePath;
        break;
      }
    }

    if (!flagStockPath) {
      console.log('Flag stock directory not found. Tried paths:', possiblePaths);
      return NextResponse.json({ images: [] });
    }

    const images: any[] = [];
    
    // Read files directly from flag_stock directory (not subdirectories)
    try {
      const files = fs.readdirSync(flagStockPath);

      files.forEach((file) => {
        const lowerFile = file.toLowerCase();
        if (lowerFile.endsWith('.jpg') || lowerFile.endsWith('.jpeg')) {
          // Extract country name from filename
          const countryName = filenameToCountryName(file);
          
          // Create a URL-friendly ID
          const fileId = file.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          
          images.push({
            id: fileId,
            country: countryName,
            filename: file,
            path: `/api/gallery/image?file=${encodeURIComponent(file)}`,
            thumbnail: `/api/gallery/image?file=${encodeURIComponent(file)}`,
          });
        }
      });
    } catch (err) {
      console.error(`Error reading directory ${flagStockPath}:`, err);
    }

    // Sort by country name
    images.sort((a, b) => a.country.localeCompare(b.country));

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error loading images:', error);
    return NextResponse.json({ images: [] }, { status: 500 });
  }
}
