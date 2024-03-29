import { animate, keyframes, style, transition, trigger } from '@angular/animations';

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

export const fadeIn = [
  trigger('fadeIn', [
    transition('void => *', []), // When the item is created
    transition('* => void', []), // When the item is removed
    transition('* => *', [ // When the item is changed
      animate(800, keyframes([ // Animate for 800 ms
        style({ opacity: 0, transform: 'translateY(100%)' }),
        style({ opacity: 1, transform: 'translateY(0%)' })
      ]))
    ])
  ])
];
