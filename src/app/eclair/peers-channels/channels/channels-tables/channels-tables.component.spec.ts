import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECLChannelsTablesComponent } from './channels-tables.component';

describe('ECLChannelsTablesComponent', () => {
  let component: ECLChannelsTablesComponent;
  let fixture: ComponentFixture<ECLChannelsTablesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLChannelsTablesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelsTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
