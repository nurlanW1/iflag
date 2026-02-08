import type { NextPage } from 'next';
import Link from 'next/link';

const flags = [
  { id: '1', name: 'USA', imageUrl: '/flags/usa.png' },
  { id: '2', name: 'Canada', imageUrl: '/flags/canada.png' },
  { id: '3', name: 'Japan', imageUrl: '/flags/japan.png' },
];

const FlagsPage: NextPage = () => {
  return (
    <main>
      <h1>Available Flags</h1>
      <ul>
        {flags.map(flag => (
          <li key={flag.id}>
            <Link href={`/flags/${flag.id}`}>
              <img src={flag.imageUrl} alt={flag.name} width={64} height={40} />
              <span>{flag.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
};

export default FlagsPage;
