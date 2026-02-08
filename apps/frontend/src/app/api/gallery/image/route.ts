import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
      return new NextResponse('Missing file parameter', { status: 400 });
    }

    // Try multiple possible paths
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
      return new NextResponse('Flag stock directory not found', { status: 404 });
    }

    // Security check: prevent directory traversal
    const safeFileName = path.basename(file);
    if (safeFileName !== file || file.includes('..')) {
      return new NextResponse('Invalid file name', { status: 403 });
    }

    const imagePath = path.join(flagStockPath, safeFileName);

    // Security check: ensure the path is within flag_stock directory
    const resolvedPath = path.resolve(imagePath);
    const resolvedFlagStock = path.resolve(flagStockPath);
    if (!resolvedPath.startsWith(resolvedFlagStock)) {
      return new NextResponse('Invalid path', { status: 403 });
    }

    if (!fs.existsSync(imagePath)) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(file).toLowerCase();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
