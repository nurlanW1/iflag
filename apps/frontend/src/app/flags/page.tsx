import { redirect } from 'next/navigation';

/** Legacy hub URL; country catalog lives at `/gallery`. */
export default function FlagsIndexPage() {
  redirect('/gallery');
}
