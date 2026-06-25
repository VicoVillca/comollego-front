import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // AppComponent ahora es solo un contenedor raíz
  // Toda la lógica se movió a MainLayoutComponent y otros componentes
  title = 'comollego-angular';
}