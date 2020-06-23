import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRPeersChannelsComponent } from './peers-channels.component';

describe('ECLRPeersChannelsComponent', () => {
  let component: ECLRPeersChannelsComponent;
  let fixture: ComponentFixture<ECLRPeersChannelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRPeersChannelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRPeersChannelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
