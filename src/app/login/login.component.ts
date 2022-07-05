import { CommonService } from './../service/common.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(
    private router: Router,
    private commonService: CommonService,
  ) { }

  ngOnInit(): void {
    this.commonService.setPtxAuthorizationHeader();
  }

  routeTo(searchType: 'searchLine' | 'searchBusStop' | 'searchNearestBusStation') {
    this.router.navigate(['/home']);
    this.commonService.searchType = searchType;
  }
}
