import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  readonly points = signal<number>(this.loadPoints());
  readonly notification = signal<string>('');

  constructor() {
    effect(() => {
      localStorage.setItem('comollego_gamification_state', this.points().toString());
    });
  }

  private loadPoints(): number {
    try {
      const saved = localStorage.getItem('comollego_gamification_state');
      return saved ? Number(saved) : 60;
    } catch {
      return 60;
    }
  }

  triggerExpGain(points: number, reason: string) {
    this.points.update(p => p + points);
    this.notification.set(`+${points} EXP por ${reason}`);
    setTimeout(() => {
      this.notification.set('');
    }, 4500);
  }
}
