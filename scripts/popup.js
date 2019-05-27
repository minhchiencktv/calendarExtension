'use strict';
var app = angular.module('CalendarModule', []);

app.controller('CalendarController', ['$scope', '$http', 'CalendarService', 'LunarUtilService',
  function ($scope, $http, CalendarService) {
  $scope.currentDate = new Date();
  $scope.year = new Date().getFullYear();
  $scope.month = new Date().getMonth();
  /**
   * onPrev
   */
  $scope.onPrev = function () {
    var month = $scope.month - 1;
    var year = $scope.year;
    $scope.month = (month + 12) % 12;
    $scope.year = $scope.month === 11 ? (year - 1) : year;
    $http.get('./data/solarHoliday.json').then(function(response){
      $scope.solarHoliday = response.data;
      $scope.dates = CalendarService.getDateByMonthAndYear($scope.year, $scope.month, $scope.solarHoliday);
    });
  }
  /**
   * onNext
   */
  $scope.onNext = function () {
    var month = $scope.month + 1;
    var year = $scope.year;
    $scope.month = month % 12;
    $scope.year = $scope.month === 0 ? (year + 1) : year;
    $http.get('./data/solarHoliday.json').then(function(response){
      $scope.solarHoliday = response.data;
      $scope.dates = CalendarService.getDateByMonthAndYear($scope.year, $scope.month, $scope.solarHoliday);
    });
  }
  /**
   * getCurrentDate
   */
  $scope.getCurrentDate = function () {
    var now = new Date();
    $scope.month = now.getMonth();
    $scope.year = now.getFullYear();
    $http.get('./data/solarHoliday.json').then(function(response){
      $scope.solarHoliday = response.data;
      $scope.dates = CalendarService.getDateByMonthAndYear($scope.year, $scope.month, $scope.solarHoliday);
    });
  }
  /**
   * Init app
   */
  $scope.InitApp = function () {
    $http.get('./data/solarHoliday.json').then(function(response){
      $scope.solarHoliday = response.data;
      $scope.dates = CalendarService.getDateByMonthAndYear($scope.year, $scope.month, $scope.solarHoliday);
    });
  }
  $scope.InitApp();
}]);

app.service('CalendarService', ['$log', 'LunarUtilService', function ($log, LunarUtilService) {
  /**
  * getPreviousDatesOfMonth
  * @param {*} year 
  * @param {*} month 
  */
  var getPreviousDatesOfMonth = function (year, month, solarHoliday) {
    let date = new Date(year, month, 1);
    const dates = [];
    let day = date.getDay();
    for (let i = day - 1; i >= 0; i--) {
      date = new Date(Date.parse(date) - 86400000);
      dates[i] = {
        date,
        isHide: true,
        lunarDate: LunarUtilService.convertSolar2Lunar(date.getFullYear(), date.getMonth() + 1, date.getDate(), 7),
        event: solarHoliday.find(function(item){
          return item.date === date.getDate() && item.month === date.getMonth() + 1;
        }),
      }
    }
    return dates;
  }
  /**
   * getNextDatesOfMonth
   * @param {*} year 
   * @param {*} month 
   */
  var getNextDatesOfMonth = function (year, month, solarHoliday) {
    let date = new Date(year, (month + 1), 1);
    const dates = [];
    const numWeek = date.getDay();
    for (let i = 0; i <= (13 - numWeek); i++) {
      dates[i] = {
        date,
        isHide: true,
        lunarDate: LunarUtilService.convertSolar2Lunar(date.getFullYear(), date.getMonth() + 1, date.getDate(), 7),
        event: solarHoliday.find(function(item){
          return item.date === date.getDate() && item.month === date.getMonth() + 1;
        }),
      }
      date = new Date(Date.parse(date) + 86400000);
    }
    return dates;
  }
  /**
   * getDatesOfMonth
   * @param {*} year 
   * @param {*} month 
   */
  var getDatesOfMonth = function (year, month, solarHoliday) {
    var today = new Date();
    let dates = [];
    for (let i = 1; new Date(year, month, i).getMonth() === month; i++) {
      var date = new Date(year, month, i);
      dates.push({
        date,
        isHide: false,
        isToday: date.getUTCFullYear() === today.getFullYear()
          && date.getMonth() === today.getMonth()
          && date.getDate() === today.getDate(),
        isSunday: date.getDay() === 0,
        lunarDate: LunarUtilService.convertSolar2Lunar(date.getFullYear(), date.getMonth() + 1, date.getDate(), 7),
        event: solarHoliday.find(function(item){
          return item.date === date.getDate() && item.month === date.getMonth() + 1;
        }),
      });
    }
    return dates;
  }
  /**`
   * getDateByMonthAndYear
   * @param {*} year 
   * @param {*} month 
   */
  var getDateByMonthAndYear = function (year, month, solarHoliday) {
    console.log(solarHoliday);
    let dates = [];
    let prev = getPreviousDatesOfMonth(year, month, solarHoliday);
    let next = getNextDatesOfMonth(year, month, solarHoliday);
    dates = prev;
    dates = dates.concat(getDatesOfMonth(year, month, solarHoliday).concat());
    dates = dates.concat(next);
    const gridMonth = [];
    for (let i = 0; i < 6; i++) {
      gridMonth[i] = [];
      gridMonth[i] = dates.slice((i * 7), (i * 7) + 7);
    }
    return gridMonth;
  }
  return {
    getNextDatesOfMonth,
    getDatesOfMonth,
    getDateByMonthAndYear,
  };
}]);

app.service('LunarUtilService', ['$log', function ($log) {
  /**
 * getJNDFromGregoryDate
 * @param {Number} year 
 * @param {Number} month 
 * @param {Number} day 
 */
  var getJNDFromGregoryDate = (year, month, day) => {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + (12 * a) - 3;
    const JDN = day
      + Math.floor(((153 * m) + 2) / 5)
      + (365 * y)
      + Math.floor(y / 4)
      - Math.floor(y / 100)
      + Math.floor(y / 400)
      - 32045;
    return JDN;
  }
  /**
   * parseJNDToGregoryDate
   * @param {Number} jnd 
   */
  var parseJNDToGregoryDate = (jnd) => {
    let a, b, c, d, e, m;
    if (jnd > 2299160) {
      a = jnd + 32044;
      b = Math.floor(((4 * a) + 3) / 146097);
      c = a - Math.floor((b * 146097) / 4);
    } else {
      b = 0;
      c = jnd + 32082;
    }
    d = Math.floor(((4 * c) + 3) / 1461);
    e = c - Math.floor((1461 * d) / 4);
    m = Math.floor(((5 * e) + 2) / 153);
    const day = e - Math.floor(((153 * m) + 2) / 5) + 1;
    const month = m + 3 - 12 * Math.floor(m / 10);
    const year = b * 100 + d - 4800 + Math.floor(m / 10);
    return new Date(year, month - 1, day);
  }
  /**
   * getNewMoonDay
   * @param {Number} k 
   * @param {Number} timeZone
   * @returns
   */
  var getNewMoonDay = (k, timeZone) => {
    let T, T2, T3, dr, Jd1, M, Mpr, F, C1, deltat, JdNew;
    T = k / 1236.85; // Time in Julian centuries from 1900 January 0.5
    T2 = T * T;
    T3 = T2 * T;
    dr = Math.PI / 180;
    Jd1 = 2415020.75933 + (29.53058868 * k) + (0.0001178 * T2) - (0.000000155 * T3);
    Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr); // Mean new moon
    M = 359.2242 + (29.10535608 * k) - (0.0000333 * T2) - (0.00000347 * T3); // Sun's mean anomaly
    Mpr = 306.0253 + (385.81691806 * k) + (0.0107306 * T2) + (0.00001236 * T3); // Moon's mean anomaly
    F = 21.2964 + (390.67050646 * k) - (0.0016528 * T2) - (0.00000239 * T3); // Moon's argument of latitude
    C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    if (T < -11) {
      deltat = 0.001 + (0.000839 * T) + (0.0002261 * T2) - (0.00000845 * T3) - (0.000000081 * T * T3);
    } else {
      deltat = -0.000278 + (0.000265 * T) + (0.000262 * T2);
    };
    JdNew = Jd1 + C1 - deltat;
    return Math.floor(JdNew + 0.5 + (timeZone / 24))
  }
  /**
   * getSunLongitude
   * @param {Number} jdn 
   * @param {Number} timeZone 
   */
  var getSunLongitude = (jdn, timeZone) => {
    var T, T2, dr, M, L0, DL, L;
    T = (jdn - 2451545.5 - timeZone / 24) / 36525; // Time in Julian centuries from 2000-01-01 12:00:00 GMT
    T2 = T * T;
    dr = Math.PI / 180; // degree to radian
    M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2; // mean anomaly, degree
    L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2; // mean longitude, degree
    DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    L = L0 + DL; // true longitude, degree
    L = L * dr;
    L = L - Math.PI * 2 * (Math.floor(L / (Math.PI * 2))); // Normalize to (0, 2*PI)
    return Math.floor(L / Math.PI * 6);
  }
  /**
   * getLunarMonth11
   * @param {Number} yy 
   * @param {Number} timeZone 
   */
  var getLunarMonth11 = (yy, timeZone) => {
    var k, off, nm, sunLong;
    off = getJNDFromGregoryDate(yy, 12, 31) - 2415021;
    k = Math.floor(off / 29.530588853);
    nm = getNewMoonDay(k, timeZone);
    sunLong = getSunLongitude(nm, timeZone); // sun longitude at local midnight
    if (sunLong >= 9) {
      nm = getNewMoonDay(k - 1, timeZone);
    }
    return nm;
  }
  /**
   * getLeapMonthOffset
   * @param {Number} a11 
   * @param {Number} timeZone 
   */
  var getLeapMonthOffset = (a11, timeZone) => {
    var k, last, arc, i;
    k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    last = 0;
    i = 1; // We start with the month following lunar month 11
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    do {
      last = arc;
      i++;
      arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc !== last && i < 14);
    return i - 1;
  }
  /**
   * convertSolar2Lunar
   * @param {Number} yy 
   * @param {Number} mm 
   * @param {Number} dd 
   * @param {Number} timeZone 
   */
  var convertSolar2Lunar = (yy, mm, dd, timeZone) => {
    let k, dayNumber, monthStart, a11, b11, lunarDay, lunarMonth, lunarYear, lunarLeap;
    dayNumber = getJNDFromGregoryDate(yy, mm, dd);
    k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
    monthStart = getNewMoonDay(k + 1, timeZone);
    if (monthStart > dayNumber) {
      monthStart = getNewMoonDay(k, timeZone);
    }
    a11 = getLunarMonth11(yy, timeZone);
    b11 = a11;
    if (a11 >= monthStart) {
      lunarYear = yy;
      a11 = getLunarMonth11(yy - 1, timeZone);
    } else {
      lunarYear = yy + 1;
      b11 = getLunarMonth11(yy + 1, timeZone);
    }
    lunarDay = dayNumber - monthStart + 1;
    const diff = Math.floor((monthStart - a11) / 29);
    lunarLeap = 0;
    lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
      if (diff >= leapMonthDiff) {
        lunarMonth = diff + 10;
        if (diff === leapMonthDiff) {
          lunarLeap = 1;
        }
      }
    }
    if (lunarMonth > 12) {
      lunarMonth = lunarMonth - 12;
    }
    if (lunarMonth >= 11 && diff < 4) {
      lunarYear -= 1;
    }
    return [lunarYear, lunarMonth, lunarDay, lunarLeap];
  }
  /**
   * convertLunar2Solar
   * @param {Number} lunarDay 
   * @param {Number} lunarMonth 
   * @param {Number} lunarYear 
   * @param {Number} lunarLeap 
   * @param {Number} timeZone 
   */
  var convertLunar2Solar = (lunarDay, lunarMonth, lunarYear, lunarLeap, timeZone) => {
    var k, a11, b11, off, leapOff, leapMonth, monthStart;
    if (lunarMonth < 11) {
      a11 = getLunarMonth11(lunarYear - 1, timeZone);
      b11 = getLunarMonth11(lunarYear, timeZone);
    } else {
      a11 = getLunarMonth11(lunarYear, timeZone);
      b11 = getLunarMonth11(lunarYear + 1, timeZone);
    }
    off = lunarMonth - 11;
    if (off < 0) {
      off += 12;
    }
    if (b11 - a11 > 365) {
      leapOff = getLeapMonthOffset(a11, timeZone);
      leapMonth = leapOff - 2;
      if (leapMonth < 0) {
        leapMonth += 12;
      }
      if (lunarLeap !== 0 && lunarMonth !== leapMonth) {
        return [0, 0, 0];
      } else if (lunarLeap !== 0 || off >= leapOff) {
        off += 1;
      }
    }
    k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
    monthStart = getNewMoonDay(k + off, timeZone);
    return parseJNDToGregoryDate(monthStart + lunarDay - 1);
  }
  return {
    getJNDFromGregoryDate,
    parseJNDToGregoryDate,
    getNewMoonDay,
    getSunLongitude,
    getLunarMonth11,
    convertSolar2Lunar,
    convertLunar2Solar
  };
}])