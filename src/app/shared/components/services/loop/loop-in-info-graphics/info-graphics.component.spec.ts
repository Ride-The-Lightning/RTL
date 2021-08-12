import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CommonService } from '../../../../services/common.service';
import { DataService } from '../../../../services/data.service';
import { mockDataService, mockLoggerService } from '../../../../test-helpers/mock-services';
import { SharedModule } from '../../../../shared.module';

import { LoopInInfoGraphicsComponent } from './info-graphics.component';

describe('LoopInInfoGraphicsComponent', () => {
  let component: LoopInInfoGraphicsComponent;
  let fixture: ComponentFixture<LoopInInfoGraphicsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LoopInInfoGraphicsComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule
      ],
      providers: [ 
        CommonService,
        { provide: DataService, useClass: mockDataService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoopInInfoGraphicsComponent);
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
