/** خطوط التجارة الاستراتيجية على الخريطة المتوسطة */
export interface TradeRouteDef {
  id: string;
  from: string;
  to: string;
}

export const TRADE_ROUTES: TradeRouteDef[] = [
  { id: 'northam_zahiran', from: 'northam', to: 'zahiran' },
  { id: 'falconia_northam', from: 'falconia', to: 'northam' },
  { id: 'steelmark_zahiran', from: 'steelmark', to: 'zahiran' },
  { id: 'zahiran_qaseria', from: 'zahiran', to: 'qaseria' },
  { id: 'qaseria_miras', from: 'qaseria', to: 'miras' },
  { id: 'ironfeld_copanga', from: 'ironfeld', to: 'copanga' },
  { id: 'copanga_sirania', from: 'copanga', to: 'sirania' },
  { id: 'sirania_ndalu', from: 'sirania', to: 'ndalu' },
  { id: 'ndalu_portica', from: 'ndalu', to: 'portica' },
  { id: 'portica_freeport', from: 'portica', to: 'freeport' },
  { id: 'kalmera_portica', from: 'kalmera', to: 'portica' },
  { id: 'northam_portica', from: 'northam', to: 'portica' },
  { id: 'miras_havaria', from: 'miras', to: 'havaria' },
  { id: 'zahiran_sirania', from: 'zahiran', to: 'sirania' },
];

export type TradeFlow = 'player' | 'ai' | 'neutral';
