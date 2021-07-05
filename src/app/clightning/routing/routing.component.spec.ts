import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../shared/shared.module';

import { CLRoutingComponent } from './routing.component';

describe('CLRoutingComponent', () => {
  let component: CLRoutingComponent;
  let fixture: ComponentFixture<CLRoutingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLRoutingComponent ],
      imports: [ SharedModule, RouterTestingModule ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(CLRoutingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});
