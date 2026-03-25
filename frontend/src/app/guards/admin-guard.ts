import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rol = auth.getUsuario()?.rol;

  if (rol === 'superadmin' || rol === 'admin') return true;

  router.navigate(['/dashboard']);
  return false;
};
