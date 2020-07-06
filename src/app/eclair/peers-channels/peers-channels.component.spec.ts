import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLPeersChannelsComponent } from './peers-channels.component';

describe('ECLPeersChannelsComponent', () => {
  let component: ECLPeersChannelsComponent;
  let fixture: ComponentFixture<ECLPeersChannelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLPeersChannelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLPeersChannelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
