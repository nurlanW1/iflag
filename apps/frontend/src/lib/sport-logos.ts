export interface FootballTeam {
  id: string;
  name: string;
  league: string;
  country: string;
  logoUrl: string;
}

export const POPULAR_TEAMS: FootballTeam[] = [
  // ── Premier League ──────────────────────────────────────────────────────
  { id: 'man-city',      name: 'Manchester City',     league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/50.png'   },
  { id: 'liverpool',     name: 'Liverpool',            league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/40.png'   },
  { id: 'man-utd',       name: 'Manchester United',    league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/33.png'   },
  { id: 'arsenal',       name: 'Arsenal',              league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/42.png'   },
  { id: 'chelsea',       name: 'Chelsea',              league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/49.png'   },
  { id: 'tottenham',     name: 'Tottenham Hotspur',    league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/47.png'   },
  { id: 'aston-villa',   name: 'Aston Villa',          league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/66.png'   },
  { id: 'newcastle',     name: 'Newcastle United',     league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/34.png'   },
  { id: 'west-ham',      name: 'West Ham United',      league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/48.png'   },
  { id: 'everton',       name: 'Everton',              league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/45.png'   },
  { id: 'wolves',        name: 'Wolverhampton',        league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/39.png'   },
  { id: 'brighton',      name: 'Brighton',             league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/51.png'   },
  { id: 'crystal-palace',name: 'Crystal Palace',       league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/52.png'   },
  { id: 'leicester',     name: 'Leicester City',       league: 'Premier League',  country: 'England',      logoUrl: 'https://media.api-sports.io/football/teams/46.png'   },

  // ── La Liga ─────────────────────────────────────────────────────────────
  { id: 'real-madrid',   name: 'Real Madrid',          league: 'La Liga',         country: 'Spain',        logoUrl: 'https://media.api-sports.io/football/teams/541.png'  },
  { id: 'barcelona',     name: 'FC Barcelona',         league: 'La Liga',         country: 'Spain',        logoUrl: 'https://media.api-sports.io/football/teams/529.png'  },
  { id: 'atletico',      name: 'Atletico Madrid',      league: 'La Liga',         country: 'Spain',        logoUrl: 'https://media.api-sports.io/football/teams/530.png'  },
  { id: 'sevilla',       name: 'Sevilla FC',           league: 'La Liga',         country: 'Spain',        logoUrl: 'https://media.api-sports.io/football/teams/536.png'  },
  { id: 'valencia',      name: 'Valencia CF',          league: 'La Liga',         country: 'Spain',        logoUrl: 'https://media.api-sports.io/football/teams/532.png'  },
  { id: 'villarreal',    name: 'Villarreal',           league: 'La Liga',         country: 'Spain',        logoUrl: 'https://media.api-sports.io/football/teams/533.png'  },
  { id: 'real-sociedad', name: 'Real Sociedad',        league: 'La Liga',         country: 'Spain',        logoUrl: 'https://media.api-sports.io/football/teams/548.png'  },
  { id: 'athletic',      name: 'Athletic Bilbao',      league: 'La Liga',         country: 'Spain',        logoUrl: 'https://media.api-sports.io/football/teams/531.png'  },
  { id: 'betis',         name: 'Real Betis',           league: 'La Liga',         country: 'Spain',        logoUrl: 'https://media.api-sports.io/football/teams/543.png'  },

  // ── Serie A ─────────────────────────────────────────────────────────────
  { id: 'inter',         name: 'Inter Milan',          league: 'Serie A',         country: 'Italy',        logoUrl: 'https://media.api-sports.io/football/teams/505.png'  },
  { id: 'juventus',      name: 'Juventus',             league: 'Serie A',         country: 'Italy',        logoUrl: 'https://media.api-sports.io/football/teams/496.png'  },
  { id: 'ac-milan',      name: 'AC Milan',             league: 'Serie A',         country: 'Italy',        logoUrl: 'https://media.api-sports.io/football/teams/489.png'  },
  { id: 'napoli',        name: 'SSC Napoli',           league: 'Serie A',         country: 'Italy',        logoUrl: 'https://media.api-sports.io/football/teams/492.png'  },
  { id: 'roma',          name: 'AS Roma',              league: 'Serie A',         country: 'Italy',        logoUrl: 'https://media.api-sports.io/football/teams/497.png'  },
  { id: 'lazio',         name: 'SS Lazio',             league: 'Serie A',         country: 'Italy',        logoUrl: 'https://media.api-sports.io/football/teams/487.png'  },
  { id: 'fiorentina',    name: 'Fiorentina',           league: 'Serie A',         country: 'Italy',        logoUrl: 'https://media.api-sports.io/football/teams/502.png'  },
  { id: 'atalanta',      name: 'Atalanta',             league: 'Serie A',         country: 'Italy',        logoUrl: 'https://media.api-sports.io/football/teams/499.png'  },

  // ── Bundesliga ──────────────────────────────────────────────────────────
  { id: 'bayern',        name: 'Bayern Munich',        league: 'Bundesliga',      country: 'Germany',      logoUrl: 'https://media.api-sports.io/football/teams/157.png'  },
  { id: 'dortmund',      name: 'Borussia Dortmund',    league: 'Bundesliga',      country: 'Germany',      logoUrl: 'https://media.api-sports.io/football/teams/165.png'  },
  { id: 'leipzig',       name: 'RB Leipzig',           league: 'Bundesliga',      country: 'Germany',      logoUrl: 'https://media.api-sports.io/football/teams/173.png'  },
  { id: 'leverkusen',    name: 'Bayer Leverkusen',     league: 'Bundesliga',      country: 'Germany',      logoUrl: 'https://media.api-sports.io/football/teams/168.png'  },
  { id: 'frankfurt',     name: 'Eintracht Frankfurt',  league: 'Bundesliga',      country: 'Germany',      logoUrl: 'https://media.api-sports.io/football/teams/169.png'  },
  { id: 'wolfsburg',     name: 'VfL Wolfsburg',        league: 'Bundesliga',      country: 'Germany',      logoUrl: 'https://media.api-sports.io/football/teams/161.png'  },
  { id: 'gladbach',      name: 'Borussia Mönchengladbach', league: 'Bundesliga', country: 'Germany',      logoUrl: 'https://media.api-sports.io/football/teams/163.png'  },

  // ── Ligue 1 ─────────────────────────────────────────────────────────────
  { id: 'psg',           name: 'Paris Saint-Germain',  league: 'Ligue 1',         country: 'France',       logoUrl: 'https://media.api-sports.io/football/teams/85.png'   },
  { id: 'marseille',     name: 'Olympique Marseille',  league: 'Ligue 1',         country: 'France',       logoUrl: 'https://media.api-sports.io/football/teams/81.png'   },
  { id: 'lyon',          name: 'Olympique Lyon',       league: 'Ligue 1',         country: 'France',       logoUrl: 'https://media.api-sports.io/football/teams/80.png'   },
  { id: 'monaco',        name: 'AS Monaco',            league: 'Ligue 1',         country: 'France',       logoUrl: 'https://media.api-sports.io/football/teams/91.png'   },
  { id: 'nice',          name: 'OGC Nice',             league: 'Ligue 1',         country: 'France',       logoUrl: 'https://media.api-sports.io/football/teams/84.png'   },

  // ── Eredivisie ──────────────────────────────────────────────────────────
  { id: 'ajax',          name: 'Ajax',                 league: 'Eredivisie',      country: 'Netherlands',  logoUrl: 'https://media.api-sports.io/football/teams/194.png'  },
  { id: 'psv',           name: 'PSV Eindhoven',        league: 'Eredivisie',      country: 'Netherlands',  logoUrl: 'https://media.api-sports.io/football/teams/197.png'  },
  { id: 'feyenoord',     name: 'Feyenoord',            league: 'Eredivisie',      country: 'Netherlands',  logoUrl: 'https://media.api-sports.io/football/teams/193.png'  },

  // ── Primeira Liga ───────────────────────────────────────────────────────
  { id: 'porto',         name: 'FC Porto',             league: 'Primeira Liga',   country: 'Portugal',     logoUrl: 'https://media.api-sports.io/football/teams/212.png'  },
  { id: 'benfica',       name: 'SL Benfica',           league: 'Primeira Liga',   country: 'Portugal',     logoUrl: 'https://media.api-sports.io/football/teams/211.png'  },
  { id: 'sporting-cp',   name: 'Sporting CP',          league: 'Primeira Liga',   country: 'Portugal',     logoUrl: 'https://media.api-sports.io/football/teams/228.png'  },
  { id: 'braga',         name: 'SC Braga',             league: 'Primeira Liga',   country: 'Portugal',     logoUrl: 'https://media.api-sports.io/football/teams/217.png'  },

  // ── Scottish Premiership ─────────────────────────────────────────────────
  { id: 'celtic',        name: 'Celtic',               league: 'Scottish Prem',   country: 'Scotland',     logoUrl: 'https://media.api-sports.io/football/teams/232.png'  },
  { id: 'rangers',       name: 'Rangers',              league: 'Scottish Prem',   country: 'Scotland',     logoUrl: 'https://media.api-sports.io/football/teams/234.png'  },

  // ── Süper Lig ────────────────────────────────────────────────────────────
  { id: 'galatasaray',   name: 'Galatasaray',          league: 'Süper Lig',       country: 'Turkey',       logoUrl: 'https://media.api-sports.io/football/teams/213.png'  },
  { id: 'fenerbahce',    name: 'Fenerbahçe',           league: 'Süper Lig',       country: 'Turkey',       logoUrl: 'https://media.api-sports.io/football/teams/633.png'  },
  { id: 'besiktas',      name: 'Beşiktaş',             league: 'Süper Lig',       country: 'Turkey',       logoUrl: 'https://media.api-sports.io/football/teams/618.png'  },
  { id: 'trabzonspor',   name: 'Trabzonspor',          league: 'Süper Lig',       country: 'Turkey',       logoUrl: 'https://media.api-sports.io/football/teams/614.png'  },

  // ── South America ────────────────────────────────────────────────────────
  { id: 'boca',          name: 'Boca Juniors',         league: 'Primera División', country: 'Argentina',   logoUrl: 'https://media.api-sports.io/football/teams/405.png'  },
  { id: 'river',         name: 'River Plate',          league: 'Primera División', country: 'Argentina',   logoUrl: 'https://media.api-sports.io/football/teams/441.png'  },
  { id: 'flamengo',      name: 'Flamengo',             league: 'Série A',          country: 'Brazil',      logoUrl: 'https://media.api-sports.io/football/teams/127.png'  },
  { id: 'santos',        name: 'Santos FC',            league: 'Série A',          country: 'Brazil',      logoUrl: 'https://media.api-sports.io/football/teams/128.png'  },
  { id: 'fluminense',    name: 'Fluminense',           league: 'Série A',          country: 'Brazil',      logoUrl: 'https://media.api-sports.io/football/teams/130.png'  },
  { id: 'corinthians',   name: 'Corinthians',          league: 'Série A',          country: 'Brazil',      logoUrl: 'https://media.api-sports.io/football/teams/131.png'  },

  // ── Saudi Pro League ────────────────────────────────────────────────────
  { id: 'al-hilal',      name: 'Al-Hilal',             league: 'Saudi Pro League', country: 'Saudi Arabia', logoUrl: 'https://media.api-sports.io/football/teams/2282.png' },
  { id: 'al-nassr',      name: 'Al-Nassr',             league: 'Saudi Pro League', country: 'Saudi Arabia', logoUrl: 'https://media.api-sports.io/football/teams/2289.png' },
  { id: 'al-ittihad',    name: 'Al-Ittihad',           league: 'Saudi Pro League', country: 'Saudi Arabia', logoUrl: 'https://media.api-sports.io/football/teams/2288.png' },

  // ── Other Europe ────────────────────────────────────────────────────────
  { id: 'shakhtar',      name: 'Shakhtar Donetsk',    league: 'Ukrainian PL',    country: 'Ukraine',      logoUrl: 'https://media.api-sports.io/football/teams/224.png'  },
  { id: 'dinamo-zagreb', name: 'Dinamo Zagreb',        league: 'HNL',             country: 'Croatia',      logoUrl: 'https://media.api-sports.io/football/teams/257.png'  },
  { id: 'red-star',      name: 'Red Star Belgrade',    league: 'Serbian SL',      country: 'Serbia',       logoUrl: 'https://media.api-sports.io/football/teams/399.png'  },
  { id: 'anderlecht',    name: 'RSC Anderlecht',       league: 'Pro League',      country: 'Belgium',      logoUrl: 'https://media.api-sports.io/football/teams/240.png'  },
  { id: 'club-bruges',   name: 'Club Brugge',          league: 'Pro League',      country: 'Belgium',      logoUrl: 'https://media.api-sports.io/football/teams/245.png'  },
  { id: 'salzburg',      name: 'Red Bull Salzburg',    league: 'Bundesliga AT',   country: 'Austria',      logoUrl: 'https://media.api-sports.io/football/teams/322.png'  },
  { id: 'young-boys',    name: 'BSC Young Boys',       league: 'Super League CH', country: 'Switzerland',  logoUrl: 'https://media.api-sports.io/football/teams/1816.png' },
];

export function searchTeams(query: string): FootballTeam[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return POPULAR_TEAMS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q) ||
      t.league.toLowerCase().includes(q),
  ).slice(0, 20);
}
