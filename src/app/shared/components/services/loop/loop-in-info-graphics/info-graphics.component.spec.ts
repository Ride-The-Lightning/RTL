import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonService } from '../../../../services/common.service';
import { mockCommonService } from '../../../../services/test-consts';
import { SharedModule } from '../../../../shared.module';

import { LoopInInfoGraphicsComponent } from './info-graphics.component';



describe('LoopInInfoGraphicsComponent', () => {
  let component: LoopInInfoGraphicsComponent;
  let fixture: ComponentFixture<LoopInInfoGraphicsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoopInInfoGraphicsComponent ],
      imports: [ SharedModule ],
      providers: [ 
        { provide: CommonService, useClass: mockCommonService }
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
