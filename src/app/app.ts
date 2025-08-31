import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// --- DATA INTERFACES ---
interface CalendarEvent {
  title: string;
  time: string;
  color: 'blue' | 'green' | 'yellow';
}

interface ComplianceConfig {
  id: number;
  codigo: number;
  nombre: string;
  descripcion: string;
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

// --- TYPES OF VIEWS ---
type View = 'calendar' | 'cumplimiento' | 'normograma';
type ComplianceSubView = 'configuracion' | 'operacion';
type NormogramaSubView = 'grilla' | 'busqueda';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex h-screen bg-gray-200 font-sans">
      <!-- Barra Lateral Izquierda -->
      <aside class="w-16 flex-shrink-0 bg-white border-r flex flex-col items-center py-4 space-y-4">
        <div class="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg font-bold text-xl">G</div>
        <nav class="flex flex-col space-y-2">
          <a href="#" class="p-2 rounded-lg" title="Home" (click)="setView('calendar')"
             [ngClass]="{'bg-blue-100 text-blue-600': activeView() === 'calendar', 'text-gray-500 hover:bg-gray-200': activeView() !== 'calendar'}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          </a>
          <a href="#" class="p-2 rounded-lg" title="Cumplimiento" (click)="setView('cumplimiento')"
             [ngClass]="{'bg-blue-100 text-blue-600': activeView() === 'cumplimiento', 'text-gray-500 hover:bg-gray-200': activeView() !== 'cumplimiento'}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </a>
          <a href="#" class="p-2 rounded-lg" title="Normograma" (click)="setView('normograma')"
             [ngClass]="{'bg-blue-100 text-blue-600': activeView() === 'normograma', 'text-gray-500 hover:bg-gray-200': activeView() !== 'normograma'}">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </a>
        </nav>
      </aside>

      <!-- Contenido Principal -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header Superior (Azul) -->
        <header class="h-12 bg-blue-700 text-white flex items-center justify-between px-4 shadow-md flex-shrink-0 z-20">
            <div class="flex items-center">
                <nav class="flex items-center">
                    <a href="#" (click)="setView('calendar')" class="px-3 py-2 text-sm font-medium rounded-t-md" [ngClass]="{'bg-blue-800': activeView() === 'calendar', 'hover:bg-blue-600': activeView() !== 'calendar'}">Mis Tareas</a>
                    @if (activeView() === 'normograma') {
                      <a href="#" (click)="setNormogramaSubView('grilla')" class="px-3 py-2 text-sm font-medium rounded-t-md" [ngClass]="{'bg-blue-800': normogramaSubView() === 'grilla', 'hover:bg-blue-600': normogramaSubView() !== 'grilla'}">Gestión Normograma</a>
                      @if(normogramaSubView() === 'busqueda') {
                        <a href="#" class="px-3 py-2 text-sm font-medium bg-blue-800 rounded-t-md">Búsqueda Normograma</a>
                      }
                    }
                </nav>
            </div>
            <div class="flex items-center space-x-4">
                <a href="#" class="text-sm hover:bg-blue-600 p-2 rounded-md flex items-center space-x-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg><span>Manuales</span></a>
                <a href="#" class="text-sm hover:bg-blue-600 p-2 rounded-md flex items-center space-x-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 00-4-4H3V9h2a4 4 0 004-4V3l4 4-4 4z" /></svg><span>Informes</span></a>
                
                <!-- Botón de Configuración con Menú Desplegable -->
                <div class="relative">
                    <button (click)="toggleConfigMenu()" class="text-sm hover:bg-blue-600 p-2 rounded-md flex items-center space-x-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span>Configuración</span>
                    </button>
                    @if(isConfigMenuOpen()) {
                        <div class="absolute top-full left-0 mt-2 w-72 bg-blue-800 rounded-md shadow-xl text-white font-semibold text-sm">
                            <div class="relative" (mouseenter)="isParametroGeneralMenuOpen.set(true)" (mouseleave)="isParametroGeneralMenuOpen.set(false)">
                                <a href="#" class="flex justify-between items-center p-3 hover:bg-blue-700 rounded-t-md">
                                    <span>AJUSTES PARÁMETRO GENERAL</span>
                                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                                </a>
                                @if (isParametroGeneralMenuOpen()) {
                                    <div class="absolute right-full top-0 mr-1 w-72 bg-white rounded-md shadow-xl border text-gray-800 p-2 font-normal">
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

                <!-- Botón de Usuario con Menú Desplegable -->
                <div class="relative">
                    <button (click)="toggleUserMenu()" class="flex items-center space-x-1 text-sm bg-blue-800 px-2 py-1 rounded-md">
                        <span>jchavarro</span>
                        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                    </button>
                     @if (isUserMenuOpen()) {
                      <div class="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border text-gray-800">
                        <div class="p-4">
                            <h3 class="text-lg font-bold text-gray-800 mb-2">jchavarro</h3>
                            <div class="text-xs space-y-1 text-gray-600 border-b pb-3">
                                <p><span class="font-semibold w-20 inline-block">Nombre:</span> Jhon Chavarro</p>
                                <br>
                                <p><span class="font-semibold w-20 inline-block">Correo:</span> jchevarro@software.com.co</p>
                                <br>
                                <p><span class="font-semibold w-20 inline-block">Cargo:</span> ANALISTA DE DESARROLLO - Jhon Chavarro</p>
                                <p><span class="font-semibold w-20 inline-block">Unidad organizacional:</span> DESARROLLO</p>
                                <p><span class="font-semibold w-20 inline-block">Superior:</span> IMPLEMENTADOR SD1</p>
                                <br>
                                <p><span class="font-semibold w-20 inline-block">Perfil:</span> TICKETS</p>
                                <p><span class="font-semibold w-20 inline-block">Auditor:</span> NO</p>
                                <p><span class="font-semibold w-20 inline-block">Gestor:</span> NO</p>
                            </div>
                            <div class="mt-3 text-sm space-y-2 border-b pb-3">
                                <a href="#" class="flex items-center text-blue-600 hover:underline"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>Notificar datos</a>
                                <a href="#" class="flex items-center text-blue-600 hover:underline"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h1a2 2 0 012-2" /></svg>Cambio de contraseña</a>
                                <a href="#" class="flex items-center text-blue-600 hover:underline"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>Salir del sistema</a>
                            </div>
                        </div>
                      </div>
                    }
                </div>
            </div>
        </header>

        <!-- Área de Contenido Principal (Dinámica) -->
        <main class="flex-1 overflow-y-auto">
          @switch (activeView()) {
            @case ('calendar') {
             <div class="flex flex-1 overflow-hidden p-4 space-x-4 h-full">
                <!-- Panel Izquierdo: Calendario y Footer -->
                <div class="flex-1 flex flex-col h-full">
                    <!-- Panel del Calendario -->
                    <div class="flex-1 flex flex-col bg-white rounded-lg shadow-md">
                      <div class="flex items-center justify-between p-3 border-b">
                        <div class="flex items-center space-x-2">
                          <button (click)="changeMonth(-1)" class="p-1 text-gray-500 hover:bg-gray-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></button>
                           <h2 class="text-lg font-bold text-gray-700 uppercase">{{ monthYear() }}</h2>
                          <button (click)="changeMonth(1)" class="p-1 text-gray-500 hover:bg-gray-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg></button>
                        </div>
                         <button (click)="goToToday()" class="px-3 py-1 text-xs font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50">Hoy</button>
                      </div>
                      <div class="grid grid-cols-7 flex-1 border-t border-l">
                        @for(day of weekDays; track day) {<div class="p-2 text-center text-xs font-semibold text-gray-500 border-r border-b bg-gray-50">{{ day }}</div>}
                        @for(day of calendarDays(); track day.fullDate) {
                          <div class="p-2 border-r border-b flex flex-col min-h-[100px]" [class.bg-gray-50]="!day.isCurrentMonth">
                            <span class="text-sm font-medium self-end" [class.text-gray-400]="!day.isCurrentMonth" [class.text-white]="day.isToday" [class.bg-blue-600]="day.isToday" [class.rounded-full]="day.isToday" [class.w-6]="day.isToday" [class.h-6]="day.isToday" [class.flex]="day.isToday" [class.items-center]="day.isToday" [class.justify-center]="day.isToday">{{ day.day }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  <!-- Barra de Estado Inferior -->
                  <footer class="h-10 bg-gray-100 flex items-center justify-between px-4 mt-4 rounded-lg shadow-inner flex-shrink-0">
                      <input type="text" placeholder="Buscar en Aerts..." class="text-sm border rounded py-1 px-2 w-1/3 bg-white">
                      <div class="text-xs text-gray-600">
                          ISO 1.177.0 | PHP 5.6 | Viernes 29 de Agosto del 2025
                      </div>
                  </footer>
                </div>

                <!-- Panel Derecho: Barra Lateral de Filtros -->
                <aside class="w-80 flex-shrink-0 bg-white rounded-lg shadow-md p-4 flex flex-col text-sm">
                    <button class="w-full bg-gray-200 py-2 rounded-md font-semibold text-gray-700 hover:bg-gray-300 mb-4">GUARDAR FILTROS</button>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <label class="font-semibold text-gray-600">VISTA:</label>
                            <select class="border rounded-md text-xs p-2 w-48"><option>CALENDARIO</option></select>
                        </div>
                        <div class="flex items-center justify-between">
                            <label class="font-semibold text-gray-600">ESTADO:</label>
                            <div class="flex items-center">
                                <select class="border rounded-md text-xs p-2 w-40"><option>ABIERTO</option></select>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <label class="font-semibold text-gray-600">RESPONSABLE:</label>
                            <select class="border rounded-md text-xs p-2 w-48"><option>TODOS</option></select>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t">
                        <label class="flex items-center">
                            <input type="checkbox" checked class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <span class="ml-2 font-semibold text-gray-700">TODOS</span>
                        </label>
                    </div>
                    <div class="mt-4">
                        <div class="bg-blue-600 text-white p-2 rounded-t-md font-bold text-xs">CUMPLIMIENTO</div>
                        <div class="border border-t-0 p-2 rounded-b-md">
                             <label class="flex items-center">
                                <input type="checkbox" checked class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-gray-700">Mis cumplimientos</span>
                            </label>
                        </div>
                    </div>
                     <div class="mt-2">
                        <div class="bg-blue-600 text-white p-2 rounded-t-md font-bold text-xs">WORKFLOW</div>
                        <div class="border border-t-0 p-2 rounded-b-md">
                             <label class="flex items-center">
                                <input type="checkbox" checked class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-gray-700">Mis gestiones de flujos</span>
                            </label>
                        </div>
                    </div>
                </aside>
              </div>
            }
            @case ('cumplimiento') {
              <!-- Módulo de Cumplimiento con Pestañas -->
              <div class="bg-white p-4 rounded-lg shadow h-full flex flex-col">
                <div class="border-b border-gray-200">
                  <nav class="-mb-px flex space-x-4" aria-label="Tabs">
                    <button (click)="setComplianceSubView('configuracion')" class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm" [ngClass]="{'border-blue-500 text-blue-600': complianceSubView() === 'configuracion', 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': complianceSubView() !== 'configuracion'}">
                      Configuración de Cumplimiento
                    </button>
                  </nav>
                </div>
                @if (complianceSubView() === 'configuracion') {
                  <div class="flex-grow flex flex-col"><div class="flex items-center space-x-2 p-3 bg-gray-50 border-b"><button (click)="openComplianceModal()" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" /></svg><span>Insertar</span></button><button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg><span>Modificar</span></button><button (click)="deleteSelectedComplianceItems()" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg><span>Eliminar</span></button><button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 0V3a1 1 0 112 0v2.101a7.002 7.002 0 01-11.898 0V3a1 1 0 011-1zM2 10a8 8 0 1116 0 8 8 0 01-16 0zm2.5 1.5a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg><span>Recargar</span></button></div><div class="overflow-y-auto flex-grow"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50 sticky top-0"><tr><th class="px-4 py-2 text-left"><input type="checkbox" class="rounded" [checked]="isAllComplianceSelected()" (change)="toggleSelectAllCompliance($event)"></th><th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th><th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th><th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">@for (item of complianceData(); track item.id) {<tr class="hover:bg-gray-50"><td class="px-4 py-3"><input type="checkbox" class="rounded" [checked]="selectedComplianceIds().has(item.id)" (change)="toggleSelectComplianceItem(item.id)"></td><td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{{ item.codigo }}</td><td class="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{{ item.nombre }}</td><td class="px-6 py-3 text-sm text-gray-500">{{ item.descripcion }}</td></tr>} @empty {<tr><td colspan="4" class="text-center py-8 text-gray-500">No hay datos de configuración.</td></tr>}</tbody></table></div></div>
                }
              </div>
            }
            @case ('normograma') {
              <!-- Módulo de Normograma con Pestañas -->
              <div class="p-4 h-full flex flex-col">
                @if (normogramaSubView() === 'grilla') {
                  <div class="flex-grow bg-white rounded-lg shadow-md flex flex-col">
                    <div class="flex-shrink-0 p-3 bg-gray-100 rounded-t-lg border-b">
                       <h2 class="text-sm font-semibold text-gray-600">GESTIÓN NORMOGRAMA</h2>
                     </div>
                    <div class="flex items-center space-x-2 p-3 bg-gray-50 border-b">
                      <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" /></svg><span>Insertar</span></button>
                      <button (click)="openNormogramaModal()" [disabled]="selectedNormogramaIds().size !== 1" [class.cursor-not-allowed]="selectedNormogramaIds().size !== 1" [class.text-gray-400]="selectedNormogramaIds().size !== 1" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg><span>Modificar</span></button>
                      <button (click)="deleteSelectedNormogramaItems()" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg><span>Eliminar</span></button>
                       <button (click)="setNormogramaSubView('busqueda')" class="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg><span>Buscar</span></button>
                      <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 0V3a1 1 0 112 0v2.101a7.002 7.002 0 01-11.898 0V3a1 1 0 011-1zM2 10a8 8 0 1116 0 8 8 0 01-16 0zm2.5 1.5a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg><span>Recargar</span></button>
                      <button class="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3a1 1 0 000 2h14a1 1 0 100-2H3zM3 7a1 1 0 000 2h14a1 1 0 100-2H3zM3 11a1 1 0 100 2h14a1 1 0 100-2H3zM3 15a1 1 0 100 2h14a1 1 0 100-2H3z" /></svg><span>Filtros</span></button>
                    </div>
                    <div class="overflow-y-auto flex-grow">
                      <table class="min-w-full divide-y divide-gray-200 text-sm">
                        <thead class="bg-gray-50 sticky top-0">
                          <tr>
                            <th class="px-2 py-2 text-left"><input type="checkbox" class="rounded" [checked]="isAllNormogramaSelected()" (change)="toggleSelectAllNormograma($event)"></th>
                            <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Consecutivo</th>
                            <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Título</th>
                            <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Responsable</th>
                            <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Tipo Norma</th>
                            <th class="px-4 py-2 text-left font-semibold text-gray-600 uppercase">Fecha</th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          @for (item of normogramaData(); track item.id) {
                            <tr class="hover:bg-gray-50">
                              <td class="px-2 py-2"><input type="checkbox" class="rounded" [checked]="selectedNormogramaIds().has(item.id)" (change)="toggleSelectNormogramaItem(item.id)"></td>
                              <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.consecutivo }}</td>
                              <td class="px-4 py-2 text-gray-900" style="min-width: 300px;">{{ item.titulo }}</td>
                              <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.responsable }}</td>
                              <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.tipoNorma }}</td>
                              <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ item.fecha }}</td>
                            </tr>
                          } @empty {
                            <tr><td colspan="6" class="text-center py-8 text-gray-500">No hay datos en el normograma.</td></tr>
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
                  <div class="flex-grow flex flex-col text-sm">
                     <!-- Search Box Section -->
                      <div class="bg-gray-200 p-4 border-b">
                          <div class="bg-blue-800 p-2 text-white font-bold text-center text-xs">BUSCADOR NORMOGRAMA</div>
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
                          <div class="flex items-center space-x-2 p-3 bg-blue-800 text-white text-xs font-bold">
                            NORMOGRAMA
                          </div>
                          <div class="overflow-y-auto flex-grow">
                            <table class="min-w-full divide-y divide-gray-200 text-sm">
                              <thead class="bg-gray-50 sticky top-0">
                                <tr>
                                  <th class="px-2 py-2 text-left font-semibold text-gray-600 uppercase">Ver</th>
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
                                      <td class="px-2 py-2"><input type="checkbox" class="rounded"></td>
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
          }
        </main>
      </div>

      <!-- Modal Formulario de Cumplimiento -->
      @if (isComplianceModalOpen()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h3 class="text-xl font-bold mb-4">{{ editingComplianceItem()?.id ? 'Editar' : 'Agregar' }} Tipo Cumplimiento</h3>
            <form (submit)="saveComplianceItem($event)" class="space-y-4">
              <div><label for="codigo" class="block text-sm font-medium text-gray-700">Código</label><input type="number" id="codigo" name="codigo" [value]="editingComplianceItem()?.codigo || ''" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></div>
              <div><label for="nombre" class="block text-sm font-medium text-gray-700">Nombre</label><input type="text" id="nombre" name="nombre" [value]="editingComplianceItem()?.nombre || ''" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></div>
              <div><label for="descripcion" class="block text-sm font-medium text-gray-700">Descripción</label><textarea id="descripcion" name="descripcion" rows="3" [value]="editingComplianceItem()?.descripcion || ''" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea></div>
              <div class="pt-4 flex justify-end space-x-3"><button type="button" (click)="closeComplianceModal()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancelar</button><button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button></div>
            </form>
          </div>
        </div>
      }
      
      <!-- Modal Formulario de Normograma -->
      @if (isNormogramaModalOpen()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl">
            <header class="bg-blue-700 text-white p-3 rounded-t-lg">
              <h3 class="text-lg font-semibold">Modificar Normograma</h3>
            </header>
            <form (submit)="saveNormogramaItem($event)" class="p-6 max-h-[80vh] overflow-y-auto">
              @if(editingNormogramaItem(); as currentItem) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <!-- Columna Izquierda -->
                  <div class="space-y-4">
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> NÚMERO CONSECUTIVO:</label><input type="text" [value]="currentItem.consecutivo" name="consecutivo" class="mt-1 w-full p-2 border rounded-md bg-gray-100" readonly></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> NÚMERO NORMA:</label><input type="text" [value]="currentItem.numeroNorma" name="numeroNorma" class="mt-1 w-full p-2 border rounded-md"></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> FECHA EXPEDICIÓN:</label><input type="date" [value]="currentItem.fechaExpedicion" name="fechaExpedicion" class="mt-1 w-full p-2 border rounded-md"></div>
                    <div><label class="font-semibold text-gray-700 block">TÍTULO:</label><input type="text" [value]="currentItem.titulo" name="titulo" class="mt-1 w-full p-2 border rounded-md"></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> ASUNTO:</label><textarea name="asunto" rows="2" class="mt-1 w-full p-2 border rounded-md">{{ currentItem.asunto }}</textarea></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> IMPACTO:</label><textarea name="impacto" rows="2" class="mt-1 w-full p-2 border rounded-md">{{ currentItem.impacto }}</textarea></div>
                    <div><label class="font-semibold text-gray-700 block">FECHA CUMPLIMIENTO:</label><input type="date" [value]="currentItem.fechaCumplimiento" name="fechaCumplimiento" class="mt-1 w-full p-2 border rounded-md"></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> ÁREA RESPONSABLE:</label><select name="areaResponsable" [value]="currentItem.areaResponsable" class="mt-1 w-full p-2 border rounded-md"><option>VICEPRESIDENCIA RECURSOS HUMANOS</option></select></div>
                    <div><label class="font-semibold text-gray-700 block"><span class="text-red-500">*</span> RESPONSABLE:</label><select name="responsable" [value]="currentItem.responsable" class="mt-1 w-full p-2 border rounded-md"><option>VICEPRESIDENTE DE MARKETING Y CANALES - FERNANDO LOAIZA</option></select></div>
                  </div>
                  <!-- Columna Derecha -->
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

                <!-- Sección de URLs -->
                <div class="mt-6 pt-4 border-t">
                    <h4 class="font-bold text-gray-700 mb-2">URLS</h4>
                    <div class="flex items-center space-x-2">
                        <button type="button" class="p-1 bg-gray-200 rounded-md hover:bg-gray-300">+</button>
                        <button type="button" class="p-1 bg-gray-200 rounded-md hover:bg-gray-300">-</button>
                        <label class="font-semibold text-gray-700">LINK:</label>
                        <input type="text" name="link" [value]="currentItem.link" class="flex-grow p-2 border rounded-md">
                    </div>
                </div>

                <!-- Sección de Usuario y Archivo -->
                <div class="grid grid-cols-2 gap-x-8 mt-4">
                    <div><label class="font-semibold text-gray-700 block">USUARIO:</label><input type="text" name="usuario" [value]="currentItem.usuario" class="mt-1 w-full p-2 border rounded-md bg-gray-100" readonly></div>
                    <div><label class="font-semibold text-gray-700 block">FECHA CREACIÓN:</label><input type="text" name="fechaCreacion" [value]="currentItem.fechaCreacion" class="mt-1 w-full p-2 border rounded-md bg-gray-100" readonly></div>
                    <div class="col-span-2"><label class="font-semibold text-gray-700 block">ARCHIVO:</label><input type="file" class="mt-1 w-full text-xs"></div>
                    <div class="col-span-2"><label class="font-semibold text-gray-700 block">DESCRIPCION:</label><input type="text" name="descripcionArchivo" [value]="currentItem.descripcionArchivo" class="mt-1 w-full p-2 border rounded-md"></div>
                </div>

              }
              <div class="pt-8 flex justify-center space-x-4">
                  <button type="button" class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Modificar</button>
                  <button type="button" class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Ver documentos</button>
                  <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // --- STATE MANAGEMENT WITH SIGNALS ---
  
  activeView = signal<View>('calendar');
  complianceSubView = signal<ComplianceSubView>('configuracion');
  normogramaSubView = signal<NormogramaSubView>('grilla');
  currentDate = signal(new Date());
  selectedDate = signal(new Date());
  isComplianceModalOpen = signal(false);
  isUserMenuOpen = signal(false);
  isConfigMenuOpen = signal(false);
  isParametroGeneralMenuOpen = signal(false);
  isNormogramaModalOpen = signal(false);
  editingNormogramaItem = signal<NormogramaItem | null>(null);
  normogramaSearchQuery = signal('');
  normogramaSearchResults = signal<NormogramaItem[] | null>(null);

  mockEvents = signal<Map<string, CalendarEvent[]>>(new Map([
    [this.getDateKey(new Date()), [{ title: 'Reunión de equipo', time: '10:00', color: 'blue' }]],
    [this.getDateKey(new Date(new Date().setDate(new Date().getDate() + 2))), [{ title: 'Entrega GCI 3.0', time: '15:00', color: 'green' }]],
    [this.getDateKey(new Date(new Date().setDate(new Date().getDate() - 5))), [{ title: 'Revisión Sprint', time: '09:00', color: 'yellow' }]],
  ]));

  complianceData = signal<ComplianceConfig[]>([
    { id: 1, codigo: 230, nombre: 'NORMATIVO', descripcion: 'Código monetario financiero 2017' },
    { id: 2, codigo: 274, nombre: 'REGULACIÓN INTERNA', descripcion: '' },
    { id: 3, codigo: 279, nombre: 'REPORTES INTERNOS Y EXTERNOS', descripcion: 'Gerencia de compliance' },
    { id: 4, codigo: 280, nombre: 'OBLIGACIONES LEGALES', descripcion: '' },
  ]);
  editingComplianceItem = signal<Partial<ComplianceConfig> | null>(null);
  selectedComplianceIds = signal<Set<number>>(new Set());

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


  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // --- COMPUTED SIGNALS ---
  monthYear = computed(() => this.currentDate().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
  calendarDays = computed(() => {
    const date = this.currentDate(); const year = date.getFullYear(); const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1); const lastDayOfMonth = new Date(year, month + 1, 0);
    const days = []; const today = new Date();
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) { const prevMonthDay = new Date(year, month, 0); prevMonthDay.setDate(prevMonthDay.getDate() - i); days.unshift({ day: prevMonthDay.getDate(), isCurrentMonth: false, fullDate: prevMonthDay, events: [], isToday: false, isSelected: false }); }
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) { const dayDate = new Date(year, month, i); const dateKey = this.getDateKey(dayDate); days.push({ day: i, isCurrentMonth: true, fullDate: dayDate, events: this.mockEvents().get(dateKey) || [], isToday: dateKey === this.getDateKey(today), isSelected: dateKey === this.getDateKey(this.selectedDate()) }); }
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) { const nextMonthDay = new Date(year, month + 1, i); days.push({ day: i, isCurrentMonth: false, fullDate: nextMonthDay, events: [], isToday: false, isSelected: false }); }
    return days;
  });
  isAllComplianceSelected = computed(() => {
    const data = this.complianceData();
    const selected = this.selectedComplianceIds();
    return data.length > 0 && data.every(item => selected.has(item.id));
  });

   isAllNormogramaSelected = computed(() => {
    const data = this.normogramaData();
    const selected = this.selectedNormogramaIds();
    return data.length > 0 && data.every(item => selected.has(item.id));
  });

  // --- VIEW & MODAL METHODS ---
  setView(view: View) { 
    this.activeView.set(view);
    if(view === 'normograma') {
      this.normogramaSubView.set('grilla');
    }
  }
  toggleUserMenu() { 
    this.isUserMenuOpen.update(v => !v); 
    if (this.isUserMenuOpen()) this.isConfigMenuOpen.set(false);
  }
  toggleConfigMenu() { 
    this.isConfigMenuOpen.update(v => !v); 
    if (this.isConfigMenuOpen()) this.isUserMenuOpen.set(false);
  }
  setComplianceSubView(subView: ComplianceSubView) { this.complianceSubView.set(subView); }
  setNormogramaSubView(subView: NormogramaSubView) { this.normogramaSubView.set(subView); }

  openComplianceModal(item?: ComplianceConfig) {
    this.editingComplianceItem.set(item ? { ...item } : { codigo: 0, nombre: '', descripcion: '' });
    this.isComplianceModalOpen.set(true);
  }
  closeComplianceModal() { this.isComplianceModalOpen.set(false); }

  // --- CRUD METHODS FOR COMPLIANCE ---
  saveComplianceItem(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const updatedItem: Partial<ComplianceConfig> = {
      codigo: +(formData.get('codigo') || 0),
      nombre: formData.get('nombre') as string,
      descripcion: formData.get('descripcion') as string,
    };

    this.complianceData.update(currentData => {
      const existingId = this.editingComplianceItem()?.id;
      if (existingId) {
        return currentData.map(item => item.id === existingId ? { ...item, ...updatedItem } : item);
      } else {
        const newId = Math.max(...currentData.map(i => i.id), 0) + 1;
        return [...currentData, { ...updatedItem, id: newId } as ComplianceConfig];
      }
    });
    this.closeComplianceModal();
  }

  deleteSelectedComplianceItems() {
    this.complianceData.update(currentData => currentData.filter(item => !this.selectedComplianceIds().has(item.id)));
    this.selectedComplianceIds.set(new Set());
  }

  // --- SELECTION METHODS FOR COMPLIANCE GRID ---
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

  // --- NORMOGRAMA METHODS ---
  openNormogramaModal() {
    const selectedIds = this.selectedNormogramaIds();
    if (selectedIds.size !== 1) {
      return;
    }
    const idToEdit = selectedIds.values().next().value;
    const itemToEdit = this.normogramaData().find(item => item.id === idToEdit);
    if (itemToEdit) {
      this.editingNormogramaItem.set({ ...itemToEdit });
      this.isNormogramaModalOpen.set(true);
    }
  }

  closeNormogramaModal() {
    this.isNormogramaModalOpen.set(false);
    this.editingNormogramaItem.set(null);
  }

  saveNormogramaItem(event: Event) {
    event.preventDefault();
    if (!this.editingNormogramaItem()) return;

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const idToUpdate = this.editingNormogramaItem()!.id;

    this.normogramaData.update(currentData => {
        return currentData.map(item => {
            if (item.id === idToUpdate) {
              return { 
                ...item,
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
                descripcionArchivo: formData.get('descripcionArchivo') as string,
              };
            }
            return item;
        });
    });

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


  // --- CALENDAR METHODS ---
  changeMonth(offset: number) { this.currentDate.update(d => { const newDate = new Date(d); newDate.setMonth(newDate.getMonth() + offset); return newDate; }); }
  goToToday() { this.currentDate.set(new Date()); this.selectedDate.set(new Date()); }
  selectDate(date: Date) { this.selectedDate.set(date); }
  private getDateKey(date: Date): string { return date.toISOString().split('T')[0]; }
}

