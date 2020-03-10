import { animate, style, transition, trigger } from '@angular/animations';

export const opacityAnimation = [
  trigger('opacityAnimation', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('1000ms ease-in', style({ opacity: 1 }))
    ]),
    transition(':leave', [
      animate('0ms', style({ opacity: 0 }))
    ])
  ])
];
