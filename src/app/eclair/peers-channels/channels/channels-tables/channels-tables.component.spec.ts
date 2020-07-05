import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CLChannelsTablesComponent } from './channels-tables.component';

describe('CLChannelsTablesComponent', () => {
  let component: CLChannelsTablesComponent;
  let fixture: ComponentFixture<CLChannelsTablesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelsTablesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelsTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
