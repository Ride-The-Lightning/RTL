import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonService } from '../../../../../shared/services/common.service';
import { mockCommonService } from '../../../../services/test-consts';
import { SharedModule } from '../../../../shared.module';

import { SwapOutInfoGraphicsComponent } from './info-graphics.component';



describe('SwapOutInfoGraphicsComponent', () => {
  let component: SwapOutInfoGraphicsComponent;
  let fixture: ComponentFixture<SwapOutInfoGraphicsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SwapOutInfoGraphicsComponent ],
      imports: [ SharedModule ],
      providers: [ 
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapOutInfoGraphicsComponent);
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
