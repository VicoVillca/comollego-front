import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Sindicato } from '../../../core/models/transit.models';
import { SINDICATOS_MOCK } from '../../../data/mock-data';

@Component({
  selector: 'app-sindicatos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './sindicatos-admin.html',
  styleUrl: './sindicatos-admin.css'
})
export class SindicatosAdminComponent implements OnInit {
  // ============================================================
  // ESTADO
  // ============================================================
  sindicatos = signal<Sindicato[]>([]);
  searchTerm = signal('');
  isLoading = signal(true);
  
  // ============================================================
  // MODAL
  // ============================================================
  showModal = signal(false);
  isEditing = signal(false);
  editSindicato: Partial<Sindicato> = {};

  // ============================================================
  // FILTRADO
  // ============================================================
  filteredSindicatos = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) return this.sindicatos();
    return this.sindicatos().filter(s => 
      s.nombre.toLowerCase().includes(search) ||
      (s.descripcion?.toLowerCase().includes(search) ?? false)
    );
  });

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    this.loadSindicatos();
  }

  // ============================================================
  // MÉTODOS
  // ============================================================
  loadSindicatos() {
    // Por ahora usamos MOCK, después se conectará al backend
    this.sindicatos.set(SINDICATOS_MOCK);
    setTimeout(() => this.isLoading.set(false), 300);
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.editSindicato = { nombre: '', descripcion: '' };
    this.showModal.set(true);
  }

  openEditModal(sindicato: Sindicato) {
    this.isEditing.set(true);
    this.editSindicato = { ...sindicato };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editSindicato = {};
  }

  saveSindicato() {
    if (!this.editSindicato.nombre?.trim()) {
      alert('El nombre del sindicato es obligatorio');
      return;
    }

    if (this.isEditing()) {
      // Actualizar existente
      this.sindicatos.update(list => 
        list.map(s => 
          s.id === this.editSindicato.id 
            ? { ...s, ...this.editSindicato } as Sindicato
            : s
        )
      );
    } else {
      // Crear nuevo
      const newSindicato: Sindicato = {
        id: Date.now(),
        nombre: this.editSindicato.nombre || '',
        descripcion: this.editSindicato.descripcion || '',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.sindicatos.update(list => [newSindicato, ...list]);
    }
    this.closeModal();
  }

  deleteSindicato(id: number) {
    if (confirm('¿Estás seguro de eliminar este sindicato?')) {
      this.sindicatos.update(list => list.filter(s => s.id !== id));
    }
  }

  // ============================================================
  // GETTERS
  // ============================================================
  get totalSindicatos(): number {
    return this.filteredSindicatos().length;
  }

  get isFormValid(): boolean {
    return !!this.editSindicato.nombre?.trim();
  }
}