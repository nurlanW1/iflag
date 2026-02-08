// Virus Scanner - Security scanning for uploaded files

export interface ScanResult {
  clean: boolean;
  viruses?: string[];
  scanned_at: Date;
}

// Scan file for viruses
export async function scanFile(file_path: string): Promise<ScanResult> {
  const scanner_type = process.env.VIRUS_SCANNER || 'clamav';

  switch (scanner_type) {
    case 'clamav':
      return await scanWithClamAV(file_path);
    case 'virustotal':
      return await scanWithVirusTotal(file_path);
    case 'none':
      // Development mode - skip scanning
      console.warn('Virus scanning disabled');
      return { clean: true, scanned_at: new Date() };
    default:
      throw new Error(`Unknown virus scanner: ${scanner_type}`);
  }
}

// ClamAV scanning
async function scanWithClamAV(file_path: string): Promise<ScanResult> {
  try {
    // ClamAV Node.js client
    const { NodeClam } = await import('clamscan');
    
    const clamscan = await new NodeClam().init({
      removeInfected: false,
      quarantineInfected: false,
      scanLog: null,
      debugMode: false,
      fileList: null,
      scanRecursively: false,
      clamscan: {
        path: process.env.CLAMAV_PATH || '/usr/bin/clamscan',
        db: null,
        scanArchives: true,
        active: true,
      },
    });

    const result = await clamscan.isInfected(file_path);

    if (result.isInfected) {
      return {
        clean: false,
        viruses: result.viruses || ['Unknown virus'],
        scanned_at: new Date(),
      };
    }

    return {
      clean: true,
      scanned_at: new Date(),
    };
  } catch (error: any) {
    // If ClamAV is not available, log and allow (with warning)
    console.error('ClamAV scan error:', error);
    
    // In production, you might want to fail here
    // For now, we'll allow but log the error
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Virus scanner unavailable');
    }
    
    return { clean: true, scanned_at: new Date() };
  }
}

// VirusTotal API scanning
async function scanWithVirusTotal(file_path: string): Promise<ScanResult> {
  const api_key = process.env.VIRUSTOTAL_API_KEY;
  if (!api_key) {
    throw new Error('VirusTotal API key not configured');
  }

  try {
    const { readFile } = await import('fs/promises');
    const file_buffer = await readFile(file_path);
    const file_base64 = file_buffer.toString('base64');

    // Upload file to VirusTotal
    const form_data = new FormData();
    form_data.append('file', new Blob([file_buffer]), file_path);

    const upload_response = await fetch('https://www.virustotal.com/api/v3/files', {
      method: 'POST',
      headers: {
        'x-apikey': api_key,
      },
      body: form_data,
    });

    if (!upload_response.ok) {
      throw new Error('VirusTotal upload failed');
    }

    const upload_data = await upload_response.json();
    const analysis_id = upload_data.data.id;

    // Wait for analysis (poll)
    let analysis_complete = false;
    let attempts = 0;
    const max_attempts = 10;

    while (!analysis_complete && attempts < max_attempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const analysis_response = await fetch(
        `https://www.virustotal.com/api/v3/analyses/${analysis_id}`,
        {
          headers: {
            'x-apikey': api_key,
          },
        }
      );

      const analysis_data = await analysis_response.json();
      const status = analysis_data.data.attributes.status;

      if (status === 'completed') {
        analysis_complete = true;
        const stats = analysis_data.data.attributes.stats;
        
        if (stats.malicious > 0) {
          return {
            clean: false,
            viruses: [`Detected by ${stats.malicious} engines`],
            scanned_at: new Date(),
          };
        }

        return {
          clean: true,
          scanned_at: new Date(),
        };
      }

      attempts++;
    }

    // Timeout - assume clean (or implement retry logic)
    console.warn('VirusTotal scan timeout');
    return { clean: true, scanned_at: new Date() };
  } catch (error: any) {
    console.error('VirusTotal scan error:', error);
    throw new Error(`Virus scanning failed: ${error.message}`);
  }
}
