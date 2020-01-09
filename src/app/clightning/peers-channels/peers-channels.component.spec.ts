import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLPeersChannelsComponent } from './peers-channels.component';

describe('CLPeersChannelsComponent', () => {
  let component: CLPeersChannelsComponent;
  let fixture: ComponentFixture<CLPeersChannelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLPeersChannelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLPeersChannelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
