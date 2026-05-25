import type { InfluenceAction } from '../influence/InfluenceSystem';

export type CommandId = InfluenceAction | 'super' | 'details' | 'move' | 'cut_trade';

export interface CommandOption {
  id: CommandId;
  label: string;
  icon: string;
  enabled: boolean;
  hint?: string;
}

export class CommandMenu {
  private menu = document.getElementById('command-menu')!;
  private centerLabel = document.getElementById('cmd-center-label')!;
  private itemsEl = document.getElementById('command-menu-items')!;
  private countryId: string | null = null;

  onCommand?: (countryId: string, command: CommandId) => void;

  constructor() {
    this.menu.addEventListener('click', (e) => {
      if (e.target === this.menu) this.hide();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }

  show(screenX: number, screenY: number, countryName: string, countryId: string, options: CommandOption[]): void {
    this.countryId = countryId;
    this.centerLabel.textContent = countryName;

    const radius = options.length > 6 ? 82 : 72;
    const count = options.length;
    this.itemsEl.innerHTML = '';

    options.forEach((opt, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cmd-item ${opt.enabled ? '' : 'disabled'} ${opt.id === 'super' ? 'super' : ''}`;
      btn.disabled = !opt.enabled;
      btn.title = opt.hint ?? '';
      btn.style.transform = `translate(${x}px, ${y}px)`;
      btn.innerHTML = `<span class="cmd-icon">${opt.icon}</span><span class="cmd-label">${opt.label}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (opt.enabled && this.countryId) {
          this.onCommand?.(this.countryId, opt.id);
          this.hide();
        }
      });
      this.itemsEl.appendChild(btn);
    });

    const pad = 100;
    const x = Math.min(window.innerWidth - pad * 2, Math.max(pad, screenX)) - pad;
    const y = Math.min(window.innerHeight - pad * 2, Math.max(pad, screenY)) - pad;
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;
    this.menu.classList.remove('hidden');
  }

  hide(): void {
    this.menu.classList.add('hidden');
    this.countryId = null;
  }

  isVisible(): boolean {
    return !this.menu.classList.contains('hidden');
  }
}
