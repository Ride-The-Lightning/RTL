import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLROpenChannelComponent } from './open-channel.component';

describe('ECLROpenChannelComponent', () => {
  let component: ECLROpenChannelComponent;
  let fixture: ComponentFixture<ECLROpenChannelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLROpenChannelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLROpenChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
