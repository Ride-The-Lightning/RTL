import { CanActivate } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor() {}

  canActivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (!sessionStorage.getItem('token')) {
      return false;
    } else {
      return true;
    }
  }
}

@Injectable()
export class LNDUnlockedGuard implements CanActivate {
  constructor() {}

  canActivate(): boolean | Observable<boolean> | Promise<boolean> {
    if (!sessionStorage.getItem('lndUnlocked')) {
      return false;
    } else {
      return true;
    }
  }
}

@Injectable()
export class CLUnlockedGuard implements CanActivate {
  constructor() {}

  canActivate(): boolean | Observable<boolean> | Promise<boolean> {
    return true;
    if (!sessionStorage.getItem('clUnlocked')) {
      return false;
    } else {
      return true;
    }
  }
}
