import { Engine, Scene, PointerEventTypes } from '@babylonjs/core';
import { GameState } from './GameState';
import { EventBus } from './EventBus';
import { TimeManager } from './TimeManager';
import { WorldMap } from '../map/WorldMap';
import { UnitRenderer } from '../map/UnitRenderer';
import { HUD } from '../ui/HUD';
import { CountryPanel, type PanelGeneralFlags } from '../ui/CountryPanel';
import { Notifications } from '../ui/Notifications';
import { RegionTracker } from '../ui/RegionTracker';
import { GameOverlay } from '../ui/GameOverlay';
import { UnitBar } from '../ui/UnitBar';
import { CommandMenu, type CommandOption, type CommandId } from '../ui/CommandMenu';
import { GeneralPicker } from '../ui/GeneralPicker';
import { AIController, type AiLevel } from '../ai/AIController';
import type { InfluenceAction } from '../influence/InfluenceSystem';
import type { GeneralId } from '../factions/General';
import { unitCanPerform } from '../units/unitRoles';
import { CUT_TRADE_COST, CUT_TRADE_MIN_INFLUENCE } from '../map/TradeRouteManager';

export class GameEngine {
  private engine: Engine;
  private scene: Scene;
  private state!: GameState;
  private worldMap!: WorldMap;
  private unitRenderer!: UnitRenderer;
  private ai!: AIController;
  private readonly aiLevel: AiLevel = 2;
  private timeManager!: TimeManager;
  private events = new EventBus();
  private hud = new HUD();
  private panel = new CountryPanel();
  private unitBar = new UnitBar();
  private commandMenu = new CommandMenu();
  private generalPicker = new GeneralPicker();
  private notifications = new Notifications();
  private regionTracker = new RegionTracker();
  private overlay = new GameOverlay();
  private lastFrame = performance.now();
  private started = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio, 2));
    this.scene = new Scene(this.engine);

    this.overlay.onRestart = () => window.location.reload();
    this.generalPicker.onSelect = (id) => this.initGame(id);
    window.addEventListener('resize', () => this.engine.resize());
  }

  begin(): void {
    this.generalPicker.show();
  }

  private initGame(generalId: GeneralId): void {
    if (this.started) return;
    this.started = true;

    this.state = new GameState(generalId);
    this.worldMap = new WorldMap(this.engine, this.scene, this.state.countries);
    this.unitRenderer = new UnitRenderer(this.scene);

    const camera = this.worldMap.build();
    camera.attachControl(this.canvas, true);

    this.state.units.setCountryPositionResolver((id) => this.worldMap.getCountryPosition(id));
    this.state.units.spawnStartingUnits();

    this.ai = new AIController(
      this.aiLevel,
      this.state.countries,
      this.state.units,
      this.state.tradeRoutes,
      (id) => this.worldMap.getCountryPosition(id),
    );

    this.timeManager = new TimeManager(
      () => this.onResourceTick(),
      () => this.hud.updateTime(this.timeManager.formatTime()),
    );

    this.setupInput();
    this.setupUI();
    this.refreshUI();

    const g = this.state.general;
    this.hud.updateGeneral(g.nameAr, g.isSuperWeaponAvailable());
    this.hud.setTradeRoutesActive(this.worldMap.tradeRoutes.visible);
    const hints: Record<string, string> = {
      tech_king: 'استثمار +9% شمال · T خطوط التجارة',
      retail_caesar: 'مصنع +14% · إغراق سوقي · T تجارة',
      smart_investor: 'استثمار +7% · استحواذ كامل · T تجارة',
      debt_hunter: 'قرض +12% · قطع تجارة · الفخ السيادي',
      market_mover: 'انهيار كبير · +9% جزر/نورثام · قرض +11%',
      oil_prince: 'حزام نفطي +9% · +10⛽/حقل · الصدمة النفطية',
      sovereign_shadow: 'جنوب +10% · انقلاب هادئ 85% نفوذ',
      food_lord: 'جنوب +9% · +8🌾/حقل · مجاعة إقليمية',
      metal_king: 'شمال +9% · +7💎/منجم · الحظر الكامل',
    };
    this.notifications.show(`💼 ${g.nameAr} — ${hints[g.id] ?? ''}`);
    this.notifications.show(`🤖 خصم: ${this.ai.levelLabelAr} (مستوى ${this.ai.level})`, 5000);

    this.engine.runRenderLoop(() => this.gameLoop());
  }

  private gameLoop(): void {
    const now = performance.now();
    const delta = now - this.lastFrame;
    this.lastFrame = now;

    if (!this.state.isGameOver) {
      this.timeManager.update(delta);
    }

    const arrived = this.state.units.update(delta);
    for (const unit of arrived) {
      if (unit.faction === 'player' && unit.atCountryId) {
        const c = this.state.getCountry(unit.atCountryId);
        if (c) {
          this.notifications.show(`✓ ${unit.displayName} → ${c.displayName}`, 2500);
          if (this.state.selectedCountryId === unit.atCountryId && this.panel.isOpen()) {
            this.panel.refresh(c, unit, this.panelFlags());
          }
        }
      }
    }

    this.worldMap.updateAnimations(delta);
    this.unitRenderer.sync(this.state.units.units, delta);
    this.unitBar.render(
      this.state.units.getPlayerUnits(),
      this.state.units.selectedUnitId,
      this.state.resources,
      this.state.units.playerLoanAdvisorHired,
    );
    this.scene.render();
  }

  private setupUI(): void {
    this.unitBar.onSelectUnit = (id) => this.selectPlayerUnit(id);
    this.unitBar.onRecruit = () => this.handleRecruitAdvisor();

    this.commandMenu.onCommand = (countryId, cmd) => this.handleCommand(countryId, cmd);

    document.getElementById('layer-toggle')!.addEventListener('click', () => {
      if (!this.state.isGameOver) this.toggleHiddenLayer();
    });
    document.getElementById('trade-toggle')!.addEventListener('click', () => {
      if (!this.state.isGameOver) this.toggleTradeRoutes();
    });

    window.addEventListener('keydown', (e) => {
      if (!this.started || this.state.isGameOver) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        this.toggleHiddenLayer();
      }
      if (e.key === 't' || e.key === 'T') {
        this.toggleTradeRoutes();
      }
      if (e.key === 'Escape') this.commandMenu.hide();
      if (e.key === '1') this.selectPlayerUnit('player_analyst');
      if (e.key === '2' && this.state.units.hasPlayerLoanAdvisor()) {
        this.selectPlayerUnit('player_loan_advisor');
      }
    });
  }

  private setupInput(): void {
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (!this.started || this.state.isGameOver) return;
      if (pointerInfo.type !== PointerEventTypes.POINTERPICK) return;
      const pick = pointerInfo.pickInfo;
      if (!pick?.hit || !pick.pickedMesh) return;

      const unitId = this.unitRenderer.getUnitIdFromMesh(pick.pickedMesh);
      if (unitId) {
        const unit = this.state.units.getUnit(unitId);
        if (unit?.faction === 'player') {
          this.commandMenu.hide();
          this.selectPlayerUnit(unitId);
          this.notifications.show(`✓ ${unit.displayName}`);
          return;
        }
      }

      const countryId = this.worldMap.getCountryIdFromMesh(pick.pickedMesh);
      if (!countryId) {
        this.commandMenu.hide();
        return;
      }

      const country = this.state.getCountry(countryId);
      if (!country) return;

      const evt = pointerInfo.event as PointerEvent;
      this.state.selectCountry(countryId);
      this.state.units.orderPlayerToCountry(countryId);
      this.panel.show(country, this.state.units.getSelectedUnit(), this.panelFlags());
      this.commandMenu.show(
        evt.clientX,
        evt.clientY,
        country.displayName,
        countryId,
        this.buildCommands(countryId),
      );
      this.events.emit('country:selected', countryId);
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private buildCommands(countryId: string): CommandOption[] {
    const country = this.state.getCountry(countryId)!;
    const unit = this.state.units.getSelectedUnit();
    const atCountry = unit?.atCountryId === countryId && !unit?.busy;
    const g = this.state.general;

    const investGain = unit && atCountry ? this.state.getInfluenceGain(unit, 'invest', country) : 0;
    const factoryGain = unit && atCountry ? this.state.getInfluenceGain(unit, 'factory', country) : 0;
    const loanGain =
      unit?.role === 'loan_advisor' && atCountry ? g.getLoanBonus() : 0;
    const routesHere = this.state.tradeRoutes.getRoutesForCountry(countryId).length;
    const canCut =
      !!unit &&
      atCountry &&
      this.state.tradeRoutes.canCutAtCountry(countryId, country.playerInfluence);

    const superCheck =
      unit?.role === 'analyst' && atCountry
        ? g.canUseSuperWeapon(country, true, this.state.resources)
        : { ok: false, reason: 'يتطلب المحلل في الدولة' };

    const opts: CommandOption[] = [
      {
        id: 'move',
        label: 'تحريك',
        icon: '📍',
        enabled: !!unit && !unit.busy,
        hint: 'إرسال الوحدة المحددة',
      },
      {
        id: 'details',
        label: 'تفاصيل',
        icon: '📋',
        enabled: true,
      },
      {
        id: 'invest',
        label: `استثمر +${investGain || '?'}`,
        icon: '📈',
        enabled: !!unit && atCountry && unitCanPerform(unit.role, 'invest'),
        hint: 'المحلل المالي',
      },
      {
        id: 'loan',
        label: `قرض +${loanGain || g.getLoanBonus()}`,
        icon: '🏦',
        enabled: !!unit && atCountry && unitCanPerform(unit.role, 'loan'),
        hint: 'مستشار القرض',
      },
      {
        id: 'factory',
        label: `مصنع +${factoryGain || g.getFactoryBonus()}`,
        icon: '🏭',
        enabled: !!unit && atCountry && unitCanPerform(unit.role, 'factory'),
        hint: 'المحلل المالي',
      },
      {
        id: 'cut_trade',
        label: 'قطع تجارة',
        icon: '✂️',
        enabled: canCut,
        hint: canCut
          ? `${routesHere} خط(وط) · ${CUT_TRADE_COST.capital}💰 · نفوذ ${CUT_TRADE_MIN_INFLUENCE}%+`
          : `نفوذ ${CUT_TRADE_MIN_INFLUENCE}%+ وخطوط نشطة`,
      },
      {
        id: 'super',
        label: g.superWeaponNameAr,
        icon: '⚡',
        enabled: superCheck.ok && g.isSuperWeaponAvailable(),
        hint:
          superCheck.reason ??
          (g.isMapWideSuperWeapon() ? 'يضرب الخريطة كاملة' : g.superWeaponNameAr),
      },
    ];

    return opts;
  }

  private handleCommand(countryId: string, cmd: CommandId): void {
    if (cmd === 'details') {
      const country = this.state.getCountry(countryId);
      if (country) this.panel.show(country, this.state.units.getSelectedUnit(), this.panelFlags());
      return;
    }
    if (cmd === 'move') {
      if (this.state.units.orderPlayerToCountry(countryId)) {
        const c = this.state.getCountry(countryId);
        this.notifications.show(`⟳ → ${c?.displayName}`);
      }
      return;
    }
    if (cmd === 'super') {
      this.handleSuperWeapon(countryId);
      return;
    }
    if (cmd === 'cut_trade') {
      this.handleCutTrade(countryId);
      return;
    }
    this.handleInfluenceAction(countryId, cmd as InfluenceAction);
  }

  private selectPlayerUnit(id: string): void {
    const unit = this.state.units.selectUnit(id);
    if (!unit) return;
    this.hud.updateSelectedUnit(unit);
    this.refreshUI();
    if (this.state.selectedCountryId) {
      const country = this.state.getCountry(this.state.selectedCountryId);
      if (country) this.panel.refresh(country, unit, this.panelFlags());
    }
  }

  private handleRecruitAdvisor(): void {
    if (this.state.isGameOver) return;
    const advisor = this.state.recruitLoanAdvisor();
    if (!advisor) {
      this.notifications.show('⚠ 2000💰 + 30💎 لتعيين مستشار القرض');
      return;
    }
    this.state.units.selectUnit(advisor.id);
    this.notifications.show('✓ مستشار القرض جاهز — القروض +10%', 5000);
    this.refreshUI();
  }

  private handleInfluenceAction(countryId: string, action: InfluenceAction): void {
    if (this.state.isGameOver) return;

    const country = this.state.getCountry(countryId);
    const unit = this.state.units.getSelectedUnit();
    if (!country || !unit) return;

    if (unit.atCountryId !== countryId) {
      this.notifications.show(`⚠ ${unit.displayName} ليس هنا`);
      return;
    }
    if (!this.state.canPerformAction(unit, action)) {
      this.notifications.show(action === 'loan' ? '⚠ يتطلب مستشار القرض' : '⚠ يتطلب المحلل');
      return;
    }

    if (!this.state.applyInfluenceAction(countryId, action)) {
      this.notifications.show('⚠ موارد غير كافية');
      return;
    }

    this.ai.recordPlayerAction(countryId);
    const gain = this.state.getInfluenceGain(unit, action, country);
    this.notifications.show(`✓ ${country.displayName} — نفوذك ${Math.round(country.playerInfluence)}% (+${gain})`);
    this.refreshUI();
    this.checkGameEnd();
  }

  private handleSuperWeapon(countryId: string): void {
    if (this.state.isGameOver) return;

    const unit = this.state.units.getSelectedUnit();
    if (unit?.role !== 'analyst') {
      this.notifications.show('⚠ يتطلب المحلل المالي');
      return;
    }

    const country = this.state.getCountry(countryId);
    if (!country) return;

    const check = this.state.general.canUseSuperWeapon(
      country,
      unit.atCountryId === countryId,
      this.state.resources,
    );
    if (!check.ok) {
      this.notifications.show(`⚠ ${check.reason}`);
      return;
    }

    if (!this.state.applySuperWeapon(countryId)) {
      this.notifications.show('⚠ فشل تنفيذ السلاح');
      return;
    }

    this.ai.recordPlayerAction(countryId);

    if (this.state.general.isMapWideSuperWeapon()) {
      const mapWideMsgs: Record<string, string> = {
        market_mover: '⚡ الانهيار الكبير! — +2500💰 تعويض',
        oil_prince: '⚡ الصدمة النفطية! العالم يختنق — +250⛽',
        food_lord: '⚡ المجاعة المُدارة! — الجنوب يجوع · +120🌾',
        metal_king: '⚡ الحظر الكامل! — الصناعة تتجمد · +200💎',
      };
      this.notifications.show(
        mapWideMsgs[this.state.general.id] ?? '⚡ ضربة عالمية!',
        7000,
      );
      this.hud.updateGeneral(this.state.general.nameAr, false);
      this.refreshUI();
      this.checkGameEnd();
      return;
    }

    const msgs: Record<string, string> = {
      tech_king: `⚡ شلل رقمي على ${country.displayName}!`,
      retail_caesar: `⚡ إغراق كامل لسوق ${country.displayName}!`,
      smart_investor: `⚡ استحواذ كامل على ${country.displayName}!`,
      debt_hunter: `⚡ الفخ السيادي — ${country.displayName} في ديونك!`,
      sovereign_shadow: `⚡ انقلاب هادئ — ${country.displayName} تحت سيطرتك!`,
    };
    const msg = msgs[this.state.general.id] ?? `⚡ ${country.displayName}!`;
    this.notifications.show(msg, 6000);
    this.hud.updateGeneral(this.state.general.nameAr, false);
    this.refreshUI();
    this.checkGameEnd();
  }

  private panelFlags(): PanelGeneralFlags {
    const id = this.state.general.id;
    return {
      oilPrince: id === 'oil_prince',
      foodLord: id === 'food_lord',
      metalKing: id === 'metal_king',
    };
  }

  private toggleHiddenLayer(): void {
    const on = this.state.toggleHiddenLayer();
    this.worldMap.setHiddenLayerVisible(on);
    this.hud.setHiddenLayerActive(on);
  }

  private handleCutTrade(countryId: string): void {
    if (this.state.isGameOver) return;

    const country = this.state.getCountry(countryId);
    const result = this.state.cutTradeAtCountry(countryId);
    if (!result.ok) {
      this.notifications.show(
        `⚠ قطع التجارة: نفوذ ${CUT_TRADE_MIN_INFLUENCE}%+ · ${CUT_TRADE_COST.capital}💰 · المحلل حاضر`,
      );
      return;
    }
    this.ai.recordPlayerAction(countryId);
    this.notifications.show(
      `✂️ قطعت ${result.count} خط تجارة من ${country?.displayName}`,
      5000,
    );
    this.refreshUI();
  }

  private toggleTradeRoutes(): void {
    const on = this.worldMap.toggleTradeRoutes();
    this.hud.setTradeRoutesActive(on);
    this.notifications.show(on ? '🟢 خطوط التجارة ظاهرة' : 'خطوط التجارة مخفية', 2000);
  }

  private onResourceTick(): void {
    if (this.state.isGameOver) return;

    this.state.resources.tick();
    const debtBonus = this.state.getDebtTrapBonus();
    if (debtBonus > 0) {
      this.state.resources.addBonus({ capital: debtBonus });
    }
    const oilBonus = this.state.getOilBeltTickBonus();
    if (oilBonus > 0) this.state.resources.addBonus({ oil: oilBonus });
    const foodBonus = this.state.getFoodSouthTickBonus();
    if (foodBonus > 0) this.state.resources.addBonus({ food: foodBonus });
    const metalBonus = this.state.getMetalNorthTickBonus();
    if (metalBonus > 0) this.state.resources.addBonus({ metals: metalBonus });
    const tradePenalty = this.state.getTradeSeverancePenalty();
    if (tradePenalty.oil > 0 || tradePenalty.food > 0) {
      this.state.resources.addBonus({
        oil: -tradePenalty.oil,
        food: -tradePenalty.food,
      });
    }
    this.hud.updateResources(this.state.resources.get());

    const aiMove = this.ai.onGameTick();
    if (aiMove) {
      const verbs: Record<string, string> = {
        invest: `استثمر في ${aiMove.countryName}`,
        loan: `أقرض في ${aiMove.countryName}`,
        factory: `بنى مصنعاً في ${aiMove.countryName}`,
        cut_trade: `قطع التجارة من ${aiMove.countryName}`,
      };
      this.notifications.show(`⚠ الخصم ${verbs[aiMove.actionType] ?? aiMove.countryName}`, 4500);
    }

    this.state.checkPassiveLoss();
    this.refreshUI();
    this.checkGameEnd();
  }

  private checkGameEnd(): void {
    const status = this.state.getGameStatus();
    if (status.outcome === 'playing') return;

    this.state.gameOutcome = status.outcome;
    this.timeManager.pause();
    this.commandMenu.hide();

    const totalInfluence = [...this.state.countries.values()].reduce(
      (s, c) => s + c.playerInfluence,
      0,
    );

    this.overlay.show(status.outcome, status.message, {
      controlledCountries: status.controlledCountries,
      totalInfluence: Math.round(totalInfluence),
      actionsCount: this.state.actionsCount,
      playTime: this.timeManager.formatTime(),
    });
  }

  private refreshUI(): void {
    const status = this.state.getGameStatus();
    this.regionTracker.render(status.regions);
    this.worldMap.updateCountryVisuals(this.state.tradeRoutes.severed);
    if (this.state.hiddenLayer) this.worldMap.setHiddenLayerVisible(true);
    this.unitRenderer.sync(this.state.units.units);
    this.hud.updateResources(this.state.resources.get());
    this.hud.updateSelectedUnit(this.state.units.getSelectedUnit());
    this.unitBar.render(
      this.state.units.getPlayerUnits(),
      this.state.units.selectedUnitId,
      this.state.resources,
      this.state.units.playerLoanAdvisorHired,
    );

    const countryId = this.state.selectedCountryId;
    if (countryId && this.panel.isOpen()) {
      const country = this.state.getCountry(countryId);
      if (country) {
        this.panel.refresh(country, this.state.units.getSelectedUnit(), this.panelFlags());
      }
    }
  }

  dispose(): void {
    this.engine.dispose();
  }
}
