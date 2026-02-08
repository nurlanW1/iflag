import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCountryCode } from '@/lib/country-mapping';
import { getCountryName } from '@/lib/country-code-to-name';
import { countries, hasFlag } from 'country-flag-icons';

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

// Helper function to convert country name to slug
function countryToSlug(country: string): string {
  return country.toLowerCase().replace(/\s+/g, '-');
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
      return NextResponse.json({ countries: [] });
    }

    const countryMap = new Map<string, { name: string; slug: string; code: string | null; count: number; thumbnail: string }>();
    const codeMap = new Map<string, string>(); // Track code -> name to avoid duplicates
    
    // First, add all countries from the library (even if they don't have files)
    countries.forEach((code) => {
      if (hasFlag(code)) {
        const countryName = getCountryName(code) || code;
        const countrySlug = countryToSlug(countryName);
        
        // Use code as key to avoid duplicates by name variations
        if (!codeMap.has(code)) {
          codeMap.set(code, countryName);
          countryMap.set(countryName, {
            name: countryName,
            slug: countrySlug,
            code: code,
            count: 0,
            thumbnail: `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`,
          });
        }
      }
    });
    
    // Then, read files from flag_stock directory and update counts/thumbnails
    try {
      const files = fs.readdirSync(flagStockPath);

      files.forEach((file) => {
        const lowerFile = file.toLowerCase();
        if (lowerFile.endsWith('.jpg') || lowerFile.endsWith('.jpeg')) {
          // Extract country name from filename
          const countryName = filenameToCountryName(file);
          const countrySlug = countryToSlug(countryName);
          const countryCode = getCountryCode(countryName);
          
          // Check if country exists by name or code
          let existingCountry = countryMap.get(countryName);
          
          // If not found by name, try to find by code
          if (!existingCountry && countryCode && codeMap.has(countryCode)) {
            const mappedName = codeMap.get(countryCode)!;
            existingCountry = countryMap.get(mappedName);
          }
          
          if (existingCountry) {
            // Update existing country
            existingCountry.count += 1;
            // Prefer JPG thumbnail if available
            existingCountry.thumbnail = `/api/gallery/image?file=${encodeURIComponent(file)}`;
          } else {
            // If country doesn't exist, add it (for countries not in library)
            // But check if we already have it by code
            if (countryCode && codeMap.has(countryCode)) {
              const mappedName = codeMap.get(countryCode)!;
              const existing = countryMap.get(mappedName);
              if (existing) {
                existing.count += 1;
                existing.thumbnail = `/api/gallery/image?file=${encodeURIComponent(file)}`;
              }
            } else {
              // New country not in library
              countryMap.set(countryName, {
                name: countryName,
                slug: countrySlug,
                code: countryCode,
                count: 1,
                thumbnail: `/api/gallery/image?file=${encodeURIComponent(file)}`,
              });
              if (countryCode) {
                codeMap.set(countryCode, countryName);
              }
            }
          }
        }
      });
    } catch (err) {
      console.error(`Error reading directory ${flagStockPath}:`, err);
    }

    // Convert to array and sort by name
    const countriesList = Array.from(countryMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ countries: countriesList });
  } catch (error) {
    console.error('Error loading countries:', error);
    return NextResponse.json({ countries: [] }, { status: 500 });
  }
}
