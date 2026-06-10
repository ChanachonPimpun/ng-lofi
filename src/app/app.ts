import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerCard } from './components/player-card/player-card';
import { ShaderBackgroundComponent } from './components/shader-background/shader-background';
import { ThemeService, BackgroundMode } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PlayerCard, ShaderBackgroundComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  themeService = inject(ThemeService);
  currentMode = this.themeService.currentMode;
}
