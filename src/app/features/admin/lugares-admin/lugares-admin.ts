import { Component, inject, signal, computed, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { LugarService } from '../../../features/lugares/lugar.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { Lugar } from '../../../core/models/transit.models';

declare module 'leaflet' {
  namespace MarkerClusterGroup {
    interface Options {
      maxClusterRadius?: number;
      iconCreateFunction?: (cluster: any) => L.DivIcon;
      polygonOptions?: L.PolylineOptions;
      spiderfyOnMaxZoom?: boolean;
      showCoverageOnHover?: boolean;
      zoomToBoundsOnClick?: boolean;
      singleMarkerMode?: boolean;
      disableClusteringAtZoom?: number;
    }
  }
}

@Component({
  selector: 'app-lugares-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, DialogModule],
  templateUrl: './lugares-admin.html',
  styleUrl: './lugares-admin.css'
})
export class LugaresAdminComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // ============================================================
  // SERVICIOS
  // ============================================================
  private lugarService = inject(LugarService);
  private gamificationService = inject(GamificationService);

  // ============================================================
  // ESTADO
  // ============================================================
  lugares = signal<Lugar[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');
  selectedLugarId = signal<number | null>(null);

  // ============================================================
  // MODAL
  // ============================================================
  showModal = signal(false);
  isEditing = signal(false);
  editLugar: Partial<Lugar> = {};

  // ============================================================
  // MAPA
  // ============================================================
  private map: L.Map | null = null;
  private markersCluster: L.MarkerClusterGroup | null = null;
  private selectedMarker: L.Marker | null = null;

  // ============================================================
  // COMPUTADAS
  // ============================================================
  filteredLugares = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    if (!search) return this.lugares();
    return this.lugares().filter(l =>
      l.nombre.toLowerCase().includes(search) ||
      l.ciudad.toLowerCase().includes(search) ||
      (l.descripcion?.toLowerCase().includes(search) ?? false)
    );
  });

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    this.cargarLugares();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 300);
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  // ============================================================
  // MAPA CON CLUSTER
  // ============================================================
  private initMap() {
    if (!this.mapContainer || this.map) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [-16.5000, -68.1500],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    this.markersCluster = L.markerClusterGroup({
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 18,
      iconCreateFunction: function(cluster: any) {
        const childCount = cluster.getChildCount();
        let color = '#4361ee';
        let size = 'small';
        
        if (childCount > 50) {
          color = '#dc2626';
          size = 'large';
        } else if (childCount > 20) {
          color = '#f59e0b';
          size = 'medium';
        } else if (childCount > 5) {
          color = '#10b981';
          size = 'small';
        }
        
        const sizeMap = {
          small: { w: 36, h: 36, f: 12 },
          medium: { w: 44, h: 44, f: 14 },
          large: { w: 52, h: 52, f: 16 }
        };
        
        const sz = sizeMap[size as keyof typeof sizeMap];
        
        return L.divIcon({
          html: `
            <div style="
              background: ${color};
              color: white;
              border-radius: 50%;
              width: ${sz.w}px;
              height: ${sz.h}px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${sz.f}px;
              font-weight: 700;
              font-family: system-ui, -apple-system, sans-serif;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
              border: 2px solid white;
              transition: all 0.2s ease;
              cursor: pointer;
            ">
              ${childCount}
            </div>
          `,
          className: 'cluster-marker',
          iconSize: L.point(sz.w, sz.h),
          iconAnchor: L.point(sz.w/2, sz.h/2)
        });
      }
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.abrirModalNuevo(e.latlng.lat, e.latlng.lng);
    });

    this.renderMarkers(this.lugares());
  }

  private renderMarkers(lugares: Lugar[]) {
    if (!this.markersCluster) return;
    
    this.markersCluster.clearLayers();

    lugares.forEach(l => {
      const marker = L.marker([l.latitud, l.longitud], {
        title: l.nombre
      });

      const isSelected = this.selectedLugarId() === l.id;

      marker.bindPopup(`
        <div class="popup-content">
          <strong>${this.escapeHtml(l.nombre)}</strong><br>
          <i class="pi pi-map-marker"></i> ${this.escapeHtml(l.ciudad)}<br>
          <small>${l.latitud.toFixed(5)}, ${l.longitud.toFixed(5)}</small><br>
          ${l.descripcion ? '<br>' + this.escapeHtml(l.descripcion) : ''}
          <br><br>
          <button class="popup-btn edit" data-id="${l.id}">
            <i class="pi pi-pencil"></i> Editar
          </button>
          <button class="popup-btn delete" data-id="${l.id}">
            <i class="pi pi-trash"></i> Eliminar
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const popupEl = document.querySelector('.leaflet-popup-content');
        if (!popupEl) return;

        popupEl.querySelectorAll('.popup-btn.edit').forEach((btn: any) => {
          btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            const lugar = this.lugares().find(l => l.id === id);
            if (lugar) this.abrirModalEditar(lugar);
          });
        });

        popupEl.querySelectorAll('.popup-btn.delete').forEach((btn: any) => {
          btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            this.eliminarLugar(id);
          });
        });
      });

      this.markersCluster!.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
        this.map?.setView([l.latitud, l.longitud], 15);
      }
    });

    if (lugares.length > 0 && !this.selectedLugarId()) {
      this.map?.fitBounds(this.markersCluster.getBounds(), {
        padding: [50, 50],
        maxZoom: 15
      });
    }
  }

  // ============================================================
  // CRUD
  // ============================================================
  async cargarLugares(term: string = '') {
    this.isLoading.set(true);
    try {
      let data: Lugar[];
      if (term && term.trim() !== '') {
        const response = await this.lugarService.buscarLugares(term).toPromise();
        data = response?.data || [];
      } else {
        const response = await this.lugarService.obtenerTodos().toPromise();
        data = response?.data || [];
      }
      this.lugares.set(data);
      this.renderMarkers(data);
    } catch (error) {
      console.error('Error cargando lugares:', error);
      this.gamificationService.notification.set('❌ Error al cargar lugares');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
    } finally {
      this.isLoading.set(false);
    }
  }

  async guardarLugar(lugar: Partial<Lugar>) {
    try {
      let response;
      if (lugar.id) {
        response = await this.lugarService.actualizarLugar(lugar.id, lugar).toPromise();
        this.gamificationService.notification.set('✅ Lugar actualizado correctamente');
      } else {
        response = await this.lugarService.crearLugar(lugar).toPromise();
        this.gamificationService.notification.set('✅ Lugar creado correctamente');
      }
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
      await this.cargarLugares(this.searchTerm());
      return response;
    } catch (error) {
      console.error('Error guardando lugar:', error);
      this.gamificationService.notification.set('❌ Error al guardar el lugar');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
      throw error;
    }
  }

  async eliminarLugar(id: number) {
    if (!confirm('¿Estás seguro de eliminar este punto de referencia?')) return;
    try {
      await this.lugarService.eliminarLugar(id).toPromise();
      this.gamificationService.notification.set('🗑️ Lugar eliminado correctamente');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
      if (this.selectedLugarId() === id) {
        this.selectedLugarId.set(null);
      }
      await this.cargarLugares(this.searchTerm());
    } catch (error) {
      console.error('Error eliminando lugar:', error);
      this.gamificationService.notification.set('❌ Error al eliminar el lugar');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
    }
  }

  // ============================================================
  // MODAL
  // ============================================================
  abrirModalNuevo(lat: number | null = null, lng: number | null = null) {
    this.isEditing.set(false);
    this.editLugar = {
      nombre: '',
      ciudad: 'La Paz',
      descripcion: '',
      latitud: lat ?? -16.5000,
      longitud: lng ?? -68.1500
    };
    this.showModal.set(true);
  }

  abrirModalEditar(lugar: Lugar) {
    this.isEditing.set(true);
    this.editLugar = { ...lugar };
    this.showModal.set(true);
  }

  cerrarModal() {
    this.showModal.set(false);
    this.editLugar = {};
  }

  guardarLugarModal() {
    const lugar = this.editLugar;
    if (!lugar.nombre?.trim() || !lugar.ciudad?.trim()) {
      this.gamificationService.notification.set('⚠️ Nombre y ciudad son obligatorios');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
      return;
    }
    if (lugar.latitud === undefined || lugar.longitud === undefined) {
      this.gamificationService.notification.set('⚠️ Latitud y longitud son obligatorias');
      setTimeout(() => this.gamificationService.notification.set(''), 3000);
      return;
    }

    this.guardarLugar(lugar);
    this.cerrarModal();
  }

  // ============================================================
  // SELECCIONAR LUGAR
  // ============================================================
  selectLugar(lugar: Lugar) {
    this.selectedLugarId.set(lugar.id);
    this.renderMarkers(this.lugares());
    this.map?.setView([lugar.latitud, lugar.longitud], 15);
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  private escapeHtml(str: string): string {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  get totalLugares(): number {
    return this.filteredLugares().length;
  }

  onSearchChange() {
    this.cargarLugares(this.searchTerm());
  }

  limpiarBusqueda() {
    this.searchTerm.set('');
    this.cargarLugares('');
  }
}