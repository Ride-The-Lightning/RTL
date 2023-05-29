import { inject } from '@angular/core';
import { Router, ActivatedRoute, CanActivateFn } from '@angular/router';

import { SessionService } from './session.service';
import { map } from 'rxjs/operators';

export function AuthGuard(): CanActivateFn {
  return () => {
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const sessionService = inject(SessionService);
    if (!sessionService.getItem('token')) {
      return false;
    } else if (route.snapshot.url && route.snapshot.url.length && route.snapshot.url[0].path !== 'settings' && route.snapshot.url[0].path !== 'auth' && sessionService.getItem('defaultPassword') === 'true') {
      router.navigate(['/settings/auth']);
      return false;
    } else {
      return true;
    }
  };
};

export function LNDUnlockedGuard(): CanActivateFn {
  return () => {
    const sessionService = inject(SessionService);
    return !!sessionService.watchSession().pipe(map((session) => session.lndUnlocked));
  };
};

export function CLNUnlockedGuard(): CanActivateFn {
  return () => {
    const sessionService = inject(SessionService);
    return !!sessionService.watchSession().pipe(map((session) => session.clnUnlocked));
  };
};

export function ECLUnlockedGuard(): CanActivateFn {
  return () => {
    const sessionService = inject(SessionService);
    return !!sessionService.watchSession().pipe(map((session) => session.eclUnlocked));
  };
};
