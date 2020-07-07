import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLOpenChannelComponent } from './open-channel.component';

describe('ECLOpenChannelComponent', () => {
  let component: ECLOpenChannelComponent;
  let fixture: ComponentFixture<ECLOpenChannelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLOpenChannelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLOpenChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
