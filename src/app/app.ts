import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  QueryList,
  ViewChildren,
} from '@angular/core';

interface WeddingEvent {
  date: string;
  time: string;
  occasion: string;
  venue: string;
  location: string;
  mapUrl: string;
  image: string;
  note: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChildren('revealEl') revealElements!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('timelineCard') timelineCards!: QueryList<ElementRef<HTMLElement>>;

  private observer?: IntersectionObserver;
  private splashTimeoutId?: ReturnType<typeof setTimeout>;
  private splashFadeTimeoutId?: ReturnType<typeof setTimeout>;
  private revealFallbackId?: ReturnType<typeof setTimeout>;
  private readonly splashDismissTotalMs = 2000;
  private readonly splashFadeMs = 550;

  scrollY = 0;
  cardScales: number[] = [];
  cardOffsets: string[] = [];
  showSplash = true;
  splashFading = false;

  // Update couple info and media paths here.
  readonly couple = {
    title: 'Bengali Wedding Invitation',
    groom: 'Pronoy',
    bride: 'Prakriti',
    weddingTagline: 'With blessings and joy, we invite you to celebrate our union.',
    heroImage: 'images/couple-hero-placeholder.png',
    splashImage: 'images/splash-photo.jpg',
  };

  // Update schedule values, notes, map links, and event images here.
  readonly events: WeddingEvent[] = [
    {
      date: '3 May 2026',
      time: '5:00 PM',
      occasion: 'Aasirvaad & Engagement',
      venue: 'Larica Tolly Community Hall',
      location: 'Kolkata, West Bengal',
      mapUrl: 'https://maps.google.com/?q=Larica+Tolly+Community+Hall',
      image: 'images/event-engagement-placeholder.png',
      note: 'Traditional blessings and ring ceremony.',
    },
    {
      date: '28 January 2027',
      time: '11:30 AM',
      occasion: 'Aiburobhat',
      venue: 'Princeton Club',
      location: 'Kolkata, West Bengal',
      mapUrl: 'https://maps.google.com/?q=Princeton+Club+Kolkata',
      image: 'images/event-aiburobhat-placeholder.png',
      note: 'A joyful pre-wedding feast with close family.',
    },
    {
      date: '29 January 2027',
      time: '09:30 AM',
      occasion: 'Haldi',
      venue: 'Princeton Club',
      location: 'Kolkata, West Bengal',
      mapUrl: 'https://maps.google.com/?q=Princeton+Club+Kolkata',
      image: 'images/event-haldi-placeholder.png',
      note: 'Haldi ceremony filled with colors and blessings.',
    },
    {
      date: '29 January 2027',
      time: '6:30 PM',
      occasion: 'Wedding Ceremony',
      venue: 'Princeton Club',
      location: 'Kolkata, West Bengal',
      mapUrl: 'https://maps.google.com/?q=Princeton+Club+Kolkata',
      image: 'images/event-wedding-placeholder.png',
      note: 'Sacred wedding rituals and celebration.',
    },
    {
      date: '30 January 2027',
      time: '8:30 AM',
      occasion: 'Bidai',
      venue: 'Princeton Club',
      location: 'Kolkata, West Bengal',
      mapUrl: 'https://maps.google.com/?q=Princeton+Club+Kolkata',
      image: 'images/event-bidai-placeholder.png',
      note: 'Emotional farewell with family blessings.',
    },
    {
      date: '31 January 2027',
      time: '7:00 PM',
      occasion: 'Reception',
      venue: 'Basushree Wedding Hall',
      location: 'Kolkata, West Bengal',
      mapUrl: 'https://maps.google.com/?q=Basushree+Wedding+Hall',
      image: 'images/event-reception-placeholder.png',
      note: 'An evening of dinner, music, and blessings.',
    },
  ];

  // Add more photos or replace these placeholders when you share real pictures.
  readonly gallery = [
    {
      image: 'images/gallery-1-placeholder.jpg',
      alt: 'Pronoy and Prakriti memory placeholder one',
    },
    {
      image: 'images/gallery-2-placeholder.jpg',
      alt: 'Pronoy and Prakriti memory placeholder two',
    },
    {
      image: 'images/gallery-3-placeholder.jpg',
      alt: 'Pronoy and Prakriti memory placeholder three',
    },
    {
      image: 'images/gallery-4-placeholder.jpg',
      alt: 'Pronoy and Prakriti memory placeholder four',
    },
  ];

  get heroContentTransform(): string {
    const offset = Math.min(this.scrollY * 0.14, 75);
    return `translate3d(0, ${offset}px, 0)`;
  }

  get heroImageTransform(): string {
    const offset = Math.min(this.scrollY * 0.08, 44);
    const scale = 1 + Math.min(this.scrollY / 5000, 0.07);
    return `translate3d(0, ${offset}px, 0) scale(${scale})`;
  }

  get orbOneTransform(): string {
    const offset = Math.min(this.scrollY * 0.06, 36);
    return `translate3d(0, ${offset}px, 0)`;
  }

  get orbTwoTransform(): string {
    const offset = Math.min(this.scrollY * 0.04, 26);
    return `translate3d(0, -${offset}px, 0)`;
  }

  get mainWeddingDate(): string {
    const weddingEvent = this.events.find((event) => event.occasion === 'Wedding Ceremony');
    return weddingEvent?.date ?? '29 January 2027';
  }

  get mainWeddingVenue(): string {
    const weddingEvent = this.events.find((event) => event.occasion === 'Wedding Ceremony');
    return weddingEvent?.venue ?? 'Princeton Club';
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrollY = window.scrollY || 0;
    this.updateTimelineCardMotion();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateTimelineCardMotion();
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      const dismissTriggerMs = Math.max(this.splashDismissTotalMs - this.splashFadeMs, 0);
      this.splashTimeoutId = setTimeout(() => {
        this.startSplashDismiss();
      }, dismissTriggerMs);
    }

    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            entry.target.classList.toggle('in-view', entry.isIntersecting);
          });
        },
        {
          threshold: 0.2,
          rootMargin: '0px 0px -8% 0px',
        },
      );

      this.revealElements.forEach((element) => {
        this.observer?.observe(element.nativeElement);
      });
    } else {
      this.forceRevealElements();
    }

    // Cross-browser safety: ensure reveal content is visible even if IO callbacks are missed.
    this.revealFallbackId = setTimeout(() => {
      this.forceRevealElements();
    }, 1400);

    this.updateTimelineCardMotion();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.splashTimeoutId) {
      clearTimeout(this.splashTimeoutId);
    }
    if (this.splashFadeTimeoutId) {
      clearTimeout(this.splashFadeTimeoutId);
    }
    if (this.revealFallbackId) {
      clearTimeout(this.revealFallbackId);
    }
  }

  private forceRevealElements(): void {
    this.revealElements?.forEach((element) => {
      element.nativeElement.classList.add('in-view');
    });
  }

  private startSplashDismiss(): void {
    if (!this.showSplash || this.splashFading) {
      return;
    }

    this.splashFading = true;
    if (this.splashTimeoutId) {
      clearTimeout(this.splashTimeoutId);
      this.splashTimeoutId = undefined;
    }

    this.splashFadeTimeoutId = setTimeout(() => {
      this.showSplash = false;
      this.splashFading = false;
    }, this.splashFadeMs);
  }

  private updateTimelineCardMotion(): void {
    if (typeof window === 'undefined' || !this.timelineCards) {
      return;
    }

    const viewportCenter = window.innerHeight * 0.5;
    const viewportSpan = window.innerHeight * 0.75;

    this.timelineCards.forEach((cardRef, index) => {
      const rect = cardRef.nativeElement.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(viewportCenter - cardCenter);
      const normalized = Math.min(distance / viewportSpan, 1);
      const emphasis = 1 - normalized;

      const scale = 0.9 + emphasis * 0.12;
      const direction = cardCenter < viewportCenter ? -1 : 1;
      const translateY = direction * normalized * 12;

      this.cardScales[index] = Number(scale.toFixed(3));
      this.cardOffsets[index] = `${translateY.toFixed(2)}px`;
    });
  }
}
