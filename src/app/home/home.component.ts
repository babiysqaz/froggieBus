import { CommonService } from './../service/common.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SwitchToEnglishService } from '../service/switch-to-english.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { lastValueFrom } from 'rxjs';

interface BusStops {
  goal: string,
  stops: Array<string>,
  EstimatedTime: Array<number>,
  busStatus: Array<'進站中' | '未發車' | '末班駛離' | string>,
  busStatusClass: Array<'approaching' | 'moving' | 'notMoving'>,
}
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public searchType: 'searchLine' | 'searchBusStop' | 'searchNearestBusStation' = 'searchLine';
  public tipText = '';
  public direction = 0;
  public isSearching = false;
  public hasSearched = false;
  public isNull = false;
  public busStatusClass: 'approaching' | 'moving' | 'notMoving' = 'notMoving';
  public cityNameArr = [
    '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市', '基隆市', '新竹市', '嘉義市',
    '宜蘭縣', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '屏東縣', '花蓮縣', '臺東縣', '金門縣', '澎湖縣', '連江縣'
  ];
  public inputText = '';
  public busStops: Array<BusStops> = [];
  public nearestBusStations: Array<{ stationName: string, distance: number, }> = [];
  public googleMapUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl('');
  private location: { longitude: number, latitude: number } = { longitude: 0, latitude: 0 };

  constructor(
    private router: Router,
    private httpClient: HttpClient,
    private switchToEnglishService: SwitchToEnglishService,
    private commonService: CommonService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.switchTab(this.commonService.searchType);
  }

  toHomePage() {
    this.router.navigate(['/login']);
  }

  switchTab(searchType: 'searchLine' | 'searchBusStop' | 'searchNearestBusStation') {
    this.hasSearched = false;
    this.inputText = ''
    this.searchType = searchType;
    switch (searchType) {
      case 'searchLine':
        this.tipText = '請輸入欲查詢公車';
        break;
      case 'searchBusStop':
        this.tipText = '請輸入欲查詢站牌名';
        break;
      case 'searchNearestBusStation':
        this.tipText = '請輸入地址或使用定位';
        break;
    }
  }

  async search(searchType: 'searchLine' | 'searchBusStop' | 'searchNearestBusStation') {
    if (this.isSearching) {
      console.log('還在讀取中');
      return;
    }
    this.isSearching = true;
    switch (searchType) {
      case 'searchLine':
        const citySelector = document.getElementById("citySelector") as HTMLSelectElement;
        let cityName = this.switchToEnglishService.switchCityName(citySelector.value);
        await this.searchLine(cityName);
        break;
      case 'searchBusStop':
        await this.searchBusStation();
        break;
      case 'searchNearestBusStation':
        await this.searchNearestBusStation();
        break;
    }
    this.hasSearched = true;
    this.isSearching = false;
  }

  /**
   * 取得該公車的最新動態及路線資訊
   */
  async searchLine(cityName: string) {
    //busStatus:0:'正常',1:'尚未發車',2:'交管不停靠',3:'末班車已過',4:'今日未營運'
    this.busStops = [
      { goal: '', stops: [], EstimatedTime: [], busStatus: [], busStatusClass: [] },
      { goal: '', stops: [], EstimatedTime: [], busStatus: [], busStatusClass: [] }
    ];

    const stopOfRouteUrl = "https://ptx.transportdata.tw/MOTC/v2/Bus/StopOfRoute/City/" + cityName + '/' + this.inputText + "?$filter=RouteID%20eq%20'" + this.inputText + "'&$top=30&$format=JSON";
    const promise1 = lastValueFrom(this.httpClient.get(stopOfRouteUrl, { headers: environment.ptxAuthorizationHeader }))
      .then((res: any) => {
        if (res.length === 0) {
          this.isNull = true;
        } else {
          this.busStops[0].goal = res[1].Stops[0].StopName.Zh_tw;
          this.busStops[1].goal = res[0].Stops[0].StopName.Zh_tw;
          for (let index = 0; index < res[1].Stops.length; index++) {
            this.busStops[0].stops.push(res[0].Stops[index].StopName.Zh_tw);
            this.busStops[1].stops.push(res[1].Stops[index].StopName.Zh_tw);
          }
        }
      });

    const estimatedTimeOfArrivalUrl = "https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/" + cityName + '/' + this.inputText + "?$filter=RouteID%20eq%20'" + this.inputText + "'&$orderby=StopSequence" + "&$format=JSON";
    const promise2 = lastValueFrom(this.httpClient.get(estimatedTimeOfArrivalUrl, { headers: environment.ptxAuthorizationHeader }))
      .then((res: any) => {
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

    await Promise.all([promise1, promise2]);
  }

  async searchBusStation() { }

  /**
   * 取得鄰近公車站點資訊
   */
  async searchNearestBusStation() {
    this.location = await this.commonService.getPosition().catch((err: Error) => { console.log(err); });
    this.googleMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.google.com/maps/embed/v1/search?q=%E5%85%AC%E8%BB%8A%E7%AB%99&key=${environment.googleMapKey}&center=${this.location.latitude},${this.location.longitude}&zoom=14`);
    this.nearestBusStations = [];

    return lastValueFrom(this.httpClient.get(`https://ptx.transportdata.tw/MOTC/v2/Bus/Station/NearBy?$spatialFilter=nearby(${this.location.latitude},${this.location.longitude},500)`, { headers: environment.ptxAuthorizationHeader }))
      .then((res: any) => {
        res.forEach((element: any) => {
          this.nearestBusStations.push({
            stationName: element.StationName.Zh_tw,
            distance: this.commonService.getDistance(this.location.latitude, this.location.longitude, element.StationPosition.PositionLat, element.StationPosition.PositionLon),
          })
        });
        this.nearestBusStations.sort((a, b) => a.distance - b.distance);
      })
  }

  switchDirection(direction: number) {
    this.direction = direction;
  }

  switchBusStatus(element: any, index: number) {
    switch (element.StopStatus) {
      case 0:
        //如果小於 1 分鐘，則顯示即將進站
        if (element.EstimateTime / 60 < 1) {
          this.busStops[index].busStatus.push('進站中');
          this.busStops[index].busStatusClass.push('approaching');
        } else {
          this.busStops[index].busStatus.push(Math.floor(Number(element.EstimateTime) / 60) + 'mins');
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
}
