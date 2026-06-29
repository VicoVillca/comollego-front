// src/app/pages/sindicatos-admin/sindicatos-admin.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Sindicato } from '../../../core/models/transit.models';
import { SindicatoService } from '../../../core/services/sindicato.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-sindicatos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './sindicatos-admin.html',
  styleUrl: './sindicatos-admin.css'
})
export class SindicatosAdminComponent implements OnInit {
  // ============================================================
  // INYECCIÓN DE DEPENDENCIAS
  // ============================================================
  private sindicatoService = inject(SindicatoService);

  // ============================================================
  // ESTADO
  // ============================================================
  sindicatos = signal<Sindicato[]>([]);
  searchTerm = signal('');
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

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
  // MÉTODOS DE CARGA
  // ============================================================
  loadSindicatos() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    this.sindicatoService.obtenerTodos()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.sindicatos.set(response.data);
          } else {
            this.errorMessage.set('No se pudieron cargar los sindicatos');
          }
        },
        error: (error) => {
          console.error('Error al cargar sindicatos:', error);
          this.errorMessage.set('Error al cargar los sindicatos');
          // Si falla, podrías usar datos de respaldo
          // this.sindicatos.set(SINDICATOS_MOCK);
        }
      });
  }

  // ============================================================
  // MÉTODOS DEL MODAL
  // ============================================================
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

  // ============================================================
  // MÉTODOS CRUD
  // ============================================================
  saveSindicato() {
    if (!this.editSindicato.nombre?.trim()) {
      alert('El nombre del sindicato es obligatorio');
      return;
    }

    this.isLoading.set(true);
    
    if (this.isEditing()) {
      // ACTUALIZAR
      const id = this.editSindicato.id!;
      this.sindicatoService.actualizarSindicato(id, this.editSindicato)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.sindicatos.update(list => 
                list.map(s => s.id === id ? response.data! : s)
              );
              this.closeModal();
            } else {
              alert('Error al actualizar el sindicato');
            }
          },
          error: (error) => {
            console.error('Error al actualizar:', error);
            alert('Error al actualizar el sindicato');
          }
        });
    } else {
      // CREAR NUEVO
      this.sindicatoService.crearSindicato(this.editSindicato)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.sindicatos.update(list => [response.data!, ...list]);
              this.closeModal();
            } else {
              alert('Error al crear el sindicato');
            }
          },
          error: (error) => {
            console.error('Error al crear:', error);
            alert('Error al crear el sindicato');
          }
        });
    }
  }

  deleteSindicato(id: number) {
    if (confirm('¿Estás seguro de eliminar este sindicato?')) {
      this.isLoading.set(true);
      this.sindicatoService.eliminarSindicato(id)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.sindicatos.update(list => list.filter(s => s.id !== id));
            } else {
              alert('Error al eliminar el sindicato');
            }
          },
          error: (error) => {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar el sindicato');
          }
        });
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