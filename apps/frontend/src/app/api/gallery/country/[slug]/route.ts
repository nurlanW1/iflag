import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCountryCode } from '@/lib/country-mapping';

// Helper function to convert filename to country name
function filenameToCountryName(filename: string): string {
  let name = filename.replace(/_flag\.(jpg|jpeg)$/i, '');
  name = name.replace(/_/g, ' ');
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to convert country name to slug
function countryToSlug(country: string): string {
  return country.toLowerCase().replace(/\s+/g, '-');
}

// Helper function to convert slug to country name
function slugToCountryName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const countrySlug = params.slug;
    const countryName = slugToCountryName(countrySlug);

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
      return NextResponse.json({ error: 'Flag stock directory not found' }, { status: 404 });
    }

    const variants: any[] = [];
    
    // Read files and find matching country
    try {
      const files = fs.readdirSync(flagStockPath);

      files.forEach((file) => {
        const lowerFile = file.toLowerCase();
        if (lowerFile.endsWith('.jpg') || lowerFile.endsWith('.jpeg')) {
          const fileCountryName = filenameToCountryName(file);
          const fileCountrySlug = countryToSlug(fileCountryName);
          
          // Match by slug (more flexible)
          if (fileCountrySlug === countrySlug || fileCountryName.toLowerCase() === countryName.toLowerCase()) {
            // Extract variant type from filename if available
            // For now, we'll create variants based on available formats
            const fileId = file.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            const filePath = path.join(flagStockPath, file);
            
            // Get file stats
            let fileSize = 'Unknown';
            let dimensions = 'Original';
            try {
              const stats = fs.statSync(filePath);
              const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
              fileSize = `${sizeInMB} MB`;
            } catch (err) {
              // Ignore errors
            }
            
            variants.push({
              id: fileId,
              name: 'Standard Flag',
              type: 'standard',
              thumbnail: `/api/gallery/image?file=${encodeURIComponent(file)}`,
              formats: [
                {
                  id: `${fileId}-jpg`,
                  format: 'JPG',
                  formatCode: 'jpg',
                  category: 'raster',
                  file: file,
                  url: `/api/gallery/image?file=${encodeURIComponent(file)}`,
                  size: fileSize,
                  dimensions: dimensions,
                },
                // In the future, we can add SVG, PNG, etc. here
                // For now, we'll show the JPG as the main format
              ],
            });
          }
        }
      });
    } catch (err) {
      console.error(`Error reading directory ${flagStockPath}:`, err);
    }

    if (variants.length === 0) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    const countryCode = getCountryCode(countryName);

    return NextResponse.json({
      country: {
        name: countryName,
        slug: countrySlug,
        code: countryCode,
      },
      variants,
    });
  } catch (error) {
    console.error('Error loading country data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
