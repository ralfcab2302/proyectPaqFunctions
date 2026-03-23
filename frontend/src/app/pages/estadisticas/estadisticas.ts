import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Nabvar } from '../nabvar/nabvar';
import { Salidas } from '../../services/salidas';
import { EstadisticasResponse } from '../../models/models';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-estadisticas',
  imports: [Nabvar],
  templateUrl: './estadisticas.html',
})
export class Estadisticas implements OnInit, OnDestroy {
  private salidasService = inject(Salidas);
  private authService = inject(AuthService);

  protected rolUser = this.authService.getUsuario()?.rol;

  protected desde = signal('');
  protected hasta = signal('');
  protected cargando = signal(true);
  protected aplicando = signal(false);

  protected totalPeriodo = signal(0);
  protected totalEmpresas = signal(0);
  protected topEmpresa = signal('—');
  protected promediodiario = signal(0);

  private chartBarras: any = null;
  private chartLinea: any = null;
  private chartDonut: any = null;
  private chartTop: any = null;

  ngOnInit() {
    const hoy = new Date();
    const hace30 = new Date();
    hace30.setDate(hoy.getDate() - 30);
    this.desde.set(hace30.toISOString().slice(0, 10));
    this.hasta.set(hoy.toISOString().slice(0, 10));
    this.cargar();
  }

  protected aplicarFiltro() { this.aplicando.set(true); this.cargar(); }

  protected resetear() {
    const hoy = new Date();
    const hace30 = new Date();
    hace30.setDate(hoy.getDate() - 30);
    this.desde.set(hace30.toISOString().slice(0, 10));
    this.hasta.set(hoy.toISOString().slice(0, 10));
    this.cargar();
  }

  private cargar() {
    this.cargando.set(true);
    const params: any = {};
    if (this.desde()) params.desde = this.desde() + ' 00:00:00';
    if (this.hasta()) params.hasta = this.hasta() + ' 23:59:59';

    this.salidasService.estadisticas(params).subscribe({
      next: (res) => {
        this.calcularResumen(res);
        this.cargando.set(false);
        this.aplicando.set(false);
        setTimeout(() => this.renderTodos(res), 100);
      },
      error: () => { this.cargando.set(false); this.aplicando.set(false); }
    });
  }

  private calcularResumen(res: EstadisticasResponse) {
    this.totalPeriodo.set(res.total);
    this.totalEmpresas.set(res.porEmpresa?.length ?? 0);
    if (res.porEmpresa?.length) {
      const top = [...res.porEmpresa].sort((a, b) => Number(b.total) - Number(a.total))[0];
      this.topEmpresa.set(top.nombre_empresa);
    }
    if (res.porDia?.length) {
      this.promediodiario.set(Math.round(res.total / res.porDia.length));
    }
  }

  private renderChart(id: string, instance: any, config: object): any {
    const el = document.getElementById(id) as HTMLCanvasElement;
    if (!el) return instance;
    if (instance) instance.destroy();
    return new (window as any).Chart(el, config);
  }

  private renderTodos(res: EstadisticasResponse) {
    this.renderLinea(res);
    this.renderBarras(res);
    this.renderDonut(res);
    this.renderTop(res);
  }

  private renderLinea(res: EstadisticasResponse) {
    if (!res.porDia?.length) return;
    this.chartLinea = this.renderChart('chart-linea', this.chartLinea, {
      type: 'line',
      data: {
        labels: res.porDia.map(d =>
          new Date(d.dia).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        ),
        datasets: [{
          label: 'Salidas',
          data: res.porDia.map(d => Number(d.total)),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.08)',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: '#3b82f6',
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index', intersect: false,
            backgroundColor: '#1e293b',
            titleColor: '#94a3b8',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 0 },
            grid: { color: '#1e293b' },
            // Muestra solo 1 de cada 3 etiquetas para no saturar
            afterTickToLabelConversion: (axis: any) => {
              axis.ticks = axis.ticks.filter((_: any, i: number) => i % 3 === 0);
            }
          },
          y: {
            ticks: { color: '#64748b', font: { size: 11 } },
            grid: { color: '#1e293b' },
            beginAtZero: true,
          },
        },
      },
    });
  }

  private renderBarras(res: EstadisticasResponse) {
    if (!res.porEmpresa?.length) return;
    const sorted = [...res.porEmpresa]
      .sort((a, b) => Number(b.total) - Number(a.total))
      .slice(0, 15); // máx 15 para que no quede aplastado

    // Gradiente de azul según posición
    const colores = sorted.map((_, i) => {
      const alpha = 1 - (i / sorted.length) * 0.5;
      return `rgba(59, 130, 246, ${alpha})`;
    });

    this.chartBarras = this.renderChart('chart-barras', this.chartBarras, {
      type: 'bar',
      data: {
        labels: sorted.map(e => e.nombre_empresa),
        datasets: [{
          label: 'Salidas',
          data: sorted.map(e => Number(e.total)),
          backgroundColor: colores,
          borderRadius: 4,
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b', titleColor: '#94a3b8',
            bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: { color: '#64748b', font: { size: 10 } },
            grid: { color: '#1e293b' },
            beginAtZero: true,
          },
          y: {
            ticks: { color: '#94a3b8', font: { size: 11 } },
            grid: { display: false },
          },
        },
      },
    });
  }

  private renderDonut(res: EstadisticasResponse) {
    if (!res.porSalida?.length) return;

    // Agrupar salidas con poco volumen en "Otros"
    const sorted = [...res.porSalida].sort((a, b) => Number(b.total) - Number(a.total));
    const top8 = sorted.slice(0, 8);
    const resto = sorted.slice(8);
    const totalResto = resto.reduce((acc, s) => acc + Number(s.total), 0);
    const datos = totalResto > 0 ? [...top8, { nro_salida: 0, total: totalResto }] : top8;

    const COLORES = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316','#64748b'];

    this.chartDonut = this.renderChart('chart-donut', this.chartDonut, {
      type: 'doughnut',
      data: {
        labels: datos.map(s => s.nro_salida === 0 ? 'Otras salidas' : `Salida ${s.nro_salida}`),
        datasets: [{
          data: datos.map(s => Number(s.total)),
          backgroundColor: COLORES,
          borderWidth: 2,
          borderColor: '#1e293b',
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', padding: 14, font: { size: 11 }, boxWidth: 12 },
          },
          tooltip: {
            backgroundColor: '#1e293b', titleColor: '#94a3b8',
            bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1,
            callbacks: {
              label: (ctx: any) => {
                const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              }
            }
          },
        },
      },
    });
  }

  private renderTop(res: EstadisticasResponse) {
    if (!res.porEmpresa?.length) return;
    const top10 = [...res.porEmpresa]
      .sort((a, b) => Number(b.total) - Number(a.total))
      .slice(0, 10);

    const max = Number(top10[0]?.total ?? 1);
    const colores = top10.map((e) => {
      const ratio = Number(e.total) / max;
      if (ratio > 0.8) return '#3b82f6';
      if (ratio > 0.6) return '#6366f1';
      if (ratio > 0.4) return '#8b5cf6';
      return '#a855f7';
    });

    this.chartTop = this.renderChart('chart-top', this.chartTop, {
      type: 'bar',
      data: {
        labels: top10.map(e => e.nombre_empresa),
        datasets: [{
          label: 'Salidas',
          data: top10.map(e => Number(e.total)),
          backgroundColor: colores,
          borderRadius: 6,
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b', titleColor: '#94a3b8',
            bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1,
          },
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 30 }, grid: { display: false } },
          y: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' }, beginAtZero: true },
        },
      },
    });
  }

  ngOnDestroy() {
    [this.chartBarras, this.chartLinea, this.chartDonut, this.chartTop]
      .forEach(c => { if (c) c.destroy(); });
  }
}
