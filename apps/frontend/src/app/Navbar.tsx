import Link from 'next/link';

export default function Navbar() {
  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
      <Link href="/">Home</Link> | <Link href="/flags">Flags</Link>
    </nav>
  );
}
