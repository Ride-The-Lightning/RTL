import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../../shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PeerswapsInComponent } from './swaps-in.component';

describe('PeerswapsInComponent', () => {
  let component: PeerswapsInComponent;
  let fixture: ComponentFixture<PeerswapsInComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PeerswapsInComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule
      ],
      providers: []
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PeerswapsInComponent);
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
