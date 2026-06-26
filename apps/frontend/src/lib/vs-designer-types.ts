export interface VSEntity {
  name: string;
  imageUrl: string;
  type: 'flag' | 'club';
}

export interface VSDesignerState {
  left: VSEntity;
  right: VSEntity;
  bgColor: string;
  eventTitle: string;
  vsText: string;
  dateMode: 'auto' | 'manual';
  dateText: string;
  titleSize: number;
  vsSize: number;
  nameSize: number;
  titleColor: string;
  vsColor: string;
  nameColor: string;
  dateColor: string;
}

export const defaultState: VSDesignerState = {
  left: {
    name: 'Uzbekistan',
    imageUrl: 'https://flagcdn.com/w320/uz.png',
    type: 'flag',
  },
  right: {
    name: 'Portugal',
    imageUrl: 'https://flagcdn.com/w320/pt.png',
    type: 'flag',
  },
  bgColor: '#0A1628',
  eventTitle: 'WORLD CUP 2026',
  vsText: 'VS',
  dateMode: 'auto',
  dateText: '',
  titleSize: 28,
  vsSize: 96,
  nameSize: 22,
  titleColor: '#FFFFFF',
  vsColor: '#FFFFFF',
  nameColor: '#CCCCCC',
  dateColor: '#888888',
};
