import jsSHA from 'jssha';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class CommonService {
  searchType: 'searchLine' | 'searchBusStop' | 'searchNearestBusStation' = 'searchLine';

  constructor() { }

  setPtxAuthorizationHeader() {
    let AppID = '56d46e9897a148bca3e3fd6c1e400cb0';
    let AppKey = 'eFy9jIOXaHvKXhi40qbKS58EGJ8';
    let GMTString = new Date().toUTCString();
    let ShaObj = new jsSHA('SHA-1', 'TEXT');
    ShaObj.setHMACKey(AppKey, 'TEXT');
    ShaObj.update('x-date: ' + GMTString);
    let HMAC = ShaObj.getHMAC('B64');
    let Authorization = 'hmac username=\"' + AppID + '\", algorithm=\"hmac-sha1\", headers=\"x-date\", signature=\"' + HMAC + '\"';
    environment.ptxAuthorizationHeader = { 'Authorization': Authorization, 'X-Date': GMTString };
  }

  /**
   * 取得目標位置，若沒有參數則取得當前位置
   */
  getPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resp => {
        resolve({ longitude: resp.coords.longitude, latitude: resp.coords.latitude });
      },
        err => {
          reject(`fail : ${err}`)
        });
    });
  }

  getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
    }
    else {
      let radlat1 = Math.PI * lat1 / 180;
      let radlat2 = Math.PI * lat2 / 180;
      let theta = lon1 - lon2;
      let radtheta = Math.PI * theta / 180;
      let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180 / Math.PI;
      dist = dist * 60 * 1.1515;
      dist = dist * 1.609344 * 1000;// 轉換成m
      return Math.floor(dist);
    }
  }
}
