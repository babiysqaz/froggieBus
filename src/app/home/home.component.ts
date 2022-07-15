import { CommonService } from './../service/common.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SwitchToEnglishService } from '../service/switch-to-english.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { lastValueFrom } from 'rxjs';
interface BusLines {
  goal: string,
  stopNames: Array<string>,
  estimatedTime: Array<number>,
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
  public cityNameArr = [
    '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市', '基隆市', '新竹市', '嘉義市',
    '宜蘭縣', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '屏東縣', '花蓮縣', '臺東縣', '金門縣', '澎湖縣', '連江縣'
  ];
  public inputText = '';
  public busLines: Array<BusLines> = [];
  public busStops: Array<{ stopName: string, estimatedTime: number }> = [];
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
    }
  }

  async search(searchType: 'searchLine' | 'searchBusStop' | 'searchNearestBusStation') {
    this.isNull = false;
    if (this.isSearching) {
      console.log('還在讀取中');
      return;
    }
    this.isSearching = true;
    const citySelector = document.getElementById("citySelector") as HTMLSelectElement;
    let cityName = this.switchToEnglishService.switchCityName(citySelector?.value);
    switch (searchType) {
      case 'searchLine':
        await this.searchLine(cityName);
        break;
      case 'searchBusStop':
        await this.searchBusStation(cityName);
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
    this.busLines = [
      { goal: '', stopNames: [], estimatedTime: [], busStatus: [], busStatusClass: [] },
      { goal: '', stopNames: [], estimatedTime: [], busStatus: [], busStatusClass: [] }
    ];

    const promise1 = lastValueFrom(this.httpClient.get(
      `https://ptx.transportdata.tw/MOTC/v2/Bus/StopOfRoute/City/${cityName}/${this.inputText}?$filter=RouteID%20eq%20'${this.inputText}'&$top=30&$format=JSON`,
      { headers: environment.ptxAuthorizationHeader }))
      .then((res: any) => {
        if (res.length === 0) {
          this.isNull = true;
          return;
        }
        this.busLines[0].goal = res[1].Stops[0].StopName.Zh_tw;
        this.busLines[1].goal = res[0].Stops[0].StopName.Zh_tw;
        this.busLines[0].stopNames = res[0].Stops.map((element: any) => element.StopName.Zh_tw);
        this.busLines[1].stopNames = res[1].Stops.map((element: any) => element.StopName.Zh_tw);
      });

    const promise2 = lastValueFrom(this.httpClient.get(
      `https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/${cityName}/${this.inputText}?$filter=RouteID%20eq%20'${this.inputText}'&$orderby=StopSequence&$format=JSON`,
      { headers: environment.ptxAuthorizationHeader }))
      .then((res: any) => {
        if (res.length === 0) {
          this.isNull = true;
          return;
        }
        res.forEach((element: any) => {
          if (element.Direction === 0) {
            this.busLines[0].estimatedTime.push(element);
            this.switchBusStatus(element, 0);
            return;
          }
          this.busLines[1].estimatedTime.push(element);
          this.switchBusStatus(element, 1);
        });
      });
    await Promise.all([promise1, promise2]);
  }

  /**
   * 取得即將經過該公車站牌的所有公車資訊
   */
  async searchBusStation(cityName: string) {
    return lastValueFrom(this.httpClient.get<any>(
      `https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/${cityName}?$filter=contains(StopName%2FZh_tw%2C'${this.inputText}')&$format=JSON`,
      { headers: environment.ptxAuthorizationHeader }))
      .then(res => {
        if (res.length === 0) {
          this.isNull = true;
          return;
        }
        this.busStops = res
          .filter((item: any) => item.StopStatus === 0)// 0 代表有發車
          .map((item: any) => ({ stopName: item.StopName.Zh_tw, estimatedTime: Math.floor(item.EstimateTime / 60) }))
      });
  }

  /**
   * 取得鄰近公車站點資訊
   */
  async searchNearestBusStation() {
    this.location = await this.commonService.getPosition();
    this.googleMapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.google.com/maps/embed/v1/search?q=%E5%85%AC%E8%BB%8A%E7%AB%99&key=${environment.googleMapKey}&center=${this.location.latitude},${this.location.longitude}&zoom=14`);
    this.nearestBusStations = [];

    return lastValueFrom(this.httpClient.get(`https://ptx.transportdata.tw/MOTC/v2/Bus/Station/NearBy?$spatialFilter=nearby(${this.location.latitude},${this.location.longitude},500)`, { headers: environment.ptxAuthorizationHeader }))
      .then((res: any) => {
        if (res.length === 0) {
          this.isNull = true;
          return;
        }
        this.nearestBusStations = res
          .map((element: any) => (
            {
              stationName: element.StationName.Zh_tw,
              distance: this.commonService.getDistance(this.location.latitude, this.location.longitude, element.StationPosition.PositionLat, element.StationPosition.PositionLon),
            }
          ))
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
          this.busLines[index].busStatus.push('進站中');
          this.busLines[index].busStatusClass.push('approaching');
          return;
        }
        this.busLines[index].busStatus.push(Math.floor(element.EstimateTime / 60) + 'mins');
        this.busLines[index].busStatusClass.push('moving');
        break;
      case 1:
        this.busLines[index].busStatus.push('未發車');
        this.busLines[index].busStatusClass.push('notMoving');
        break;
      case 2:
        this.busLines[index].busStatus.push('未發車');
        this.busLines[index].busStatusClass.push('notMoving');
        break;
      case 3:
        this.busLines[index].busStatus.push('末班駛離');
        this.busLines[index].busStatusClass.push('notMoving');
        break;
      case 4:
        this.busLines[index].busStatus.push('未發車');
        this.busLines[index].busStatusClass.push('notMoving');
        break;
    }
  }
}
