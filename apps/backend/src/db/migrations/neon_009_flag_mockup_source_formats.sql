-- Neon: allow PSD + Adobe Illustrator (AI) and video formats on country_flag_files.format
-- (mockup masters, R2 import, admin upload).

ALTER TABLE country_flag_files DROP CONSTRAINT IF EXISTS country_flag_files_format_check;

ALTER TABLE country_flag_files
  ADD CONSTRAINT country_flag_files_format_check
  CHECK (
    format IN (
      'png', 'svg', 'jpg', 'jpeg', 'webp', 'eps', 'pdf',
      'ai', 'psd',
      'mp4', 'webm', 'mov'
    )
  );
