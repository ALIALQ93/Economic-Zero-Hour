import type { Unit } from '../units/Unit';
import type { ResourceManager } from '../resources/ResourceManager';
import { RECRUIT_LOAN_ADVISOR_COST } from '../units/unitRoles';

export class UnitBar {
  private analystBtn = document.getElementById('btn-unit-analyst')! as HTMLButtonElement;
  private advisorBtn = document.getElementById('btn-unit-advisor')! as HTMLButtonElement;
  private recruitBtn = document.getElementById('btn-recruit-advisor')! as HTMLButtonElement;

  onSelectUnit?: (unitId: string) => void;
  onRecruit?: () => void;

  constructor() {
    this.analystBtn.addEventListener('click', () => this.onSelectUnit?.('player_analyst'));
    this.advisorBtn.addEventListener('click', () => {
      if (!this.advisorBtn.disabled) this.onSelectUnit?.('player_loan_advisor');
    });
    this.recruitBtn.addEventListener('click', () => this.onRecruit?.());
  }

  render(
    playerUnits: Unit[],
    selectedId: string | null,
    resources: ResourceManager,
    hired: boolean,
  ): void {
    const analyst = playerUnits.find((u) => u.id === 'player_analyst');
    const advisor = playerUnits.find((u) => u.id === 'player_loan_advisor');

    this.analystBtn.classList.toggle('active', selectedId === 'player_analyst');
    this.analystBtn.textContent = analyst?.busy ? '◆ محلل ⟳' : '◆ محلل مالي';

    if (hired && advisor) {
      this.recruitBtn.classList.add('hidden');
      this.advisorBtn.classList.remove('hidden');
      this.advisorBtn.disabled = false;
      this.advisorBtn.classList.toggle('active', selectedId === 'player_loan_advisor');
      this.advisorBtn.textContent = advisor.busy ? '◆ مستشار ⟳' : '◆ مستشار قرض';
    } else {
      this.advisorBtn.classList.add('hidden');
      this.recruitBtn.classList.remove('hidden');
      const canAfford = resources.canAfford(RECRUIT_LOAN_ADVISOR_COST);
      this.recruitBtn.disabled = !canAfford;
      this.recruitBtn.textContent = `+ مستشار قرض (${RECRUIT_LOAN_ADVISOR_COST.capital}💰)`;
    }
  }
}
