import { Injectable, signal } from '@angular/core';

export interface Song {
  id: number;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioObj = new Audio();

  // Mock playlist
  playlist = signal<Song[]>([
    {
      id: 1,
      title: 'Come Find Me',
      artist: 'Amies',
      coverUrl: 'assets/covers/Looking Up To The Sky.jpg',
      audioUrl: 'assets/songs/Come Find Me.mp3'
    },
    {
      id: 2,
      title: 'Postcard',
      artist: 'Amies',
      coverUrl: 'assets/covers/Looking Up To The Sky.jpg',
      audioUrl: 'assets/songs/Postcard.mp3'
    },
    {
      id: 3,
      title: 'Looking Up To The Sky',
      artist: 'Amies',
      coverUrl: 'assets/covers/Looking Up To The Sky.jpg',
      audioUrl: 'assets/songs/Looking Up To The Sky.mp3'
    },
    {
      id: 4,
      title: 'Breathtaking',
      artist: 'Purrple Cat',
      coverUrl: 'assets/covers/Breathtaking.jpg',
      audioUrl: 'assets/songs/Breathtaking.mp3'
    },
    {
      id: 5,
      title: 'Missing You',
      artist: 'Purrple Cat',
      coverUrl: 'assets/covers/Missing You.jpg',
      audioUrl: 'assets/songs/Missing You.mp3'
    },
    {
      id: 6,
      title: 'Are We Still Dreaming',
      artist: 'cxlt',
      coverUrl: 'assets/covers/Are We Still Dreaming.jpg',
      audioUrl: 'assets/songs/Are We Still Dreaming.mp3'
    },
    {
      id: 7,
      title: 'Lime Soda',
      artist: 'Iam6teen',
      coverUrl: 'assets/covers/Lime Soda.jpg',
      audioUrl: 'assets/songs/Lime Soda.mp3'
    },
    {
      id: 8,
      title: 'muguet',
      artist: 'Green face',
      coverUrl: 'assets/covers/muguet.jpg',
      audioUrl: 'assets/songs/muguet.mp3'
    },
    {
      id: 9,
      title: 'Wanted',
      artist: 'Purrple Cat',
      coverUrl: 'assets/covers/Breathtaking.jpg',
      audioUrl: 'assets/songs/Wanted.mp3'
    },
    {
      id: 10,
      title: 'Above the Clouds',
      artist: 'Purrple Cat',
      coverUrl: 'assets/covers/Above the Clouds.jpg',
      audioUrl: 'assets/songs/Above the Clouds.mp3'
    }
  ]);

  currentSong = signal<Song | null>(null);
  isPlaying = signal<boolean>(false);
  progress = signal<number>(0);
  duration = signal<number>(0);
  volume = signal<number>(0.5);

  constructor() {
    this.audioObj.volume = this.volume();

    this.audioObj.addEventListener('timeupdate', () => {
      this.progress.set(this.audioObj.currentTime);
      this.duration.set(this.audioObj.duration || 0);
    });

    this.audioObj.addEventListener('ended', () => {
      this.next();
    });

    this.audioObj.addEventListener('play', () => {
      this.isPlaying.set(true);
    });

    this.audioObj.addEventListener('pause', () => {
      this.isPlaying.set(false);
    });
  }

  playSong(song: Song) {
    if (this.currentSong()?.id !== song.id) {
      this.currentSong.set(song);
      this.audioObj.src = song.audioUrl;
      this.audioObj.load();
    }
    this.audioObj.play().catch(err => console.error('Audio play error:', err));
  }

  togglePlayPause() {
    if (!this.currentSong()) {
      if (this.playlist().length > 0) {
        this.playSong(this.playlist()[0]);
      }
      return;
    }

    if (this.audioObj.paused) {
      this.audioObj.play().catch(err => console.error('Audio play error:', err));
    } else {
      this.audioObj.pause();
    }
  }

  next() {
    const current = this.currentSong();
    if (!current) return;
    const list = this.playlist();
    const index = list.findIndex(s => s.id === current.id);
    const nextIndex = (index + 1) % list.length;
    this.playSong(list[nextIndex]);
  }

  prev() {
    const current = this.currentSong();
    if (!current) return;
    const list = this.playlist();
    const index = list.findIndex(s => s.id === current.id);
    const prevIndex = (index - 1 + list.length) % list.length;
    this.playSong(list[prevIndex]);
  }

  seek(time: number) {
    this.audioObj.currentTime = time;
  }

  setVolume(vol: number) {
    this.volume.set(vol);
    this.audioObj.volume = vol;
  }
}
