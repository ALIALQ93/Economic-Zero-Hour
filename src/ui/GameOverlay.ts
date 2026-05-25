import type { GameOutcome } from '../game/WinConditionChecker';

export interface OverlayStats {
  controlledCountries: number;
  totalInfluence: number;
  actionsCount: number;
  playTime: string;
}

export class GameOverlay {
  private overlay = document.getElementById('game-overlay')!;
  private titleEl = document.getElementById('overlay-title')!;
  private messageEl = document.getElementById('overlay-message')!;
  private statsEl = document.getElementById('overlay-stats')!;

  onRestart?: () => void;

  constructor() {
    document.getElementById('overlay-restart')!.addEventListener('click', () => {
      this.onRestart?.();
    });
  }

  show(outcome: GameOutcome, message: string, stats: OverlayStats): void {
    const isWin = outcome.startsWith('win');
    this.overlay.classList.remove('hidden', 'win', 'loss');
    this.overlay.classList.add(isWin ? 'win' : 'loss');

    const titles: Record<GameOutcome, string> = {
      playing: '',
      win_partial: 'فوز جزئي',
      win_absolute: 'فوز مطلق',
      loss_bankruptcy: 'إفلاس',
      loss_dominated: 'هزيمة',
    };

    this.titleEl.textContent = titles[outcome];
    this.messageEl.textContent = message;
    this.statsEl.innerHTML = `
      <p>الدول الخاضعة: <strong>${stats.controlledCountries}</strong></p>
      <p>إجمالي نفوذك: <strong>${stats.totalInfluence}%</strong></p>
      <p>القرارات الاقتصادية: <strong>${stats.actionsCount}</strong></p>
      <p>مدة المباراة: <strong>${stats.playTime}</strong></p>
    `;
  }

  hide(): void {
    this.overlay.classList.add('hidden');
  }
}
