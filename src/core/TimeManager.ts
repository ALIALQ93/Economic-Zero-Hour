export class TimeManager {
  private elapsedSeconds = 0;
  private tickIntervalMs = 5000;
  private lastTickAt = 0;
  private running = true;

  constructor(
    private onTick: () => void,
    private onSecond?: (seconds: number) => void,
  ) {}

  update(deltaMs: number): void {
    if (!this.running) return;

    this.elapsedSeconds += deltaMs / 1000;
    this.onSecond?.(Math.floor(this.elapsedSeconds));

    this.lastTickAt += deltaMs;
    if (this.lastTickAt >= this.tickIntervalMs) {
      this.lastTickAt -= this.tickIntervalMs;
      this.onTick();
    }
  }

  getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  formatTime(): string {
    const total = Math.floor(this.elapsedSeconds);
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  pause(): void {
    this.running = false;
  }

  resume(): void {
    this.running = true;
  }
}
