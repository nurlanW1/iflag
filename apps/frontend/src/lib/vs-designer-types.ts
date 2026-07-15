export interface VSEntity {
  name: string;
  imageUrl: string;
  type: 'flag' | 'club';
}

export type VSBannerTemplate = 'matchday' | 'result' | 'group';
export type VSBackgroundStyle = 'gradient' | 'stadium' | 'image';

export interface VSDesignerState {
  template: VSBannerTemplate;
  left: VSEntity;
  right: VSEntity;
  groupName: string;
  groupTeams: VSEntity[];
  leftScore: string;
  rightScore: string;
  scoreMode: boolean;
  bgColor: string;
  backgroundStyle: VSBackgroundStyle;
  backgroundImageUrl: string;
  eventTitle: string;
  vsText: string;
  dateMode: 'auto' | 'manual';
  dateText: string;
  statusText: string;
  venueName: string;
  venueCity: string;
  hashtag: string;
  titleSize: number;
  centerSize: number;
  nameSize: number;
  titleColor: string;
  centerColor: string;
  nameColor: string;
  dateColor: string;
}

export const defaultState: VSDesignerState = {
  template: 'result',
  left:  { name: 'Real Madrid',  imageUrl: 'https://media.api-sports.io/football/teams/541.png', type: 'club' },
  right: { name: 'FC Barcelona', imageUrl: 'https://media.api-sports.io/football/teams/529.png', type: 'club' },
  groupName: 'GROUP A',
  groupTeams: [
    { name: 'Real Madrid', imageUrl: 'https://media.api-sports.io/football/teams/541.png', type: 'club' },
    { name: 'FC Barcelona', imageUrl: 'https://media.api-sports.io/football/teams/529.png', type: 'club' },
    { name: 'Manchester City', imageUrl: 'https://media.api-sports.io/football/teams/50.png', type: 'club' },
    { name: 'Bayern Munich', imageUrl: 'https://media.api-sports.io/football/teams/157.png', type: 'club' },
  ],
  leftScore:  '3',
  rightScore: '2',
  scoreMode:  true,
  bgColor:    '#0A1628',
  backgroundStyle: 'stadium',
  backgroundImageUrl: '',
  eventTitle: 'EL CLASICO',
  vsText:     'VS',
  dateMode:   'auto',
  dateText:   '',
  statusText: 'FULL TIME',
  venueName:  'SANTIAGO BERNABEU',
  venueCity:  'MADRID',
  hashtag:    '#ELCLASICO',
  titleSize:  32,
  centerSize: 130,
  nameSize:   34,
  titleColor:  '#FFFFFF',
  centerColor: '#FFFFFF',
  nameColor:   '#CCCCCC',
  dateColor:   '#666666',
};
