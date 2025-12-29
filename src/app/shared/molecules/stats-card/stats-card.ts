import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatsCardData {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  color?: 'primary' | 'success' | 'warning' | 'info' | 'secondary';
  loading?: boolean;
}

@Component({
  selector: 'app-stats-card',
  imports: [CommonModule],
  templateUrl: './stats-card.html',
  styleUrls: ['./stats-card.scss']
})
export class StatsCard {
  readonly data = input.required<StatsCardData>();

  protected readonly cardColor = computed(() => {
    return this.data().color || 'primary';
  });

  protected formatValue(value: string | number): string {
    if (typeof value === 'number') {
      return value.toLocaleString('es-ES');
    }
    return value;
  }

  protected formatTrend(value: number): string {
    return value > 0 ? `+${value}` : value.toString();
  }
}
