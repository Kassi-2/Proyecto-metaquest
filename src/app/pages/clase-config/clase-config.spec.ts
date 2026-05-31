import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaseConfig } from './clase-config';

describe('ClaseConfig', () => {
  let component: ClaseConfig;
  let fixture: ComponentFixture<ClaseConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaseConfig]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClaseConfig);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
