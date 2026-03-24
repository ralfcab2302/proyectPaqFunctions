import { Component, inject, signal } from '@angular/core';
import { Nabvar } from '../nabvar/nabvar';
import { Salidas } from '../../services/salidas';
import { Salida } from '../../models/models';
import { TranslateModule } from '@ngx-translate/core';
import { IdiomaService } from '../../services/idioma.service';

@Component({
  selector: 'app-busqueda',
  imports: [Nabvar, TranslateModule],
  templateUrl: './busqueda.html',
  styleUrl: './busqueda.css',
})
export class Busqueda {
  private salidas = inject(Salidas);
  private idiomaService = inject(IdiomaService);

  protected codigo = signal('');
  protected cargando = signal(false);
  protected resultado = signal<Salida[]>([]);
  protected buscado = signal(false);

  protected buscar() {
    const cod = this.codigo().trim();
    if (!cod) return;

    this.cargando.set(true);
    this.buscado.set(false);

    this.salidas.buscarPorCodigoBarras(cod).subscribe({
      next: (res: any) => {
        this.resultado.set(res.historial ?? res.salidas ?? []);
        this.buscado.set(true);
        this.cargando.set(false);
      },
      error: () => {
        this.resultado.set([]);
        this.buscado.set(true);
        this.cargando.set(false);
      },
    });
  }

  protected limpiar() {
    this.codigo.set('');
    this.resultado.set([]);
    this.buscado.set(false);
  }
}
