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
  titleSize: number;
  centerSize: number;
  nameSize: number;
  titleColor: string;
  centerColor: string;
  nameColor: string;
  dateColor: string;
}

export const defaultState: VSDesignerState = {
  left:  { name: 'Uzbekistan', imageUrl: 'https://flagcdn.com/w320/uz.png', type: 'flag' },
  right: { name: 'Portugal',   imageUrl: 'https://flagcdn.com/w320/pt.png', type: 'flag' },
  leftScore:  '0',
  rightScore: '0',
  scoreMode:  true,
  bgColor:    '#0A1628',
  eventTitle: 'WORLD CUP',
  vsText:     'VS',
  dateMode:   'auto',
  dateText:   '',
  titleSize:  30,
  centerSize: 120,
  nameSize:   24,
  titleColor:  '#FFFFFF',
  centerColor: '#FFFFFF',
  nameColor:   '#CCCCCC',
  dateColor:   '#666666',
};
