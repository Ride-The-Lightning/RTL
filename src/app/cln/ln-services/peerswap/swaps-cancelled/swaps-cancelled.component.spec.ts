import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PeerswapsCancelledComponent } from './swaps-cancelled.component';
import { mockLoggerService } from '../../../../shared/test-helpers/mock-services';
import { LoggerService } from '../../../../shared/services/logger.service';

describe('PeerswapsCancelledComponent', () => {
  let component: PeerswapsCancelledComponent;
  let fixture: ComponentFixture<PeerswapsCancelledComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PeerswapsCancelledComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule
      ],
      providers: [
        { provide: LoggerService, useClass: mockLoggerService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PeerswapsCancelledComponent);
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
