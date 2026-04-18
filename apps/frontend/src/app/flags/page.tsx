import { redirect } from 'next/navigation';

/** Legacy hub URL; catalog browsing lives at `/browse`. */
export default function FlagsIndexPage() {
  redirect('/browse');
}
