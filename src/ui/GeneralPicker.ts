import type { GeneralId } from '../factions/General';

export class GeneralPicker {
  private overlay = document.getElementById('general-picker')!;

  onSelect?: (id: GeneralId) => void;

  constructor() {
    this.overlay.querySelectorAll('[data-general]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.general as GeneralId;
        this.hide();
        this.onSelect?.(id);
      });
    });
  }

  show(): void {
    this.overlay.classList.remove('hidden');
  }

  hide(): void {
    this.overlay.classList.add('hidden');
  }
}
