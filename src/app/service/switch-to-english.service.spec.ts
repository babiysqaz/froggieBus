import { TestBed } from '@angular/core/testing';

import { SwitchToEnglishService } from './switch-to-english.service';

describe('SwitchToEnglishService', () => {
  let service: SwitchToEnglishService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SwitchToEnglishService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
