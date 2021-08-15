import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CommonService } from '../../../../../shared/services/common.service';
import { DataService } from '../../../../services/data.service';
import { mockDataService, mockLoggerService } from '../../../../test-helpers/mock-services';
import { SharedModule } from '../../../../shared.module';

import { LoopOutInfoGraphicsComponent } from './info-graphics.component';

describe('LoopOutInfoGraphicsComponent', () => {
  let component: LoopOutInfoGraphicsComponent;
  let fixture: ComponentFixture<LoopOutInfoGraphicsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LoopOutInfoGraphicsComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule
      ],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService }
      ]
    }).
    compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopOutInfoGraphicsComponent);
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
