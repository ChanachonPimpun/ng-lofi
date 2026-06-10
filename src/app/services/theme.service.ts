import { Injectable, signal } from '@angular/core';

export type BackgroundMode = 'coffee' | 'rain' | 'space';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentMode = signal<BackgroundMode>('coffee');

  setMode(mode: BackgroundMode) {
    this.currentMode.set(mode);
  }
}
