import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PeersChannelsComponent } from './peers-channels.component';

describe('PeersChannelsComponent', () => {
  let component: PeersChannelsComponent;
  let fixture: ComponentFixture<PeersChannelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PeersChannelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PeersChannelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
