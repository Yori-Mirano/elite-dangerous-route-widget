const url = require('url');
const { parse } = require('node-html-parser');
const { fetch, getDistance } = require('./utils');

const regex = {
  lang: /^\/(\w{2})\//
}

module.exports = class EdsmExpedition {
  url;
  apiUrl;
  waypoints;
  isFetched = false;

  constructor(url) {
    this.url = new URL(url);
    this.apiUrl = `${this.url.origin}/api-v1`;
  }

  getHtmlPageContent() {
    return fetch(this.getEnglishUrl(this.url));
  }

  getEnglishUrl(url) {
    return url.origin + url.pathname.replace(regex.lang, '/en/');
  }

  getOriginLangUrl(url) {
    return url.origin + url.pathname.replace(regex.lang, `/${this.getOriginLang()}/`);
  }

  getOriginLang() {
    const langMatch = this.url.pathname.match(regex.lang);
    let lang = 'en'

    if (langMatch && langMatch[1]) {
      lang = langMatch[1];
    }

    return lang;
  }

  getRowsFromDom(dom) {
    return dom.querySelectorAll('.card-header')
              .find(el => el.textContent.includes('Expedition waypoints'))
              .nextElementSibling.querySelectorAll('tbody > tr');
  }

  getWaypointsFromRows(rows) {
    return rows.map(row => {
      const cells   = row.querySelectorAll('td');
      const href    = cells[1].querySelector('a').getAttribute("href");
      const id      = href.match(/\/id\/(\d+)\//)[1];
      const name    = href.match(/\/([^\/]+)$/)[1].replace(/\+/g, ' ');

      return {
        name,
        id,
        url: this.getOriginLangUrl(new URL(this.url.origin + href)),
      };
    });
  }

  fetchWaypoints() {
    return new Promise(resolve => {
      this.getHtmlPageContent().then(({data}) => {
        const dom       = parse(data);
        const rows      = this.getRowsFromDom(dom);
        const waypoints = this.getWaypointsFromRows(rows);

        let query = `${this.apiUrl}/systems?showCoordinates=1&showPrimaryStar=1&showId=1`;

        waypoints.forEach(waypoint => query += `&systemName[]=${waypoint.name}`);

        fetch(query).then(response => {
          console.log('edsm api rate limite - remaining:', response.headers['x-rate-limit-remaining'], '/', response.headers['x-rate-limit-limit'], '( reset: ', response.headers['x-rate-limit-reset'], ')');
          const waypointsFromEdsm = JSON.parse(response.data);

          waypoints.forEach(waypoint => {
            const waypointFromEdsm  = waypointsFromEdsm.find(waypointFromEdsm => waypointFromEdsm.name === waypoint.name);
            waypoint.position       = [waypointFromEdsm.coords.x, waypointFromEdsm.coords.y, waypointFromEdsm.coords.z];
            waypoint.type           = waypointFromEdsm.primaryStar.type.match(/^(\w+)/)[1];
          });

          this.waypoints = waypoints;
          this.isFetched = true;
          resolve(waypoints);
        });
      })
    });
  }

  getTotalDistance() {
    return this.getSegments().reduce((total, segment) => total + segment.distance, 0);
  }

  getSegments() {
    let segments = [];
    let previousSegment;
    let distanceFromStart = 0;

    for (let i = 1, l = this.waypoints.length; i < l; i++) {
      if (previousSegment) {
        distanceFromStart += previousSegment.distance;
      }

      const segment = {
        start:    this.waypoints[i-1],
        end:      this.waypoints[i],
        distance: getDistance(this.waypoints[i-1].position, this.waypoints[i].position),
        distanceFromStart
      }

      previousSegment = segment;
      segments.push(segment);
    }

    return segments;
  }

  getCurrentSegment(currentPosition) {
    const segments = this.getSegments();

    const segmentsWidthDistanceScore = segments.map(segment => {
      const startDistance   = getDistance(segment.start.position, currentPosition);
      const endDistance     = getDistance(segment.end.position, currentPosition);
      return {
        score: (startDistance + endDistance) / segment.distance,
        segment
      };
    });

    return segmentsWidthDistanceScore.sort((a, b) => a.score - b.score)[0].segment;
  }


  getProgression(currentPosition) {
    const segment           = this.getCurrentSegment(currentPosition);
    const startDistance     = getDistance(segment.start.position, currentPosition);
    const endDistance       = getDistance(segment.end.position, currentPosition);
    const progression       = startDistance / (startDistance + endDistance);
    const totalprogression  = (segment.distanceFromStart + segment.distance * progression) / this.getTotalDistance();

    return {
      segment,
      progression,      // From 0 to 1.0
      totalprogression  // From 0 to 1.0
    };
  }
}
