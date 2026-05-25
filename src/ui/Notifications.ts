export class Notifications {
  private container = document.getElementById('notifications')!;
  private timeout: ReturnType<typeof setTimeout> | null = null;

  show(message: string, durationMs = 4000): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.container.innerHTML = `<span class="toast">${message}</span>`;
    this.timeout = setTimeout(() => {
      this.container.innerHTML = '';
      this.timeout = null;
    }, durationMs);
  }
}
