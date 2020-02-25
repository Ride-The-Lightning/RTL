import { animate, style, transition, trigger } from '@angular/animations';

export const sliderAnimation = [
  trigger('sliderAnimation', [
    transition(':enter', [
      style({ transform: 'translateX(100%)' }),
      animate('1000ms ease-in', style({ transform: 'translateX(0%)' }))
    ]),
    transition(':leave', [
      animate('0ms', style({ transform: 'translateX(100%)' }))
    ])
  ])
];
