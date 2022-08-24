import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../../shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SwapPeersComponent } from './swap-peers.component';

describe('SwapPeersComponent', () => {
  let component: SwapPeersComponent;
  let fixture: ComponentFixture<SwapPeersComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SwapPeersComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule
      ],
      providers: []
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapPeersComponent);
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
