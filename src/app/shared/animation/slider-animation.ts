import { animate, state, style, transition, trigger } from '@angular/animations';

export const sliderAnimation = [
  trigger('sliderAnimation', [
    state('*', style({ transform: 'translateX(0)' })),
    transition('void => backward', [
      style({ transform: 'translateX(-100%' }), animate('800ms')
    ]),
    transition('backward => void', [
      animate('0ms', style({ transform: 'translateX(100%)' }))
    ]),
    transition('void => forward', [
      style({ transform: 'translateX(100%' }), animate('800ms')
    ]),
    transition('forward => void', [
      animate('0ms', style({ transform: 'translateX(-100%)' }))
    ])
  ])
];
