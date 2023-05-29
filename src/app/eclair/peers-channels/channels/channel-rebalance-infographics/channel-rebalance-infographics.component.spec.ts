import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CommonService } from '../../../../shared/services/common.service';
import { DataService } from '../../../../shared/services/data.service';
import { mockDataService } from '../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../shared/shared.module';

import { ECLChannelRebalanceInfographicsComponent } from './channel-rebalance-infographics.component';

describe('ECLChannelRebalanceInfographicsComponent', () => {
  let component: ECLChannelRebalanceInfographicsComponent;
  let fixture: ComponentFixture<ECLChannelRebalanceInfographicsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLChannelRebalanceInfographicsComponent],
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
    fixture = TestBed.createComponent(ECLChannelRebalanceInfographicsComponent);
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
