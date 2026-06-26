import type { Metadata } from 'next';
import VSDesignerClient from './VSDesignerClient';

export const metadata: Metadata = {
  title: 'VS Designer — Create Matchup Graphics | Flagswing',
  description:
    'Design professional VS matchup graphics for sports, politics and events using country flags and team logos.',
};

export default function VSDesignerPage() {
  return <VSDesignerClient />;
}
