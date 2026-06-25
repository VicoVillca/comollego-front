import { Routes } from '@angular/router';
import { AppComponent } from './app.component';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    children: [
      { path: '', redirectTo: 'map', pathMatch: 'full' },
      { path: 'map', component: AppComponent },
      { path: 'routes', component: AppComponent },
      { path: 'details/:id', component: AppComponent },
      { path: 'editor', component: AppComponent }
    ]
  }
];
