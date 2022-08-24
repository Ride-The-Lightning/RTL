import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../../shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PeerswapsOutComponent } from './swaps-out.component';

describe('PeerswapsOutComponent', () => {
  let component: PeerswapsOutComponent;
  let fixture: ComponentFixture<PeerswapsOutComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PeerswapsOutComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule
      ],
      providers: []
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PeerswapsOutComponent);
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
