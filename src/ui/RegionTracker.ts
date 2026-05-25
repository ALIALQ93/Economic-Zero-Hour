import type { RegionStatus } from '../game/WinConditionChecker';

export class RegionTracker {
  private list = document.getElementById('region-list')!;

  render(regions: RegionStatus[]): void {
    this.list.innerHTML = regions
      .map(
        (r) => `
      <div class="region-item ${r.fullyControlled ? 'done' : ''}">
        <span class="region-name">${r.nameAr}</span>
        <span class="region-count">${r.controlled}/${r.total}</span>
        <div class="region-bar"><div class="region-fill" style="width:${r.progressPct}%"></div></div>
      </div>`,
      )
      .join('');
  }
}
