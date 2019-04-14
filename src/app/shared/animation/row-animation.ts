import { trigger, state, animate, transition, style } from '@angular/animations';

export const newlyAddedRowAnimation = [
  trigger('newlyAddedRowAnimation', [
    state('notAdded, void', style({ transform: 'translateX(0%)' })),
    state('added', style({ transform: 'translateX(100%)'})),
    transition('added <=> notAdded', animate('1000ms ease-out')),
    transition('added <=> void', animate('0ms ease-out'))
  ])
];
