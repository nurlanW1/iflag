export interface FootballTeam {
  id: string;
  name: string;
  league: string;
  country: string;
  logoUrl: string;
}

export const POPULAR_TEAMS: FootballTeam[] = [
  // Premier League
  { id: 'man-city', name: 'Manchester City', league: 'Premier League', country: 'England', logoUrl: 'https://media.api-sports.io/football/teams/50.png' },
  { id: 'liverpool', name: 'Liverpool', league: 'Premier League', country: 'England', logoUrl: 'https://media.api-sports.io/football/teams/40.png' },
  { id: 'man-utd', name: 'Manchester United', league: 'Premier League', country: 'England', logoUrl: 'https://media.api-sports.io/football/teams/33.png' },
  { id: 'arsenal', name: 'Arsenal', league: 'Premier League', country: 'England', logoUrl: 'https://media.api-sports.io/football/teams/42.png' },
  { id: 'chelsea', name: 'Chelsea', league: 'Premier League', country: 'England', logoUrl: 'https://media.api-sports.io/football/teams/49.png' },
  { id: 'tottenham', name: 'Tottenham Hotspur', league: 'Premier League', country: 'England', logoUrl: 'https://media.api-sports.io/football/teams/47.png' },
  // La Liga
  { id: 'real-madrid', name: 'Real Madrid', league: 'La Liga', country: 'Spain', logoUrl: 'https://media.api-sports.io/football/teams/541.png' },
  { id: 'barcelona', name: 'FC Barcelona', league: 'La Liga', country: 'Spain', logoUrl: 'https://media.api-sports.io/football/teams/529.png' },
  { id: 'atletico', name: 'Atletico Madrid', league: 'La Liga', country: 'Spain', logoUrl: 'https://media.api-sports.io/football/teams/530.png' },
  // Serie A
  { id: 'inter', name: 'Inter Milan', league: 'Serie A', country: 'Italy', logoUrl: 'https://media.api-sports.io/football/teams/505.png' },
  { id: 'juventus', name: 'Juventus', league: 'Serie A', country: 'Italy', logoUrl: 'https://media.api-sports.io/football/teams/496.png' },
  { id: 'ac-milan', name: 'AC Milan', league: 'Serie A', country: 'Italy', logoUrl: 'https://media.api-sports.io/football/teams/489.png' },
  { id: 'napoli', name: 'SSC Napoli', league: 'Serie A', country: 'Italy', logoUrl: 'https://media.api-sports.io/football/teams/492.png' },
  { id: 'roma', name: 'AS Roma', league: 'Serie A', country: 'Italy', logoUrl: 'https://media.api-sports.io/football/teams/497.png' },
  // Bundesliga
  { id: 'bayern', name: 'Bayern Munich', league: 'Bundesliga', country: 'Germany', logoUrl: 'https://media.api-sports.io/football/teams/157.png' },
  { id: 'dortmund', name: 'Borussia Dortmund', league: 'Bundesliga', country: 'Germany', logoUrl: 'https://media.api-sports.io/football/teams/165.png' },
  // Ligue 1
  { id: 'psg', name: 'Paris Saint-Germain', league: 'Ligue 1', country: 'France', logoUrl: 'https://media.api-sports.io/football/teams/85.png' },
  // Other
  { id: 'porto', name: 'FC Porto', league: 'Primeira Liga', country: 'Portugal', logoUrl: 'https://media.api-sports.io/football/teams/212.png' },
  { id: 'benfica', name: 'SL Benfica', league: 'Primeira Liga', country: 'Portugal', logoUrl: 'https://media.api-sports.io/football/teams/211.png' },
  { id: 'ajax', name: 'Ajax', league: 'Eredivisie', country: 'Netherlands', logoUrl: 'https://media.api-sports.io/football/teams/194.png' },
  // National teams
  { id: 'nt-brazil', name: 'Brazil', league: 'National Team', country: 'Brazil', logoUrl: 'https://media.api-sports.io/football/teams/6.png' },
  { id: 'nt-france', name: 'France', league: 'National Team', country: 'France', logoUrl: 'https://media.api-sports.io/football/teams/2.png' },
  { id: 'nt-germany', name: 'Germany', league: 'National Team', country: 'Germany', logoUrl: 'https://media.api-sports.io/football/teams/25.png' },
  { id: 'nt-spain', name: 'Spain', league: 'National Team', country: 'Spain', logoUrl: 'https://media.api-sports.io/football/teams/9.png' },
  { id: 'nt-england', name: 'England', league: 'National Team', country: 'England', logoUrl: 'https://media.api-sports.io/football/teams/10.png' },
  { id: 'nt-portugal', name: 'Portugal', league: 'National Team', country: 'Portugal', logoUrl: 'https://media.api-sports.io/football/teams/27.png' },
  { id: 'nt-argentina', name: 'Argentina', league: 'National Team', country: 'Argentina', logoUrl: 'https://media.api-sports.io/football/teams/26.png' },
  { id: 'nt-uzbekistan', name: 'Uzbekistan', league: 'National Team', country: 'Uzbekistan', logoUrl: 'https://media.api-sports.io/football/teams/268.png' },
];

export function searchTeams(query: string): FootballTeam[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return POPULAR_TEAMS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q) ||
      t.league.toLowerCase().includes(q),
  ).slice(0, 12);
}
