import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SwitchToEnglishService {

  constructor() { }

  switchCityName(city: string) {
    switch (city) {
      case '臺北市':
        return 'Taipei';
      case '新北市':
        return 'NewTaipei';
      case '桃園市':
        return 'Taoyuan';
      case '臺中市':
        return 'Taichung';
      case '臺南市':
        return 'Tainan';
      case '高雄市':
        return 'Kaohsiung';
      case '基隆市':
        return 'Keelung';
      case '新竹市':
        return 'Hsinchu';
      case '新竹縣':
        return 'HsinchuCounty';
      case '苗栗縣':
        return 'MiaoliCounty';
      case '彰化縣':
        return 'ChanghuaCounty';
      case '南投縣':
        return 'NantouCounty';
      case '雲林縣':
        return 'YunlinCounty';
      case '嘉義縣':
        return 'ChiayiCounty';
      case '嘉義市':
        return 'Chiayi';
      case '屏東縣':
        return 'PingtungCounty';
      case '宜蘭縣':
        return 'YilanCounty';
      case '花蓮縣':
        return 'HualienCounty';
      case '臺東縣':
        return 'TaitungCounty';
      case '金門縣':
        return 'KinmenCounty';
      case '澎湖縣':
        return 'PenghuCounty';
      case '連江縣':
        return 'LienchiangCounty';
    }
    return '';
  }
}
