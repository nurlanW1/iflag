export interface VSEntity {
  name: string;
  imageUrl: string;
  type: 'flag' | 'club';
}

export interface VSDesignerState {
  left: VSEntity;
  right: VSEntity;
  leftScore: string;
  rightScore: string;
  scoreMode: boolean;
  bgColor: string;
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
  left:  { name: 'Real Madrid',  imageUrl: 'https://media.api-sports.io/football/teams/541.png', type: 'club' },
  right: { name: 'FC Barcelona', imageUrl: 'https://media.api-sports.io/football/teams/529.png', type: 'club' },
  leftScore:  '3',
  rightScore: '2',
  scoreMode:  true,
  bgColor:    '#0A1628',
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
