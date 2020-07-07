import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLChannelInformationComponent } from './channel-information.component';

describe('ECLChannelInformationComponent', () => {
  let component: ECLChannelInformationComponent;
  let fixture: ComponentFixture<ECLChannelInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLChannelInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
