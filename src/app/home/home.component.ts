import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SwitchToEnglishService } from '../service/switch-to-english.service';
import jsSHA from 'jssha';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public pageIndex = -1;//0:找路線 1:找站牌 2:附近車站
  public defaultText = ''
  public tabSelectArr = [false, false, false];
  public directionSelectArr = [true, false];
  public direction: number = 0;
  public isSearching = false;
  public hasSearched = false;
  public isNull = false;
  public busStatusClass: 'approaching' | 'moving' | 'notMoving' = 'notMoving';
  public cityNameArr = [
    '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市', '基隆市', '新竹市', '嘉義市',
    '宜蘭縣', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '屏東縣', '花蓮縣', '臺東縣', '金門縣', '澎湖縣', '連江縣'
  ];
  public routeName = '';
  public goals = ['', ''];
  public busStops: any = [[], []];
  API_URL = "https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/Taipei?$top=30&$format=JSON";


  constructor(
    private activeRote: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private switchToEnglishService: SwitchToEnglishService,
  ) { }

  ngOnInit(): void {
    this.activeRote.queryParams.subscribe(param => {
      //從網址傳來的參數是 string 需要轉 number
      this.switchTab(Number(param['path']));
    });
  }

  routeLogin() {
    this.router.navigate(['/login'])
  }

  switchTab(num: number) {
    this.pageIndex = num;
    this.hasSearched = false;
    this.tabSelectArr = [false, false, false];
    this.tabSelectArr[num] = true;
    this.routeName = ''
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

  async search(num: number) {
    if (this.isSearching) {
      console.log('尚在讀取中');
      return;
    }
    this.isSearching = true;
    const citySelector = document.getElementById("citySelector") as HTMLSelectElement;
    let cityName = this.switchToEnglishService.switchCityName(citySelector.value);
    switch (num) {
      //找路線
      case 0:
        await this.searchLine(cityName);
        this.hasSearched = true;
        this.isSearching = false;
        break;
      //找站牌
      case 1:
        await this.searchBusStation();
        this.hasSearched = true;
        this.isSearching = false;
        break;
      //找附近車站
      case 2:
        await this.searchNearestBusStation();
        this.hasSearched = true;
        this.isSearching = false;
        break;
    }
  }

  async searchLine(cityName: string) {
    //busStatus:0:'正常',1:'尚未發車',2:'交管不停靠',3:'末班車已過',4:'今日未營運'
    this.busStops = [
      { stops: [], EstimatedTime: [], busStatus: [], busStatusClass: [] },
      { stops: [], EstimatedTime: [], busStatus: [], busStatusClass: [] }
    ];
    this.goals = ['', ''];
    const stopOfRouteUrl = "https://ptx.transportdata.tw/MOTC/v2/Bus/StopOfRoute/City/" + cityName + '/' + this.routeName + "?$filter=RouteID%20eq%20'" + this.routeName + "'&$top=30&$format=JSON";
    this.http.get(stopOfRouteUrl, {
      headers: this.getAuthorizationHeader()
    }).subscribe((res: any) => {
      if (res.length !== 0) {
        this.goals[0] = res[1].Stops[0].StopName.Zh_tw;
        this.goals[1] = res[0].Stops[0].StopName.Zh_tw;
        for (let index = 0; index < res[1].Stops.length; index++) {
          this.busStops[0].stops.push(res[0].Stops[index].StopName.Zh_tw);
          this.busStops[1].stops.push(res[1].Stops[index].StopName.Zh_tw);
        }
      } else {
        this.isNull = true;
      }
    });

    const estimatedTimeOfArrivalUrl = "https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/" + cityName + '/' + this.routeName + "?$filter=RouteID%20eq%20'" + this.routeName + "'&$orderby=StopSequence" + "&$format=JSON";
    this.http.get(estimatedTimeOfArrivalUrl, {
      headers: this.getAuthorizationHeader()
    }).subscribe((res: any) => {
      res.forEach((element: any) => {
        //public busStatusClass: 'approaching' | 'moving' | 'notMoving' = 'notMoving';
        if (element.Direction === 0) {
          this.busStops[0].EstimatedTime.push(element);
          this.switchBusStatus(element, 0);
        } else {
          this.busStops[1].EstimatedTime.push(element);
          this.switchBusStatus(element, 1);
        }
      });
      console.log(this.busStops);
    });



  }

  async searchBusStation() {

  }

  async searchNearestBusStation() {

  }

  switchdirection(num: number) {
    this.directionSelectArr = [false, false];
    this.directionSelectArr[num] = true;
    this.direction = num;
  }

  switchBusStatus(element: any, index: number) {
    switch (element.StopStatus) {
      case 0:
        //如果小於 1 分鐘，則顯示即將進站
        if (Math.floor(element.EstimatedTime / 60)) {
          this.busStops[index].busStatus.push('進站中');
          this.busStops[index].busStatusClass.push('approaching');
        } else {
          this.busStops[index].busStatus.push(Math.floor(element.EstimatedTime / 60) + 'mins');
          this.busStops[index].busStatusClass.push('moving');
        }
        break;
      case 1:
        this.busStops[index].busStatus.push('未發車');
        this.busStops[index].busStatusClass.push('notMoving');
        break;
      case 2:
        this.busStops[index].busStatus.push('未發車');
        this.busStops[index].busStatusClass.push('notMoving');
        break;
      case 3:
        this.busStops[index].busStatus.push('末班駛離');
        this.busStops[index].busStatusClass.push('notMoving');
        break;
      case 4:
        this.busStops[index].busStatus.push('未發車');
        this.busStops[index].busStatusClass.push('notMoving');
        break;
    }
  }


  getAuthorizationHeader() {
    var AppID = '56d46e9897a148bca3e3fd6c1e400cb0';
    var AppKey = 'eFy9jIOXaHvKXhi40qbKS58EGJ8';

    var GMTString = new Date().toUTCString();
    var ShaObj = new jsSHA('SHA-1', 'TEXT');
    ShaObj.setHMACKey(AppKey, 'TEXT');
    ShaObj.update('x-date: ' + GMTString);
    var HMAC = ShaObj.getHMAC('B64');
    var Authorization = 'hmac username=\"' + AppID + '\", algorithm=\"hmac-sha1\", headers=\"x-date\", signature=\"' + HMAC + '\"';

    return { 'Authorization': Authorization, 'X-Date': GMTString };
  }
}
