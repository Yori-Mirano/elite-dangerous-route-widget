export default class {
    el;        
    remainingJumps = 0;
    remainingLight = 0;
    remainingMinut = 0;
    lightYearPerJu;
    lightYearPerHo;
    jumpsPerHour;  
    secondsPerJump;
  
    constructor(el) {
      this.el = el;
      this.el.classList.add('info');
      this.updateView();
    }

    setState(infos) {
      this.remainingJumps     = infos.remainingJumps;
      this.remainingLightYear = infos.remainingLightYear;
      this.remainingMinutes   = infos.remainingMinutes;
      this.lightYearPerJump   = infos.lightYearPerJump;
      this.lightYearPerHour   = infos.lightYearPerHour;
      this.jumpsPerHour       = infos.jumpsPerHour;
      this.secondsPerJump     = infos.secondsPerJump;
      this.updateView();
    }
  
    updateView() {
      this.el.innerHTML = `
        <div>
          <div style="display: flex; align-items: flex-end; justify-content: space-between; border-bottom: .1rem solid #fff8; padding-bottom: .4rem; margin-bottom: .5rem; transition: border-color .5s;">
            <div style="font-size: 1.7rem; font-weight: bold; line-height: 1; text-align: right;">
              <span>${Math.round(this.remainingMinutes)}</span>
              <div style="font-size: 1.1rem;"> min</div>
            </div>
            <div style="margin-left: .8rem;">
              <div><span>${Math.round(this.remainingLightYear)}</span><span> ly</span></div>
              <div><span>${Math.round(this.remainingJumps)}</span><span> jmp</span></div>
            </div>
          </div>
  
          <div style="display: flex; justify-content: space-between;">
            <div>
              <div><span>${Math.round(this.lightYearPerHour) || '----'}</span><span> ly/hr</span></div>
              <div><span>${Math.round(this.lightYearPerJump) || '--'}</span><span> ly/jmp</span></div>
            </div>
            <div style="margin-left: 1rem; text-align: right;">
              <div><span>${Math.round(this.jumpsPerHour) || '--'}</span><span> jmp/hr</span></div>
              <div><span>${Math.round(this.secondsPerJump) || '--'}</span><span> sec/jmp</span></div>
            </div>
          </div>
        </div>`;
    }
  }