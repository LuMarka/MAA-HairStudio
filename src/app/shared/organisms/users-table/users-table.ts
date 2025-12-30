import { Component, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { User } from '../../../core/models/interfaces/users.interface';

export interface UserTableColumn {
  key: keyof User;
  label: string;
  sortable?: boolean;
}

export type SortDirection = 'asc' | 'desc' | null;

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-table.html',
  styleUrl: './users-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersTable {
  // Inputs
  readonly users = input<User[]>([]);
  readonly columns = input<UserTableColumn[]>([
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Rol', sortable: true },
    { key: 'createdAt', label: 'Fecha de Registro', sortable: true }
  ]);
  readonly isLoading = input(false);

  // Outputs
  readonly userSelected = output<User>();
  readonly userEdit = output<User>();
  readonly userDelete = output<User>();
  readonly userRoleChange = output<{ user: User; newRole: string }>();
  readonly sorted = output<{ column: keyof User; direction: SortDirection }>();

  // State
  protected readonly sortColumn = signal<keyof User | null>(null);
  protected readonly sortDirection = signal<SortDirection>(null);

  // Computed
  protected readonly sortedUsers = computed(() => {
    const usersData = this.users();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column || !direction) return usersData;

    return [...usersData].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return direction === 'asc' ? comparison : -comparison;
    });
  });

  onSort(column: keyof User): void {
    const currentColumn = this.sortColumn();
    const currentDirection = this.sortDirection();

    if (currentColumn !== column) {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    } else {
      if (currentDirection === 'asc') {
        this.sortDirection.set('desc');
      } else if (currentDirection === 'desc') {
        this.sortColumn.set(null);
        this.sortDirection.set(null);
      }
    }

    this.sorted.emit({
      column: this.sortColumn() || 'id',
      direction: this.sortDirection()
    });
  }

  getSortArrow(column: keyof User): string {
    if (this.sortColumn() !== column) return '⇅';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  onSelectUser(user: User): void {
    this.userSelected.emit(user);
  }

  onEditUser(user: User, event: Event): void {
    event.stopPropagation();
    this.userEdit.emit(user);
  }

  onDeleteUser(user: User, event: Event): void {
    event.stopPropagation();
    this.userDelete.emit(user);
  }

  onRoleChange(user: User, newRole: string, event: Event): void {
    event.stopPropagation();
    this.userRoleChange.emit({ user, newRole });
  }

  formatValue(value: any, key: keyof User): string {
    if (value === null || value === undefined) return '—';

    if (key === 'createdAt' || key === 'updatedAt') {
      return new Date(value).toLocaleDateString('es-AR');
    }

    if (key === 'role') {
      const roleMap: Record<string, string> = {
        admin: 'Administrador',
        user: 'Usuario',
        custom: 'Personalizado'
      };
      return roleMap[value] || value;
    }

    return String(value);
  }
}
