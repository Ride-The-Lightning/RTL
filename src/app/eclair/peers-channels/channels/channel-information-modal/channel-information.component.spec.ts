import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLRChannelInformationComponent } from './channel-information.component';

describe('ECLRChannelInformationComponent', () => {
  let component: ECLRChannelInformationComponent;
  let fixture: ComponentFixture<ECLRChannelInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLRChannelInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLRChannelInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
