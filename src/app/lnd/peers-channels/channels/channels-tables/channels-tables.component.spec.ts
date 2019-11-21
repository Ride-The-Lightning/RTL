import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelsTablesComponent } from './channels-tables.component';

describe('ChannelsTablesComponent', () => {
  let component: ChannelsTablesComponent;
  let fixture: ComponentFixture<ChannelsTablesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelsTablesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelsTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
