import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPubkeyComponent } from './show-pubkey.component';

describe('ShowPubkeyComponent', () => {
  let component: ShowPubkeyComponent;
  let fixture: ComponentFixture<ShowPubkeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowPubkeyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPubkeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
