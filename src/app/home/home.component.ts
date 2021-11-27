import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public function = '';
  public defaultText = ''
  public tabSelectArr = [false, false, false];
  constructor(
    private activeRote: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.activeRote.queryParams.subscribe(param => {
      this.switchTab(param['path']);
    });
  }

  routeLogin() {
    this.router.navigate(['/login'])
  }

  switchTab(num: number) {
    //從網址傳來的參數是 string 需要轉 number
    num=Number(num);
    this.tabSelectArr = [false, false, false];
    this.tabSelectArr[num] = true;
    switch (num) {
      case 0:
        this.defaultText = '請輸入欲查詢公車';
        break;
      case 1:
        this.defaultText = '請輸入欲查詢站牌名';
        break;
      case 2:
        this.defaultText = '請輸入地址或使用定位';
        break;
    }
  }
}
