import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScrollAnimationService implements OnDestroy {
  private observer: IntersectionObserver | null = null;
  private animatedElements = new Set<Element>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeObserver();
  }

  private initializeObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '-10% 0px -10% 0px', // Trigger when element is 10% visible
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
          this.animateElement(entry.target);
          this.animatedElements.add(entry.target);
        }
      });
    }, options);
  }

  observeElements(selector: string): void {
    if (!this.observer) return;

    // Wait a bit for elements to be rendered
    setTimeout(() => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!this.animatedElements.has(element)) {
          this.observer?.observe(element);
        }
      });
    }, 100);
  }

  observeListItems(containerSelector: string): void {
    if (!this.observer) return;

    setTimeout(() => {
      const containers = document.querySelectorAll(containerSelector);
      containers.forEach(container => {
        const items = container.querySelectorAll('.services-template__step-item, .services-template__benefit-item');
        items.forEach((item, index) => {
          // Add staggered delay based on index
          (item as HTMLElement).style.transitionDelay = `${index * 0.1}s`;
          this.observer?.observe(item);
        });
      });
    }, 200);
  }

  private animateElement(element: Element): void {
    element.classList.add('animate-in');
  }

  resetAnimations(): void {
    this.animatedElements.clear();
    // Remove animate-in classes
    document.querySelectorAll('.animate-in').forEach(el => {
      el.classList.remove('animate-in');
    });
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
