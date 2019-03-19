import { trigger, state, animate, transition, style } from '@angular/animations';

export const newlyAddedRowAnimation = [
  trigger('newlyAddedRowAnimation', [
    state('notAdded, void', style({ transform: 'translateX(0)' })),
    state('added', style({ transform: 'translateX(1.5)', border: '1px solid' })),
    transition('added <=> notAdded', animate('2000ms ease-out')),
    transition('added <=> void', animate('2000ms ease-out'))
  ])
];
