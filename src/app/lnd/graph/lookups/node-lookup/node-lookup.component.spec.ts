import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoggerService } from '../../../../shared/services/logger.service';
import { SharedModule } from '../../../../shared/shared.module';

import { NodeLookupComponent } from './node-lookup.component';

describe('NodeLookupComponent', () => {
  let component: NodeLookupComponent;
  let fixture: ComponentFixture<NodeLookupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NodeLookupComponent],
      imports: [SharedModule],
      providers: [LoggerService]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeLookupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});
