import { ChangeDetectionStrategy, Component, computed, signal, ViewChild, ElementRef, HostListener, VERSION } from '@angular/core';
import { CommonModule } from '@angular/common';

// --- DATA INTERFACES ---
interface CalendarEvent {
  title: string;
  time: string;
  color: 'blue' | 'green' | 'yellow';
  status: 'Vencido' | 'Finalizado' | 'Pendiente';
  type: string;
  responsable: string;
  supervisor: string;
  fechaLimite: string;
  // Layout properties
  top?: number;
  left?: number;
  width?: number;
  zIndex?: number;
}

interface ComplianceConfig {
  id: number;
  codigo: number;
  nombre: string;
  descripcion: string;
  abreviacion: string;
}

interface ComplianceOperationItem {
  id: number;
  codigo: number;
  cumplimiento: string;
  descripcion: string;
  tipo: string;
  fechaCreacion: string;
  unidadOrganizativa: string;
}

interface CumplimientoDetail {
    codigo: number;
    nombre: string;
    tipo: string;
    descripcion: string;
    tituloNormograma: string;
    numeroLey: string;
    unidadOrganizacional: string;
    usuario: string;
    fechaCreacion: string;
}

interface ComplianceReport {
  id: number;
  codigo: number;
  reporte: string;
  responsablePrincipal: string;
  responsableAdicional: string;
  destinatarios: string;
  enlazarFlujo: boolean;
  cargo: string;
  especificaciones: string;
  responsableRespaldo: boolean;
  interesados: boolean;
  unidadOrganizacionalInteresada: boolean;
  requerimientoEnteExterno: boolean;
  // Periodicity Fields
  repetir: string;
  repetirCada: number;
  fechaInicial: string;
  fechaFinal: string;
  hora: string;
  requiereAdjunto: boolean;
  // Reminder Fields
  habilitarRecordatorio: boolean;
}


interface NormogramaItem {
  id: number;
  consecutivo: number;
  titulo: string;
  responsable: string;
  tipoNorma: string;
  fecha: string;
  numeroNorma?: number;
  fechaExpedicion?: string;
  entidad?: string;
  fechaEntradaVigencia?: string;
  asunto?: string;
  impacto?: string;
  fechaCumplimiento?: string;
  areaResponsable?: string;
  lobImpactada?: string;
  fechaAccion?: string;
  accion?: string;
  planComunicacion?: string;
  propietarioAccion?: string;
  estado?: string;
  link?: string;
  usuario?: string;
  fechaCreacion?: string;
  descripcionArchivo?: string;
}

interface UserProfile {
    nombre: string;
    correo: string;
    cargo: string;
    unidadOrganizacional: string;
    superior: string;
    perfil: string;
    esAuditor: boolean;
    esGestor: boolean;
}

interface Manual {
  id: number;
  name: string;
  size: string;
  url: string;
  uploadDate: string;
}


// --- VIEW AND THEME TYPES ---
type View = 'calendar' | 'cumplimiento' | 'workflow' | 'editProfile' | 'changePassword' | 'manuals';
type CalendarView = 'day' | 'week' | 'month';
type ComplianceModuleView = 'normograma' | 'tipo' | 'operacion' | 'informes';
type NormogramaSubView = 'grilla' | 'busqueda';
type Theme = 'blue' | 'teal' | 'indigo' | 'slate';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    /* Color variable definitions for each theme */
    .theme-blue {
      --color-primary-light: #DBEAFE; /* blue-100 */
      --color-primary-text: #2563EB;  /* blue-600 */
      --color-primary-medium: #3B82F6;/* blue-500 */
      --color-primary-dark: #1D4ED8;  /* blue-700 */
      --color-primary-darker: #1E40AF;/* blue-800 */
    }
    .theme-teal {
      --color-primary-light: #CCFBF1; /* teal-100 */
      --color-primary-text: #0D9488;  /* teal-600 */
      --color-primary-medium: #14B8A6;/* teal-500 */
      --color-primary-dark: #0F766E;  /* teal-700 */
      --color-primary-darker: #134E4A;/* teal-900 */
    }
    .theme-indigo {
       /* Colors based on the PDF Prototype */
      --color-primary-light: #F0F1FF; /* A very light lilac for backgrounds */
      --color-primary-text: #5039A3;  /* The main purple from the prototype */
      --color-primary-medium: #6A48D9;/* A slightly brighter purple */
      --color-primary-dark: #3E2B7A;  /* Dark purple for headers */
      --color-primary-darker: #2D1E59;/* Even darker purple for hover/active */
    }
      .theme-slate {
      --color-primary-light: #F1F5F9; /* slate-100 */
      --color-primary-text: #475569;  /* slate-600 */
      --color-primary-medium: #64748B;/* slate-500 */
      --color-primary-dark: #334155;  /* slate-700 */
      --color-primary-darker: #1E293B;/* slate-800 */
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 4px;
    }
    .status-Vencido { background-color: #EF4444; } /* red-500 */
    .status-Finalizado { background-color: #22C55E; } /* green-500 */
    .status-Pendiente { background-color: #F59E0B; } /* amber-500 */
  `],
  template: `
    <div class="flex h-screen bg-gray-100 font-sans" [ngClass]="'theme-' + activeTheme()">
      <!-- Left Sidebar (Prototype Style) -->
      <aside class="w-64 flex-shrink-0 bg-[--color-primary-dark] flex flex-col transition-opacity duration-300" [class.opacity-50]="!isUserLoggedIn()" [class.pointer-events-none]="!isUserLoggedIn()">
        <div class="h-20 flex items-center justify-center border-b border-white/10">
          <h1 class="text-2xl font-bold text-white">SOFTWARE GCI</h1>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-2">
          <a href="#" class="flex items-center px-4 py-2 rounded-lg text-white/80" (click)="setView('calendar')"
             [ngClass]="{'bg-white/20 font-semibold text-white': activeView() === 'calendar', 'hover:bg-white/10 hover:text-white': activeView() !== 'calendar'}">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            HOME
          </a>
          <a href="#" class="flex items-center px-4 py-2 rounded-lg text-white/80" (click)="setView('cumplimiento')"
              [ngClass]="{'bg-white/20 font-semibold text-white': activeView() === 'cumplimiento', 'hover:bg-white/10 hover:text-white': activeView() !== 'cumplimiento'}">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            CUMPLIMIENTO
          </a>
          <a href="#" class="flex items-center px-4 py-2 rounded-lg text-white/80" (click)="setView('workflow')"
              [ngClass]="{'bg-white/20 font-semibold text-white': activeView() === 'workflow', 'hover:bg-white/10 hover:text-white': activeView() !== 'workflow'}">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            WORK FLOW
          </a>
        </nav>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top Header (Prototype Style) -->
        <header class="h-20 bg-white border-b flex items-center justify-between px-8">
            <div>
              @if(isUserLoggedIn()){
                <p class="text-sm text-gray-500">{{ headerBreadcrumb() }}</p>
                <h2 class="text-2xl font-bold text-gray-800">HOLA, {{ userProfile().nombre.split(' ')[0] }} !</h2>
              } @else {
                 <h2 class="text-2xl font-bold text-gray-800">Bienvenido</h2>
              }
            </div>
            <div class="flex items-center space-x-4">
                @if(isUserLoggedIn()){
                  <a href="#" (click)="setView('manuals')" class="text-sm p-2 rounded-md flex items-center space-x-1 text-gray-600 font-medium hover:bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      <span>Manuales</span>
                  </a>
                  <a href="#" class="text-sm p-2 rounded-md flex items-center space-x-1 text-gray-600 font-medium hover:bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 00-4-4H3V9h2a4 4 0 004-4V3l4 4-4 4z" /></svg>
                      <span>Informes</span>
                  </a>
                  
                  <!-- Settings Button with Dropdown Menu -->
                  <div #configContainer class="relative">
                      <button (click)="toggleConfigMenu()" class="text-sm p-2 rounded-md flex items-center space-x-1 text-gray-600 font-medium hover:bg-gray-100">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span>Configuración</span>
                      </button>
                      @if(isConfigMenuOpen()) {
                          <div class="absolute top-full right-0 mt-2 w-72 bg-blue-800 rounded-md shadow-xl text-white font-semibold text-sm z-30">
                              <div class="relative" (mouseenter)="isParametroGeneralMenuOpen.set(true)" (mouseleave)="isParametroGeneralMenuOpen.set(false)">
                                  <a href="#" class="flex justify-between items-center p-3 hover:bg-blue-700 rounded-t-md">
                                      <span>AJUSTES PARÁMETRO GENERAL</span>
                                      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                                  </a>
                                  @if (isParametroGeneralMenuOpen()) {
                                      <div class="absolute left-full top-0 ml-1 w-72 bg-white rounded-md shadow-xl border text-gray-800 p-2 font-normal">
                                          <div class="space-y-1">
                                              <a href="#" class="flex items-center p-2 rounded hover:bg-gray-100">
                                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5.586l2.293-2.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 9.586V4a1 1 0 011-1z" /><path d="M3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>
                                                  <span>1) BÁSICOS</span>
                                              </a>
                                              <a href="#" class="flex items-center p-2 rounded hover:bg-gray-100">
                                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5.586l2.293-2.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 9.586V4a1 1 0 011-1z" /><path d="M3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>
                                                  <span>2) USUARIOS</span>
                                              </a>
                                              <a href="#" class="flex items-center p-2 rounded hover:bg-gray-100">
                                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5.586l2.293-2.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 9.586V4a1 1 0 011-1z" /><path d="M3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>
                                                  <span>3) ORGANIZACIÓN</span>
                                              </a>
                                              <a href="#" class="flex items-center p-2 rounded hover:bg-gray-100">
                                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5.586l2.293-2.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 9.586V4a1 1 0 011-1z" /><path d="M3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>
                                                  <span>4) SISTEMA</span>
                                              </a>
                                              <a href="#" class="flex items-center p-2 rounded hover:bg-gray-100">
                                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5.586l2.293-2.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 9.586V4a1 1 0 011-1z" /><path d="M3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>
                                                  <span>5) PROCESOS</span>
                                              </a>
                                              <a href="#" class="flex items-center p-2 rounded hover:bg-gray-100">
                                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5.586l2.293-2.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 9.586V4a1 1 0 011-1z" /><path d="M3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" /></svg>
                                                  <span>6) SINCRONIZACIÓN DE USUARIOS</span>
                                              </a>
                                          </div>
                                      </div>
                                  }
                              </div>
                              <a href="#" class="flex justify-between items-center p-3 hover:bg-blue-700"><span>AJUSTES CUMPLIMIENTO</span> <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg></a>
                              <a href="#" class="flex justify-between items-center p-3 hover:bg-blue-700 rounded-b-md"><span>AJUSTES WORKFLOW</span> <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg></a>
                          </div>
                      }
                  </div>

                  <div #filterContainer class="relative">
                      <button (click)="toggleFilterPanel()" class="p-2 rounded-full text-gray-500 hover:bg-gray-100" title="Buscar Actividades">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" /></svg>
                      </button>
                      @if(isFilterPanelOpen()) {
                      <div class="absolute right-0 mt-2 w-80 bg-white p-6 rounded-lg shadow-lg border text-sm z-30">
                          <h3 class="font-bold text-lg mb-4 text-gray-800">Filtros</h3>
                          <form #filterForm (submit)="applyFilters($event, filterForm)">
                              <div class="space-y-4">
                                  <div>
                                      <label class="font-semibold text-gray-600 block mb-1">Estado de la tarea</label>
                                      <select name="status" class="w-full p-2 border rounded-md bg-gray-50">
                                        <option value="">Todos</option>
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Finalizado">Finalizado</option>
                                        <option value="Vencido">Vencido</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label class="font-semibold text-gray-600 block mb-1">Responsable</label>
                                      <input type="text" name="responsable" class="w-full p-2 border rounded-md bg-gray-50">
                                  </div>
                                  <div>
                                      <label class="font-semibold text-gray-600 block mb-1">Palabras clave</label>
                                      <input type="text" name="keyword" class="w-full p-2 border rounded-md bg-gray-50">
                                  </div>
                              </div>
                              <div class="mt-6 flex justify-between">
                                  <button type="button" (click)="resetFilters(filterForm)" class="text-gray-600 hover:underline">Restablecer</button>
                                  <button type="submit" class="px-4 py-2 bg-[--color-primary-text] text-white font-semibold rounded-lg hover:bg-[--color-primary-dark]">Aceptar</button>
                              </div>
                          </form>
                      </div>
                    }
                  </div>
                  <div #themeContainer class="relative">
                      <button (click)="toggleThemeMenu()" class="p-2 rounded-full text-gray-500 hover:bg-gray-100" title="Cambiar Apariencia">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                      </button>
                      @if(isThemeMenuOpen()) {
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-30">
                          <div class="p-2 font-semibold text-sm border-b text-gray-700">Color del Tema</div>
                          <div class="p-2 space-y-1">
                            <button (click)="setTheme('indigo')" class="w-full text-left flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100">
                                <span class="w-4 h-4 rounded-full bg-[#6A48D9] mr-2 border"></span> Predeterminado
                            </button>
                            <button (click)="setTheme('blue')" class="w-full text-left flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100">
                                <span class="w-4 h-4 rounded-full bg-blue-500 mr-2 border"></span> Azul
                            </button>
                            <button (click)="setTheme('teal')" class="w-full text-left flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100">
                                <span class="w-4 h-4 rounded-full bg-teal-500 mr-2 border"></span> Verde Azulado
                            </button>
                            <button (click)="setTheme('slate')" class="w-full text-left flex items-center px-2 py-1.5 text-sm rounded hover:bg-gray-100">
                                <span class="w-4 h-4 rounded-full bg-slate-500 mr-2 border"></span> Pizarra
                            </button>
                          </div>
                        </div>
                      }
                  </div>
                  <div #updatesContainer class="relative">
                      <button (click)="toggleUpdatesMenu()" class="p-2 rounded-full text-gray-500 hover:bg-gray-100" title="Actualizaciones">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                      </button>
                      @if(isUpdatesMenuOpen()) {
                          <div class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-30">
                              <div class="p-2 space-y-1 text-sm">
                                  <a href="#" class="block px-3 py-2 rounded hover:bg-gray-100">Actualizaciones de GCI</a>
                                  <a href="#" class="block px-3 py-2 rounded hover:bg-gray-100">Noticias GCI</a>
                                  <a href="#" class="block px-3 py-2 rounded hover:bg-gray-100">Cambios de perfil</a>
                                  <a href="#" class="block px-3 py-2 rounded hover:bg-gray-100">Nuevos correos</a>
                              </div>
                          </div>
                      }
                  </div>
                  <div #userContainer class="relative">
                      <button (click)="toggleUserMenu()" class="flex items-center space-x-2">
                        <div class="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold" [style.background-color]="'var(--color-primary-medium)'">{{ userProfile().nombre.charAt(0) }}</div>
                          <div class="text-left">
                              <div class="font-semibold text-gray-800">{{ userProfile().nombre }}</div>
                              <div class="text-xs text-gray-500">{{ userProfile().correo }}</div>
                          </div>
                          <svg class="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                      </button>
                      @if (isUserMenuOpen()) {
                          <div class="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border text-gray-800 z-30">
                              <div class="p-4">
                                  <div class="text-xs space-y-1 text-gray-600 border-b pb-3">
                                      <p><span class="font-semibold w-36 inline-block">Nombre:</span> {{ userProfile().nombre }}</p>
                                      <br>
                                      <p><span class="font-semibold w-36 inline-block">Correo:</span> {{ userProfile().correo }}</p>
                                      <br>
                                      <p><span class="font-semibold w-36 inline-block">Cargo: </span> {{ userProfile().cargo }}</p>
                                      <p><span class="font-semibold w-36 inline-block">Unidad organizacional: </span> {{ userProfile().unidadOrganizacional }}</p>
                                      <p><span class="font-semibold w-36 inline-block">Superior: </span> {{ userProfile().superior }}</p>
                                      <br>
                                      <p><span class="font-semibold w-36 inline-block">Perfil: </span> {{ userProfile().perfil }}</p>
                                      <p><span class="font-semibold w-36 inline-block">Auditor: </span> {{ userProfile().esAuditor ? 'Sí' : 'No' }}</p>
                                      <p><span class="font-semibold w-36 inline-block">Gestor: </span> {{ userProfile().esGestor ? 'Sí' : 'No' }}</p>
                                  </div>
                                  <div class="mt-3 text-sm space-y-2">
                                      <a href="#" (click)="setView('editProfile'); isUserMenuOpen.set(false);" class="flex items-center text-[--color-primary-text] hover:underline">
                                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                                          Modificar datos
                                      </a>
                                      <a href="#" (click)="setView('changePassword'); isUserMenuOpen.set(false);" class="flex items-center text-[--color-primary-text] hover:underline">
                                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                          Cambio de contraseña
                                      </a>
                                      <a href="#" (click)="logout()" class="flex items-center text-red-500 hover:underline">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Salir del sistema
                                      </a>
                                  </div>
                              </div>
                          </div>
                        }
                  </div>
                }
            </div>
        </header>

        <!-- Main Content Area (Dynamic) -->
        <main class="flex-1 overflow-y-auto">
          @if(isUserLoggedIn()){
            @switch (activeView()) {
              @case ('calendar') {
              <div class="p-8 flex flex-1 h-full">
                  <!-- Calendar -->
                  <div class="flex-1 flex flex-col bg-white rounded-lg shadow-sm border">
                    <div class="flex items-center justify-between p-4 border-b">
                      <div class="flex items-center space-x-4">
                        <button (click)="goToToday()" class="px-4 py-1.5 text-sm font-semibold text-gray-700 bg-gray-200 border rounded-md hover:bg-gray-300">Hoy</button>
                        <div #datePickerContainer class="relative flex items-center space-x-2">
                            <button (click)="navigateCalendar(-1)" class="p-1 text-gray-500 hover:bg-gray-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></button>
                              <button (click)="toggleDatePicker()" class="text-lg font-bold text-gray-800 uppercase tracking-wider">{{ calendarHeaderTitle() }}</button>
                            <button (click)="navigateCalendar(1)" class="p-1 text-gray-500 hover:bg-gray-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg></button>
                            @if(isDatePickerOpen()){
                              <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-lg shadow-lg border z-20 p-4">
                                <div class="flex items-center justify-between mb-2">
                                    <button (click)="changeDatePickerYear(-1)" class="p-1 text-gray-500 hover:bg-gray-100 rounded-full">&lt;</button>
                                    <span class="font-bold text-lg">{{ datePickerDate().getFullYear() }}</span>
                                    <button (click)="changeDatePickerYear(1)" class="p-1 text-gray-500 hover:bg-gray-100 rounded-full">&gt;</button>
                                </div>
                                <div class="grid grid-cols-4 gap-2 text-sm">
                                  @for(month of months; track month; let i = $index) {
                                    <button (click)="selectMonth(i)" class="p-2 rounded-md hover:bg-gray-100" [ngClass]="{'bg-[--color-primary-light] text-[--color-primary-text] font-semibold': i === currentDate().getMonth() && datePickerDate().getFullYear() === currentDate().getFullYear()}">{{month}}</button>
                                  }
                                </div>
                              </div>
                            }
                          </div>
                      </div>
                      <div class="flex items-center space-x-1 border rounded-lg p-1 text-sm">
                          <button (click)="setCalendarView('day')" class="px-3 py-1 rounded-md" [ngClass]="{'bg-[--color-primary-light] text-[--color-primary-text] font-semibold': calendarView() === 'day', 'hover:bg-gray-100': calendarView() !== 'day'}">Día</button>
                          <button (click)="setCalendarView('week')" class="px-3 py-1 rounded-md" [ngClass]="{'bg-[--color-primary-light] text-[--color-primary-text] font-semibold': calendarView() === 'week', 'hover:bg-gray-100': calendarView() !== 'week'}">Semana</button>
                          <button (click)="setCalendarView('month')" class="px-3 py-1 rounded-md" [ngClass]="{'bg-[--color-primary-light] text-[--color-primary-text] font-semibold': calendarView() === 'month', 'hover:bg-gray-100': calendarView() !== 'month'}">Mes</button>
                      </div>
                    </div>

                    @switch(calendarView()){
                      @case('month'){
                        <div class="grid grid-cols-7 flex-1">
                          @for(day of weekDays; track day) {<div class="py-3 text-center text-sm font-semibold text-gray-500 border-b border-r">{{ day }}</div>}
                          @for(day of calendarDays(); track day.fullDate) {
                            <div (click)="handleDayClick(day, $event)" class="p-2 border-b border-r flex flex-col min-h-[120px] cursor-pointer relative" [class.bg-gray-50]="!day.isCurrentMonth">
                              <span class="text-sm font-medium self-end" [ngClass]="{'text-gray-400': !day.isCurrentMonth, 'text-white bg-[--color-primary-text]': day.isToday, 'rounded-full w-7 h-7 flex items-center justify-center': day.isToday}">{{ day.day }}</span>
                              <div class="mt-1 space-y-1 text-xs event-container">
                                @for(event of day.events; track event.title) {
                                  <div (click)="openEventDetails(event, $event)" 
                                      class="p-1 rounded-md event-item absolute truncate" 
                                      [style.top.px]="event.top"
                                      [style.left.px]="event.left"
                                      [style.width.px]="event.width"
                                      [style.zIndex]="event.zIndex"
                                      [ngClass]="{
                                    'bg-red-100 text-red-800': event.status === 'Vencido',
                                    'bg-green-100 text-green-800': event.status === 'Finalizado',
                                    'bg-amber-100 text-amber-800': event.status === 'Pendiente'
                                  }">
                                    <span class="status-dot" [ngClass]="'status-' + event.status"></span>
                                    {{ event.title }}
                                  </div>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      }
                      @case('week'){
                        <div class="grid grid-cols-7 flex-1">
                          @for(day of weekData(); track day.fullDate){
                            <div class="text-center py-3 font-semibold text-gray-600 border-b border-r">
                              {{ day.dayName }} <span class="text-gray-500 font-bold">{{day.dayNumber}}</span>
                            </div>
                          }
                          @for(day of weekData(); track day.fullDate){
                            <div (click)="handleDayClick(day, $event)" class="border-b border-r p-2 min-h-[400px] relative cursor-pointer">
                              @for(event of day.events; track event.title) {
                                  <div (click)="openEventDetails(event, $event)" 
                                      class="p-1 rounded-md event-item absolute text-xs cursor-pointer truncate" 
                                      [style.top.px]="event.top"
                                      [style.left.px]="event.left"
                                      [style.width.%]="95"
                                      [style.zIndex]="event.zIndex"
                                      [ngClass]="{
                                    'bg-red-100 text-red-800': event.status === 'Vencido',
                                    'bg-green-100 text-green-800': event.status === 'Finalizado',
                                    'bg-amber-100 text-amber-800': event.status === 'Pendiente'
                                  }">
                                    <span class="status-dot" [ngClass]="'status-' + event.status"></span>
                                    {{ event.title }} ({{event.time}})
                                  </div>
                                }
                            </div>
                          }
                        </div>
                      }
                      @case('day'){
                          <div (click)="openAddEventModal(selectedDate())" class="p-4 overflow-y-auto h-full cursor-pointer">
                              <h3 class="text-lg font-bold text-gray-800 mb-4">{{selectedDate().toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long'})}}</h3>
                              <div class="space-y-4">
                                  @for(event of dayData(); track event.title){
                                    <div (click)="openEventDetails(event, $event)" class="p-3 rounded-lg cursor-pointer flex items-start space-x-4" [ngClass]="{
                                      'bg-red-50 border-l-4 border-red-500': event.status === 'Vencido',
                                      'bg-green-50 border-l-4 border-green-500': event.status === 'Finalizado',
                                      'bg-amber-50 border-l-4 border-amber-500': event.status === 'Pendiente'
                                    }">
                                      <div class="w-20 text-sm font-semibold text-gray-600">{{event.time}}</div>
                                      <div>
                                        <p class="font-bold text-gray-800">{{event.title}}</p>
                                        <p class="text-sm text-gray-500">{{event.type}}</p>
                                      </div>
                                    </div>
                                  }
                                  @empty {
                                    <div class="text-center py-10 text-gray-500 flex flex-col items-center justify-center h-full">
                                          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                                              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          <p>No hay eventos para este día.</p>
                                          <p class="text-sm text-gray-400">Haz clic aquí para agregar una nueva tarea.</p>
                                      </div>
                                  }
                              </div>
                          </div>
                      }
                    }

                  </div>
                </div>
              }
              @case ('cumplimiento') {
                <div class="flex flex-1 h-full">
                  <!-- Secondary Sidebar for Cumplimiento -->
                  <aside class="w-60 flex-shrink-0 bg-white border-r flex flex-col">
                      <nav class="flex-1 px-2 py-4 space-y-1">
                          <a href="#" (click)="setComplianceModuleView('normograma')" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md" [ngClass]="{'bg-gray-200 text-gray-900': complianceModuleView() === 'normograma', 'hover:bg-gray-100': complianceModuleView() !== 'normograma'}">
                              Normograma
                          </a>
                          <a href="#" (click)="setComplianceModuleView('tipo')" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md" [ngClass]="{'bg-gray-200 text-gray-900': complianceModuleView() === 'tipo', 'hover:bg-gray-100': complianceModuleView() !== 'tipo'}">
                              Tipo Cumplimiento
                          </a>
                          <a href="#" (click)="setComplianceModuleView('operacion')" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md" [ngClass]="{'bg-gray-200 text-gray-900': complianceModuleView() === 'operacion', 'hover:bg-gray-100': complianceModuleView() !== 'operacion'}">
                              Operación de Cumplimiento
                          </a>
                          <a href="#" class="flex items-center px-3 py-2 text-sm font-medium text-gray-400 rounded-md cursor-not-allowed">
                              Informes
                          </a>
                      </nav>
                  </aside>

                  <!-- Content Area for Cumplimiento -->
                  <div class="flex-1 overflow-y-auto p-6">
                    @if(isComplianceDetailView()){
                        <div class="flex-grow flex flex-col p-2 space-y-2">
                          <button (click)="goBackToComplianceList()" class="self-start mb-4 flex items-center text-sm text-[--color-primary-text] hover:underline">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Volver a Operaciones
                          </button>
                          <!-- Form -->
                          <div class="bg-gray-100 p-2 border rounded-md">
                              <div class="bg-[--color-primary-dark] text-white font-bold p-2 rounded-t-md text-sm">CUMPLIMIENTO</div>
                              <div class="p-4 bg-white rounded-b-md">
                                  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                                      <!-- Left Column -->
                                      <div>
                                          <div class="grid grid-cols-3 gap-2 items-center mb-2">
                                              <label class="font-semibold text-gray-700">CODIGO:</label>
                                              <input type="text" [value]="cumplimientoDetailData().codigo" class="col-span-2 p-1 border rounded-md bg-gray-100" readonly>
                                          </div>
                                          <div class="grid grid-cols-3 gap-2 items-center mb-2">
                                              <label class="font-semibold text-gray-700"><span class="text-red-500">*</span> NOMBRE CUMPLIMIENTO:</label>
                                              <input type="text" [value]="cumplimientoDetailData().nombre" class="col-span-2 p-1 border rounded-md">
                                          </div>
                                          <div class="grid grid-cols-3 gap-2 items-center">
                                              <label class="font-semibold text-gray-700"><span class="text-red-500">*</span> DESCRIPCIÓN:</label>
                                              <input type="text" [value]="cumplimientoDetailData().descripcion" class="col-span-2 p-1 border rounded-md">
                                          </div>
                                      </div>
                                      <!-- Right Column -->
                                      <div>
                                          <div class="grid grid-cols-3 gap-2 items-center mb-2">
                                              <label class="font-semibold text-gray-700"><span class="text-red-500">*</span> TIPO CUMPLIMIENTOS:</label>
                                              <select class="col-span-2 p-1 border rounded-md">
                                                  <option [selected]="cumplimientoDetailData().tipo === 'NORMATIVO'">NORMATIVO</option>
                                              </select>
                                          </div>
                                      </div>
                                  </div>
                                  <div class="grid grid-cols-1 gap-y-3 text-xs mt-3 border-t pt-3">
                                      <div class="grid grid-cols-6 gap-2 items-center">
                                          <label class="col-span-1 font-semibold text-gray-700">TITULO NORMOGRAMA:</label>
                                          <select class="col-span-5 p-1 border rounded-md"></select>
                                      </div>
                                      <div class="grid grid-cols-6 gap-2 items-center">
                                          <label class="col-span-1 font-semibold text-gray-700">NÚMERO DE LEY/RES:</label>
                                          <input type="text" class="col-span-5 p-1 border rounded-md">
                                      </div>
                                      <div class="grid grid-cols-6 gap-2 items-center">
                                          <label class="col-span-1 font-semibold text-gray-700">UNIDAD ORGANIZACIONAL:</label>
                                          <select class="col-span-5 p-1 border rounded-md"></select>
                                      </div>
                                      <div class="grid grid-cols-6 gap-2 items-center">
                                          <label class="col-span-1 font-semibold text-gray-700">USUARIO:</label>
                                          <input type="text" [value]="cumplimientoDetailData().usuario" class="col-span-2 p-1 border rounded-md bg-gray-100" readonly>
                                          <label class="col-span-1 font-semibold text-gray-700 text-right">FECHA CREACIÓN:</label>
                                          <input type="text" [value]="cumplimientoDetailData().fechaCreacion" class="col-span-2 p-1 border rounded-md bg-gray-100" readonly>
                                      </div>
                                  </div>
                                  <div class="flex justify-center mt-3">
                                      <button class="px-4 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-xs">Modificar</button>
                                  </div>
                              </div>
                          </div>
                          <!-- Reports -->
                          <div class="bg-gray-100 p-2 border rounded-md flex-grow flex flex-col">
                              <div class="bg-[--color-primary-dark] text-white font-bold p-2 rounded-t-md text-sm">REPORTES</div>
                              <div class="bg-white rounded-b-md flex-grow flex flex-col">
                                  <div class="flex items-center space-x-2 p-2 bg-gray-50 border-b text-xs">
                                      <button (click)="openReportModal()" class="flex items-center space-x-1 text-gray-600 hover:text-[--color-primary-text]"><span>+ Insertar</span></button>
                                      <button (click)="openReportModal(selectedReportItem())" [disabled]="selectedReportIds().size !== 1" class="flex items-center space-x-1 text-gray-600 hover:text-[--color-primary-text] disabled:text-gray-400 disabled:cursor-not-allowed"><span>Modificar</span></button>
                                      <button [disabled]="selectedReportIds().size === 0" class="flex items-center space-x-1 text-gray-600 hover:text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"><span>- Eliminar</span></button>
                                  </div>
                                  <div class="overflow-auto flex-grow">
                                      <table class="min-w-full text-xs">
                                          <thead class="bg-gray-50 sticky top-0">
                                              <tr>
                                                  <th class="px-2 py-2"><input type="checkbox" [checked]="isAllReportsSelected()" (change)="toggleSelectAllReports($event)" class="rounded text-[--color-primary-text] focus:ring-[--color-primary-medium]"></th>
                                                  <th class="px-4 py-2 text-left font-semibold text-gray-600">Código</th>
                                                  <th class="px-4 py-2 text-left font-semibold text-gray-600">Reporte</th>
                                                  <th class="px-4 py-2 text-left font-semibold text-gray-600">Responsable principal</th>
                                                  <th class="px-4 py-2 text-left font-semibold text-gray-600">Responsable adicional</th>
                                                  <th class="px-4 py-2 text-left font-semibold text-gray-600">Destinatarios</th>
                                              </tr>
                                          </thead>
                                          <tbody class="divide-y divide-gray-200">
                                              @for(report of complianceReportsData(); track report.id) {
                                                  <tr class="hover:bg-gray-50">
                                                      <td class="px-2 py-2"><input type="checkbox" class="rounded text-[--color-primary-text] focus:ring-[--color-primary-medium]" [checked]="selectedReportIds().has(report.id)" (change)="toggleSelectReport(report.id)"></td>
                                                      <td class="px-4 py-2 text-gray-700">{{report.codigo}}</td>
                                                      <td class="px-4 py-2 text-gray-700">{{report.reporte}}</td>
                                                      <td class="px-4 py-2 text-gray-700">{{report.responsablePrincipal}}</td>
                                                      <td class="px-4 py-2 text-gray-700">{{report.responsableAdicional}}</td>
                                                      <td class="px-4 py-2 text-gray-700">{{report.destinatarios}}</td>
                                                  </tr>
                                              } @empty {
                                                  <tr><td colspan="6" class="text-center p-4 text-gray-500">No hay reportes.</td></tr>
                                              }
                                          </tbody>
                                      </table>
                                  </div>
                                </div>
                          </div>
                        </div>
                    } @else {
                        @switch(complianceModuleView()){
                          @case('normograma'){
                              <!-- Normograma Module -->
                              <div class="h-full flex flex-col">
                                  @if (normogramaSubView() === 'grilla') {
                                  <div class="flex-grow bg-white rounded-lg shadow-md flex flex-col">
                                      <div class="flex-shrink-0 p-3 bg-gray-100 rounded-t-lg border-b">
                                      <h2 class="text-sm font-semibold text-gray-600">GESTIÓN NORMOGRAMA</h2>
                                      </div>
                                      <div class="flex items-center space-x-2 p-3 bg-gray-50 border-b">
                                      <button (click)="openNormogramaModal()" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" /></svg><span>Insertar</span></button>
                                      <button (click)="openNormogramaModal(selectedNormogramaItem())" [disabled]="selectedNormogramaIds().size !== 1" [class.cursor-not-allowed]="selectedNormogramaIds().size !== 1" [class.text-gray-400]="selectedNormogramaIds().size !== 1" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg><span>Modificar</span></button>
                                      <button (click)="deleteSelectedNormogramaItems()" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg><span>Eliminar</span></button>
                                      <button (click)="setNormogramaSubView('busqueda')" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg><span>Buscar</span></button>
                                      <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 0V3a1 1 0 112 0v2.101a7.002 7.002 0 01-11.898 0V3a1 1 0 011-1zM2 10a8 8 0 1116 0 8 8 0 01-16 0zm2.5 1.5a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg><span>Recargar</span></button>
                                      <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3a1 1 0 000 2h14a1 1 0 100-2H3zM3 7a1 1 0 000 2h14a1 1 0 100-2H3zM3 11a1 1 0 100 2h14a1 1 0 100-2H3zM3 15a1 1 0 100 2h14a1 1 0 100-2H3z" /></svg><span>Filtros</span></button>
                                      </div>
                                      <div class="overflow-auto flex-grow">
                                      <table class="min-w-full divide-y divide-gray-200 text-sm">
                                          <thead class="bg-gray-50 sticky top-0">
                                          <tr>
                                              <th class="px-2 py-2 text-left"><input type="checkbox" class="rounded text-[--color-primary-text] focus:ring-[--color-primary-medium]" [checked]="isAllNormogramaSelected()" (change)="toggleSelectAllNormograma($event)"></th>
                                              <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Consecutivo</th>
                                              <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Título</th>
                                              <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Responsable</th>
                                              <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Tipo Norma</th>
                                              <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Asunto</th>
                                              <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Entidad</th>
                                              <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Estado</th>
                                              <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">F. Expedición</th>
                                          </tr>
                                          </thead>
                                          <tbody class="bg-white divide-y divide-gray-200">
                                          @for (item of normogramaData(); track item.id) {
                                              <tr class="hover:bg-gray-50">
                                              <td class="px-2 py-2"><input type="checkbox" class="rounded text-[--color-primary-text] focus:ring-[--color-primary-medium]" [checked]="selectedNormogramaIds().has(item.id)" (change)="toggleSelectNormogramaItem(item.id)"></td>
                                              <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.consecutivo }}</td>
                                              <td class="px-4 py-2 text-gray-900" style="min-width: 300px; white-space: normal;">{{ item.titulo }}</td>
                                              <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.responsable }}</td>
                                              <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.tipoNorma }}</td>
                                              <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.asunto }}</td>
                                              <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.entidad }}</td>
                                              <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.estado }}</td>
                                              <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.fechaExpedicion }}</td>
                                              </tr>
                                          } @empty {
                                              <tr><td colspan="9" class="text-center py-8 text-gray-500">No hay datos en el normograma.</td></tr>
                                          }
                                          </tbody>
                                      </table>
                                      </div>
                                      <div class="flex-shrink-0 flex items-center justify-between p-2 bg-gray-50 border-t text-xs text-gray-600">
                                          <span>Mostrando 1 - 9 de 174</span>
                                      </div>
                                  </div>
                                  }
                                  @if (normogramaSubView() === 'busqueda') {
                                    <button (click)="setNormogramaSubView('grilla')" class="self-start mb-4 flex items-center text-sm text-[--color-primary-text] hover:underline">
                                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                      Volver a Normograma
                                    </button>
                                    <div class="flex-grow flex flex-col text-sm">
                                        <!-- Search Box Section -->
                                        <div class="bg-gray-200 p-4 border-b">
                                            <div class="bg-[--color-primary-darker] p-2 text-white font-bold text-center text-xs">BUSCADOR NORMOGRAMA</div>
                                            <div class="bg-white p-4 flex items-center justify-center space-x-2">
                                                <div class="relative flex-grow">
                                                    <input type="text" #searchInput (input)="normogramaSearchQuery.set(searchInput.value)" [value]="normogramaSearchQuery()" class="w-full p-2 border rounded-md pr-10">
                                                    <span class="absolute right-3 top-2.5 text-gray-400">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>
                                                    </span>
                                                </div>
                                                <button (click)="searchNormograma()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Buscar</button>
                                                <button (click)="clearNormogramaSearch()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Limpiar</button>
                                            </div>
                                        </div>
                                        <!-- Results Section -->
                                        <div class="flex-grow bg-white flex flex-col">
                                            <div class="flex items-center space-x-2 p-3 bg-[--color-primary-darker] text-white text-xs font-bold">
                                            NORMOGRAMA
                                            </div>
                                            <div class="flex items-center space-x-2 p-3 bg-gray-50 border-b">
                                                <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><span>Ver</span></button>
                                                <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg><span>Buscar</span></button>
                                                <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 0V3a1 1 0 112 0v2.101a7.002 7.002 0 01-11.898 0V3a1 1 0 011-1zM2 10a8 8 0 1116 0 8 8 0 01-16 0zm2.5 1.5a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg><span>Recargar</span></button>
                                                <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3a1 1 0 000 2h14a1 1 0 100-2H3zM3 7a1 1 0 000 2h14a1 1 0 100-2H3zM3 11a1 1 0 100 2h14a1 1 0 100-2H3zM3 15a1 1 0 100 2h14a1 1 0 100-2H3z" /></svg><span>Filtros</span></button>
                                            </div>
                                            <div class="overflow-y-auto flex-grow">
                                            <table class="min-w-full divide-y divide-gray-200 text-sm">
                                                <thead class="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th class="px-2 py-2 text-left"><input type="checkbox" class="rounded text-[--color-primary-text] focus:ring-[--color-primary-medium]"></th>
                                                    <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Cod</th>
                                                    <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Estado</th>
                                                    <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Tipo Norma</th>
                                                    <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Consecutivo</th>
                                                    <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Título</th>
                                                    <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Asunto</th>
                                                </tr>
                                                </thead>
                                                <tbody class="bg-white divide-y divide-gray-200">
                                                @if (normogramaSearchResults() !== null) {
                                                    @for(item of normogramaSearchResults(); track item.id) {
                                                    <tr class="hover:bg-gray-50">
                                                        <td class="px-2 py-2"><input type="checkbox" class="rounded text-[--color-primary-text] focus:ring-[--color-primary-medium]"></td>
                                                        <td class="px-4 py-2 whitespace-nowrap text-gray-500"></td>
                                                        <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.estado }}</td>
                                                        <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.tipoNorma }}</td>
                                                        <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.consecutivo }}</td>
                                                        <td class="px-4 py-2 text-gray-900">{{ item.titulo }}</td>
                                                        <td class="px-4 py-2 text-gray-900">{{ item.asunto }}</td>
                                                    </tr>
                                                    }
                                                }
                                                @if(normogramaSearchResults()?.length === 0) {
                                                    <tr><td colspan="7" class="text-center py-8 text-gray-500">No se encontraron resultados.</td></tr>
                                                }
                                                </tbody>
                                            </table>
                                                @if (normogramaSearchResults() === null) {
                                                <div class="text-center py-8 text-gray-500">Realice una búsqueda para ver los resultados.</div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                  }
                              </div>
                          }
                          @case('tipo'){
                              <div class="flex-grow flex flex-col bg-white rounded-lg shadow-md"><div class="flex items-center space-x-2 p-3 bg-gray-50 border-b"><button (click)="openComplianceModal()" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" /></svg><span>Insertar</span></button><button (click)="openComplianceModal(selectedComplianceItem())" [disabled]="selectedComplianceIds().size !== 1" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text] disabled:text-gray-400 disabled:cursor-not-allowed"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg><span>Modificar</span></button><button (click)="deleteSelectedComplianceItems()" [disabled]="selectedComplianceIds().size === 0" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg><span>Eliminar</span></button><button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 0V3a1 1 0 112 0v2.101a7.002 7.002 0 01-11.898 0V3a1 1 0 011-1zM2 10a8 8 0 1116 0 8 8 0 01-16 0zm2.5 1.5a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg><span>Recargar</span></button></div><div class="overflow-y-auto flex-grow"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50 sticky top-0"><tr><th class="px-4 py-2 text-left"><input type="checkbox" class="rounded text-[--color-primary-text] focus:ring-[--color-primary-medium]" [checked]="isAllComplianceSelected()" (change)="toggleSelectAllCompliance($event)"></th><th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th><th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th><th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th><th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Abreviación</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">@for (item of complianceData(); track item.id) {<tr class="hover:bg-gray-50"><td class="px-4 py-3"><input type="checkbox" class="rounded text-[--color-primary-text] focus:ring-[--color-primary-medium]" [checked]="selectedComplianceIds().has(item.id)" (change)="toggleSelectComplianceItem(item.id)"></td><td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{{ item.codigo }}</td><td class="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{{ item.nombre }}</td><td class="px-6 py-3 text-sm text-gray-500">{{ item.descripcion }}</td><td class="px-6 py-3 text-sm text-gray-500">{{ item.abreviacion }}</td></tr>} @empty {<tr><td colspan="5" class="text-center py-8 text-gray-500">No hay datos de configuración.</td></tr>}</tbody></table></div></div>
                          }
                          @case('operacion'){
                            <div class="flex-grow flex flex-col bg-white rounded-lg shadow-md">
                                <!-- Toolbar -->
                                <div class="flex items-center space-x-2 p-3 bg-gray-50 border-b">
                                    <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" /></svg><span>Insertar</span></button>
                                    <button (click)="editSelectedComplianceOperation()" [disabled]="selectedComplianceOperationIds().size !== 1" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text] disabled:text-gray-400 disabled:cursor-not-allowed"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg><span>Modificar</span></button>
                                    <button [disabled]="selectedComplianceOperationIds().size === 0" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg><span>Eliminar</span></button>
                                    <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg><span>Buscar</span></button>
                                    <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 0V3a1 1 0 112 0v2.101a7.002 7.002 0 01-11.898 0V3a1 1 0 011-1zM2 10a8 8 0 1116 0 8 8 0 01-16 0zm2.5 1.5a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg><span>Recargar</span></button>      
                                    <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M3 3a2 2 0 00-2 2v6a2 2 0 002 2h1V9a4 4 0 014-4h6V3a2 2 0 00-2-2H3z" /></svg><span>Clonar</span></button>
                                    <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-[--color-primary-text]"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3a1 1 0 000 2h14a1 1 0 100-2H3zM3 7a1 1 0 000 2h14a1 1 0 100-2H3zM3 11a1 1 0 100 2h14a1 1 0 100-2H3zM3 15a1 1 0 100 2h14a1 1 0 100-2H3z" /></svg><span>Filtros</span></button>
                                </div>
                                <!-- Grid -->
                                <div class="overflow-y-auto flex-grow">
                                  <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50 sticky top-0">
                                      <tr>
                                        <th class="px-4 py-2 text-left"><input type="checkbox" class="rounded text-[--color-primary-text] focus:ring-[--color-primary-medium]" [checked]="isAllComplianceOperationSelected()" (change)="toggleSelectAllComplianceOperation($event)"></th>
                                        <th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                        <th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cumplimiento</th>
                                        <th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                        <th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                        <th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha Creación</th>
                                        <th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unidad Organizativa</th>
                                      </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        @for (item of complianceOperationData(); track item.id) {
                                        <tr class="hover:bg-gray-50">
                                            <td class="px-4 py-3"><input type="checkbox" class="rounded text-[--color-primary-text] focus:ring-[--color-primary-medium]" [checked]="selectedComplianceOperationIds().has(item.id)" (change)="toggleSelectComplianceOperationItem(item.id)"></td>
                                            <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{{ item.codigo }}</td>
                                            <td class="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{{ item.cumplimiento }}</td>
                                            <td class="px-6 py-3 text-sm text-gray-500">{{ item.descripcion }}</td>
                                            <td class="px-6 py-3 text-sm text-gray-500">{{ item.tipo }}</td>
                                            <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{{ item.fechaCreacion }}</td>
                                            <td class="px-6 py-3 text-sm text-gray-500">{{ item.unidadOrganizativa }}</td>
                                        </tr>
                                        } @empty {
                                            <tr><td colspan="7" class="text-center py-8 text-gray-500">No hay datos de operación.</td></tr>
                                        }
                                    </tbody>
                                  </table>
                                </div>
                            </div>
                          }
                          @case('informes'){
                            <div class="p-4 bg-white rounded-lg shadow"><h2 class="text-2xl font-bold text-gray-800">Módulo de Informes</h2><p class="mt-2 text-gray-600">Esta sección se encuentra en proceso de análisis.</p></div>
                          }
                        }
                    }
                  </div>
                </div>
              }
               @case('editProfile') {
                <div class="p-8">
                    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
                        <h2 class="text-2xl font-bold text-gray-800 mb-6">Modificar Mis Datos</h2>
                        <form (submit)="saveProfile($event)">
                            <div class="space-y-4">
                                <div>
                                    <label class="font-semibold text-gray-700 block mb-1">Nombre Completo</label>
                                    <input type="text" name="nombre" [value]="userProfile().nombre" class="w-full p-2 border rounded-md bg-gray-50">
                                </div>
                                <div>
                                    <label class="font-semibold text-gray-700 block mb-1">Correo Electrónico</label>
                                    <input type="email" name="correo" [value]="userProfile().correo" class="w-full p-2 border rounded-md bg-gray-50">
                                </div>
                                <div>
                                    <label class="font-semibold text-gray-700 block mb-1">Cargo</label>
                                    <input type="text" name="cargo" [value]="userProfile().cargo" class="w-full p-2 border rounded-md bg-gray-50">
                                </div>
                                 <div>
                                    <label class="font-semibold text-gray-700 block mb-1">Unidad Organizacional</label>
                                    <input type="text" name="unidad" [value]="userProfile().unidadOrganizacional" class="w-full p-2 border rounded-md bg-gray-50">
                                </div>
                            </div>
                            <div class="mt-8 flex justify-end space-x-4">
                                <button type="button" (click)="setView('calendar')" class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancelar</button>
                                <button type="submit" class="px-6 py-2 bg-[--color-primary-medium] text-white rounded-lg hover:bg-[--color-primary-dark] font-semibold">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
               }
               @case('changePassword') {
                <div class="p-8">
                    <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
                        <h2 class="text-2xl font-bold text-gray-800 mb-6">Cambiar Contraseña</h2>
                        <form>
                            <div class="space-y-4">
                                <div>
                                    <label class="font-semibold text-gray-700 block mb-1">Contraseña Actual</label>
                                    <input type="password" class="w-full p-2 border rounded-md">
                                </div>
                                <div>
                                    <label class="font-semibold text-gray-700 block mb-1">Nueva Contraseña</label>
                                    <input type="password" class="w-full p-2 border rounded-md">
                                </div>
                                 <div>
                                    <label class="font-semibold text-gray-700 block mb-1">Confirmar Nueva Contraseña</label>
                                    <input type="password" class="w-full p-2 border rounded-md">
                                </div>
                            </div>
                            <div class="mt-8 flex justify-end space-x-4">
                                <button type="button" (click)="setView('calendar')" class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancelar</button>
                                <button type="submit" class="px-6 py-2 bg-[--color-primary-medium] text-white rounded-lg hover:bg-[--color-primary-dark] font-semibold">Actualizar</button>
                            </div>
                        </form>
                    </div>
                </div>
               }
               @case('manuals') {
                <div class="p-8">
                  <div class="max-w-5xl mx-auto bg-white rounded-lg shadow-md">
                    <!-- Header -->
                    <div class="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                      <h2 class="text-xl font-bold text-gray-700">Gestión de Manuales</h2>
                      <label class="px-4 py-2 bg-[--color-primary-medium] text-white font-semibold rounded-lg hover:bg-[--color-primary-dark] cursor-pointer flex items-center space-x-2 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        </svg>
                        <span>Subir Manual</span>
                        <input type="file" #fileUploadInput class="hidden" accept=".pdf" (change)="handleFileUpload($event)">
                      </label>
                    </div>
                    <!-- Manuals List Table -->
                    <div class="overflow-x-auto">
                      <table class="min-w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-100">
                          <tr>
                            <th scope="col" class="px-6 py-3">Nombre del Archivo</th>
                            <th scope="col" class="px-6 py-3">Tamaño</th>
                            <th scope="col" class="px-6 py-3">Fecha de Subida</th>
                            <th scope="col" class="px-6 py-3 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for(manual of manuals(); track manual.id) {
                            <tr class="bg-white border-b hover:bg-gray-50">
                              <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center">
                                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                                  </svg>
                                 {{ manual.name }}
                              </td>
                              <td class="px-6 py-4">{{ manual.size }}</td>
                              <td class="px-6 py-4">{{ manual.uploadDate }}</td>
                              <td class="px-6 py-4 text-center space-x-2">
                                <a [href]="manual.url" [download]="manual.name" class="inline-flex items-center p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors duration-200" title="Descargar">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                                  </svg>
                                </a>
                                <button (click)="deleteManual(manual.id)" class="inline-flex items-center p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors duration-200" title="Eliminar">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          } @empty {
                            <tr>
                              <td colspan="4" class="text-center py-10 text-gray-500">
                                <p>No hay manuales subidos.</p>
                                <p class="text-xs">Haga clic en "Subir Manual" para empezar.</p>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
               }
            }
          } @else {
            <!-- System Logged Out / Login View -->
            <div class="flex flex-col items-center justify-center h-full bg-gray-100 text-center p-8">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h2 class="text-3xl font-bold text-gray-700">Has salido del sistema</h2>
                <p class="text-gray-500 mt-2 mb-6">Tu sesión ha sido cerrada de forma segura.</p>
                <button (click)="login()" class="px-8 py-3 bg-[--color-primary-medium] text-white rounded-lg hover:bg-[--color-primary-dark] font-semibold text-lg">
                    Ingresar de Nuevo
                </button>
            </div>
          }
        </main>
        <!-- Footer -->
        @if(isUserLoggedIn()){
          <footer class="h-10 bg-white border-t flex items-center justify-between px-8 text-xs text-gray-500">
              <div>
                  <span>GCI v1.0.0</span> | 
                  <span>Angular v{{angularVersion}}</span> |
                  <span>{{todayString}}</span>
              </div>
              <div class="relative">
                  <button (click)="isHelpModalOpen.set(true)" class="flex items-center space-x-1 hover:text-[--color-primary-text] hover:underline">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>Ayuda</span>
                  </button>
              </div>
          </footer>
        }
      </div>

       <!-- Event Details Modal -->
       @if(selectedEvent()){
        <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
            <header class="p-4 border-b flex justify-between items-center">
              <h3 class="text-lg font-bold text-gray-800">{{selectedEvent()?.title}}</h3>
              <button (click)="closeEventDetails()" class="p-1 rounded-full hover:bg-gray-200">&times;</button>
            </header>
            <div class="p-6 space-y-3 text-sm">
              <p><span class="font-semibold text-gray-600 w-28 inline-block">Estado:</span> 
                <span class="px-2 py-1 text-xs rounded-full" [ngClass]="{
                  'bg-red-100 text-red-800': selectedEvent()?.status === 'Vencido',
                  'bg-green-100 text-green-800': selectedEvent()?.status === 'Finalizado',
                  'bg-amber-100 text-amber-800': selectedEvent()?.status === 'Pendiente'
                }">{{selectedEvent()?.status}}</span>
              </p>
              <p><span class="font-semibold text-gray-600 w-28 inline-block">Tipo de Tarea:</span> {{selectedEvent()?.type}}</p>
              <p><span class="font-semibold text-gray-600 w-28 inline-block">Responsable:</span> {{selectedEvent()?.responsable}}</p>
              <p><span class="font-semibold text-gray-600 w-28 inline-block">Supervisor:</span> {{selectedEvent()?.supervisor}}</p>
              <p><span class="font-semibold text-gray-600 w-28 inline-block">Fecha Límite:</span> {{selectedEvent()?.fechaLimite}}</p>
            </div>
          </div>
        </div>
      }

      <!-- Add Event Modal -->
      @if(isAddEventModalOpen()){
        <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <header class="bg-[--color-primary-dark] text-white p-3 rounded-t-lg flex justify-between items-center">
               <h3 class="text-lg font-semibold">Crear Nueva Tarea</h3>
                <button (click)="closeAddEventModal()" class="text-white hover:text-gray-200">&times;</button>
             </header>
             <form #addEventForm (submit)="saveNewEvent($event, addEventForm)">
                <div class="p-6 bg-gray-50 space-y-4 text-sm">
                   <div>
                      <label class="font-semibold text-gray-700 block mb-1">Título de la Tarea</label>
                      <input type="text" name="title" required class="w-full p-2 border rounded-md">
                   </div>
                   <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="font-semibold text-gray-700 block mb-1">Estado</label>
                        <select name="status" class="w-full p-2 border rounded-md bg-white">
                          <option>Pendiente</option>
                          <option>Finalizado</option>
                          <option>Vencido</option>
                        </select>
                      </div>
                       <div>
                        <label class="font-semibold text-gray-700 block mb-1">Tipo de Tarea</label>
                        <select name="type" class="w-full p-2 border rounded-md bg-white">
                          <option>TAREA CUMPLIMIENTO</option>
                          <option>NORMOGRAMA</option>
                        </select>
                      </div>
                   </div>
                   <div>
                      <label class="font-semibold text-gray-700 block mb-1">Responsable</label>
                      <input type="text" name="responsable" required class="w-full p-2 border rounded-md">
                   </div>
                    <div>
                      <label class="font-semibold text-gray-700 block mb-1">Supervisor</label>
                      <input type="text" name="supervisor" required class="w-full p-2 border rounded-md">
                   </div>
                   <div class="grid grid-cols-2 gap-4">
                      <div>
                          <label class="font-semibold text-gray-700 block mb-1">Fecha Límite</label>
                          <input type="date" name="fechaLimite" [value]="formatDate(newEventDate())" required class="w-full p-2 border rounded-md">
                      </div>
                      <div>
                          <label class="font-semibold text-gray-700 block mb-1">Hora</label>
                          <input type="time" name="time" value="10:00" required class="w-full p-2 border rounded-md">
                      </div>
                   </div>
                </div>
                 <div class="px-6 py-4 bg-gray-100 flex justify-end">
                    <button type="submit" class="px-6 py-2 bg-[--color-primary-medium] text-white rounded-lg hover:bg-[--color-primary-dark] font-semibold">
                      Guardar Tarea
                    </button>
                </div>
             </form>
          </div>
        </div>
      }

        <!-- Compliance Form Modal -->
      @if (isComplianceModalOpen()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
             <header class="bg-[--color-primary-dark] text-white p-3 rounded-t-lg flex justify-between items-center">
               <h3 class="text-lg font-semibold">{{ editingComplianceItem()?.id ? 'Modificar' : 'Insertar' }} Tipo Cumplimiento</h3>
                <button (click)="closeComplianceModal()" class="text-white hover:text-gray-200">&times;</button>
             </header>
            <form (submit)="saveComplianceItem($event)" class="p-6 bg-gray-100">
              <div class="grid grid-cols-1 gap-4 text-sm">
                <div><label class="font-semibold text-gray-700 block">CÓDIGO:</label><input type="text" name="codigo" [value]="editingComplianceItem()?.codigo || ''" class="mt-1 w-full p-2 border rounded-md bg-gray-200" readonly></div>
                <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> NOMBRE:</label><input type="text" name="nombre" [value]="editingComplianceItem()?.nombre || ''" class="mt-1 w-full p-2 border rounded-md"></div>
                <div><label class="font-semibold text-gray-700 block">DESCRIPCIÓN:</label><textarea name="descripcion" rows="3" class="mt-1 w-full p-2 border rounded-md">{{ editingComplianceItem()?.descripcion || '' }}</textarea></div>
                <div><label class="font-semibold text-gray-700 block">ABREVIACIÓN:</label><input type="text" name="abreviacion" [value]="editingComplianceItem()?.abreviacion || ''" class="mt-1 w-full p-2 border rounded-md"></div>
              </div>
              <div class="pt-6 flex justify-center">
                  <button type="submit" class="px-6 py-2 bg-[--color-primary-medium] text-white rounded-lg hover:bg-[--color-primary-dark]">
                    {{ editingComplianceItem()?.id ? 'Modificar' : 'Guardar' }}
                  </button>
              </div>
            </form>
          </div>
        </div>
      }
      
      <!-- Normograma Form Modal -->
      @if (isNormogramaModalOpen()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl">
            <header class="bg-[--color-primary-dark] text-white p-3 rounded-t-lg flex justify-between items-center">
              <h3 class="text-lg font-semibold">{{ editingNormogramaItem()?.id ? 'Modificar' : 'Insertar' }} Normograma</h3>
              <button (click)="closeNormogramaModal()" class="text-white hover:text-gray-200 text-2xl">&times;</button>
            </header>
            <form (submit)="saveNormogramaItem($event)" class="p-6 max-h-[80vh] overflow-y-auto">
              @if(editingNormogramaItem(); as currentItem) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <!-- Left Column -->
                  <div class="space-y-4">
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> NÚMERO CONSECUTIVO:</label><input type="text" [value]="currentItem.consecutivo" name="consecutivo" class="mt-1 w-full p-2 border rounded-md" [readOnly]="currentItem.id !== 0"></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> NÚMERO NORMA:</label><input type="text" [value]="currentItem.numeroNorma" name="numeroNorma" class="mt-1 w-full p-2 border rounded-md"></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> FECHA EXPEDICIÓN:</label><input type="date" [value]="currentItem.fechaExpedicion" name="fechaExpedicion" class="mt-1 w-full p-2 border rounded-md"></div>
                    <div><label class="font-semibold text-gray-700 block">TÍTULO:</label><input type="text" [value]="currentItem.titulo" name="titulo" class="mt-1 w-full p-2 border rounded-md"></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> ASUNTO:</label><textarea name="asunto" rows="2" class="mt-1 w-full p-2 border rounded-md">{{ currentItem.asunto }}</textarea></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> IMPACTO:</label><textarea name="impacto" rows="2" class="mt-1 w-full p-2 border rounded-md">{{ currentItem.impacto }}</textarea></div>
                    <div><label class="font-semibold text-gray-700 block">FECHA CUMPLIMIENTO:</label><input type="date" [value]="currentItem.fechaCumplimiento" name="fechaCumplimiento" class="mt-1 w-full p-2 border rounded-md"></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> ÁREA RESPONSABLE:</label><select name="areaResponsable" [value]="currentItem.areaResponsable" class="mt-1 w-full p-2 border rounded-md"><option>VICEPRESIDENCIA RECURSOS HUMANOS</option></select></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> RESPONSABLE:</label><select name="responsable" [value]="currentItem.responsable" class="mt-1 w-full p-2 border rounded-md"><option>VICEPRESIDENTE DE MARKETING Y CANALES - FERNANDO LOAIZA</option></select></div>
                  </div>
                  <!-- Right Column -->
                  <div class="space-y-4">
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> TIPO DE NORMA:</label><select name="tipoNorma" [value]="currentItem.tipoNorma" class="mt-1 w-full p-2 border rounded-md"><option>LEY</option><option>CIRCULAR EXTERNA</option><option>DOCUMENTO TÉCNICO</option><option>HOJA DE RUTA</option></select></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> ENTIDAD:</label><input type="text" [value]="currentItem.entidad" name="entidad" class="mt-1 w-full p-2 border rounded-md"></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> FECHA ENTRADA EN VIGENCIA:</label><input type="date" [value]="currentItem.fechaEntradaVigencia" name="fechaEntradaVigencia" class="mt-1 w-full p-2 border rounded-md"></div>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="font-semibold text-gray-700 block">LOB IMPACTADA:</label><input type="text" name="lobImpactada" [value]="currentItem.lobImpactada" class="mt-1 w-full p-2 border rounded-md"></div>
                        <div><label class="font-semibold text-gray-700 block">FECHA ACCIÓN:</label><input type="date" name="fechaAccion" [value]="currentItem.fechaAccion" class="mt-1 w-full p-2 border rounded-md"></div>
                    </div>
                    <div><label class="font-semibold text-gray-700 block">ACCIÓN:</label><textarea name="accion" rows="2" class="mt-1 w-full p-2 border rounded-md">{{ currentItem.accion }}</textarea></div>
                    <div><label class="font-semibold text-gray-700 block">PLAN DE COMUNICACIÓN:</label><textarea name="planComunicacion" rows="2" class="mt-1 w-full p-2 border rounded-md">{{ currentItem.planComunicacion }}</textarea></div>
                    <div><label class="font-semibold text-gray-700 block">PROPIETARIO ACCIÓN:</label><select name="propietarioAccion" [value]="currentItem.propietarioAccion" class="mt-1 w-full p-2 border rounded-md"><option value=""></option></select></div>
                     <div><label class="font-semibold text-gray-700 block">ESTADO:</label><select name="estado" [value]="currentItem.estado" class="mt-1 w-full p-2 border rounded-md"><option>NUEVO</option></select></div>
                  </div>
                </div>

                <!-- URLs Section -->
                <div class="mt-6 pt-4 border-t">
                  <h4 class="font-bold text-gray-700 mb-2">URLS</h4>
                  <div class="flex items-center space-x-2">
                      <button type="button" class="p-1 bg-gray-200 rounded-md hover:bg-gray-300">+</button>
                      <button type="button" class="p-1 bg-gray-200 rounded-md hover:bg-gray-300">-</button>
                      <label class="font-semibold text-gray-700">LINK:</label>
                      <input type="text" name="link" [value]="currentItem.link" class="flex-grow p-2 border rounded-md">
                  </div>
                </div>

                <!-- User and File Section -->
                <div class="grid grid-cols-2 gap-x-8 mt-4">
                  <div><label class="font-semibold text-gray-700 block">USUARIO:</label><input type="text" name="usuario" [value]="currentItem.usuario" class="mt-1 w-full p-2 border rounded-md bg-gray-100" readonly></div>
                  <div><label class="font-semibold text-gray-700 block">FECHA CREACIÓN:</label><input type="text" name="fechaCreacion" [value]="currentItem.fechaCreacion" class="mt-1 w-full p-2 border rounded-md bg-gray-100" readonly></div>
                  <div class="col-span-2"><label class="font-semibold text-gray-700 block">ARCHIVO:</label><input type="file" class="mt-1 w-full text-xs"></div>
                  <div class="col-span-2"><label class="font-semibold text-gray-700 block">DESCRIPCION:</label><input type="text" name="descripcionArchivo" [value]="currentItem.descripcionArchivo" class="mt-1 w-full p-2 border rounded-md"></div>
                </div>

              }
              <div class="pt-8 flex justify-center space-x-4">
                  <button type="button" class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Ver documentos</button>
                  <button type="submit" class="px-6 py-2 bg-[--color-primary-medium] text-white rounded-lg hover:bg-[--color-primary-dark]">
                    {{ editingNormogramaItem()?.id !== 0 ? 'Actualizar' : 'Guardar' }}
                  </button>
              </div>
            </form>
          </div>
        </div>
      }
      
      <!-- Compliance Report Form Modal -->
       @if (isReportModalOpen()) {
         <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl">
                 <header class="bg-[--color-primary-dark] text-white p-3 rounded-t-lg flex justify-between items-center">
                     <h3 class="text-lg font-semibold">{{ editingReportItem()?.id ? 'Modificar' : 'Insertar' }} Reporte de Cumplimiento</h3>
                     <button (click)="closeReportModal()" class="text-white hover:text-gray-200 text-2xl">&times;</button>
                 </header>
                 <form (submit)="saveReportItem($event)" class="p-4 max-h-[80vh] overflow-y-auto text-xs bg-gray-100">
                    @if(editingReportItem(); as currentReport) {
                        <!-- Compliance Report Section -->
                        <div class="bg-[--color-primary-dark] text-white font-bold p-2 rounded-t-md text-sm">REPORTE DE CUMPLIMIENTO</div>
                        <div class="p-4 bg-white rounded-b-md mb-4 space-y-3">
                            <div>
                                <label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> NOMBRE DEL REPORTE:</label>
                                <input type="text" name="reporte" [value]="currentReport.reporte || ''" class="mt-1 w-full p-1 border rounded-md">
                            </div>
                            <div class="flex items-center space-x-4">
                                <label class="flex items-center">
                                    <input type="checkbox" name="enlazarFlujo" [checked]="currentReport.enlazarFlujo" class="h-4 w-4 rounded border-gray-300 text-[--color-primary-text]">
                                    <span class="ml-2 font-semibold text-gray-700">ENLAZAR FLUJO DE TRABAJO:</span>
                                </label>
                                <input type="text" name="cargo" placeholder="CARGO" [value]="currentReport.cargo || ''" class="p-1 border rounded-md flex-grow">
                            </div>
                            <div>
                                <label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> RESPONSABLE DEL CIERRE:</label>
                                 <select name="responsablePrincipal" class="mt-1 w-full p-1 border rounded-md">
                                    <option value=""></option>
                                 </select>
                            </div>
                            <div>
                                <label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> DESTINO:</label>
                                <input type="text" name="destinatarios" [value]="currentReport.destinatarios || ''" class="mt-1 w-full p-1 border rounded-md">
                            </div>
                            <div>
                                <label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> ESPECIFICACIONES:</label>
                                <textarea name="especificaciones" rows="2" class="mt-1 w-full p-1 border rounded-md">{{currentReport.especificaciones || ''}}</textarea>
                            </div>
                            <div class="grid grid-cols-2 gap-x-6">
                              <div class="space-y-1">
                                  <label class="flex items-center"><input type="checkbox" name="responsableRespaldo" [checked]="currentReport.responsableRespaldo" class="h-4 w-4 rounded text-[--color-primary-text]"><span class="ml-2">RESPONSABLE DE RESPALDO</span></label>
                                  <label class="flex items-center"><input type="checkbox" name="interesados" [checked]="currentReport.interesados" class="h-4 w-4 rounded text-[--color-primary-text]"><span class="ml-2">INTERESADOS</span></label>
                              </div>
                               <div class="space-y-1">
                                  <label class="flex items-center"><input type="checkbox" name="unidadOrganizacionalInteresada" [checked]="currentReport.unidadOrganizacionalInteresada" class="h-4 w-4 rounded text-[--color-primary-text]"><span class="ml-2">UNIDAD ORGANIZACIONAL INTERESADA</span></label>
                                  <label class="flex items-center"><input type="checkbox" name="requerimientoEnteExterno" [checked]="currentReport.requerimientoEnteExterno" class="h-4 w-4 rounded text-[--color-primary-text]"><span class="ml-2">REQUERIMIENTO ENTE EXTERNO</span></label>
                              </div>
                            </div>
                        </div>
                        
                        <!-- Periodicity Section -->
                        <div class="bg-[--color-primary-dark] text-white font-bold p-2 rounded-t-md text-sm">PERIODICIDAD</div>
                        <div class="p-4 bg-white rounded-b-md mb-4 space-y-3">
                            <div class="grid grid-cols-3 gap-4 items-center">
                                <label class="font-semibold">REPETIR:</label>
                                <select name="repetir" [value]="currentReport.repetir" class="col-span-2 p-1 border rounded-md">
                                    <option>Cada día</option>
                                    <option>Semanalmente</option>
                                    <option>Mensualmente</option>
                                </select>
                            </div>
                            <div class="grid grid-cols-3 gap-4 items-center">
                                <label class="font-semibold">REPETIR CADA:</label>
                                <div class="col-span-2 flex items-center space-x-2">
                                    <input type="number" name="repetirCada" [value]="currentReport.repetirCada" class="w-20 p-1 border rounded-md">
                                    <span>DÍA</span>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-4 items-center">
                                <label class="font-semibold">FECHA INICIAL:</label>
                                <input type="date" name="fechaInicial" [value]="currentReport.fechaInicial" class="col-span-2 p-1 border rounded-md">
                            </div>
                            <div class="grid grid-cols-3 gap-4 items-center">
                                <label class="font-semibold">FECHA FINAL:</label>
                                <input type="date" name="fechaFinal" [value]="currentReport.fechaFinal" class="col-span-2 p-1 border rounded-md">
                            </div>
                            <div class="grid grid-cols-3 gap-4 items-center">
                                <label class="font-semibold">HORA:</label>
                                <input type="time" name="hora" [value]="currentReport.hora" class="col-span-2 p-1 border rounded-md">
                            </div>
                            <div class="flex items-center">
                                <input type="checkbox" name="requiereAdjunto" [checked]="currentReport.requiereAdjunto" class="h-4 w-4 rounded text-[--color-primary-text]">
                                <label class="ml-2 font-semibold">REQUIERE ADJUNTO:</label>
                            </div>
                            <div class="bg-gray-100 p-2 rounded-md">
                                <p class="font-semibold">RESUMEN:</p>
                                <p>SE CREARAN REPORTES <span class="font-bold">DIARIOS</span>, REPITIENDOSE CADA <span class="font-bold">1 DÍA</span>, INICIANDO EL DÍA <span class="font-bold">2025-08-29</span>, HASTA EL DÍA <span class="font-bold">2025-08-29</span> A LAS <span class="font-bold">06 AM</span>. CADA REPORTE <span class="font-bold">NO REQUIERE ARCHIVO ADJUNTO</span>.</p>
                            </div>
                        </div>
                        
                        <!-- Custom Reminder Section -->
                        <div class="bg-[--color-primary-dark] text-white font-bold p-2 rounded-t-md text-sm">RECORDATORIO PERSONALIZADO</div>
                        <div class="p-4 bg-white rounded-b-md">
                            <label class="flex items-center">
                                <input type="checkbox" name="habilitarRecordatorio" [checked]="currentReport.habilitarRecordatorio" class="h-4 w-4 rounded text-[--color-primary-text]">
                                <span class="ml-2 font-semibold">HABILITAR RECORDATORIO PERSONALIZADO:</span>
                            </label>
                        </div>
                    }
                     <div class="pt-6 flex justify-center">
                         <button type="submit" class="px-8 py-2 bg-[--color-primary-medium] text-white font-semibold rounded-lg hover:bg-[--color-primary-dark]">
                             {{ editingReportItem()?.id ? 'Modificar' : 'Guardar' }}
                         </button>
                     </div>
                 </form>
             </div>
         </div>
       }

       <!-- Help Modal -->
      @if(isHelpModalOpen()){
          <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <header class="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 class="text-lg font-bold text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-[--color-primary-text]" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                  Guía Rápida del Sistema
                </h3>
                <button (click)="isHelpModalOpen.set(false)" class="p-1 rounded-full hover:bg-gray-200 text-2xl font-light">&times;</button>
              </header>
              <div class="p-6 space-y-4 text-sm text-gray-700 max-h-[60vh] overflow-y-auto">
                <h4 class="font-bold text-base text-gray-800">Resumen de Módulos Principales</h4>
                
                <div>
                  <h5 class="font-semibold text-[--color-primary-text]">1. Home (Calendario)</h5>
                  <p>Visualiza todas tus tareas y eventos en vistas de día, semana y mes. Puedes agregar nuevas tareas, ver detalles y filtrar por estado, responsable o palabras clave.</p>
                </div>

                <div>
                  <h5 class="font-semibold text-[--color-primary-text]">2. Cumplimiento</h5>
                  <p>Gestiona todos los aspectos del cumplimiento normativo. Esta sección se divide en:</p>
                  <ul class="list-disc list-inside pl-4 mt-1 space-y-1">
                    <li><strong>Normograma:</strong> Administra el catálogo de normas, leyes y regulaciones.</li>
                    <li><strong>Tipo Cumplimiento:</strong> Configura las diferentes categorías de cumplimiento (Normativo, Legal, etc.).</li>
                    <li><strong>Operación de Cumplimiento:</strong> Crea y gestiona las tareas y reportes específicos derivados de cada norma.</li>
                  </ul>
                </div>
                
                <div>
                  <h5 class="font-semibold text-[--color-primary-text]">3. Work Flow</h5>
                  <p>Este módulo está diseñado para la gestión de flujos de trabajo y procesos internos (Actualmente en desarrollo).</p>
                </div>

                <div>
                  <h5 class="font-semibold text-[--color-primary-text]">4. Manuales</h5>
                  <p>Una sección centralizada para subir, descargar y gestionar todos los manuales de usuario y guías en formato PDF.</p>
                </div>

                <h4 class="font-bold text-base text-gray-800 pt-3 border-t">Opciones del Encabezado</h4>
                <p>En la parte superior derecha encontrarás iconos para:</p>
                  <ul class="list-disc list-inside pl-4 mt-1 space-y-1">
                    <li><strong>Manuales e Informes:</strong> Accesos directos a estas secciones.</li>
                    <li><strong>Configuración:</strong> Ajustes generales y específicos de cada módulo.</li>
                    <li><strong>Filtros:</strong> Aplica filtros a la vista actual (por ejemplo, en el calendario).</li>
                    <li><strong>Apariencia:</strong> Cambia el tema de color de la aplicación.</li>
                    <li><strong>Notificaciones:</strong> Revisa las últimas actualizaciones y noticias.</li>
                    <li><strong>Perfil de Usuario:</strong> Modifica tus datos, cambia tu contraseña o cierra la sesión.</li>
                  </ul>
              </div>
            </div>
          </div>
        }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // --- STATE MANAGEMENT WITH SIGNALS ---
  
  isUserLoggedIn = signal<boolean>(true);
  activeView = signal<View>('calendar');
  calendarView = signal<CalendarView>('month');
  complianceModuleView = signal<ComplianceModuleView>('normograma');
  isComplianceDetailView = signal(false);
  normogramaSubView = signal<NormogramaSubView>('grilla');
  currentDate = signal(new Date(2025, 3, 1));
  selectedDate = signal(new Date(2025, 3, 1));
  isComplianceModalOpen = signal(false);
  isUserMenuOpen = signal(false);
  isConfigMenuOpen = signal(false);
  isParametroGeneralMenuOpen = signal(false);
  isNormogramaModalOpen = signal(false);
  isReportModalOpen = signal(false);
  isFilterPanelOpen = signal(false);
  isDatePickerOpen = signal(false);
  datePickerDate = signal(new Date(2025, 3, 1));
  selectedEvent = signal<CalendarEvent | null>(null);
  isAddEventModalOpen = signal(false);
  newEventDate = signal<Date | null>(null);
  isUpdatesMenuOpen = signal(false);
  isHelpModalOpen = signal(false);

  angularVersion = VERSION.full;
  todayString = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  userProfile = signal<UserProfile>({
    nombre: 'Camila Cuervo',
    correo: 'camicuervo1545@gmail.com.co',
    cargo: 'Analista de desarrollo',
    unidadOrganizacional: 'Desarrollo',
    superior: '',
    perfil: 'Tickets',
    esAuditor: false,
    esGestor: false,
  });

  editingNormogramaItem = signal<Partial<NormogramaItem> | null>(null);
  normogramaSearchQuery = signal('');
  normogramaSearchResults = signal<NormogramaItem[] | null>(null);

  // --- Theme State ---
  activeTheme = signal<Theme>('indigo');
  isThemeMenuOpen = signal(false);

  mockEvents = signal<Map<string, CalendarEvent[]>>(new Map([
    ['2025-04-02', [
      { title: 'Reporte SARLAFT', time: '10:00', color: 'blue', status: 'Vencido', type: 'TAREA CUMPLIMIENTO', responsable: 'Jhon Chavarro', supervisor: 'Implementador SD1', fechaLimite: '02 ABRIL 2025' },
      { title: 'Revisión SARLAFT', time: '12:00', color: 'blue', status: 'Vencido', type: 'TAREA CUMPLIMIENTO', responsable: 'Jhon Chavarro', supervisor: 'Implementador SD1', fechaLimite: '02 ABRIL 2025' }
    ]],
    ['2025-04-03', [{ title: 'Auditoría Interna', time: '15:00', color: 'green', status: 'Vencido', type: 'NORMOGRAMA', responsable: 'Liliana Quiroga', supervisor: 'Implementador SD1', fechaLimite: '03 ABRIL 2025' }]],
    ['2025-04-04', [{ title: 'Capacitación GCI', time: '09:00', color: 'yellow', status: 'Finalizado', type: 'TAREA CUMPLIMIENTO', responsable: 'Camila Cuervo', supervisor: 'Implementador SD1', fechaLimite: '04 ABRIL 2025' }]],
    ['2025-04-07', [{ title: 'Entrega Informe', time: '17:00', color: 'yellow', status: 'Finalizado', type: 'TAREA CUMPLIMIENTO', responsable: 'Jhon Chavarro', supervisor: 'Implementador SD1', fechaLimite: '07 ABRIL 2025' }]],
    ['2025-04-08', [{ title: 'Revisión Contratos', time: '09:00', color: 'blue', status: 'Vencido', type: 'NORMOGRAMA', responsable: 'Mario Chavarro', supervisor: 'Implementador SD1', fechaLimite: '08 ABRIL 2025' }]],
    ['2025-04-16', [
      { title: 'Plan de Mejora', time: '11:00', color: 'yellow', status: 'Pendiente', type: 'TAREA CUMPLIMIENTO', responsable: 'Camila Cuervo', supervisor: 'Implementador SD1', fechaLimite: '16 ABRIL 2025' },
      { title: 'Verificación', time: '14:00', color: 'green', status: 'Finalizado', type: 'NORMOGRAMA', responsable: 'Liliana Quiroga', supervisor: 'Implementador SD1', fechaLimite: '16 ABRIL 2025' },
      { title: 'Reunión de Cierre', time: '16:00', color: 'blue', status: 'Pendiente', type: 'TAREA CUMPLIMIENTO', responsable: 'Camila Cuervo', supervisor: 'Implementador SD1', fechaLimite: '16 ABRIL 2025' }
    ]],
     ['2025-04-10', [
        { title: 'Normativa Legal 2025', time: '11:00', color: 'yellow', status: 'Pendiente', type: 'NORMOGRAMA', responsable: 'Mario Chavarro', supervisor: 'Implementador SD1', fechaLimite: '10 ABRIL 2025' },
        { title: 'Cumplimiento Regular', time: '14:00', color: 'green', status: 'Finalizado', type: 'TAREA CUMPLIMIENTO', responsable: 'Jhon Chavarro', supervisor: 'Implementador SD1', fechaLimite: '10 ABRIL 2025' }
     ]],
  ]));

  activeFilters = signal({ status: '', responsable: '', keyword: '' });

  // --- Compliance Data & State ---
  complianceData = signal<ComplianceConfig[]>([
    { id: 1, codigo: 230, nombre: 'NORMATIVO', descripcion: 'Código monetario financiero 2017', abreviacion: '' },
    { id: 2, codigo: 274, nombre: 'REGULACIÓN INTERNA', descripcion: '', abreviacion: '' },
    { id: 3, codigo: 279, nombre: 'REPORTES INTERNOS Y EXTERNOS', descripcion: 'Gerencia de compliance', abreviacion: 'GDC' },
    { id: 4, codigo: 280, nombre: 'OBLIGACIONES LEGALES', descripcion: '', abreviacion: '' },
  ]);
  editingComplianceItem = signal<Partial<ComplianceConfig> | null>(null);
  selectedComplianceIds = signal<Set<number>>(new Set());
  
  // --- Compliance Operation Data & State ---
  complianceOperationData = signal<ComplianceOperationItem[]>([
    { id: 1, codigo: 1, cumplimiento: 'CALENDARIO TRIBUTARIO', descripcion: 'CALENDARIO TRIBUTARIO', tipo: 'NORMATIVO', fechaCreacion: '2024-11-28', unidadOrganizativa: '' },
    { id: 2, codigo: 2, cumplimiento: 'SEGUIMIENTO DE CONTRATOS', descripcion: 'SEGUIMIENTO DE CONTRATOS DE SD SOFTWARE', tipo: 'NORMATIVO', fechaCreacion: '2024-11-29', unidadOrganizativa: '' },
  ]);
  selectedComplianceOperationIds = signal<Set<number>>(new Set());

  // --- Compliance Form Data & State ---
   cumplimientoDetailData = signal<CumplimientoDetail>({
        codigo: 1,
        nombre: 'CALENDARIO TRIBUTARIO',
        tipo: 'NORMATIVO',
        descripcion: 'CALENDARIO TRIBUTARIO',
        tituloNormograma: '',
        numeroLey: '',
        unidadOrganizacional: '',
        usuario: 'IMPLEMENTADOR SD',
        fechaCreacion: '2024-11-28'
    });
    
  // --- Compliance Reports Data & State ---
  complianceReportsData = signal<ComplianceReport[]>([]);
  editingReportItem = signal<Partial<ComplianceReport> | null>(null);
  selectedReportIds = signal<Set<number>>(new Set());

  // --- Normograma Data & State ---
  normogramaData = signal<NormogramaItem[]>([
    { id: 1, consecutivo: 69, titulo: 'por la cual se modifica el Código Penal y se establecen otras disposiciones (discriminación).', responsable: 'VICEPRESIDENTE DE MARKETING Y CANALES - FERNANDO LOAIZA', tipoNorma: 'LEY', fecha: '', numeroNorma: 1482, fechaExpedicion: '2011-11-01', fechaEntradaVigencia: '2011-11-01', entidad: 'Congreso de Colombia', asunto: 'Delitos por Discriminación', impacto: 'Modifica el Código Penal para abordar la discriminación, impactando las políticas de recursos humanos y el cumplimiento.', fechaCumplimiento: '2011-11-01', areaResponsable: 'VICEPRESIDENCIA RECURSOS HUMANOS', lobImpactada: '', fechaAccion: '', accion: '', planComunicacion: '', propietarioAccion: '', estado: 'NUEVO', link: 'http://www.secretariasenado.gov.co/senado/basedoc/', usuario: 'GCI SUPERUSUARIO', fechaCreacion: '2025-05-19', descripcionArchivo: '' },
    { id: 2, consecutivo: 70, titulo: 'Estrategia de Entornos Laborales Saludables en el Ambiente Laboral.', responsable: 'VICEPRESIDENTE DE MARKETING Y CANALES - FERNANDO LOAIZA', tipoNorma: 'LEY', fecha: '' },
    { id: 3, consecutivo: 71, titulo: 'Adición del Capítulo 13 al Título 2, del Libro 100-000008 del 07 de julio de 2022.', responsable: 'GERENTE ADMINISTRATIVO - Liliana Quiroga', tipoNorma: 'CIRCULAR EXTERNA', fecha: '' },
    { id: 4, consecutivo: 72, titulo: 'Proporciona instrucciones sobre la divulgación de información financiera sobre los efectos del cambio climático.', responsable: 'GERENTE ADMINISTRATIVO - Liliana Quiroga', tipoNorma: 'CIRCULAR EXTERNA', fecha: '' },
    { id: 5, consecutivo: 73, titulo: 'Proporciona instrucciones sobre la adopción de la Taxonomía Verde de Colombia.', responsable: 'GERENTE ADMINISTRATIVO - Liliana Quiroga', tipoNorma: 'CIRCULAR EXTERNA', fecha: '' },
    { id: 6, consecutivo: 74, titulo: 'Proporciona instrucciones relacionadas con la emisión de bonos vinculados al desempeño sostenible.', responsable: 'GERENTE ADMINISTRATIVO - Liliana Quiroga', tipoNorma: 'CIRCULAR EXTERNA', fecha: '' },
    { id: 7, consecutivo: 75, titulo: 'Reemplaza Circular Externa 028 de 2020', responsable: 'GERENTE ADMINISTRATIVO - Liliana Quiroga', tipoNorma: 'CIRCULAR EXTERNA', fecha: '' },
    { id: 8, consecutivo: 76, titulo: 'Documento Técnico sobre la Gestión de Riesgos y Oportunidades Climáticas para Entidades Financieras.', responsable: 'GERENTE ADMINISTRATIVO - Mario Chavarro', tipoNorma: 'DOCUMENTO TÉCNICO', fecha: '' },
    { id: 9, consecutivo: 77, titulo: 'Hoja de Ruta para incorporar riesgos y oportunidades relacionadas con el clima en la gestión del sistema financiero colombiano.', responsable: 'GERENTE ADMINISTRATIVO - Mario Chavarro', tipoNorma: 'HOJA DE RUTA', fecha: '' },
  ]);
  selectedNormogramaIds = signal<Set<number>>(new Set());

  // --- Manuals Data & State ---
  manuals = signal<Manual[]>([
    { id: 1, name: 'Manual_Usuario_GCI.pdf', size: '2.5 MB', url: '#', uploadDate: '2025-08-15' },
    { id: 2, name: 'Guia_Rapida_Configuracion.pdf', size: '1.1 MB', url: '#', uploadDate: '2025-08-10' },
  ]);
  @ViewChild('fileUploadInput') fileUploadInput?: ElementRef<HTMLInputElement>;
  
  // --- Element References for Click-Outside logic ---
  @ViewChild('configContainer') configContainerRef?: ElementRef;
  @ViewChild('filterContainer') filterContainerRef?: ElementRef;
  @ViewChild('themeContainer') themeContainerRef?: ElementRef;
  @ViewChild('updatesContainer') updatesContainerRef?: ElementRef;
  @ViewChild('userContainer') userContainerRef?: ElementRef;
  @ViewChild('datePickerContainer') datePickerContainerRef?: ElementRef;

  
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // --- COMPUTED SIGNALS ---
  monthYear = computed(() => this.currentDate().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
  
  filteredEvents = computed(() => {
    const events = this.mockEvents();
    const filters = this.activeFilters();
    if (!filters.status && !filters.responsable && !filters.keyword) {
      return events;
    }

    const newEventsMap = new Map<string, CalendarEvent[]>();
    events.forEach((dateEvents, dateKey) => {
      const filtered = dateEvents.filter(event => {
        const statusMatch = !filters.status || event.status === filters.status;
        const responsableMatch = !filters.responsable || event.responsable.toLowerCase().includes(filters.responsable.toLowerCase());
        const keywordMatch = !filters.keyword || event.title.toLowerCase().includes(filters.keyword.toLowerCase());
        return statusMatch && responsableMatch && keywordMatch;
      });

      if (filtered.length > 0) {
        newEventsMap.set(dateKey, filtered);
      }
    });
    return newEventsMap;
  });
  
  calendarDays = computed(() => {
    const date = this.currentDate(); const year = date.getFullYear(); const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1); const lastDayOfMonth = new Date(year, month + 1, 0);
    const days = []; const today = new Date();
    const getDateKey = this.getDateKey;
    // Days from the previous month
    const startDayOfWeek = firstDayOfMonth.getDay();
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const dayDate = new Date(year, month - 1, prevLastDay - i);
        days.push({ day: prevLastDay - i, isCurrentMonth: false, fullDate: dayDate, events: this.processOverlappingEvents(this.filteredEvents().get(getDateKey(dayDate)) || []), isToday: false, isSelected: false });
    }

    // Days of the current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const dayDate = new Date(year, month, i);
        const dateKey = getDateKey(dayDate);
        days.push({ day: i, isCurrentMonth: true, fullDate: dayDate, events: this.processOverlappingEvents(this.filteredEvents().get(dateKey) || []), isToday: dateKey === getDateKey(today), isSelected: dateKey === getDateKey(this.selectedDate()) });
    }

    // Days from the next month
    let nextMonthDayCounter = 1;
    while(days.length < 42) { // Ensure 6 rows
       const dayDate = new Date(year, month + 1, nextMonthDayCounter);
       days.push({ day: nextMonthDayCounter, isCurrentMonth: false, fullDate: dayDate, events: this.processOverlappingEvents(this.filteredEvents().get(getDateKey(dayDate)) || []), isToday: false, isSelected: false });
       nextMonthDayCounter++;
    }

    return days;
  });

  weekData = computed(() => {
    const startOfWeek = new Date(this.selectedDate());
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const week = [];
    const getDateKey = this.getDateKey;
    for(let i=0; i<7; i++){
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      const dateKey = getDateKey(day);
      week.push({
        fullDate: day,
        dayName: day.toLocaleDateString('es-ES', {weekday: 'short'}),
        dayNumber: day.getDate(),
        events: this.processOverlappingEvents(this.filteredEvents().get(dateKey) || [])
      })
    }
    return week;
  });
  
  dayData = computed(() => {
      const dateKey = this.getDateKey(this.selectedDate());
      return this.filteredEvents().get(dateKey) || [];
  });

  isAllComplianceSelected = computed(() => {
    const data = this.complianceData();
    const selected = this.selectedComplianceIds();
    return data.length > 0 && data.every(item => selected.has(item.id));
  });
  
  isAllComplianceOperationSelected = computed(() => {
    const data = this.complianceOperationData();
    const selected = this.selectedComplianceOperationIds();
    return data.length > 0 && data.every(item => selected.has(item.id));
  });

   isAllNormogramaSelected = computed(() => {
    const data = this.normogramaData();
    const selected = this.selectedNormogramaIds();
    return data.length > 0 && data.every(item => selected.has(item.id));
  });
  
  isAllReportsSelected = computed(() => {
    const data = this.complianceReportsData();
    const selected = this.selectedReportIds();
    return data.length > 0 && data.every(item => selected.has(item.id));
  });

  selectedNormogramaItem = computed(() => {
    const selectedIds = this.selectedNormogramaIds();
    if (selectedIds.size !== 1) return null;
    const id = selectedIds.values().next().value;
    return this.normogramaData().find(item => item.id === id) || null;
  });

  selectedComplianceItem = computed(() => {
    const selectedIds = this.selectedComplianceIds();
    if (selectedIds.size !== 1) return null;
    const id = selectedIds.values().next().value;
    return this.complianceData().find(item => item.id === id) || null;
  });
  
  selectedReportItem = computed(() => {
    const selectedIds = this.selectedReportIds();
    if (selectedIds.size !== 1) return null;
    const id = selectedIds.values().next().value;
    return this.complianceReportsData().find(item => item.id === id) || null;
  });

  calendarHeaderTitle = computed(() => {
    const view = this.calendarView();
    const selDate = this.selectedDate();

    if (view === 'month') {
      return this.currentDate().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }

    if (view === 'week') {
      const week = this.weekData();
      const start = week[0].fullDate;
      const end = week[6].fullDate;
      const startMonth = start.toLocaleDateString('es-ES', { month: 'short' });
      const endMonth = end.toLocaleDateString('es-ES', { month: 'short' });

      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} - ${end.getDate()} de ${end.toLocaleDateString('es-ES', { month: 'long' })}, ${end.getFullYear()}`;
      } else {
        return `${start.getDate()} de ${startMonth} - ${end.getDate()} de ${endMonth}, ${end.getFullYear()}`;
      }
    }

    if (view === 'day') {
      return selDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return ''; // Fallback
  });

  headerBreadcrumb = computed(() => {
    const view = this.activeView();
    if (view === 'calendar') return 'Inicio > Calendario';
    if (view === 'editProfile') return 'Inicio > Mi Perfil > Modificar Datos';
    if (view === 'changePassword') return 'Inicio > Mi Perfil > Cambiar Contraseña';
    if (view === 'manuals') return 'Inicio > Manuales';

    if (view === 'cumplimiento') {
       if (this.isComplianceDetailView()) {
         return 'Inicio > Cumplimiento > Detalle de Operación';
       }
      const moduleView = this.complianceModuleView();
      let moduleName = '';
      switch(moduleView) {
        case 'normograma': moduleName = 'Normograma'; break;
        case 'tipo': moduleName = 'Tipo Cumplimiento'; break;
        case 'operacion': moduleName = 'Operación de Cumplimiento'; break;
        case 'informes': moduleName = 'Informes'; break;
      }
      return `Inicio > Cumplimiento > ${moduleName}`;
    }
    if (view === 'workflow') {
      return `Inicio > work flow`;
    }
    return 'Inicio'; // Fallback
  });

  // --- CLICK OUTSIDE HANDLER ---
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.isConfigMenuOpen() && this.configContainerRef && !this.configContainerRef.nativeElement.contains(event.target)) {
      this.isConfigMenuOpen.set(false);
    }
    if (this.isFilterPanelOpen() && this.filterContainerRef && !this.filterContainerRef.nativeElement.contains(event.target)) {
      this.isFilterPanelOpen.set(false);
    }
    if (this.isThemeMenuOpen() && this.themeContainerRef && !this.themeContainerRef.nativeElement.contains(event.target)) {
      this.isThemeMenuOpen.set(false);
    }
    if (this.isUpdatesMenuOpen() && this.updatesContainerRef && !this.updatesContainerRef.nativeElement.contains(event.target)) {
      this.isUpdatesMenuOpen.set(false);
    }
    if (this.isUserMenuOpen() && this.userContainerRef && !this.userContainerRef.nativeElement.contains(event.target)) {
      this.isUserMenuOpen.set(false);
    }
    if (this.isDatePickerOpen() && this.datePickerContainerRef && !this.datePickerContainerRef.nativeElement.contains(event.target)) {
      this.isDatePickerOpen.set(false);
    }
  }

  // --- AUTH METHODS ---
  logout() {
    this.isUserLoggedIn.set(false);
    this.isUserMenuOpen.set(false);
    this.activeView.set('calendar'); // Reset view
  }

  login() {
    this.isUserLoggedIn.set(true);
    this.activeView.set('calendar');
  }

  saveProfile(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    this.userProfile.update(profile => ({
      ...profile,
      nombre: formData.get('nombre') as string,
      correo: formData.get('correo') as string,
      cargo: formData.get('cargo') as string,
      unidadOrganizacional: formData.get('unidad') as string,
    }));
    this.setView('calendar'); // Go back to home after saving
  }

  // --- VIEW & MODAL METHODS ---
  setView(view: View) { 
    this.activeView.set(view);
    if (view === 'cumplimiento') {
      this.isComplianceDetailView.set(false);
      this.complianceModuleView.set('normograma');
    }
  }
  setCalendarView(view: CalendarView) {
    this.calendarView.set(view);
  }
  
  toggleUserMenu() { 
    this.isUserMenuOpen.update(v => !v); 
    if (this.isUserMenuOpen()) {
        this.isThemeMenuOpen.set(false);
        this.isFilterPanelOpen.set(false);
        this.isUpdatesMenuOpen.set(false);
        this.isConfigMenuOpen.set(false);
    }
  }
  
  toggleThemeMenu() {
    this.isThemeMenuOpen.update(v => !v);
    if(this.isThemeMenuOpen()){
        this.isUserMenuOpen.set(false);
        this.isFilterPanelOpen.set(false);
        this.isUpdatesMenuOpen.set(false);
        this.isConfigMenuOpen.set(false);
    }
  }
  
  toggleFilterPanel() {
      this.isFilterPanelOpen.update(v => !v);
      if(this.isFilterPanelOpen()){
        this.isUserMenuOpen.set(false);
        this.isThemeMenuOpen.set(false);
        this.isUpdatesMenuOpen.set(false);
        this.isConfigMenuOpen.set(false);
    }
  }

  toggleUpdatesMenu() {
    this.isUpdatesMenuOpen.update(v => !v);
    if(this.isUpdatesMenuOpen()){
        this.isUserMenuOpen.set(false);
        this.isFilterPanelOpen.set(false);
        this.isThemeMenuOpen.set(false);
        this.isConfigMenuOpen.set(false);
    }
  }

  toggleConfigMenu() {
    this.isConfigMenuOpen.update(v => !v);
    if (this.isConfigMenuOpen()) {
        this.isUserMenuOpen.set(false);
        this.isThemeMenuOpen.set(false);
        this.isFilterPanelOpen.set(false);
        this.isUpdatesMenuOpen.set(false);
    }
  }

  toggleDatePicker() {
    this.isDatePickerOpen.update(v => !v);
  }

  changeDatePickerYear(offset: number){
    this.datePickerDate.update(d => {
      const newDate = new Date(d);
      newDate.setFullYear(newDate.getFullYear() + offset);
      return newDate;
    })
  }

  selectMonth(monthIndex: number) {
    this.currentDate.update(d => {
      const newDate = new Date(this.datePickerDate());
      newDate.setMonth(monthIndex, 1);
      return newDate;
    });
    this.datePickerDate.set(this.currentDate());
    this.isDatePickerOpen.set(false);
  }

  openEventDetails(event: CalendarEvent, mouseEvent: MouseEvent) {
    mouseEvent.stopPropagation();
    this.selectedEvent.set(event);
  }

  closeEventDetails() {
    this.selectedEvent.set(null);
  }

  handleDayClick(day: { fullDate: Date }, event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.event-item')) {
      return;
    }
    this.openAddEventModal(day.fullDate);
  }

  openAddEventModal(date: Date) {
    this.newEventDate.set(date);
    this.isAddEventModalOpen.set(true);
  }

  closeAddEventModal() {
    this.isAddEventModalOpen.set(false);
  }

  saveNewEvent(event: Event, form: HTMLFormElement) {
    event.preventDefault();
    const formData = new FormData(form);
    const date = this.newEventDate();
    if (!date) return;

    const newEvent: CalendarEvent = {
      title: formData.get('title') as string,
      status: formData.get('status') as 'Pendiente' | 'Finalizado' | 'Vencido',
      type: formData.get('type') as string,
      responsable: formData.get('responsable') as string,
      supervisor: formData.get('supervisor') as string,
      fechaLimite: new Date(formData.get('fechaLimite') as string).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase(),
      time: formData.get('time') as string,
      color: 'blue'
    };

    const dateKey = this.getDateKey(date);
    this.mockEvents.update(events => {
      const newMap = new Map(events);
      const dayEvents = newMap.get(dateKey) || [];
      dayEvents.push(newEvent);
      newMap.set(dateKey, dayEvents);
      return newMap;
    });

    this.closeAddEventModal();
  }
  
  applyFilters(event: Event, form: HTMLFormElement) {
      event.preventDefault();
      const formData = new FormData(form);
      this.activeFilters.set({
          status: formData.get('status') as string,
          responsable: formData.get('responsable') as string,
          keyword: formData.get('keyword') as string
      });
      this.isFilterPanelOpen.set(false);
  }

  resetFilters(form: HTMLFormElement) {
      form.reset();
      this.activeFilters.set({ status: '', responsable: '', keyword: '' });
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }
  
  setComplianceModuleView(module: ComplianceModuleView) { 
    this.complianceModuleView.set(module); 
    this.isComplianceDetailView.set(false);
  }
  setNormogramaSubView(subView: NormogramaSubView) { 
    this.normogramaSubView.set(subView);
  }

  editSelectedComplianceOperation() {
    const selectedIds = this.selectedComplianceOperationIds();
    if (selectedIds.size !== 1) {
      return;
    }
    const id = selectedIds.values().next().value;
    const itemToEdit = this.complianceOperationData().find(item => item.id === id);

    if (itemToEdit) {
      this.cumplimientoDetailData.update(currentDetails => ({
        ...currentDetails,
        codigo: itemToEdit.codigo,
        nombre: itemToEdit.cumplimiento,
        descripcion: itemToEdit.descripcion,
        tipo: itemToEdit.tipo,
        fechaCreacion: itemToEdit.fechaCreacion,
        unidadOrganizacional: itemToEdit.unidadOrganizativa,
        tituloNormograma: '', 
        numeroLey: ''
      }));
      
      this.selectedComplianceOperationIds.set(new Set());
      this.isComplianceDetailView.set(true);
    }
  }

  goBackToComplianceList(){
    this.isComplianceDetailView.set(false);
    this.complianceModuleView.set('operacion');
  }
  
  // --- Theme Methods ---
  setTheme(theme: Theme) {
    this.activeTheme.set(theme);
    this.isThemeMenuOpen.set(false);
  }

  openComplianceModal(item?: ComplianceConfig | null) {
    this.editingComplianceItem.set(item ? { ...item } : {id: 0, codigo: 0, nombre: '', descripcion: '', abreviacion: ''});
    this.isComplianceModalOpen.set(true);
  }
  closeComplianceModal() { this.isComplianceModalOpen.set(false); }

  openReportModal(item?: ComplianceReport | null) {
    const today = new Date().toISOString().split('T')[0];
    this.editingReportItem.set(item ? { ...item } : {
        id: 0, codigo: 0, reporte: '', responsablePrincipal: '', responsableAdicional: '',
        destinatarios: '', enlazarFlujo: false, cargo: '', especificaciones: '',
        responsableRespaldo: false, interesados: false, unidadOrganizacionalInteresada: false,
        requerimientoEnteExterno: false, repetir: 'Cada día', repetirCada: 1,
        fechaInicial: today, fechaFinal: today, hora: '06:00', requiereAdjunto: false,
        habilitarRecordatorio: false
    });
    this.isReportModalOpen.set(true);
  }
  closeReportModal() { this.isReportModalOpen.set(false); }

  // --- CRUD METHODS FOR COMPLIANCE ---
  saveComplianceItem(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const currentItem = this.editingComplianceItem();
    if (!currentItem) return;

    const updatedItem: Partial<ComplianceConfig> = {
      nombre: formData.get('nombre') as string,
      descripcion: formData.get('descripcion') as string,
      abreviacion: formData.get('abreviacion') as string,
    };

    if (currentItem.id && currentItem.id !== 0) { // Update
      this.complianceData.update(currentData => 
        currentData.map(item => item.id === currentItem.id ? { ...item, ...updatedItem } : item)
      );
    } else { // Insert
      const newId = Math.max(...this.complianceData().map(i => i.id), 0) + 1;
      const newCodigo = Math.max(...this.complianceData().map(i => i.codigo), 0) + 1;
      const newItem: ComplianceConfig = {
        ...updatedItem,
        id: newId,
        codigo: newCodigo,
      } as ComplianceConfig;
       this.complianceData.update(currentData => [...currentData, newItem]);
    }
    this.closeComplianceModal();
  }

  deleteSelectedComplianceItems() {
    this.complianceData.update(currentData => currentData.filter(item => !this.selectedComplianceIds().has(item.id)));
    this.selectedComplianceIds.set(new Set());
  }
  
  // --- CRUD for Reports ---
  saveReportItem(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const currentItem = this.editingReportItem();
    if (!currentItem) return;

    const itemData: Omit<ComplianceReport, 'id' | 'codigo'> = {
        reporte: formData.get('reporte') as string,
        responsablePrincipal: formData.get('responsablePrincipal') as string,
        destinatarios: formData.get('destinatarios') as string,
        enlazarFlujo: formData.has('enlazarFlujo'),
        cargo: formData.get('cargo') as string,
        especificaciones: formData.get('especificaciones') as string,
        responsableRespaldo: formData.has('responsableRespaldo'),
        interesados: formData.has('interesados'),
        unidadOrganizacionalInteresada: formData.has('unidadOrganizacionalInteresada'),
        requerimientoEnteExterno: formData.has('requerimientoEnteExterno'),
        responsableAdicional: '',
        repetir: formData.get('repetir') as string,
        repetirCada: +(formData.get('repetirCada') || 1),
        fechaInicial: formData.get('fechaInicial') as string,
        fechaFinal: formData.get('fechaFinal') as string,
        hora: formData.get('hora') as string,
        requiereAdjunto: formData.has('requiereAdjunto'),
        habilitarRecordatorio: formData.has('habilitarRecordatorio')
    };

    if (currentItem.id && currentItem.id !== 0) { // Update
        this.complianceReportsData.update(data => data.map(item =>
            item.id === currentItem.id ? { ...item, ...itemData } : item
        ));
    } else { // Insert
        const newId = Math.max(...this.complianceReportsData().map(i => i.id), 0) + 1;
        const newCodigo = newId;
        const newItem: ComplianceReport = { ...itemData, id: newId, codigo: newCodigo };
        this.complianceReportsData.update(data => [...data, newItem]);
    }

    this.closeReportModal();
  }

  // --- SELECTION METHODS FOR COMPLIANCE CONFIG GRID ---
  toggleSelectAllCompliance(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedComplianceIds.update(currentSet => {
        const newSet = new Set(currentSet);
        if (checked) { this.complianceData().forEach(item => newSet.add(item.id)); }
        else { newSet.clear(); }
        return newSet;
    });
  }

  toggleSelectComplianceItem(id: number) {
      this.selectedComplianceIds.update(currentSet => {
          const newSet = new Set(currentSet);
          if (newSet.has(id)) { newSet.delete(id); }
          else { newSet.add(id); }
          return newSet;
      });
  }
  
  // --- SELECTION METHODS FOR COMPLIANCE OPERATION GRID ---
  toggleSelectAllComplianceOperation(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedComplianceOperationIds.update(currentSet => {
        const newSet = new Set(currentSet);
        if (checked) { this.complianceOperationData().forEach(item => newSet.add(item.id)); }
        else { newSet.clear(); }
        return newSet;
    });
  }

  toggleSelectComplianceOperationItem(id: number) {
      this.selectedComplianceOperationIds.update(currentSet => {
          const newSet = new Set(currentSet);
          if (newSet.has(id)) { newSet.delete(id); }
          else { newSet.add(id); }
          return newSet;
      });
  }
  
  // --- SELECTION METHODS FOR REPORTS GRID ---
   toggleSelectAllReports(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedReportIds.update(currentSet => {
        const newSet = new Set(currentSet);
        if (checked) { this.complianceReportsData().forEach(item => newSet.add(item.id)); }
        else { newSet.clear(); }
        return newSet;
    });
  }

  toggleSelectReport(id: number) {
      this.selectedReportIds.update(currentSet => {
          const newSet = new Set(currentSet);
          if (newSet.has(id)) { newSet.delete(id); }
          else { newSet.add(id); }
          return newSet;
      });
  }

  // --- NORMOGRAMA METHODS ---
  openNormogramaModal(item?: NormogramaItem | null) {
    if (item) {
       this.editingNormogramaItem.set({ ...item });
    } else {
      // For 'Insert', create an empty object with a temporary ID of 0
      this.editingNormogramaItem.set({
        id: 0, consecutivo: 0, titulo: '', responsable: '', tipoNorma: 'LEY', fecha: '',
        numeroNorma: undefined, fechaExpedicion: '', entidad: '', fechaEntradaVigencia: '',
        asunto: '', impacto: '', fechaCumplimiento: '', areaResponsable: 'VICEPRESIDENCIA RECURSOS HUMANOS',
        lobImpactada: '', fechaAccion: '', accion: '', planComunicacion: '',
        propietarioAccion: '', estado: 'NUEVO', link: '', usuario: 'GCI SUPERUSUARIO',
        fechaCreacion: new Date().toISOString().split('T')[0], descripcionArchivo: ''
      });
    }
    this.isNormogramaModalOpen.set(true);
  }

  closeNormogramaModal() {
    this.isNormogramaModalOpen.set(false);
    this.editingNormogramaItem.set(null);
  }

  saveNormogramaItem(event: Event) {
    event.preventDefault();
    const currentItem = this.editingNormogramaItem();
    if (!currentItem) return;

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const itemData: Omit<NormogramaItem, 'id' | 'consecutivo'> & { consecutivo?: number } = {
        numeroNorma: +(formData.get('numeroNorma') || 0),
        fechaExpedicion: formData.get('fechaExpedicion') as string,
        titulo: formData.get('titulo') as string,
        asunto: formData.get('asunto') as string,
        impacto: formData.get('impacto') as string,
        fechaCumplimiento: formData.get('fechaCumplimiento') as string,
        areaResponsable: formData.get('areaResponsable') as string,
        responsable: formData.get('responsable') as string,
        tipoNorma: formData.get('tipoNorma') as string,
        entidad: formData.get('entidad') as string,
        fechaEntradaVigencia: formData.get('fechaEntradaVigencia') as string,
        lobImpactada: formData.get('lobImpactada') as string,
        fechaAccion: formData.get('fechaAccion') as string,
        accion: formData.get('accion') as string,
        planComunicacion: formData.get('planComunicacion') as string,
        propietarioAccion: formData.get('propietarioAccion') as string,
        estado: formData.get('estado') as string,
        link: formData.get('link') as string,
        usuario: formData.get('usuario') as string,
        fechaCreacion: formData.get('fechaCreacion') as string,
        descripcionArchivo: formData.get('descripcionArchivo') as string,
        fecha: '',
    };


    if (currentItem.id && currentItem.id !== 0) { // Update
      this.normogramaData.update(currentData => currentData.map(item => 
        item.id === currentItem.id ? { ...item, ...itemData } : item
      ));
    } else { // Insert
       const newConsecutivo = Math.max(...this.normogramaData().map(i => i.consecutivo), 0) + 1;
       const newId = Math.max(...this.normogramaData().map(i => i.id), 0) + 1;
       const newItem: NormogramaItem = {
         ...itemData,
         id: newId,
         consecutivo: newConsecutivo,
       };
       this.normogramaData.update(currentData => [...currentData, newItem]);
    }

    this.closeNormogramaModal();
  }

  deleteSelectedNormogramaItems() {
    this.normogramaData.update(currentData => currentData.filter(item => !this.selectedNormogramaIds().has(item.id)));
    this.selectedNormogramaIds.set(new Set());
  }

  toggleSelectAllNormograma(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedNormogramaIds.update(currentSet => {
        const newSet = new Set(currentSet);
        if (checked) { this.normogramaData().forEach(item => newSet.add(item.id)); }
        else { newSet.clear(); }
        return newSet;
    });
  }

  toggleSelectNormogramaItem(id: number) {
      this.selectedNormogramaIds.update(currentSet => {
          const newSet = new Set(currentSet);
          if (newSet.has(id)) { newSet.delete(id); }
          else { newSet.add(id); }
          return newSet;
      });
  }
  
  searchNormograma() {
    const query = this.normogramaSearchQuery().toLowerCase().trim();
    if (!query) {
      this.normogramaSearchResults.set([]);
      return;
    }
    this.normogramaSearchResults.set(
      this.normogramaData().filter(item => 
        item.titulo.toLowerCase().includes(query) ||
        (item.asunto && item.asunto.toLowerCase().includes(query)) ||
        String(item.consecutivo).includes(query)
      )
    );
  }

  clearNormogramaSearch() {
    this.normogramaSearchQuery.set('');
    this.normogramaSearchResults.set(null);
  }

  // --- MANUALS METHODS ---
  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    const newManual: Manual = {
      id: Date.now(), // simple unique id
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      url: URL.createObjectURL(file),
      uploadDate: new Date().toISOString().split('T')[0],
    };

    this.manuals.update(currentManuals => [...currentManuals, newManual]);

    // Reset the file input
    if (this.fileUploadInput) {
      this.fileUploadInput.nativeElement.value = '';
    }
  }

  deleteManual(manualId: number) {
    this.manuals.update(currentManuals => {
      // Revoke the object URL to prevent memory leaks
      const manualToDelete = currentManuals.find(m => m.id === manualId);
      if (manualToDelete && manualToDelete.url.startsWith('blob:')) {
        URL.revokeObjectURL(manualToDelete.url);
      }
      return currentManuals.filter(m => m.id !== manualId);
    });
  }


  // --- CALENDAR METHODS ---
  navigateCalendar(offset: number) {
    const view = this.calendarView();
    
    if (view === 'month') {
        this.currentDate.update(d => { 
            const newDate = new Date(d); 
            newDate.setMonth(newDate.getMonth() + offset, 1);
            this.datePickerDate.set(newDate);
            this.selectedDate.set(newDate);
            return newDate; 
        });
    } else {
        const newSelectedDate = new Date(this.selectedDate());
        if (view === 'week') {
            newSelectedDate.setDate(newSelectedDate.getDate() + (7 * offset));
        } else { // day view
            newSelectedDate.setDate(newSelectedDate.getDate() + (1 * offset));
        }
        this.selectedDate.set(newSelectedDate);
        if (newSelectedDate.getMonth() !== this.currentDate().getMonth() || newSelectedDate.getFullYear() !== this.currentDate().getFullYear()){
             this.currentDate.set(newSelectedDate);
             this.datePickerDate.set(newSelectedDate);
        }
    }
  }
  goToToday() { 
    const today = new Date();
    this.currentDate.set(today); 
    this.selectedDate.set(today); 
    this.datePickerDate.set(today);
  }
  selectDate(date: Date) { 
    this.selectedDate.set(date); 
    this.calendarView.set('day');
  }
  
  private processOverlappingEvents(events: CalendarEvent[]): CalendarEvent[] {
    if (events.length <= 1) {
      if (events.length === 1) {
          // Iniciar eventos un poco más abajo del header del día
          return events.map(e => ({ ...e, top: 35, left: 4, zIndex: 1 }));
      }
      return events;
    }
  
    // Simple stacking layout for multiple events
    return events.map((event, index) => {
      const top = 35 + (index * 22); // Espaciado vertical entre eventos
      return {
        ...event,
        top: top,
        left: 4, // Alinear a la izquierda
        zIndex: index + 1
      };
    });
  }

  private getDateKey = (date: Date): string => { return date.toISOString().split('T')[0]; }
}

