import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService, Song } from '../../services/audio.service';
import { ThemeService, BackgroundMode } from '../../services/theme.service';

@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-card.html',
  styleUrls: ['./player-card.css']
})
export class PlayerCard implements OnInit, OnDestroy {
  audioService = inject(AudioService);
  themeService = inject(ThemeService);

  currentMode = this.themeService.currentMode;
  currentSong = this.audioService.currentSong;
  isPlaying = this.audioService.isPlaying;
  progress = this.audioService.progress;
  duration = this.audioService.duration;
  volume = this.audioService.volume;
  playlist = this.audioService.playlist;

  currentTimeString = signal<string>(this.getCurrentTimeString());
  private timeInterval: any;

  ngOnInit() {
    this.timeInterval = setInterval(() => {
      this.currentTimeString.set(this.getCurrentTimeString());
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private getCurrentTimeString(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  progressPercentage = computed(() => {
    if (this.duration() === 0) return 0;
    return (this.progress() / this.duration()) * 100;
  });

  playPause() {
    this.audioService.togglePlayPause();
  }

  next() {
    this.audioService.next();
  }

  prev() {
    this.audioService.prev();
  }

  playSong(song: Song) {
    this.audioService.playSong(song);
  }

  onSeek(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const time = (Number(value) / 100) * this.duration();
    this.audioService.seek(time);
  }

  onVolumeChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.audioService.setVolume(Number(value));
  }

  formatTime(time: number): string {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  selectMode(mode: BackgroundMode) {
    this.themeService.setMode(mode);
  }
}
